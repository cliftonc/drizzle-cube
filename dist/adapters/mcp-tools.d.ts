import { SemanticLayerCompiler, SecurityContext } from '../server/index.js';
import { DiscoverRequest, ValidateRequest, LoadRequest } from './utils.js';
import { MCPPrompt } from '../server/ai/mcp-prompts.js';
import { MCPResource, McpAppConfig } from './mcp-transport.js';
export type { MCPPrompt, MCPResource, DiscoverRequest, ValidateRequest, LoadRequest };
export type { SecurityContext } from '../server/index.js';
/**
 * MCP tool content block (matches MCP spec)
 */
export interface MCPToolContent {
    type: 'text';
    text: string;
}
/**
 * MCP tool result (matches MCP spec CallToolResult)
 */
export interface MCPToolResult {
    content: MCPToolContent[];
    isError: boolean;
}
/**
 * MCP tool definition (matches MCP spec Tool)
 */
export interface MCPToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        required?: string[];
        properties: Record<string, unknown>;
    };
}
/**
 * Options for creating composable cube tools
 */
export interface GetCubeToolsOptions {
    /** The semantic layer compiler instance with registered cubes */
    semanticLayer: SemanticLayerCompiler;
    /**
     * Extract security context for query execution.
     * Called when the `load` tool is invoked.
     * Receives whatever metadata your MCP server provides (auth info, request context, etc.)
     */
    getSecurityContext: (meta?: unknown) => SecurityContext | Promise<SecurityContext>;
    /**
     * Optional tool name prefix. Defaults to 'drizzle_cube_'.
     * Set to '' for no prefix, or provide your own like 'analytics_'.
     */
    toolPrefix?: string;
    /**
     * Which tools to expose. Defaults to all: ['discover', 'validate', 'load']
     */
    tools?: ('discover' | 'validate' | 'load')[];
    /** Custom MCP prompts (defaults to built-in drizzle-cube prompts) */
    prompts?: MCPPrompt[];
    /** Custom MCP resources (defaults to built-in drizzle-cube resources) */
    resources?: MCPResource[];
    /**
     * Enable MCP App visualization for the load tool.
     * Pass `true` to enable with defaults, or a config object to set locale options.
     * @example app: { defaultLocale: 'nl-NL', detectBrowserLocale: false }
     */
    app?: boolean | McpAppConfig;
}
/**
 * The composable tools object returned by getCubeTools()
 */
export interface CubeTools {
    /** Tool definitions for MCP tools/list responses */
    definitions: MCPToolDefinition[];
    /**
     * Execute a tool by name. Returns MCP-spec-compliant result.
     * @param name - Tool name (with or without prefix)
     * @param args - Tool arguments from the MCP client
     * @param meta - Optional metadata passed to getSecurityContext
     */
    handle: (name: string, args: unknown, meta?: unknown) => Promise<MCPToolResult>;
    /**
     * Check if a tool name is handled by these cube tools
     * @param name - Tool name to check (with or without prefix)
     */
    handles: (name: string) => boolean;
    /** MCP prompts for prompts/list responses */
    prompts: MCPPrompt[];
    /** MCP resources for resources/list responses */
    resources: MCPResource[];
    /** The tool names this instance handles (with prefix applied) */
    toolNames: string[];
}
/**
 * Create composable MCP tools for your semantic layer.
 *
 * Returns tool definitions, a handler function, and prompts/resources
 * that you can register on any MCP server.
 *
 * @example With @modelcontextprotocol/sdk
 * ```typescript
 * import { Server } from '@modelcontextprotocol/sdk/server/index.js'
 * import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
 * import { getCubeTools } from 'drizzle-cube/mcp'
 *
 * const cubeTools = getCubeTools({
 *   semanticLayer,
 *   getSecurityContext: async (meta) => ({ orgId: meta.authInfo?.orgId })
 * })
 *
 * const server = new Server({ name: 'my-server', version: '1.0.0' })
 *
 * server.setRequestHandler(ListToolsRequestSchema, async () => ({
 *   tools: [...myOtherTools, ...cubeTools.definitions]
 * }))
 *
 * server.setRequestHandler(CallToolRequestSchema, async (req) => {
 *   if (cubeTools.handles(req.params.name)) {
 *     return cubeTools.handle(req.params.name, req.params.arguments, req)
 *   }
 *   return handleOtherTools(req)
 * })
 * ```
 *
 * @example With Hono + postgrest-mcp style
 * ```typescript
 * import { getCubeTools } from 'drizzle-cube/mcp'
 *
 * const cubeTools = getCubeTools({
 *   semanticLayer,
 *   getSecurityContext: async () => ({ orgId: 'default' })
 * })
 *
 * // Merge with your existing PostgREST tools
 * const allTools = [...postgrestTools, ...cubeTools.definitions]
 * ```
 */
export declare function getCubeTools(options: GetCubeToolsOptions): CubeTools;
