/**
 * MCP RPC handler helpers for the Next.js adapter.
 *
 * Extracted from `createMcpRpcHandler`'s returned handler to keep per-HTTP-method
 * routing, request validation, SSE-response building, and error formatting out
 * of a single high-complexity function. Behaviour (status codes, headers,
 * JSON-RPC bodies, CORS) is identical to the inlined implementation.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  buildJsonRpcError,
  negotiateProtocol,
  parseJsonRpc,
  primeEventId,
  serializeSseEvent,
  validateAcceptHeader,
  validateOriginHeader,
  type JsonRpcRequest
} from '../mcp-transport.js'

/** MCP endpoint config fields the Next.js handler helpers depend on. */
export interface NextMcpHandlerConfig {
  allowedOrigins?: string[]
}

/** Applies adapter CORS headers to an outgoing header set (no-op when CORS is disabled). */
export type ApplyCors = (request: NextRequest, headers: Headers) => void

/** Builds the adapter CORS header record for JSON responses (empty when disabled). */
export type CorsHeaders = (request: NextRequest) => Record<string, string>

/**
 * Build the SSE `Response` for a GET (streaming connection open) request,
 * emitting the initial `mcp/ready` event.
 */
export function buildMcpGetResponse(request: NextRequest, applyCors: ApplyCors): NextResponse {
  const encoder = new TextEncoder()
  const eventId = primeEventId()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(serializeSseEvent({
        jsonrpc: '2.0',
        method: 'mcp/ready',
        params: { protocol: 'streamable-http' }
      }, eventId, 15000)))
    }
  })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  applyCors(request, headers)
  return new NextResponse(stream, { status: 200, headers })
}

/**
 * Result of the POST pre-dispatch validation gauntlet. When `response` is set
 * the caller must return it immediately; otherwise `rpcRequest` and
 * `acceptHeader` are populated for dispatch.
 */
export interface NextMcpRequestPrep {
  response?: NextResponse
  rpcRequest?: JsonRpcRequest
  acceptHeader?: string | null
}

/**
 * Run the POST validation sequence (origin, Accept, protocol, body). Returns a
 * short-circuit `response` on the first failure, or the parsed request on success.
 */
export async function prepareMcpPostRequest(
  request: NextRequest,
  mcp: NextMcpHandlerConfig
): Promise<NextMcpRequestPrep> {
  // Validate Origin header (MCP 2025-11-25: MUST validate, return 403 if invalid)
  const originValidation = validateOriginHeader(
    request.headers.get('origin'),
    mcp.allowedOrigins ? { allowedOrigins: mcp.allowedOrigins } : {}
  )
  if (!originValidation.valid) {
    return { response: NextResponse.json(buildJsonRpcError(null, -32600, originValidation.reason), { status: 403 }) }
  }

  // Validate Accept header (MCP 2025-11-25: MUST include both application/json and text/event-stream)
  const acceptHeader = request.headers.get('accept')
  if (!validateAcceptHeader(acceptHeader)) {
    return {
      response: NextResponse.json(
        buildJsonRpcError(null, -32600, 'Accept header must include both application/json and text/event-stream'),
        { status: 400 }
      )
    }
  }

  const protocol = negotiateProtocol(Object.fromEntries(request.headers.entries()))
  if (!protocol.ok) {
    return {
      response: NextResponse.json(
        { error: 'Unsupported MCP protocol version', supported: protocol.supported },
        { status: 426 }
      )
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = null
  }

  const rpcRequest = parseJsonRpc(body)
  if (!rpcRequest) {
    return { response: NextResponse.json(buildJsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'), { status: 400 }) }
  }

  return { rpcRequest, acceptHeader }
}

/** Build a single-event SSE `NextResponse` carrying one JSON-RPC payload, with CORS + extra headers. */
export function buildMcpSseResponse(
  request: NextRequest,
  payload: unknown,
  applyCors: ApplyCors,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  const encoder = new TextEncoder()
  const eventId = primeEventId()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`id: ${eventId}\n\n`))
      controller.enqueue(encoder.encode(serializeSseEvent(payload, eventId)))
      controller.close()
    }
  })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...extraHeaders
  })
  applyCors(request, headers)
  return new NextResponse(stream, { status: 200, headers })
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
