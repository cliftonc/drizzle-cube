import type { SemanticLayerCompiler, SecurityContext } from '../server'
import {
  getDefaultMCPPrompts,
  getDefaultMcpInstructions,
  type MCPPrompt
} from '../server/ai/mcp-prompts'
import { QUERY_PARAMS_SCHEMA } from '../server/ai/query-schema'
import {
  handleDiscover,
  handleValidate,
  handleLoad,
  generateRequestId,
  type DiscoverRequest,
  type ValidateRequest,
  type LoadRequest,
  type McpAppConfig
} from './utils'

// Re-export McpAppConfig for adapters that import from mcp-transport
export type { McpAppConfig }

// Re-export MCPPrompt for external consumers
export { type MCPPrompt }

// MCP App visualization constants
export const MCP_APP_RESOURCE_URI = 'ui://drizzle-cube/visualization.html'
export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app'

// MCP App HTML loaded from generated file (built by scripts/generate-mcp-app-html.ts)
import { mcpAppHtml } from '../mcp-app/generated-html'

/** Get the bundled MCP App HTML, optionally with locale config injected. Returns empty string if not yet built. */
export function getMcpAppHtml(config?: McpAppConfig): string {
  if (!mcpAppHtml || !config) return mcpAppHtml
  // Escape `</` → `<\/` so the JSON cannot break out of the script block
  const safeJson = JSON.stringify({
    defaultLocale: config.defaultLocale,
    detectBrowserLocale: config.detectBrowserLocale,
  }).replace(/<\//g, '<\\/')
  const script = `<script>window.__DRIZZLE_CUBE_MCP_APP_CONFIG__ = ${safeJson}</script>`
  return mcpAppHtml.replace('</head>', `${script}</head>`)
}

export type JsonRpcId = string | number | null | undefined

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: JsonRpcId
  method: string
  params?: unknown
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: JsonRpcId
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

export interface McpDispatchContext {
  semanticLayer: SemanticLayerCompiler
  extractSecurityContext: (req: any, res: any) => SecurityContext | Promise<SecurityContext>
  rawRequest: unknown
  rawResponse: unknown
  negotiatedProtocol?: string | null
  resources?: MCPResource[]
  prompts?: MCPPrompt[]
  /**
   * Pre-resolved instructions string returned in the `initialize` result
   * (`InitializeResult.instructions` per MCP spec). When omitted, falls
   * back to `getDefaultMcpInstructions()`. Adapters resolve this from the
   * `MCPOptions.instructions` resolver before calling `dispatchMcpMethod`.
   */
  instructions?: string
  /** Enable MCP App visualization for load tool */
  appEnabled?: boolean
  /** Locale configuration for the MCP App (only used when appEnabled is true) */
  appConfig?: McpAppConfig
  /** Optional name for the MCP serverInfo.name field. Defaults to 'drizzle-cube'. */
  serverName?: string
}

export interface MCPResource {
  uri: string
  name: string
  description: string
  mimeType: string
  text: string
}

export type MCPPromptResolver = MCPPrompt[] | ((defaults: MCPPrompt[]) => MCPPrompt[])
export type MCPResourceResolver = MCPResource[] | ((defaults: MCPResource[]) => MCPResource[])
export type MCPInstructionsResolver = string | ((defaults: string) => string)

export interface ProtocolNegotiation {
  ok: boolean
  negotiated: string | null
  supported: string[]
}

export const SUPPORTED_MCP_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26']
export const DEFAULT_MCP_PROTOCOL = '2025-11-25'

export function negotiateProtocol(headers: Record<string, string | string[] | undefined>): ProtocolNegotiation {
  const requested = normalizeHeader(headers['mcp-protocol-version'])
  const negotiated = requested || DEFAULT_MCP_PROTOCOL
  return {
    ok: SUPPORTED_MCP_PROTOCOLS.includes(negotiated),
    negotiated: SUPPORTED_MCP_PROTOCOLS.includes(negotiated) ? negotiated : null,
    supported: SUPPORTED_MCP_PROTOCOLS
  }
}

export function wantsEventStream(accept: string | null | undefined): boolean {
  if (!accept) return false
  const values = accept.split(',').map(v => v.trim().toLowerCase())
  const hasSse = values.includes('text/event-stream')
  const hasJson = values.includes('application/json')
  // Prefer JSON when both are offered; stream only when client explicitly prefers SSE
  return hasSse && !hasJson
}

/**
 * MCP Session ID header name (per 2025-11-25 spec)
 */
export const MCP_SESSION_ID_HEADER = 'mcp-session-id'

/**
 * MCP Protocol Version header name (per 2025-11-25 spec)
 */
export const MCP_PROTOCOL_VERSION_HEADER = 'mcp-protocol-version'

/**
 * Validate the Accept header per MCP 2025-11-25 spec.
 * Client MUST include both `application/json` and `text/event-stream` as supported content types.
 *
 * @returns true if valid, false if invalid
 */
export function validateAcceptHeader(accept: string | null | undefined): boolean {
  if (!accept) return false
  const values = accept.split(',').map(v => v.trim().toLowerCase().split(';')[0])
  const hasJson = values.some(v => v === 'application/json')
  const hasSse = values.some(v => v === 'text/event-stream')
  const hasWildcard = values.some(v => v === '*/*')
  // Accept if both JSON and SSE are present (spec-compliant),
  // or if JSON alone is present (Claude app initial probe),
  // or if wildcard is present (generic HTTP clients)
  return (hasJson && hasSse) || hasJson || hasWildcard
}

export interface OriginValidationOptions {
  /**
   * List of allowed origins (e.g., ['http://localhost:3000', 'https://myapp.com'])
   * If not provided, defaults to localhost origins only
   */
  allowedOrigins?: string[]
  /**
   * If true, allows requests without an Origin header (non-browser clients)
   * @default true
   */
  allowMissingOrigin?: boolean
}

/**
 * Validate the Origin header per MCP 2025-11-25 spec.
 * Servers MUST validate Origin to prevent DNS rebinding attacks.
 * If Origin is present and invalid, MUST respond with 403 Forbidden.
 *
 * @returns { valid: true } if allowed, or { valid: false, reason: string } if blocked
 */
export function validateOriginHeader(
  origin: string | null | undefined,
  options: OriginValidationOptions = {}
): { valid: true } | { valid: false; reason: string } {
  const { allowMissingOrigin = true, allowedOrigins } = options

  // No Origin header - typically non-browser clients (curl, Postman, etc.)
  if (!origin) {
    if (allowMissingOrigin) {
      return { valid: true }
    }
    return { valid: false, reason: 'Origin header is required' }
  }

  // If no allowedOrigins configured, allow all origins (permissive mode)
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return { valid: true }
  }

  // Parse the origin
  let parsedOrigin: URL
  try {
    parsedOrigin = new URL(origin)
  } catch {
    return { valid: false, reason: 'Invalid Origin header format' }
  }

  // Check against explicit allowed origins
  const normalized = allowedOrigins.map(o => {
    try {
      return new URL(o).origin
    } catch {
      return o
    }
  })
  if (normalized.includes(parsedOrigin.origin)) {
    return { valid: true }
  }

  return { valid: false, reason: 'Origin not in allowed list' }
}

/**
 * Extract a Bearer token from an Authorization header.
 * Returns the token string if present and well-formed, or null otherwise.
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null
  const match = /^Bearer\s+(\S+)$/i.exec(authHeader)
  return match ? match[1] : null
}

/**
 * Build a WWW-Authenticate challenge header value per MCP / RFC 9728.
 * Points the client to the Protected Resource Metadata document so it can
 * discover the authorization server and begin the OAuth 2.1 flow.
 */
export function buildWwwAuthenticateChallenge(resourceMetadataUrl: string): string {
  return `Bearer resource_metadata="${resourceMetadataUrl}"`
}

export function serializeSseEvent(payload: unknown, eventId?: string, retryMs?: number): string {
  const lines: string[] = []
  if (eventId) {
    lines.push(`id: ${eventId}`)
  }
  if (retryMs && retryMs > 0) {
    lines.push(`retry: ${retryMs}`)
  }
  lines.push(`event: message`)
  lines.push(`data: ${JSON.stringify(payload)}`)
  lines.push('')
  return lines.join('\n')
}

export function buildJsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message, ...(data !== undefined ? { data } : {}) }
  }
}

export function buildJsonRpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result
  }
}

export function parseJsonRpc(body: unknown): JsonRpcRequest | null {
  if (!body || typeof body !== 'object') return null
  const candidate = body as Record<string, unknown>
  if (candidate.jsonrpc !== '2.0' || typeof candidate.method !== 'string') return null
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: candidate.method,
    id: candidate.id as JsonRpcId,
    params: candidate.params
  }
  return request
}

export async function dispatchMcpMethod(
  method: string,
  params: unknown,
  ctx: McpDispatchContext
): Promise<unknown> {
  const { semanticLayer, extractSecurityContext, rawRequest, rawResponse, appEnabled, appConfig } = ctx
  const serverName = ctx.serverName ?? 'drizzle-cube'
  const prompts = ctx.prompts ?? PROMPTS
  const baseResources = ctx.resources ?? RESOURCES
  const instructions = ctx.instructions ?? getDefaultMcpInstructions()

  // Add MCP App visualization resource when app mode is enabled
  const resources = appEnabled ? [
    ...baseResources,
    ...getMcpAppResource(appConfig)
  ] : baseResources

  switch (method) {
    case 'initialize': {
      // MCP 2025-11-25: Client sends protocolVersion in params
      // If we support it, respond with same version; otherwise respond with our latest supported
      const clientRequestedVersion = (params as any)?.protocolVersion as string | undefined
      let responseVersion: string

      if (clientRequestedVersion && SUPPORTED_MCP_PROTOCOLS.includes(clientRequestedVersion)) {
        // We support the client's requested version
        responseVersion = clientRequestedVersion
      } else {
        // Fall back to our latest supported version (client will disconnect if unsupported)
        responseVersion = DEFAULT_MCP_PROTOCOL
      }

      return {
        protocolVersion: responseVersion,
        capabilities: {
          tools: {
            listChanged: false
          },
          resources: {
            listChanged: false
          },
          prompts: {
            listChanged: false
          },
          sampling: {}
        },
        sessionId: primeEventId(),
        serverInfo: {
          name: serverName,
          // Use safe check for process.env to support edge runtimes (Cloudflare Workers, etc.)
          version: typeof process !== 'undefined' ? process.env?.npm_package_version || 'dev' : 'worker'
        },
        // MCP spec: InitializeResult.instructions — the only server-authored
        // string clients are expected to surface to the model. Tells the LLM
        // it MUST call discover first and read the queryLanguageReference
        // returned in that response before constructing any query.
        instructions
      }
    }

    case 'list_tools':
    case 'tools/list':
      return { tools: buildToolList({ appEnabled }), nextCursor: '' }

    case 'call_tool':
    case 'tools/call':
      return executeToolCall(params, ctx)

    case 'resources/list':
      return {
        resources: resources.map(({ uri, name, description, mimeType }) => ({
          uri,
          name,
          description,
          mimeType
        })),
        nextCursor: ''
      }

    case 'resources/templates/list':
      return { resourceTemplates: [], nextCursor: '' }

    case 'resources/read': {
      const uri = (params as any)?.uri as string | undefined
      const resource = resources.find(r => r.uri === uri) || resources[0]
      if (!resource) throw jsonRpcError(-32602, 'resource not found')
      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: resource.text
          }
        ]
      }
    }

    case 'prompts/list':
      return {
        prompts: prompts.map(({ name, description }) => ({ name, description })),
        nextCursor: ''
      }

    case 'ping':
      return { }

    // Handle the initialized notification (sent by client after receiving InitializeResult)
    case 'notifications/initialized':
      // Client is indicating it's ready for normal operations
      // No response needed (this is a notification)
      return {}

    case 'prompts/get': {
      const name = (params as any)?.name as string | undefined
      const prompt = prompts.find(p => p.name === name) || prompts[0]
      if (!prompt) throw jsonRpcError(-32602, 'prompt not found')
      return {
        name: prompt.name,
        description: prompt.description,
        messages: prompt.messages
      }
    }

    case 'discover':
      return handleDiscover(semanticLayer, (params || {}) as DiscoverRequest)
    case 'validate': {
      const p = (params || {}) as ValidateRequest
      if (!p.query) {
        throw jsonRpcError(-32602, 'query is required')
      }
      return handleValidate(semanticLayer, p)
    }
    case 'load': {
      const p = (params || {}) as LoadRequest
      if (!p.query) {
        throw jsonRpcError(-32602, 'query is required')
      }
      const securityContext = await extractSecurityContext(rawRequest, rawResponse)
      return handleLoad(semanticLayer, securityContext, p)
    }
    default:
      throw jsonRpcError(-32601, `Unknown MCP method: ${method}`)
  }
}

export function jsonRpcError(code: number, message: string, data?: unknown): Error & { code: number; data?: unknown } {
  const err = new Error(message) as Error & { code: number; data?: unknown }
  err.code = code
  if (data !== undefined) {
    err.data = data
  }
  return err
}

export function normalizeHeader(value: string | string[] | undefined): string | null {
  if (!value) return null
  if (Array.isArray(value)) {
    return value[0] || null
  }
  return value
}

export function isNotification(request: JsonRpcRequest): boolean {
  return request.id === undefined || request.id === null
}

export function primeEventId(): string {
  return `evt-${generateRequestId()}`
}

export function buildToolList(options?: { appEnabled?: boolean }) {
  const tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown>; _meta?: unknown }> = [
    {
      name: 'discover',
      description: `MANDATORY FIRST CALL. You MUST call this before constructing any query — even if you think you know the schema.

Returns:
- 'cubes': matched cubes with measures, dimensions, joins, and metadata hints (eventStream for funnels, etc.)
- 'queryLanguageReference': the COMPLETE TypeScript DSL for query construction. This is the source of truth for field naming, filter operators, time dimensions, and analysis modes (funnel/flow/retention). READ IT before building queries — do not guess syntax.
- 'dateFilteringGuide': decision tree for date filtering vs time grouping. READ IT whenever the user mentions a time period — this is the #1 source of incorrect queries.

The 'joins' property on each cube shows relationships. You can include dimensions from ANY related cube in your query — the system auto-joins them.

Example: If Productivity has a join to Employees, you can query:
{ "measures": ["Productivity.totalPullRequests"], "dimensions": ["Employees.name"] }`,
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Keyword to search (e.g., "sales", "employees")' },
          intent: { type: 'string', description: 'Natural language goal (e.g., "analyze productivity trends")' },
          limit: { type: 'number', description: 'Max results (default: 10)' },
          minScore: { type: 'number', description: 'Min relevance 0-1 (default: 0.1)' }
        }
      }
    },
    {
      name: 'validate',
      description: `Validate a query and get auto-corrections for issues.

Checks:
- Field existence (measures, dimensions exist in schema)
- Filter syntax and operators
- Cross-cube join validity

Returns corrected query if issues found.`,
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'object',
            description: 'CubeQuery to validate'
          }
        }
      }
    },
    {
      name: 'load',
      description: `Execute a semantic query and return aggregated results.

PREREQUISITE: You MUST have called 'discover' first in this session. The discover response contains the 'queryLanguageReference' (full DSL) and 'dateFilteringGuide' you need to construct a correct query. If you have not yet called discover, call it NOW before calling load.

Supports regular queries (measures/dimensions), funnel, flow, and retention analysis modes — see the queryLanguageReference returned by discover for the full DSL.

Key rules (the queryLanguageReference is authoritative — these are reminders, not the full spec):
- Fields are EXACTLY "CubeName.fieldName" (two parts, one dot). Copy verbatim from discover.
- Cross-cube joins: include dimensions from related cubes (system auto-joins).
- Aggregated totals over a period: use filters with inDateRange — NOT timeDimensions.
- Time series ("by month", "daily trend"): use timeDimensions WITH granularity.
- Top N: filters + order + limit.

Use "load" for data retrieval. Use "chart" to visualise results with an interactive chart.`,
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'object',
            description: 'Semantic query object. Regular: { measures, dimensions, filters, timeDimensions, order, limit }. Funnel: { funnel: {...} }. Flow: { flow: {...} }. Retention: { retention: {...} }.',
            properties: QUERY_PARAMS_SCHEMA
          }
        }
      }
    }
  ]

  // When MCP App is enabled, add the "chart" tool with UI visualization
  if (options?.appEnabled) {
    tools.push({
      name: 'chart',
      description: `Execute a semantic query and render an interactive chart visualization.

Same query format as "load", but renders results in the MCP App chart UI.
Include a "chart" object to control the visualization.

Chart types: bar, line, area, pie, scatter, bubble, radar, treemap, kpiNumber, kpiDelta, table, heatmap, funnel, sankey, sunburst, waterfall, activityGrid, boxPlot
Guidelines: single number -> kpiNumber, trend -> line/area, categories -> bar, part-of-whole -> pie, correlation -> scatter/bubble, distribution -> boxPlot`,
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'object',
            description: 'Semantic query object. Same format as the load tool.',
            properties: QUERY_PARAMS_SCHEMA
          },
          chart: {
            type: 'object',
            description: 'Chart configuration for the visualization. If omitted, chart type is auto-detected from query shape.',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'bar', 'line', 'area', 'pie', 'scatter', 'bubble', 'radar', 'radialBar',
                  'treemap', 'table', 'kpiNumber', 'kpiDelta', 'heatmap', 'boxPlot',
                  'funnel', 'sankey', 'sunburst', 'retentionHeatmap', 'retentionCombined',
                  'waterfall', 'activityGrid'
                ],
                description: 'Chart type to render'
              },
              title: {
                type: 'string',
                description: 'Chart title'
              },
              chartConfig: {
                type: 'object',
                description: 'Axis configuration — same schema as agent add_portlet chartConfig.',
                properties: {
                  xAxis: { type: 'array', items: { type: 'string' }, description: 'Dimension fields for X axis' },
                  yAxis: { type: 'array', items: { type: 'string' }, description: 'Measure fields for Y axis' },
                  series: { type: 'array', items: { type: 'string' }, description: 'Dimension for series splitting (grouped/stacked)' },
                  yAxisAssignment: {
                    type: 'object',
                    description: 'Dual Y-axis: map measure fields to "left" or "right". Only bar/line/area with 2+ measures of different scales.'
                  },
                  sizeField: { type: 'string', description: 'Bubble chart size field' },
                  colorField: { type: 'string', description: 'Bubble chart color field' }
                }
              },
              displayConfig: {
                type: 'object',
                description: 'Display options.',
                properties: {
                  showLegend: { type: 'boolean' },
                  showGrid: { type: 'boolean' },
                  showTooltip: { type: 'boolean' },
                  stacked: { type: 'boolean' },
                  stackType: { type: 'string', enum: ['none', 'normal', 'percent'] },
                  orientation: { type: 'string', enum: ['horizontal', 'vertical'] }
                }
              },
              // Backward-compatible flat aliases (deprecated — use chartConfig instead)
              xAxis: { type: 'string', description: 'Deprecated: use chartConfig.xAxis' },
              yAxis: { type: 'array', items: { type: 'string' }, description: 'Deprecated: use chartConfig.yAxis' }
            }
          }
        }
      }
    })

    // Attach MCP App UI to the chart tool only
    const chartTool = tools.find(t => t.name === 'chart')
    if (chartTool) {
      ;(chartTool as any)._meta = {
        ui: { resourceUri: MCP_APP_RESOURCE_URI }
      }
    }
  }

  return tools
}

async function executeToolCall(params: unknown, ctx: McpDispatchContext) {
  const { semanticLayer, extractSecurityContext, rawRequest, rawResponse } = ctx
  const p = (params || {}) as { name?: string; arguments?: unknown }
  if (!p.name) {
    throw jsonRpcError(-32602, 'name is required for tools/call')
  }
  const args = p.arguments
  try {
    switch (p.name) {
      case 'discover':
        return wrapContent(await handleDiscover(semanticLayer, (args || {}) as DiscoverRequest))
      case 'validate': {
        const body = (args || {}) as ValidateRequest
        if (!body.query) throw jsonRpcError(-32602, 'query is required')
        return wrapContent(await handleValidate(semanticLayer, body))
      }
      case 'load': {
        const body = (args || {}) as LoadRequest
        if (!body.query) throw jsonRpcError(-32602, 'query is required')
        const securityContext = await extractSecurityContext(rawRequest, rawResponse)
        return wrapContent(await handleLoad(semanticLayer, securityContext, body))
      }
      case 'chart': {
        // Same as load but rendered in the MCP App UI (has _meta.ui attached)
        const body = (args || {}) as LoadRequest
        if (!body.query) throw jsonRpcError(-32602, 'query is required')
        const securityContext = await extractSecurityContext(rawRequest, rawResponse)
        return wrapContent(await handleLoad(semanticLayer, securityContext, body))
      }
      default:
        throw jsonRpcError(-32601, `Unknown tool: ${p.name}`)
    }
  } catch (err) {
    // Per MCP spec, tool execution errors should be returned as successful
    // JSON-RPC results with isError: true — not as JSON-RPC protocol errors.
    // This lets the AI model see and react to the error message.
    const isProtocolError = (err as any)?.code === -32602 || (err as any)?.code === -32601
    if (isProtocolError) throw err // Re-throw actual protocol errors (missing params, unknown tool)

    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
      isError: true
    }
  }
}

function wrapContent(result: unknown) {
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

// ---------------------------------------------
// MCP App visualization resource
// ---------------------------------------------

function getMcpAppResource(config?: McpAppConfig): MCPResource[] {
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

// ---------------------------------------------
// Static prompts and resources for MCP clients
// Prompts are defined in src/server/ai/mcp-prompts.ts
// ---------------------------------------------

// Use prompts from AI module
const PROMPTS = getDefaultMCPPrompts()

const RESOURCES = [
  {
    uri: 'drizzle-cube://quickstart',
    name: 'Drizzle Cube MCP Quickstart',
    description: 'Minimal guide for using discover/validate/load',
    mimeType: 'text/markdown',
    text: [
      '# Drizzle Cube MCP Quickstart',
      '',
      'Tools:',
      '- discover: { topic?, intent?, limit?, minScore? } -> cubes list',
      '- validate: { query } -> corrected query + issues',
      '- load: { query } -> data + annotation (text only)',
      '- chart: { query, chart? } -> data + interactive chart visualization',
      '',
      'Recommended flow:',
      '1) tools/call name=discover intent="<goal>"',
      '2) tools/call name=validate query=<draft> (optional)',
      '3) tools/call name=load query=<validated> (data only) OR name=chart query=<validated> chart={type, ...} (with visualization)',
      '',
      'Query shapes supported:',
      '- regular: { measures, dimensions, filters, timeDimensions, order, limit, offset, ungrouped }',
      '- funnel: { funnel: { bindingKey, timeDimension, steps[], includeTimeMetrics?, globalTimeWindow? } }',
      '- flow: { flow: { bindingKey, timeDimension, eventDimension, startingStep: { name, filter }, stepsBefore, stepsAfter } }',
      '- retention: { retention: { timeDimension, bindingKey, dateRange: { start, end }, granularity, periods, retentionType } }',
      '',
      'Filter rules: flat arrays of { member, operator, values }. Use { and: [...] } or { or: [...] } for logical grouping.'
    ].join('\n')
  },
  {
    uri: 'drizzle-cube://query-shapes',
    name: 'Query Shapes Reference',
    description: 'Detailed schema examples for regular, funnel, flow, and retention queries',
    mimeType: 'text/markdown',
    text: [
      '# Query Shapes',
      '',
      '## Regular query',
      '```json',
      '{',
      '  "measures": ["Sales.count"],',
      '  "dimensions": ["Sales.channel"],',
      '  "filters": [',
      '    { "member": "Sales.status", "operator": "equals", "values": ["paid"] },',
      '    { "or": [',
      '      { "member": "Sales.region", "operator": "equals", "values": ["US"] },',
      '      { "member": "Sales.region", "operator": "equals", "values": ["EU"] }',
      '    ]}',
      '  ],',
      '  "timeDimensions": [{ "dimension": "Sales.createdAt", "dateRange": "last 30 days", "granularity": "day" }],',
      '  "order": { "Sales.createdAt": "asc" },',
      '  "limit": 500',
      '}',
      '```',
      '',
      '## Funnel',
      '```json',
      '{',
      '  "funnel": {',
      '    "bindingKey": "Events.userId",',
      '    "timeDimension": "Events.timestamp",',
      '    "steps": [',
      '      {',
      '        "name": "Signup",',
      '        "filter": [',
      '          { "member": "Events.eventType", "operator": "equals", "values": ["signup"] },',
      '          { "member": "Events.timestamp", "operator": "inDateRange", "values": ["last 6 months"] }',
      '        ]',
      '      },',
      '      {',
      '        "name": "Purchase",',
      '        "filter": [{ "member": "Events.eventType", "operator": "equals", "values": ["purchase"] }],',
      '        "timeToConvert": "P7D"',
      '      }',
      '    ],',
      '    "includeTimeMetrics": true',
      '  }',
      '}',
      '```',
      '',
      '## Flow',
      '```json',
      '{',
      '  "flow": {',
      '    "bindingKey": "Events.userId",',
      '    "timeDimension": "Events.timestamp",',
      '    "eventDimension": "Events.eventType",',
      '    "startingStep": {',
      '      "name": "Checkout",',
      '      "filter": { "member": "Events.eventType", "operator": "equals", "values": ["checkout"] }',
      '    },',
      '    "stepsBefore": 2,',
      '    "stepsAfter": 3',
      '  }',
      '}',
      '```',
      '',
      '## Retention',
      '```json',
      '{',
      '  "retention": {',
      '    "timeDimension": "Events.timestamp",',
      '    "bindingKey": "Events.userId",',
      '    "dateRange": { "start": "2024-01-01", "end": "2024-03-31" },',
      '    "granularity": "week",',
      '    "periods": 8,',
      '    "retentionType": "classic",',
      '    "breakdownDimensions": ["Events.country"]',
      '  }',
      '}',
      '```',
      '',
      '### Filter operators',
      'String: equals, notEquals, contains, notContains, startsWith, endsWith, like, ilike, regex',
      'Numeric: gt, gte, lt, lte, between, notBetween',
      'Set: in, notIn, set, notSet, isEmpty, isNotEmpty',
      'Date: inDateRange, beforeDate, afterDate',
      '',
      '### Time handling',
      '- Aggregated totals: use filters with inDateRange (NOT timeDimensions)',
      '- Time series grouping: use timeDimensions with granularity',
      '- Both can be combined: inDateRange filter + timeDimensions with granularity',
      '- Period comparison: use compareDateRange in timeDimensions'
    ].join('\n')
  }
]

export function getDefaultResources(): MCPResource[] {
  return RESOURCES
}

export function getDefaultPrompts(): MCPPrompt[] {
  return PROMPTS
}

/**
 * Default instructions string returned in `InitializeResult.instructions`.
 * Re-exported here so adapter consumers don't need to reach into `server/ai`.
 */
export function getDefaultInstructions(): string {
  return getDefaultMcpInstructions()
}

export function resolveMcpPrompts(prompts?: MCPPromptResolver): MCPPrompt[] {
  const defaults = getDefaultPrompts()
  if (typeof prompts === 'function') {
    return prompts(defaults)
  }
  return prompts ?? defaults
}

export function resolveMcpResources(resources?: MCPResourceResolver): MCPResource[] {
  const defaults = getDefaultResources()
  if (typeof resources === 'function') {
    return resources(defaults)
  }
  return resources ?? defaults
}

/**
 * Resolve the MCP instructions string for the `initialize` response.
 *
 * - `undefined` → returns the built-in defaults.
 * - `string`    → replaces the defaults entirely.
 * - `(defaults) => string` → derive from / extend the defaults (e.g. append
 *   project-specific guidance like custom cube semantics).
 */
export function resolveMcpInstructions(instructions?: MCPInstructionsResolver): string {
  const defaults = getDefaultInstructions()
  if (typeof instructions === 'function') {
    return instructions(defaults)
  }
  return instructions ?? defaults
}

export function buildMcpSchemaResource(semanticLayer: SemanticLayerCompiler): MCPResource {
  return {
    uri: 'drizzle-cube://schema',
    name: 'Cube Schema',
    description: 'Current cube metadata as JSON',
    mimeType: 'application/json',
    text: JSON.stringify(semanticLayer.getMetadata(), null, 2)
  }
}

export function buildMcpResources(
  semanticLayer: SemanticLayerCompiler,
  resources?: MCPResourceResolver
): MCPResource[] {
  const schemaResource = buildMcpSchemaResource(semanticLayer)
  const baseResources = resolveMcpResources(resources)
    .filter(resource => resource.uri !== schemaResource.uri)

  return [...baseResources, schemaResource]
}


