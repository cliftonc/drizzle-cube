import { SemanticLayerCompiler, SecurityContext } from '../server/index.js';
import { MCPToolResult } from './mcp-tools.js';
export interface CubeToolHandlerDeps {
    semanticLayer: SemanticLayerCompiler;
    getSecurityContext: (meta?: unknown) => SecurityContext | Promise<SecurityContext>;
    wrapContent: (result: unknown) => MCPToolResult;
    wrapError: (error: unknown) => MCPToolResult;
}
/**
 * Execute the `discover` tool. Reads the caller's cube set, so it resolves a
 * security context first — discovery has no unauthenticated mode.
 */
export declare function runDiscoverTool(deps: CubeToolHandlerDeps, args: unknown, meta?: unknown): Promise<MCPToolResult>;
/**
 * Execute the `validate` tool. The security context is required: validation is
 * against the caller's cube set, so a caller whose context cannot be resolved
 * gets an error rather than a base-set answer with the SQL omitted.
 */
export declare function runValidateTool(deps: CubeToolHandlerDeps, args: unknown, meta?: unknown): Promise<MCPToolResult>;
/**
 * Execute the `load` / `chart` tools. Both run the same query path; `chart`
 * additionally carries `_meta.ui` on its definition so the result renders in the
 * MCP App UI.
 */
export declare function runLoadTool(deps: CubeToolHandlerDeps, args: unknown, meta?: unknown): Promise<MCPToolResult>;
