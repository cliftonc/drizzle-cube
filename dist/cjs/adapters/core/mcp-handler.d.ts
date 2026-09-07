import { SemanticLayerCompiler } from '../../server/compiler.js';
import { MCPOptions } from '../utils.js';
import { McpHttpPort } from './http-port.js';
import { BaseSecurityContextThunk } from './security-context.js';
export interface McpPostHandler {
    handleMcpPost<TRes>(port: McpHttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
}
/**
 * Build the MCP POST handler once. Resolves the static resources/prompts/
 * instructions and app config from {@link MCPOptions} at setup time, mirroring
 * the per-request plumbing the adapters used to do inline.
 */
export declare function createMcpPostHandler(semanticLayer: SemanticLayerCompiler, mcp: MCPOptions): McpPostHandler;
