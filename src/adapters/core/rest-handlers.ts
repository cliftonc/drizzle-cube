/**
 * Framework-agnostic REST handlers for the non-`/load` Cube.js endpoints:
 * `meta`, `sql` (GET+POST), `dry-run` (GET+POST), `batch`, and `explain`.
 *
 * Each handler runs the validate/execute/format flow against an {@link HttpPort}
 * with no framework types inside. Response shapes, status codes, and error
 * bodies match the adapters' original inlined implementations exactly — some
 * endpoints use `formatErrorResponse` (`{ error, status }`), others a bare
 * `{ error }` or `{ error, valid: false }`; this is preserved per endpoint.
 */

import type { SemanticLayerCompiler } from '../../server/compiler.js'
import type { SemanticQuery, SecurityContext, ExplainOptions } from '../../server/index.js'
import {
  handleDryRun,
  handleBatchRequest,
  formatSqlResponse,
  formatMetaResponse,
  formatErrorResponse
} from '../utils.js'
import type { HttpPort } from './http-port.js'
import {
  resolveSecurityContext,
  sanitizeForLog,
  type BaseSecurityContextThunk
} from './security-context.js'

/** REST handlers keyed by endpoint; each closes over the shared semantic layer. */
export interface RestHandlers {
  handleMetaGet<TRes>(port: HttpPort<TRes>): TRes
  handleSqlGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleSqlPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleDryRunGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleDryRunPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleBatchPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
  handleExplainPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>
}

export function createRestHandlers(semanticLayer: SemanticLayerCompiler): RestHandlers {
  /** Shared SQL-generation tail: validate, require a referenced cube, generate, format. */
  async function runSql<TRes>(
    query: SemanticQuery,
    securityContext: SecurityContext,
    port: HttpPort<TRes>
  ): Promise<TRes> {
    const validation = semanticLayer.validateQuery(query)
    if (!validation.isValid) {
      return port.send(400, formatErrorResponse(`Query validation failed: ${validation.errors.join(', ')}`, 400))
    }

    // For SQL generation, we need at least one cube referenced
    const firstMember = query.measures?.[0] || query.dimensions?.[0]
    if (!firstMember) {
      return port.send(400, formatErrorResponse('No measures or dimensions specified', 400))
    }

    const cubeName = firstMember.split('.')[0]
    const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
    return port.send(200, formatSqlResponse(query, sqlResult))
  }

  function handleMetaGet<TRes>(port: HttpPort<TRes>): TRes {
    try {
      // Get cached metadata (fast path)
      return port.send(200, formatMetaResponse(semanticLayer.getMetadata()))
    } catch (error) {
      // codeql[js/log-injection] error source is internal, not user-controlled
      console.error('Metadata error:', error)
      return port.send(500, formatErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch metadata',
        500
      ))
    }
  }

  async function handleSqlPost<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const body = await port.getBody()
      // Accept both the nested `{ query }` and the bare-query body shapes
      // (matches load/dry-run/explain; restores the Next.js adapter's original unwrap).
      const query = ((body as { query?: SemanticQuery })?.query || body) as SemanticQuery
      const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))
      return await runSql(query, securityContext, port)
    } catch (error) {
      console.error('SQL generation error:', sanitizeForLog(error))
      return port.send(500, formatErrorResponse(
        error instanceof Error ? error.message : 'SQL generation failed',
        500
      ))
    }
  }

  async function handleSqlGet<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const queryParam = port.getQueryParam('query')
      if (!queryParam) {
        return port.send(400, formatErrorResponse('Query parameter is required', 400))
      }
      // Invalid JSON is a client error (400), mirroring GET /load — restores the
      // Next.js adapter's original behaviour rather than letting it 500.
      let query: SemanticQuery
      try {
        query = JSON.parse(queryParam) as SemanticQuery
      } catch {
        return port.send(400, formatErrorResponse('Invalid JSON in query parameter', 400))
      }
      const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))
      return await runSql(query, securityContext, port)
    } catch (error) {
      console.error('SQL generation error:', sanitizeForLog(error))
      return port.send(500, formatErrorResponse(
        error instanceof Error ? error.message : 'SQL generation failed',
        500
      ))
    }
  }

  async function handleDryRunPost<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const body = await port.getBody()
      // Handle both direct query and nested query formats
      const query = ((body as { query?: SemanticQuery })?.query || body) as SemanticQuery
      const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))
      const result = await handleDryRun(query, securityContext, semanticLayer)
      return port.send(200, result)
    } catch (error) {
      console.error('Dry-run error:', error)
      return port.send(400, {
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      })
    }
  }

  async function handleDryRunGet<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const queryParam = port.getQueryParam('query')
      if (!queryParam) {
        return port.send(400, { error: 'Query parameter is required', valid: false })
      }
      const query = JSON.parse(queryParam) as SemanticQuery
      const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))
      const result = await handleDryRun(query, securityContext, semanticLayer)
      return port.send(200, result)
    } catch (error) {
      console.error('Dry-run error:', error)
      return port.send(400, {
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      })
    }
  }

  async function handleBatchPost<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const body = (await port.getBody()) as { queries?: SemanticQuery[] }
      const queries = body?.queries

      if (!queries || !Array.isArray(queries)) {
        return port.send(400, formatErrorResponse('Request body must contain a "queries" array', 400))
      }
      if (queries.length === 0) {
        return port.send(400, formatErrorResponse('Queries array cannot be empty', 400))
      }

      // Extract security context ONCE (shared across all queries)
      const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))
      const skipCache = port.getHeader('x-cache-control') === 'no-cache'

      const batchResult = await handleBatchRequest(queries, securityContext, semanticLayer, { skipCache })
      return port.send(200, batchResult)
    } catch (error) {
      // codeql[js/log-injection] error source is internal, not user-controlled
      console.error('Batch execution error:', error)
      return port.send(500, formatErrorResponse(
        error instanceof Error ? error.message : 'Batch execution failed',
        500
      ))
    }
  }

  async function handleExplainPost<TRes>(
    port: HttpPort<TRes>,
    getBaseSecurityContext: BaseSecurityContextThunk
  ): Promise<TRes> {
    try {
      const body = (await port.getBody()) as { query?: SemanticQuery; options?: ExplainOptions }
      // Handle both direct query and nested query formats
      const query = (body?.query || body) as SemanticQuery
      const options = (body?.options || {}) as ExplainOptions
      const securityContext = await resolveSecurityContext(getBaseSecurityContext, (n) => port.getHeader(n))

      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return port.send(400, { error: `Query validation failed: ${validation.errors.join(', ')}` })
      }

      const explainResult = await semanticLayer.explainQuery(query, securityContext, options)
      return port.send(200, explainResult)
    } catch (error) {
      console.error('Explain error:', error)
      return port.send(500, {
        error: error instanceof Error ? error.message : 'Explain query failed'
      })
    }
  }

  return {
    handleMetaGet,
    handleSqlGet,
    handleSqlPost,
    handleDryRunGet,
    handleDryRunPost,
    handleBatchPost,
    handleExplainPost
  }
}
