/**
 * Composable MCP Tools for Drizzle Cube
 *
 * Use this module to register drizzle-cube's semantic layer tools
 * on your own MCP server — no need to use the built-in MCP endpoint.
 *
 * Works with @modelcontextprotocol/sdk or any MCP-compatible server.
 *
 * @example
 * ```typescript
 * import { getCubeTools } from 'drizzle-cube/mcp'
 * import { createDrizzleSemanticLayer } from 'drizzle-cube/server'
 *
 * const semanticLayer = createDrizzleSemanticLayer({ drizzle: db, schema })
 * semanticLayer.registerCube(ordersCube)
 *
 * const cubeTools = getCubeTools({
 *   semanticLayer,
 *   getSecurityContext: async () => ({ orgId: 'org_123' })
 * })
 *
 * // Register alongside your own tools on any MCP server
 * cubeTools.definitions  // tool schemas for tools/list
 * cubeTools.handle(name, args)  // tool executor for tools/call
 * cubeTools.prompts      // MCP prompts for prompts/list
 * cubeTools.resources    // MCP resources for resources/list
 * ```
 *
 * @module
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
import type { MCPPrompt } from '../server/ai/mcp-prompts'
import {
  type MCPResource,
  type McpAppConfig,
  buildToolList,
  getDefaultResources,
  getDefaultPrompts,
  getMcpAppHtml,
  MCP_APP_RESOURCE_URI,
  MCP_APP_MIME_TYPE
} from './mcp-transport'

// Re-export types consumers may need
export type { MCPPrompt, MCPResource, DiscoverRequest, ValidateRequest, LoadRequest }
export type { SecurityContext } from '../server'

/**
 * MCP tool content block (matches MCP spec)
 */
export interface MCPToolContent {
  type: 'text'
  text: string
}

/**
 * MCP tool result (matches MCP spec CallToolResult)
 */
export interface MCPToolResult {
  content: MCPToolContent[]
  isError: boolean
}

/**
 * MCP tool definition (matches MCP spec Tool)
 */
export interface MCPToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    required?: string[]
    properties: Record<string, unknown>
  }
}

/**
 * Options for creating composable cube tools
 */
export interface GetCubeToolsOptions {
  /** The semantic layer compiler instance with registered cubes */
  semanticLayer: SemanticLayerCompiler

  /**
   * Extract security context for query execution.
   * Called when the `load` tool is invoked.
   * Receives whatever metadata your MCP server provides (auth info, request context, etc.)
   */
  getSecurityContext: (meta?: unknown) => SecurityContext | Promise<SecurityContext>

  /**
   * Optional tool name prefix. Defaults to 'drizzle_cube_'.
   * Set to '' for no prefix, or provide your own like 'analytics_'.
   */
  toolPrefix?: string

  /**
   * Which tools to expose. Defaults to all: ['discover', 'validate', 'load']
   */
  tools?: ('discover' | 'validate' | 'load')[]

  /** Custom MCP prompts (defaults to built-in drizzle-cube prompts) */
  prompts?: MCPPrompt[]

  /** Custom MCP resources (defaults to built-in drizzle-cube resources) */
  resources?: MCPResource[]

  /**
   * Enable MCP App visualization for the load tool.
   * Pass `true` to enable with defaults, or a config object to set locale options.
   * @example app: { defaultLocale: 'nl-NL', detectBrowserLocale: false }
   */
  app?: boolean | McpAppConfig
}

/**
 * The composable tools object returned by getCubeTools()
 */
export interface CubeTools {
  /** Tool definitions for MCP tools/list responses */
  definitions: MCPToolDefinition[]

  /**
   * Execute a tool by name. Returns MCP-spec-compliant result.
   * @param name - Tool name (with or without prefix)
   * @param args - Tool arguments from the MCP client
   * @param meta - Optional metadata passed to getSecurityContext
   */
  handle: (name: string, args: unknown, meta?: unknown) => Promise<MCPToolResult>

  /**
   * Check if a tool name is handled by these cube tools
   * @param name - Tool name to check (with or without prefix)
   */
  handles: (name: string) => boolean

  /** MCP prompts for prompts/list responses */
  prompts: MCPPrompt[]

  /** MCP resources for resources/list responses */
  resources: MCPResource[]

  /** The tool names this instance handles (with prefix applied) */
  toolNames: string[]
}

function wrapContent(result: unknown): MCPToolResult {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof result === 'string' ? result : JSON.stringify(result)
      }
    ],
    isError: false
  }
}

function wrapError(error: unknown): MCPToolResult {
  const message = error instanceof Error ? error.message : String(error)
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true
  }
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
export function getCubeTools(options: GetCubeToolsOptions): CubeTools {
  const {
    semanticLayer,
    getSecurityContext,
    toolPrefix = 'drizzle_cube_',
    tools: enabledTools = ['discover', 'validate', 'load', 'chart'],
    prompts = getDefaultPrompts(),
    resources: customResources,
    app = false
  } = options

  const appEnabled = !!app
  const appConfig: McpAppConfig | undefined = typeof app === 'object' ? app : undefined

  // Build resources: custom or defaults + optional app resource
  const baseResources = customResources ?? getDefaultResources()
  const resources = appEnabled ? [...baseResources, ...getMcpAppResources(appConfig)] : baseResources

  // Get tool schemas from the single source of truth in mcp-transport
  const allTools = buildToolList({ appEnabled })
  const toolsByName = new Map(allTools.map(t => [t.name, t]))

  // Build prefixed tool definitions from the canonical schemas
  const definitions: MCPToolDefinition[] = enabledTools
    .filter(name => toolsByName.has(name))
    .map(name => {
      const tool = toolsByName.get(name)!
      const def: MCPToolDefinition = {
        name: `${toolPrefix}${name}`,
        description: tool.description,
        inputSchema: tool.inputSchema as MCPToolDefinition['inputSchema']
      }
      // Pass through _meta (MCP App UI metadata) if present
      const meta = (tool as any)._meta
      if (meta) (def as any)._meta = meta
      return def
    })

  const toolNames = definitions.map(d => d.name)

  // Build a set of handled names (both with and without prefix for flexibility)
  const handledNames = new Set<string>()
  for (const name of enabledTools) {
    handledNames.add(name)
    handledNames.add(`${toolPrefix}${name}`)
  }

  function handles(name: string): boolean {
    return handledNames.has(name)
  }

  async function handle(name: string, args: unknown, meta?: unknown): Promise<MCPToolResult> {
    // Strip prefix if present to get the base tool name
    const baseName = name.startsWith(toolPrefix) ? name.slice(toolPrefix.length) : name

    if (!enabledTools.includes(baseName as any)) {
      return wrapError(`Unknown tool: ${name}`)
    }

    try {
      switch (baseName) {
        case 'discover':
          return wrapContent(await handleDiscover(semanticLayer, (args || {}) as DiscoverRequest))

        case 'validate': {
          const body = (args || {}) as ValidateRequest
          if (!body.query) {
            return wrapError('query is required')
          }
          return wrapContent(await handleValidate(semanticLayer, body))
        }

        case 'load': {
          const body = (args || {}) as LoadRequest
          if (!body.query) {
            return wrapError('query is required')
          }
          const securityContext = await getSecurityContext(meta)
          return wrapContent(await handleLoad(semanticLayer, securityContext, body))
        }

        case 'chart': {
          // Same as load but rendered in the MCP App UI (has _meta.ui attached)
          const body = (args || {}) as LoadRequest
          if (!body.query) {
            return wrapError('query is required')
          }
          const securityContext = await getSecurityContext(meta)
          return wrapContent(await handleLoad(semanticLayer, securityContext, body))
        }

        default:
          return wrapError(`Unknown tool: ${name}`)
      }
    } catch (error) {
      return wrapError(error)
    }
  }

  return {
    definitions,
    handle,
    handles,
    prompts,
    resources,
    toolNames
  }
}

function getMcpAppResources(config?: McpAppConfig): MCPResource[] {
  const html = getMcpAppHtml(config)
  if (!html) return []
  return [{
    uri: MCP_APP_RESOURCE_URI,
    name: 'Drizzle Cube Visualization',
    description: 'Interactive chart visualization for query results',
    mimeType: MCP_APP_MIME_TYPE,
    text: html
  }]
}
