/**
 * Framework-agnostic core for the REST `/load` endpoint.
 *
 * This is the deep module behind the framework adapters: it runs the full REST
 * load orchestration against an {@link HttpPort}, with no framework types inside.
 *
 * NOTE: This is a DIFFERENT load orchestration from `handleLoad` in
 * `src/server/query-handlers.ts`. That one is the MCP/agent-flavored load
 * (normalizes AI fields, throws on invalid, no cache control, returns raw
 * `{ data, annotation, query }`). This REST load does NOT normalize, maps
 * validation failures to 400 JSON, honors `x-cache-control: no-cache`, and
 * returns `formatCubeResponse(...)`. The two coexist by design; converging them
 * is a separate, later decision.
 */

import type { SemanticLayerCompiler } from '../../server/compiler.js'
import type { SemanticQuery, SecurityContext } from '../../server/index.js'
import { formatCubeResponse, formatErrorResponse } from '../utils.js'
import { resolveRequestLocale, withLocaleInSecurityContext } from '../locale.js'
import type { HttpPort } from './http-port.js'

/** Returns the base (pre-locale) security context for a request. */
export type BaseSecurityContextThunk = () => SecurityContext | Promise<SecurityContext>

export interface CubeHttpHandlerOptions {
  /** The semantic layer the load flow validates and executes against. */
  semanticLayer: SemanticLayerCompiler
  /** Called once in the catch-all 500 path with the thrown error (e.g. for logging). */
  onError: (error: unknown) => void
}

export interface CubeHttpHandler {
  handleLoadGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleLoadPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
}

/**
 * Build the REST `/load` handlers (GET + POST) once. Each entry point owns its
 * own request extraction, then funnels into the shared `runLoad` tail.
 */
export function createCubeHttpHandler(options: CubeHttpHandlerOptions): CubeHttpHandler {
  const { semanticLayer, onError } = options

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
    const requestLocale = resolveRequestLocale((name) => port.getHeader(name))
    const securityContext = withLocaleInSecurityContext(await getBaseSecurityContext(), requestLocale)

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

  return { handleLoadGet, handleLoadPost }
}
