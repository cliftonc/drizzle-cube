/**
 * MCP POST-handler helpers for the Hono adapter.
 *
 * Extracted from the `app.post('/mcp')` handler to keep request validation,
 * SSE-response building, and error formatting out of a single high-complexity
 * arrow. Behaviour (status codes, headers, JSON-RPC bodies) is identical.
 */

import type { Context } from 'hono'
import {
  buildJsonRpcError,
  buildJsonRpcResult,
  dispatchMcpMethod,
  isNotification,
  negotiateProtocol,
  parseJsonRpc,
  primeEventId,
  serializeSseEvent,
  wantsEventStream,
  validateAcceptHeader,
  validateOriginHeader,
  extractBearerToken,
  buildWwwAuthenticateChallenge,
  MCP_SESSION_ID_HEADER,
  type JsonRpcRequest,
  type McpDispatchContext
} from '../mcp-transport.js'

/** MCP endpoint config fields the handler helpers depend on. */
export interface HonoMcpHandlerConfig {
  resourceMetadataUrl?: string
  allowedOrigins?: string[]
}

/**
 * Result of the pre-dispatch validation gauntlet. When `response` is set the
 * caller must return it immediately (short-circuit); otherwise `rpcRequest`,
 * `acceptHeader`, and `protocol` are populated for dispatch.
 */
export interface McpRequestPrep {
  response?: Response
  rpcRequest?: JsonRpcRequest
  acceptHeader?: string
  negotiatedProtocol?: string | null
}

/**
 * Run the MCP POST validation sequence (auth, origin, Accept, protocol, body).
 * Returns a short-circuit `response` on the first failure, or the parsed
 * request + negotiated protocol on success.
 */
export async function prepareMcpPostRequest(
  c: Context,
  mcp: HonoMcpHandlerConfig
): Promise<McpRequestPrep> {
  // OAuth 2.1 bearer token check (RFC 9728)
  if (mcp.resourceMetadataUrl && !extractBearerToken(c.req.header('authorization'))) {
    c.header('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
    return { response: c.json({ error: 'Bearer token required' }, 401) }
  }

  // Validate Origin header (MCP 2025-11-25: MUST validate, return 403 if invalid)
  const originValidation = validateOriginHeader(
    c.req.header('origin'),
    mcp.allowedOrigins ? { allowedOrigins: mcp.allowedOrigins } : {}
  )
  if (!originValidation.valid) {
    return { response: c.json(buildJsonRpcError(null, -32600, originValidation.reason), 403) }
  }

  // Validate Accept header (MCP 2025-11-25: MUST include both application/json and text/event-stream)
  const acceptHeader = c.req.header('accept')
  if (!validateAcceptHeader(acceptHeader)) {
    return {
      response: c.json(
        buildJsonRpcError(null, -32600, 'Accept header must include both application/json and text/event-stream'),
        400
      )
    }
  }

  const protocol = negotiateProtocol(c.req.header() as Record<string, string>)
  if (!protocol.ok) {
    return {
      response: c.json({ error: 'Unsupported MCP protocol version', supported: protocol.supported }, 426)
    }
  }

  const body = await c.req.json().catch(() => null)
  const rpcRequest = parseJsonRpc(body)
  if (!rpcRequest) {
    return { response: c.json(buildJsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'), 400) }
  }

  return { rpcRequest, acceptHeader, negotiatedProtocol: protocol.negotiated }
}

/** Build a single-event SSE `Response` carrying one JSON-RPC payload. */
export function buildMcpSseResponse(
  payload: unknown,
  extraHeaders?: Record<string, string>
): Response {
  const encoder = new TextEncoder()
  const eventId = primeEventId()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`id: ${eventId}\n\n`))
      controller.enqueue(encoder.encode(serializeSseEvent(payload, eventId)))
      controller.close()
    }
  })
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...extraHeaders
    }
  })
}

/** Extract the MCP-Session-Id header value from an `initialize` result, if present. */
export function extractMcpSessionHeaders(isInitialize: boolean, result: unknown, headerName: string): Record<string, string> {
  const sessionId = isInitialize && result && typeof result === 'object' && 'sessionId' in result
    ? (result as { sessionId?: string }).sessionId
    : undefined
  return sessionId ? { [headerName]: sessionId } : {}
}

/** Build a JSON-RPC error response from a thrown error (preserving code/data). */
export function buildMcpErrorPayload(error: unknown, id: JsonRpcRequest['id']) {
  const code = (error as any)?.code ?? -32603
  const data = (error as any)?.data
  const message = (error as Error).message || 'MCP request failed'
  return buildJsonRpcError(id ?? null, code, message, data)
}

/** Wrap `wantsEventStream` so the handler imports a single helper module. */
export function clientWantsStream(acceptHeader?: string): boolean {
  return wantsEventStream(acceptHeader)
}

/** Build the success-path response (202 notification, SSE stream, or JSON). */
function respondWithResult(
  c: Context,
  rpcRequest: JsonRpcRequest,
  result: unknown,
  wantsStream: boolean
): Response {
  if (isNotification(rpcRequest)) {
    return c.body(null, 202)
  }
  const response = buildJsonRpcResult(rpcRequest.id ?? null, result)
  // Extract session ID for header (MCP 2025-11-25: return in MCP-Session-Id header)
  const responseHeaders = extractMcpSessionHeaders(
    rpcRequest.method === 'initialize',
    result,
    MCP_SESSION_ID_HEADER
  )
  return wantsStream
    ? buildMcpSseResponse(response, responseHeaders)
    : c.json(response, 200, responseHeaders)
}

/** Build the error-path response (202 notification, SSE stream, or JSON). */
function respondWithError(
  c: Context,
  rpcRequest: JsonRpcRequest,
  error: unknown,
  wantsStream: boolean
): Response {
  // Log notification errors before returning 202 (P3 fix)
  if (isNotification(rpcRequest)) {
    console.error('MCP notification processing error:', error)
    return c.body(null, 202)
  }
  console.error('MCP RPC error:', error)
  const rpcError = buildMcpErrorPayload(error, rpcRequest.id)
  return wantsStream ? buildMcpSseResponse(rpcError) : c.json(rpcError, 200)
}

/**
 * Dispatch a validated MCP JSON-RPC request and build the Hono `Response`
 * (success or error path). Keeps the route handler a thin wrapper.
 */
export async function dispatchMcpPost(
  c: Context,
  rpcRequest: JsonRpcRequest,
  wantsStream: boolean,
  ctx: McpDispatchContext
): Promise<Response> {
  try {
    const result = await dispatchMcpMethod(rpcRequest.method, rpcRequest.params, ctx)
    return respondWithResult(c, rpcRequest, result, wantsStream)
  } catch (error) {
    return respondWithError(c, rpcRequest, error, wantsStream)
  }
}
