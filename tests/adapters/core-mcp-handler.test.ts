import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCubeHttpHandler } from '../../src/adapters/core'
import type { McpHttpPort } from '../../src/adapters/core'

/**
 * Unit tests for the framework-agnostic MCP POST core. No server, no DB — a stub
 * semanticLayer (with just `getMetadata`, enough for the `discover` tool) and a
 * fake McpHttpPort exercise the full dispatch flow.
 */

/** Minimal cube metadata so `discover` can score/return a cube. */
function createStubSemanticLayer(overrides: Record<string, any> = {}) {
  return {
    getEngineType: () => 'postgres',
    getMetadata: () => [
      {
        name: 'Employees',
        title: 'Employees',
        description: 'Employee records',
        measures: [{ name: 'Employees.count', type: 'number', title: 'Count' }],
        dimensions: [{ name: 'Employees.name', type: 'string', title: 'Name' }]
      }
    ],
    ...overrides
  } as any
}

interface SentJson { kind: 'json'; status: number; body: unknown }
interface SentSse { kind: 'sse'; status: number; body: string }
interface SentEmpty { kind: 'empty'; status: number }
type Sent = SentJson | SentSse | SentEmpty

/** Records send/sendSse/sendEmpty/setHeader calls for assertions. */
function createFakeMcpPort(opts: {
  headers?: Record<string, string>
  body?: unknown
} = {}): McpHttpPort<Sent> & { sent: Sent[]; headers: Record<string, string> } {
  const sent: Sent[] = []
  const headers: Record<string, string> = {}
  return {
    sent,
    headers,
    getHeader: (name: string) => opts.headers?.[name.toLowerCase()],
    getBody: async () => opts.body,
    getQueryParam: () => undefined,
    setHeader: (name: string, value: string) => { headers[name.toLowerCase()] = value },
    send: (status: number, body: unknown) => {
      const result: Sent = { kind: 'json', status, body }
      sent.push(result)
      return result
    },
    sendSse: (status: number, body: string) => {
      const result: Sent = { kind: 'sse', status, body }
      sent.push(result)
      return result
    },
    sendEmpty: (status: number) => {
      const result: Sent = { kind: 'empty', status }
      sent.push(result)
      return result
    }
  }
}

/** Accept header that satisfies the MCP 2025-11-25 requirement (JSON + SSE). */
const ACCEPT_BOTH = 'application/json, text/event-stream'

function jsonRpc(method: string, params?: unknown, id: unknown = 1) {
  return { jsonrpc: '2.0', method, params, id }
}

describe('createCubeHttpHandler — MCP POST core', () => {
  const getBaseSC = async () => ({ organisationId: 'org1' })
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('round-trips a `discover` tool call: returns the DSL reference in a JSON-RPC result', async () => {
    const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: vi.fn() })
    const port = createFakeMcpPort({
      headers: { accept: ACCEPT_BOTH },
      body: jsonRpc('tools/call', { name: 'discover', arguments: {} })
    })

    await handler.handleMcpPost(port, getBaseSC)

    expect(port.sent).toHaveLength(1)
    const out = port.sent[0] as SentJson
    expect(out.kind).toBe('json')
    expect(out.status).toBe(200)
    const body = out.body as any
    expect(body.jsonrpc).toBe('2.0')
    expect(body.id).toBe(1)
    expect(body.result.isError).toBe(false)
    // The discover tool always returns the query language reference + cubes.
    const payload = JSON.parse(body.result.content[0].text)
    expect(payload.queryLanguageReference).toBeTruthy()
    expect(payload.dateFilteringGuide).toBeTruthy()
    expect(payload.cubes[0].cube).toBe('Employees')
  })

  it('returns an `initialize` result and sets the MCP-Session-Id header when present', async () => {
    const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: vi.fn() })
    const port = createFakeMcpPort({
      headers: { accept: ACCEPT_BOTH },
      body: jsonRpc('initialize', { protocolVersion: '2025-11-25' })
    })

    await handler.handleMcpPost(port, getBaseSC)

    const out = port.sent[0] as SentJson
    expect(out.status).toBe(200)
    expect((out.body as any).result.protocolVersion).toBe('2025-11-25')
  })

  it('error path: an Accept header missing JSON/SSE returns a 400 JSON-RPC error', async () => {
    const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: vi.fn() })
    const port = createFakeMcpPort({
      headers: { accept: 'text/plain' },
      body: jsonRpc('tools/call', { name: 'discover', arguments: {} })
    })

    await handler.handleMcpPost(port, getBaseSC)

    const out = port.sent[0] as SentJson
    expect(out.kind).toBe('json')
    expect(out.status).toBe(400)
    expect((out.body as any).error.message).toContain('Accept header')
  })

  it('error path: an invalid JSON-RPC body returns a 400', async () => {
    const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: vi.fn() })
    const port = createFakeMcpPort({
      headers: { accept: ACCEPT_BOTH },
      body: { not: 'json-rpc' }
    })

    await handler.handleMcpPost(port, getBaseSC)

    const out = port.sent[0] as SentJson
    expect(out.status).toBe(400)
    expect((out.body as any).error.message).toContain('Invalid JSON-RPC')
  })

  it('rejects a disallowed Origin with a 403', async () => {
    const handler = createCubeHttpHandler({
      semanticLayer: createStubSemanticLayer(),
      onError: vi.fn(),
      mcp: { allowedOrigins: ['https://allowed.example'] }
    })
    const port = createFakeMcpPort({
      headers: { accept: ACCEPT_BOTH, origin: 'https://evil.example' },
      body: jsonRpc('initialize', {})
    })

    await handler.handleMcpPost(port, getBaseSC)

    expect((port.sent[0] as SentJson).status).toBe(403)
  })

  it('requires a Bearer token (401 + WWW-Authenticate) when resourceMetadataUrl is set', async () => {
    const handler = createCubeHttpHandler({
      semanticLayer: createStubSemanticLayer(),
      onError: vi.fn(),
      mcp: { resourceMetadataUrl: 'https://auth.example/.well-known/oauth-protected-resource' }
    })
    const port = createFakeMcpPort({
      headers: { accept: ACCEPT_BOTH },
      body: jsonRpc('initialize', {})
    })

    await handler.handleMcpPost(port, getBaseSC)

    expect((port.sent[0] as SentJson).status).toBe(401)
    expect(port.headers['www-authenticate']).toContain('resource_metadata=')
  })

  it('acknowledges a notification (no id) with an empty 202', async () => {
    const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: vi.fn() })
    const port = createFakeMcpPort({
      headers: { accept: ACCEPT_BOTH },
      body: { jsonrpc: '2.0', method: 'notifications/initialized' } // no id => notification
    })

    await handler.handleMcpPost(port, getBaseSC)

    expect(port.sent[0]).toEqual({ kind: 'empty', status: 202 })
  })

  it('streams a single-event SSE response when the client only accepts text/event-stream', async () => {
    const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: vi.fn() })
    // Wildcard passes the Accept gate; SSE-without-JSON selects the stream path.
    const port = createFakeMcpPort({
      headers: { accept: 'text/event-stream, */*' },
      body: jsonRpc('ping', {})
    })

    await handler.handleMcpPost(port, getBaseSC)

    const out = port.sent[0] as SentSse
    expect(out.kind).toBe('sse')
    expect(out.status).toBe(200)
    expect(out.body).toContain('event: message')
    expect(out.body).toContain('"jsonrpc":"2.0"')
  })
})
