/**
 * Framework-agnostic core for the Cube.js REST + MCP HTTP surface.
 *
 * This is the deep module behind the framework adapters: it runs the full
 * request orchestration (validate / execute / format) against an
 * {@link HttpPort}, with no framework types inside. Adapters translate their
 * req/res to a port and route to these handlers; they hold no request-handling
 * logic of their own.
 *
 * The REST `/load` flow lives here directly; the other REST endpoints
 * (`meta`/`sql`/`dry-run`/`batch`/`explain`) and MCP POST are composed in from
 * `rest-handlers.ts` and `mcp-handler.ts`.
 *
 * NOTE: This REST `/load` is a DIFFERENT load orchestration from `handleLoad` in
 * `src/server/query-handlers.ts`. That one is the MCP/agent-flavored load
 * (normalizes AI fields, throws on invalid, no cache control, returns raw
 * `{ data, annotation, query }`). This REST load does NOT normalize, maps
 * validation failures to 400 JSON, honors `x-cache-control: no-cache`, and
 * returns `formatCubeResponse(...)`. The two coexist by design; converging them
 * is a separate, later decision.
 */

import type { SemanticLayerCompiler } from '../../server/compiler.js'
import type { SemanticQuery } from '../../server/index.js'
import type { MCPOptions } from '../utils.js'
import { formatCubeResponse, formatErrorResponse } from '../utils.js'
import type { HttpPort, McpHttpPort } from './http-port.js'
import {
  resolveSecurityContext,
  type BaseSecurityContextThunk
} from './security-context.js'
import { createRestHandlers, type RestHandlers } from './rest-handlers.js'
import { createMcpPostHandler } from './mcp-handler.js'

export type { BaseSecurityContextThunk } from './security-context.js'

export interface CubeHttpHandlerOptions {
  /** The semantic layer the handlers validate and execute against. */
  semanticLayer: SemanticLayerCompiler
  /** Called in the REST `/load` catch-all 500 path with the thrown error (e.g. for logging). */
  onError: (error: unknown) => void
  /**
   * MCP endpoint config. Resolved once into the MCP POST handler. When omitted,
   * MCP defaults are used; the adapter decides whether to route the MCP path.
   */
  mcp?: MCPOptions
}

export interface CubeHttpHandler extends RestHandlers {
  handleLoadGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleLoadPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleMcpPost<TRes>(port: McpHttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
}

/**
 * Build all HTTP handlers once. Each REST entry point owns its own request
 * extraction, then funnels into a shared validate/execute/format tail.
 */
export function createCubeHttpHandler(options: CubeHttpHandlerOptions): CubeHttpHandler {
  const { semanticLayer, onError, mcp = {} } = options

  const restHandlers = createRestHandlers(semanticLayer)
  const { handleMcpPost } = createMcpPostHandler(semanticLayer, mcp)

  /** Map an unexpected (thrown) error to a 500, logging it via the injected onError. */
  function handleCatchAll<TRes>(error: unknown, port: HttpPort<TRes>): TRes {
    onError(error)
    return port.send(500, formatErrorResponse(
      error instanceof Error ? error.message : 'Query execution failed',
      500
    ))
  }

  async function runLoad<TRes>(
    query: SemanticQuery,
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    // Merge the request locale into the (pre-locale) security context here in the core.
    const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))

    const validation = semanticLayer.validateQuery(query)
    if (!validation.isValid) {
      return port.send(400, formatErrorResponse(
        `Query validation failed: ${validation.errors.join(', ')}`,
        400
      ))
    }

    const skipCache = port.getHeader('x-cache-control') === 'no-cache'

    const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, { skipCache })
    return port.send(200, formatCubeResponse(query, result, semanticLayer))
  }

  async function handleLoadPost<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const body = await port.getBody()
      // Accept both the nested `{ query }` and the bare-query body shapes
      // (mirrors the adapters' original `req.body.query || req.body`).
      const query = ((body as { query?: SemanticQuery })?.query || body) as SemanticQuery
      return await runLoad(query, port, getBaseSecurityContext)
    } catch (error) {
      return handleCatchAll(error, port)
    }
  }

  async function handleLoadGet<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      // GET-specific extraction: param presence + JSON parse are explicit 400s,
      // checked before any security-context resolution.
      const queryParam = port.getQueryParam('query')
      if (!queryParam) {
        return port.send(400, formatErrorResponse('Query parameter is required', 400))
      }

      let query: SemanticQuery
      try {
        query = JSON.parse(queryParam)
      } catch {
        return port.send(400, formatErrorResponse('Invalid JSON in query parameter', 400))
      }

      return await runLoad(query, port, getBaseSecurityContext)
    } catch (error) {
      return handleCatchAll(error, port)
    }
  }

  return {
    handleLoadGet,
    handleLoadPost,
    handleMcpPost,
    ...restHandlers
  }
}
