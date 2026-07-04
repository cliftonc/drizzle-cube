/**
 * Framework-agnostic MCP POST handler.
 *
 * Runs the full MCP Streamable-HTTP request flow (bearer/origin/Accept/protocol
 * validation → JSON-RPC parse → method dispatch → JSON or single-event SSE
 * response) against an {@link McpHttpPort}, with no framework types inside.
 * Status codes, headers, and JSON-RPC bodies match the adapters' original
 * inlined implementations exactly.
 */

import type { SemanticLayerCompiler } from '../../server/compiler.js'
import type { MCPOptions, McpAppConfig } from '../utils.js'
import {
  buildJsonRpcError,
  buildJsonRpcResult,
  buildMcpResources,
  dispatchMcpMethod,
  isNotification,
  negotiateProtocol,
  parseJsonRpc,
  primeEventId,
  resolveMcpPrompts,
  resolveMcpInstructions,
  serializeSseEvent,
  wantsEventStream,
  validateAcceptHeader,
  validateOriginHeader,
  originOptionsFromMcp,
  extractBearerToken,
  buildWwwAuthenticateChallenge,
  MCP_SESSION_ID_HEADER,
  type JsonRpcRequest
} from '../mcp-transport.js'
import type { McpHttpPort } from './http-port.js'
import {
  resolveSecurityContext,
  sanitizeForLog,
  type BaseSecurityContextThunk
} from './security-context.js'

export interface McpPostHandler {
  handleMcpPost<TRes>(
    port: McpHttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes>
}

/** Build a JSON-RPC error payload from a thrown error, preserving code/data. */
function buildMcpErrorPayload(error: unknown, id: JsonRpcRequest['id']) {
  const code = (error as any)?.code ?? -32603
  const data = (error as any)?.data
  const message = (error as Error).message || 'MCP request failed'
  return buildJsonRpcError(id ?? null, code, message, data)
}

/**
 * Build the MCP POST handler once. Resolves the static resources/prompts/
 * instructions and app config from {@link MCPOptions} at setup time, mirroring
 * the per-request plumbing the adapters used to do inline.
 */
export function createMcpPostHandler(
  semanticLayer: SemanticLayerCompiler,
  mcp: MCPOptions
): McpPostHandler {
  const appEnabled = !!mcp.app
  const appConfig: McpAppConfig | undefined = typeof mcp.app === 'object' ? mcp.app : undefined

  // Resolve the static resources/prompts/instructions lazily on first MCP request.
  // `buildMcpResources` reads the live cube metadata, so deferring it keeps
  // construction cheap and avoids touching the semantic layer for adapters (or
  // tests) that never exercise an MCP request.
  let statics: { resources: ReturnType<typeof buildMcpResources>; prompts: ReturnType<typeof resolveMcpPrompts>; instructions: string } | undefined
  function getStatics() {
    if (!statics) {
      statics = {
        resources: buildMcpResources(semanticLayer, mcp.resources),
        prompts: resolveMcpPrompts(mcp.prompts),
        instructions: resolveMcpInstructions(mcp.instructions)
      }
    }
    return statics
  }

  async function handleMcpPost<TRes>(
    port: McpHttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    // OAuth 2.1 bearer token check (RFC 9728) — when resourceMetadataUrl is configured,
    // reject requests without a Bearer token with 401 + WWW-Authenticate pointing to PRM
    if (mcp.resourceMetadataUrl && !extractBearerToken(port.getHeader('authorization'))) {
      port.setHeader('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
      return port.send(401, { error: 'Bearer token required' })
    }

    // Validate Origin header (MCP 2025-11-25: MUST validate, return 403 if invalid)
    const originValidation = validateOriginHeader(
      port.getHeader('origin'),
      originOptionsFromMcp(mcp)
    )
    if (!originValidation.valid) {
      return port.send(403, buildJsonRpcError(null, -32600, originValidation.reason))
    }

    // Validate Accept header (MCP 2025-11-25: MUST include both application/json and text/event-stream)
    const acceptHeader = port.getHeader('accept')
    if (!validateAcceptHeader(acceptHeader)) {
      return port.send(400, buildJsonRpcError(null, -32600, 'Accept header must include both application/json and text/event-stream'))
    }

    const protocol = negotiateProtocol({ 'mcp-protocol-version': port.getHeader('mcp-protocol-version') })
    if (!protocol.ok) {
      return port.send(426, {
        error: 'Unsupported MCP protocol version',
        supported: protocol.supported
      })
    }

    const rpcRequest = parseJsonRpc(await port.getBody())
    if (!rpcRequest) {
      return port.send(400, buildJsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'))
    }

    const wantsStream = wantsEventStream(acceptHeader)
    const isInitialize = rpcRequest.method === 'initialize'
    const { resources, prompts, instructions } = getStatics()

    try {
      const result = await dispatchMcpMethod(
        rpcRequest.method,
        rpcRequest.params,
        {
          semanticLayer,
          // The core merges the request locale into the base context here; the
          // raw req/res are unused (the adapter's thunk closes over them).
          extractSecurityContext: () => resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n)),
          rawRequest: undefined,
          rawResponse: undefined,
          negotiatedProtocol: protocol.negotiated,
          resources,
          prompts,
          instructions,
          appEnabled,
          appConfig,
          serverName: mcp.serverName
        }
      )

      if (isNotification(rpcRequest)) {
        return port.sendEmpty(202)
      }

      // Extract session ID for header (MCP 2025-11-25: return in MCP-Session-Id header)
      const sessionId = isInitialize && result && typeof result === 'object' && 'sessionId' in result
        ? (result as { sessionId?: string }).sessionId
        : undefined
      if (sessionId) {
        port.setHeader(MCP_SESSION_ID_HEADER, sessionId)
      }

      const response = buildJsonRpcResult(rpcRequest.id ?? null, result)
      if (wantsStream) {
        const eventId = primeEventId()
        return port.sendSse(200, `id: ${eventId}\n\n` + serializeSseEvent(response, eventId))
      }
      return port.send(200, response)
    } catch (error) {
      // Log notification errors before returning 202 (P3 fix)
      if (isNotification(rpcRequest)) {
        console.error('MCP notification processing error:', sanitizeForLog(error))
        return port.sendEmpty(202)
      }

      console.error('MCP RPC error:', sanitizeForLog(error))
      const rpcError = buildMcpErrorPayload(error, rpcRequest.id)
      if (wantsStream) {
        const eventId = primeEventId()
        return port.sendSse(200, `id: ${eventId}\n\n` + serializeSseEvent(rpcError, eventId))
      }
      return port.send(200, rpcError)
    }
  }

  return { handleMcpPost }
}
