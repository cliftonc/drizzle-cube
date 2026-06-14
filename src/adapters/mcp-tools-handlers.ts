/**
 * Per-tool execution helpers for getCubeTools().
 *
 * Extracted from the getCubeTools `handle` switch to keep each tool's branch
 * (arg validation + security-context resolution + semantic-layer call) out of a
 * single high-complexity dispatcher. Behaviour is identical to the inlined cases.
 */

import type { SemanticLayerCompiler, SecurityContext } from '../server'
import {
  handleDiscover,
  handleValidate,
  handleLoad,
  type DiscoverRequest,
  type ValidateRequest,
  type LoadRequest
} from './utils'
import type { MCPToolResult } from './mcp-tools'

export interface CubeToolHandlerDeps {
  semanticLayer: SemanticLayerCompiler
  getSecurityContext: (meta?: unknown) => SecurityContext | Promise<SecurityContext>
  wrapContent: (result: unknown) => MCPToolResult
  wrapError: (error: unknown) => MCPToolResult
}

/** Execute the `discover` tool. */
export function runDiscoverTool(
  deps: CubeToolHandlerDeps,
  args: unknown
): Promise<MCPToolResult> {
  return handleDiscover(deps.semanticLayer, (args || {}) as DiscoverRequest).then(deps.wrapContent)
}

/** Execute the `validate` tool — security context is optional (SQL omitted without auth). */
export async function runValidateTool(
  deps: CubeToolHandlerDeps,
  args: unknown,
  meta?: unknown
): Promise<MCPToolResult> {
  const body = (args || {}) as ValidateRequest
  if (!body.query) {
    return deps.wrapError('query is required')
  }
  let securityContext: SecurityContext | undefined
  try {
    securityContext = await deps.getSecurityContext(meta) as SecurityContext
  } catch { /* validate works without auth — SQL just won't be included */ }
  return deps.wrapContent(await handleValidate(deps.semanticLayer, body, securityContext))
}

/**
 * Execute the `load` / `chart` tools. Both run the same query path; `chart`
 * additionally carries `_meta.ui` on its definition so the result renders in the
 * MCP App UI.
 */
export async function runLoadTool(
  deps: CubeToolHandlerDeps,
  args: unknown,
  meta?: unknown
): Promise<MCPToolResult> {
  const body = (args || {}) as LoadRequest
  if (!body.query) {
    return deps.wrapError('query is required')
  }
  const securityContext = await deps.getSecurityContext(meta)
  return deps.wrapContent(await handleLoad(deps.semanticLayer, securityContext, body))
}
