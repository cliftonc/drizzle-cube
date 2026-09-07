import { SemanticLayerCompiler } from '../../server/compiler.js';
import { MCPOptions } from '../utils.js';
import { HttpPort, McpHttpPort } from './http-port.js';
import { BaseSecurityContextThunk } from './security-context.js';
import { RestHandlers } from './rest-handlers.js';
export type { BaseSecurityContextThunk } from './security-context.js';
export interface CubeHttpHandlerOptions {
    /** The semantic layer the handlers validate and execute against. */
    semanticLayer: SemanticLayerCompiler;
    /** Called in the REST `/load` catch-all 500 path with the thrown error (e.g. for logging). */
    onError: (error: unknown) => void;
    /**
     * MCP endpoint config. Resolved once into the MCP POST handler. When omitted,
     * MCP defaults are used; the adapter decides whether to route the MCP path.
     */
    mcp?: MCPOptions;
}
export interface CubeHttpHandler extends RestHandlers {
    handleLoadGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleLoadPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleMcpPost<TRes>(port: McpHttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
}
/**
 * Build all HTTP handlers once. Each REST entry point owns its own request
 * extraction, then funnels into a shared validate/execute/format tail.
 */
export declare function createCubeHttpHandler(options: CubeHttpHandlerOptions): CubeHttpHandler;
