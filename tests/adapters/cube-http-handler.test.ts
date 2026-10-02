import { describe, it, expect, vi } from 'vitest'
import { createCubeHttpHandler } from '../../src/adapters/core'
import type { HttpPort } from '../../src/adapters/core'

/**
 * Unit tests for the framework-agnostic REST /load core.
 * No server, no DB — a stub semanticLayer and a fake port exercise the flow.
 */

/** Minimal stub of the bits of SemanticLayerCompiler the load core touches. */
function createStubSemanticLayer(overrides: Record<string, any> = {}) {
  return {
    getEngineType: () => 'postgres',
    validateQuery: vi.fn(() => ({ isValid: true, errors: [] })),
    executeMultiCubeQuery: vi.fn(async () => ({ data: [{ 'Employees.count': 5 }], annotation: { measures: {} } })),
    ...overrides
  } as any
}

/** Records send() calls and exposes headers/body/query for the handler to read. */
function createFakePort(opts: {
  headers?: Record<string, string>
  body?: unknown
  queryParams?: Record<string, string>
} = {}): HttpPort<{ status: number; body: unknown }> & {
  sent: Array<{ status: number; body: unknown }>
  headersSet: Record<string, string>
} {
  const sent: Array<{ status: number; body: unknown }> = []
  const headersSet: Record<string, string> = {}
  return {
    sent,
    headersSet,
    setHeader: (name: string, value: string) => { headersSet[name] = value },
    getHeader: (name: string) => opts.headers?.[name.toLowerCase()],
    getBody: async () => opts.body,
    getQueryParam: (name: string) => opts.queryParams?.[name],
    send: (status: number, body: unknown) => {
      const result = { status, body }
      sent.push(result)
      return result
    }
  }
}

describe('createCubeHttpHandler — REST /load core', () => {
  const baseSecurityContext = { organisationId: 'org1' }
  const getBaseSC = async () => baseSecurityContext

  it('POST happy path returns a 200 Cube.js envelope', async () => {
    const semanticLayer = createStubSemanticLayer()
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort({ body: { measures: ['Employees.count'] } })

    await handler.handleLoadPost(port, getBaseSC)

    expect(port.sent).toHaveLength(1)
    expect(port.sent[0].status).toBe(200)
    const envelope = port.sent[0].body as any
    expect(envelope.queryType).toBe('regularQuery')
    expect(envelope.results[0].data).toEqual([{ 'Employees.count': 5 }])
  })

  it('POST validation failure returns a 400 without executing', async () => {
    const semanticLayer = createStubSemanticLayer({
      validateQuery: vi.fn(() => ({ isValid: false, errors: ['Unknown member Foo.bar'] }))
    })
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort({ body: { measures: ['Foo.bar'] } })

    await handler.handleLoadPost(port, getBaseSC)

    expect(port.sent).toHaveLength(1)
    expect(port.sent[0].status).toBe(400)
    expect((port.sent[0].body as any).error).toContain('Query validation failed')
    expect(semanticLayer.executeMultiCubeQuery).not.toHaveBeenCalled()
  })

  it('honors x-cache-control: no-cache by passing skipCache: true to the executor', async () => {
    const semanticLayer = createStubSemanticLayer()
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort({
      body: { measures: ['Employees.count'] },
      headers: { 'x-cache-control': 'no-cache' }
    })

    await handler.handleLoadPost(port, getBaseSC)

    expect(semanticLayer.executeMultiCubeQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { skipCache: true }
    )
  })

  it('GET happy path parses the query param and returns a 200 envelope', async () => {
    const semanticLayer = createStubSemanticLayer()
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort({
      queryParams: { query: JSON.stringify({ measures: ['Employees.count'] }) }
    })

    await handler.handleLoadGet(port, getBaseSC)

    expect(port.sent[0].status).toBe(200)
    expect(semanticLayer.executeMultiCubeQuery).toHaveBeenCalledWith(
      { measures: ['Employees.count'] },
      expect.anything(),
      expect.anything()
    )
  })

  it('GET with missing query param returns 400 "Query parameter is required"', async () => {
    const semanticLayer = createStubSemanticLayer()
    const onError = vi.fn()
    const handler = createCubeHttpHandler({ semanticLayer, onError })
    const port = createFakePort({ queryParams: {} })

    await handler.handleLoadGet(port, getBaseSC)

    expect(port.sent[0].status).toBe(400)
    expect((port.sent[0].body as any).error).toBe('Query parameter is required')
    expect(semanticLayer.executeMultiCubeQuery).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('GET with invalid JSON returns 400 "Invalid JSON in query parameter"', async () => {
    const semanticLayer = createStubSemanticLayer()
    const onError = vi.fn()
    const handler = createCubeHttpHandler({ semanticLayer, onError })
    const port = createFakePort({ queryParams: { query: '{not valid json' } })

    await handler.handleLoadGet(port, getBaseSC)

    expect(port.sent[0].status).toBe(400)
    expect((port.sent[0].body as any).error).toBe('Invalid JSON in query parameter')
    expect(semanticLayer.executeMultiCubeQuery).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('a thrown executor error returns 500 and calls onError exactly once', async () => {
    const boom = new Error('connection refused')
    const semanticLayer = createStubSemanticLayer({
      executeMultiCubeQuery: vi.fn(async () => { throw boom })
    })
    const onError = vi.fn()
    const handler = createCubeHttpHandler({ semanticLayer, onError })
    const port = createFakePort({ body: { measures: ['Employees.count'] } })

    await handler.handleLoadPost(port, getBaseSC)

    expect(port.sent[0].status).toBe(500)
    expect((port.sent[0].body as any).error).toBe('connection refused')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(boom)
  })

  it('merges the X-DC-Locale header into the security context the executor receives', async () => {
    const semanticLayer = createStubSemanticLayer()
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort({
      body: { measures: ['Employees.count'] },
      headers: { 'x-dc-locale': 'nl-NL' }
    })

    await handler.handleLoadPost(port, getBaseSC)

    const [, securityContext] = semanticLayer.executeMultiCubeQuery.mock.calls[0]
    expect(securityContext).toMatchObject({ organisationId: 'org1', locale: 'nl-NL' })
  })
})

describe('createCubeHttpHandler — tenant scoping and cache headers', () => {
  const securityContext = { organisationId: 'org1' }
  const getBaseSC = async () => securityContext

  it('resolves the security context for /meta and returns that tenant\'s cubes', async () => {
    const semanticLayer = createStubSemanticLayer({
      getMetadata: vi.fn(() => [{ name: 'Employees', measures: [], dimensions: [] }])
    })
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort()

    await handler.handleMetaGet(port, getBaseSC)

    // /meta never touched the extractor before this release.
    expect(semanticLayer.getMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ organisationId: 'org1' })
    )
    expect(port.sent[0].status).toBe(200)
    expect((port.sent[0].body as any).cubes).toHaveLength(1)
  })

  it('sets Cache-Control: private, no-store on every REST response', async () => {
    const semanticLayer = createStubSemanticLayer({
      getMetadata: vi.fn(() => []),
      generateMultiCubeSQL: vi.fn(async () => ({ sql: 'SELECT 1', params: [] })),
      dryRun: vi.fn(async () => ({ sql: 'SELECT 1', params: [] })),
      explainQuery: vi.fn(async () => ({ plan: [] }))
    })
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const body = { measures: ['Employees.count'] }

    const calls: Array<[string, () => Promise<unknown>]> = []
    const ports: Record<string, ReturnType<typeof createFakePort>> = {}
    for (const name of ['load', 'meta', 'sql', 'dryRun', 'batch', 'explain']) {
      ports[name] = createFakePort({ body: name === 'batch' ? { queries: [body] } : body })
    }
    calls.push(['load', () => handler.handleLoadPost(ports.load, getBaseSC)])
    calls.push(['meta', () => handler.handleMetaGet(ports.meta, getBaseSC)])
    calls.push(['sql', () => handler.handleSqlPost(ports.sql, getBaseSC)])
    calls.push(['dryRun', () => handler.handleDryRunPost(ports.dryRun, getBaseSC)])
    calls.push(['batch', () => handler.handleBatchPost(ports.batch, getBaseSC)])
    calls.push(['explain', () => handler.handleExplainPost(ports.explain, getBaseSC)])

    for (const [, invoke] of calls) await invoke()

    // Tenant-scoped data must never be heuristically cached by a shared cache.
    for (const [name] of calls) {
      expect(ports[name].headersSet['Cache-Control'], `${name} response`).toBe('private, no-store')
    }
  })

  it('sets the cache header on error responses too', async () => {
    const semanticLayer = createStubSemanticLayer({
      validateQuery: vi.fn(() => ({ isValid: false, errors: ['nope'] }))
    })
    const handler = createCubeHttpHandler({ semanticLayer, onError: vi.fn() })
    const port = createFakePort({ body: { measures: ['Foo.bar'] } })

    await handler.handleLoadPost(port, getBaseSC)

    expect(port.sent[0].status).toBe(400)
    expect(port.headersSet['Cache-Control']).toBe('private, no-store')
  })
})
