/**
 * Per-tool execution helpers for getCubeTools().
 *
 * Extracted from the getCubeTools `handle` switch to keep each tool's branch
 * (arg validation + security-context resolution + semantic-layer call) out of a
 * single high-complexity dispatcher. Behaviour is identical to the inlined cases.
 */

import type { SemanticLayerCompiler, SecurityContext } from '../server/index.js'
import {
  handleDiscover,
  handleValidate,
  handleLoad,
  type DiscoverRequest,
  type ValidateRequest,
  type LoadRequest
} from './utils.js'
import type { MCPToolResult } from './mcp-tools.js'

export interface CubeToolHandlerDeps {
  semanticLayer: SemanticLayerCompiler
  getSecurityContext: (meta?: unknown) => SecurityContext | Promise<SecurityContext>
  wrapContent: (result: unknown) => MCPToolResult
  wrapError: (error: unknown) => MCPToolResult
}

/**
 * Execute the `discover` tool. Reads the caller's cube set, so it resolves a
 * security context first — discovery has no unauthenticated mode.
 */
export async function runDiscoverTool(
  deps: CubeToolHandlerDeps,
  args: unknown,
  meta?: unknown
): Promise<MCPToolResult> {
  const securityContext = await deps.getSecurityContext(meta)
  return deps.wrapContent(
    await handleDiscover(deps.semanticLayer, securityContext, (args || {}) as DiscoverRequest)
  )
}

/**
 * Execute the `validate` tool. The security context is required: validation is
 * against the caller's cube set, so a caller whose context cannot be resolved
 * gets an error rather than a base-set answer with the SQL omitted.
 */
export async function runValidateTool(
  deps: CubeToolHandlerDeps,
  args: unknown,
  meta?: unknown
): Promise<MCPToolResult> {
  const body = (args || {}) as ValidateRequest
  if (!body.query) {
    return deps.wrapError('query is required')
  }
  const securityContext = await deps.getSecurityContext(meta)
  return deps.wrapContent(await handleValidate(deps.semanticLayer, securityContext, body))
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
