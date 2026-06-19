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
} = {}): HttpPort<{ status: number; body: unknown }> & { sent: Array<{ status: number; body: unknown }> } {
  const sent: Array<{ status: number; body: unknown }> = []
  return {
    sent,
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
