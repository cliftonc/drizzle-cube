import type { SemanticLayerCompiler, SecurityContext } from '../server'
import { getDefaultMCPPrompts, type MCPPrompt } from '../server/ai/mcp-prompts'
import {
  handleDiscover,
  handleSuggest,
  handleValidate,
  handleLoad,
  generateRequestId,
  type DiscoverRequest,
  type SuggestRequest,
  type ValidateRequest,
  type LoadRequest
} from './utils'

// Re-export MCPPrompt for external consumers
export { type MCPPrompt }

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
}

export interface MCPResource {
  uri: string
  name: string
  description: string
  mimeType: string
  text: string
}

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
  return hasJson && hasSse
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
  const { semanticLayer, extractSecurityContext, rawRequest, rawResponse } = ctx
  const prompts = ctx.prompts ?? PROMPTS
  const resources = ctx.resources ?? RESOURCES

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
          name: 'drizzle-cube',
          // Use safe check for process.env to support edge runtimes (Cloudflare Workers, etc.)
          version: typeof process !== 'undefined' ? process.env?.npm_package_version || 'dev' : 'worker'
        }
      }
    }

    case 'list_tools':
    case 'tools/list':
      return { tools: buildToolList(), nextCursor: '' }

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
    case 'suggest': {
      const p = (params || {}) as SuggestRequest
      if (!p.naturalLanguage) {
        throw jsonRpcError(-32602, 'naturalLanguage is required')
      }
      return handleSuggest(semanticLayer, p)
    }
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

function buildToolList() {
  return [
    {
      name: 'discover',
      description: `Find relevant cubes based on topic or intent. Call this FIRST to understand available data.

Returns cubes with:
- Relevance scores and suggested measures/dimensions
- Relationship information (joins) for cross-cube queries
- Metadata hints (eventStream for funnels, etc.)

Use the 'joins' in results to understand how cubes relate for cross-cube queries.`,
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
      name: 'suggest',
      description: `Generate a semantic query from natural language description.

Returns a draft CubeQuery object. Always validate the result before executing.`,
      inputSchema: {
        type: 'object',
        required: ['naturalLanguage'],
        properties: {
          naturalLanguage: { type: 'string', description: 'Plain English query (e.g., "top 5 employees by pull requests last 3 months")' },
          cube: { type: 'string', description: 'Optional: constrain to specific cube' }
        }
      }
    },
    {
      name: 'validate',
      description: `Validate a query and get auto-corrections for issues.

Checks:
- Field existence (measures, dimensions exist in schema)
- Filter syntax and operators
- Time dimension configuration

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

CRITICAL QUERY CONSTRUCTION RULES:

1. DATE FILTERING vs TIME GROUPING (most common mistake!)

   For AGGREGATED TOTALS over a date range, use 'filters' with 'inDateRange':
   {
     "measures": ["Productivity.totalPullRequests"],
     "dimensions": ["Employees.name"],
     "filters": [{ "member": "Productivity.date", "operator": "inDateRange", "values": ["last 3 months"] }],
     "order": { "Productivity.totalPullRequests": "desc" },
     "limit": 5
   }

   For TIME SERIES grouped by period, use 'timeDimensions' WITH granularity:
   {
     "measures": ["Productivity.totalPullRequests"],
     "timeDimensions": [{ "dimension": "Productivity.date", "dateRange": "last 3 months", "granularity": "month" }]
   }

   WARNING: Using timeDimensions WITHOUT granularity still groups by day, returning many rows instead of aggregates!

2. CROSS-CUBE JOINS
   Include dimensions from RELATED cubes (check 'joins' in discover results).
   Example: measures from Productivity + dimensions from Employees:
   { "measures": ["Productivity.totalPullRequests"], "dimensions": ["Employees.name"] }

3. TOP N PATTERN
   Use filters (not timeDimensions) + order + limit:
   { "filters": [{ "member": "X.date", "operator": "inDateRange", "values": ["last 3 months"] }], "order": { "X.total": "desc" }, "limit": 5 }`,
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'object',
            description: `CubeQuery object with:
- measures: string[] - Aggregations to calculate
- dimensions: string[] - Grouping fields (can include related cubes)
- filters: [{ member, operator, values }] - Use 'inDateRange' for date filtering
- timeDimensions: [{ dimension, granularity, dateRange }] - ONLY for time series with grouping
- order: { "Cube.field": "asc"|"desc" }
- limit: number`
          }
        }
      }
    }
  ]
}

async function executeToolCall(params: unknown, ctx: McpDispatchContext) {
  const { semanticLayer, extractSecurityContext, rawRequest, rawResponse } = ctx
  const p = (params || {}) as { name?: string; arguments?: unknown }
  if (!p.name) {
    throw jsonRpcError(-32602, 'name is required for tools/call')
  }
  const args = p.arguments
  switch (p.name) {
    case 'discover':
      return wrapContent(await handleDiscover(semanticLayer, (args || {}) as DiscoverRequest))
    case 'suggest': {
      const body = (args || {}) as SuggestRequest
      if (!body.naturalLanguage) throw jsonRpcError(-32602, 'naturalLanguage is required')
      return wrapContent(await handleSuggest(semanticLayer, body))
    }
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
    default:
      throw jsonRpcError(-32601, `Unknown tool: ${p.name}`)
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
// Static prompts and resources for MCP clients
// Prompts are defined in src/server/ai/mcp-prompts.ts
// ---------------------------------------------

// Use prompts from AI module
const PROMPTS = getDefaultMCPPrompts()

const RESOURCES = [
  {
    uri: 'drizzle-cube://quickstart',
    name: 'Drizzle Cube MCP Quickstart',
    description: 'Minimal guide for using discover/suggest/validate/load',
    mimeType: 'text/markdown',
    text: [
      '# Drizzle Cube MCP Quickstart',
      '',
      'Tools:',
      '- discover: { topic?, intent?, limit?, minScore? } → cubes list',
      '- suggest: { naturalLanguage, cube? } → draft query',
      '- validate: { query } → corrected query + issues',
      '- load: { query } → data + annotation',
      '',
      'Recommended flow:',
      '1) tools/list',
      '2) tools/call name=discover intent="<goal>"',
      '3) tools/call name=suggest naturalLanguage="<goal>"',
      '4) tools/call name=validate query=<from suggest>',
      '5) tools/call name=load query=<validated>',
      '',
      'Query shapes supported:',
      '- regular Cube.js-style query { measures, dimensions, filters, timeDimensions, order, limit, offset }',
      '- funnel { bindingKey, timeDimension, steps[], includeTimeMetrics? }',
      '- flow { bindingKey, eventDimension, steps?, window? }',
      '- retention { bindingKey, timeDimension, periods, granularity, retentionType, breakdownDimensions }',
      '',
      'Filter rules: flat arrays of { member, operator, values }; do not nest arrays.'
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
      '  "filters": [ { "member": "Sales.status", "operator": "equals", "values": ["paid"] } ],',
      '  "timeDimensions": [ { "dimension": "Sales.createdAt", "dateRange": "last 30 days", "granularity": "day" } ],',
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
      '      { "name": "Signup", "filter": [{ "member": "Events.eventType", "operator": "equals", "values": ["signup"] }] },',
      '      { "name": "Purchase", "filter": [{ "member": "Events.eventType", "operator": "equals", "values": ["purchase"] }] }',
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
      '    "bindingKey": "Events.sessionId",',
      '    "eventDimension": "Events.eventType",',
      '    "steps": ["view", "add_to_cart", "checkout"],',
      '    "window": { "unit": "minute", "value": 30 }',
      '  }',
      '}',
      '```',
      '',
      '## Retention',
      '```json',
      '{',
      '  "retention": {',
      '    "bindingKey": "Users.id",',
      '    "timeDimension": "Events.timestamp",',
      '    "periods": 8,',
      '    "granularity": "week",',
      '    "retentionType": "rolling",',
      '    "breakdownDimensions": ["Events.country"]',
      '  }',
      '}',
      '```',
      '',
      '### Filter rules',
      '- Always a flat array of filter objects: [{ member, operator, values }]',
      '- For funnels, put time filter (inDateRange) only on step 0',
      '- Operators: equals, notEquals, inDateRange, gt, gte, lt, lte, contains, notContains, set, notSet',
      '',
      '### Time handling',
      '- Relative ranges ("last 3 months") -> add ONLY an inDateRange filter on the time dimension (do NOT add timeDimensions unless grouping is requested).',
      '- Grouping ("by month/week/day") -> add timeDimensions entry with granularity.',
      '- Both can be combined: inDateRange filter + timeDimensions granularity.'
    ].join('\n')
  }
]

export function getDefaultResources(): MCPResource[] {
  return RESOURCES
}

export function getDefaultPrompts(): MCPPrompt[] {
  return PROMPTS
}
