import { describe, it, expect, vi } from 'vitest'
import { createCubeHttpHandler } from '../../src/adapters/core'
import type { McpHttpPort } from '../../src/adapters/core'
import { MCP_APP_RESOURCE_URI } from '../../src/adapters/mcp-transport'
// Import every adapter entry so a static import of the MCP App HTML added to
// any of them (or anything they reach) trips the assertions below.
import '../../src/adapters/hono'
import '../../src/adapters/express'
import '../../src/adapters/fastify'
import '../../src/adapters/nextjs'

/**
 * Guards the bundle-size invariant: the ~2 MB MCP App HTML
 * (`src/adapters/mcp-app-html.ts` → `src/mcp-app/generated-html.ts`) must only
 * be loaded through the dynamic `import()` in `getMcpAppHtml`, on the first
 * request that actually needs it — never at adapter import time, and never when
 * `mcp.app` is off. A static import anywhere on the adapter graph would put the
 * blob in every consumer's server bundle even with `mcp.enabled: false`.
 *
 * The mock factory is invoked by vitest the first time the module is imported,
 * so counting its invocations observes exactly when the blob is loaded.
 */
const htmlModule = vi.hoisted(() => ({ loads: 0 }))
vi.mock('../../src/adapters/mcp-app-html', () => {
  htmlModule.loads++
  return {
    mcpAppHtml: '<!DOCTYPE html><html><head><title>stub</title></head><body>mcp-app-stub</body></html>'
  }
})

function createStubSemanticLayer() {
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
    ]
  } as any
}

interface Sent { status: number; body: unknown }

function createPort(body: unknown): McpHttpPort<Sent> {
  return {
    getHeader: (name: string) => (name.toLowerCase() === 'accept' ? 'application/json, text/event-stream' : undefined),
    getBody: async () => body,
    getQueryParam: () => undefined,
    setHeader: () => {},
    send: (status, body) => ({ status, body }),
    sendSse: (status, body) => ({ status, body }),
    sendEmpty: (status) => ({ status, body: undefined })
  }
}

const getBaseSC = async () => ({ organisationId: 'org1' })

async function callMcp<T>(mcp: Record<string, unknown>, method: string, params?: unknown): Promise<T> {
  const handler = createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: () => {}, mcp })
  const sent = await handler.handleMcpPost(
    createPort({ jsonrpc: '2.0', method, params, id: 1 }),
    getBaseSC
  )
  expect(sent.status).toBe(200)
  const { result, error } = sent.body as { result?: T; error?: unknown }
  expect(error).toBeUndefined()
  return result!
}

const listResources = (mcp: Record<string, unknown>) =>
  callMcp<{ resources: Array<{ uri: string }> }>(mcp, 'resources/list').then(r => r.resources)

const readResource = (mcp: Record<string, unknown>, uri: string) =>
  callMcp<{ contents: Array<{ uri: string; text?: string }> }>(mcp, 'resources/read', { uri }).then(r => r.contents[0])

describe('MCP App HTML is loaded lazily', () => {
  it('is not loaded by importing the adapters or building the handlers', () => {
    // All four adapter entries and the core are imported above; none may have
    // pulled the HTML module in statically.
    expect(htmlModule.loads).toBe(0)

    createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: () => {}, mcp: { enabled: false } })
    createCubeHttpHandler({ semanticLayer: createStubSemanticLayer(), onError: () => {}, mcp: { app: true } })
    expect(htmlModule.loads).toBe(0)
  })

  it('is not loaded by MCP requests while mcp.app is off', async () => {
    const resources = await listResources({})
    expect(resources.map(r => r.uri)).not.toContain(MCP_APP_RESOURCE_URI)
    expect(htmlModule.loads).toBe(0)
  })

  it('is loaded once, on the first request that needs the app resource', async () => {
    const resources = await listResources({ app: true })
    expect(resources.map(r => r.uri)).toContain(MCP_APP_RESOURCE_URI)
    expect(htmlModule.loads).toBe(1)

    // The module is cached by the runtime: no re-load on later requests, and
    // the served document is the loaded HTML with the locale config injected.
    const content = await readResource({ app: { defaultLocale: 'nl-NL' } }, MCP_APP_RESOURCE_URI)
    expect(content.uri).toBe(MCP_APP_RESOURCE_URI)
    expect(content.text).toContain('mcp-app-stub')
    expect(content.text).toContain('"defaultLocale":"nl-NL"')
    expect(htmlModule.loads).toBe(1)
  })
})
