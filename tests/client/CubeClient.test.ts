import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { CubeClient } from '../../src/client/client/CubeClient'
import type { CubeQuery } from '../../src/client/types'
import { server } from '../client-setup/msw-server'

// This is a unit test file that mocks fetch directly
// We need to close MSW server to prevent it from intercepting requests
beforeAll(() => {
  server.close()
})

afterAll(() => {
  server.listen()
})

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CubeClient', () => {
  let client: CubeClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new CubeClient(undefined, {
      apiUrl: 'http://localhost:4000/cubejs-api/v1'
    })
  })

  describe('constructor', () => {
    it('should create client with API URL', () => {
      expect(client).toBeInstanceOf(CubeClient)
    })

    it('should create client with API URL and token', () => {
      const clientWithToken = new CubeClient('test-token', {
        apiUrl: 'http://localhost:4000/cubejs-api/v1'
      })
      expect(clientWithToken).toBeInstanceOf(CubeClient)
    })
  })

  describe('load method', () => {
    it('should make GET request to /load endpoint with query param', async () => {
      const mockResponse = {
        data: [{ 'Users.count': 5 }],
        query: { measures: ['Users.count'] }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const query: CubeQuery = {
        measures: ['Users.count']
      }

      const result = await client.load(query)

      const expectedUrl = 'http://localhost:4000/cubejs-api/v1/load?query=' + encodeURIComponent(JSON.stringify(query))
      
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      )

      expect(result.rawData()).toEqual(mockResponse.data)
    })

    it('should include authorization header when token is provided', async () => {
      const clientWithToken = new CubeClient('test-token', {
        apiUrl: 'http://localhost:4000/cubejs-api/v1'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], query: {} })
      })

      await clientWithToken.load({ measures: ['Users.count'] })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': 'test-token'
          }
        })
      )
    })

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(
        client.load({ measures: ['Users.count'] })
      ).rejects.toThrow('Cube query failed: 500')
    })
  })

  describe('sql method', () => {
    it('should make GET request to /sql endpoint with query param', async () => {
      const mockResponse = {
        sql: 'SELECT COUNT(*) as "Users.count" FROM users'
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const query: CubeQuery = {
        measures: ['Users.count']
      }

      const result = await client.sql(query)

      const expectedUrl = 'http://localhost:4000/cubejs-api/v1/sql?query=' + encodeURIComponent(JSON.stringify(query))

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('meta method', () => {
    it('should make GET request to /meta endpoint', async () => {
      const mockResponse = {
        cubes: [
          {
            name: 'Users',
            measures: [{ name: 'Users.count', type: 'count' }],
            dimensions: []
          }
        ]
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await client.meta()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/cubejs-api/v1/meta',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('max-age headers', () => {
    function okResponse(body: unknown) {
      return { ok: true, json: () => Promise.resolve(body) }
    }

    function headersOfCall(index = 0): Headers {
      const init: { headers: Record<string, string> } = mockFetch.mock.calls[index][1]
      return new Headers(init.headers)
    }

    const query: CubeQuery = { measures: ['Users.count'] }

    it('sends no max-age header by default', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ data: [] }))
      await client.load(query)

      const headers = headersOfCall()
      expect(headers.get('x-cache-max-age')).toBeNull()
      expect(headers.get('x-cache-control')).toBeNull()
    })

    it('sends x-cache-max-age on load', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ data: [] }))
      await client.load(query, { maxAgeSeconds: 30 })

      const headers = headersOfCall()
      expect(headers.get('x-cache-max-age')).toBe('30')
      expect(headers.get('x-cache-control')).toBeNull()
    })

    it('sends max-age 0 (and no-cache for older servers) for a bust on load', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ data: [] }))
      await client.load(query, { bustCache: true })

      const headers = headersOfCall()
      expect(headers.get('x-cache-max-age')).toBe('0')
      expect(headers.get('x-cache-control')).toBe('no-cache')
    })

    it('rounds fractional max-ages down and ignores negative ones', async () => {
      mockFetch.mockResolvedValue(okResponse({ data: [] }))
      await client.load(query, { maxAgeSeconds: 12.9 })
      await client.load(query, { maxAgeSeconds: -1 })

      expect(headersOfCall(0).get('x-cache-max-age')).toBe('12')
      expect(headersOfCall(1).get('x-cache-max-age')).toBeNull()
    })

    it('sends x-cache-max-age on batchLoad', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ results: [{ success: true, data: [] }] }))
      await client.batchLoad([query], { maxAgeSeconds: 10 })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toBe('http://localhost:4000/cubejs-api/v1/batch')
      const headers = headersOfCall()
      expect(headers.get('x-cache-max-age')).toBe('10')
      expect(headers.get('content-type')).toBe('application/json')
    })

    it('sends max-age 0 for a bust on batchLoad', async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ results: [{ success: true, data: [] }] }))
      await client.batchLoad([query], { bustCache: true })

      const headers = headersOfCall()
      expect(headers.get('x-cache-max-age')).toBe('0')
      expect(headers.get('x-cache-control')).toBe('no-cache')
    })
  })

  describe('result set freshness', () => {
    it('exposes lastRefreshTime and cache info from the nested response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          results: [{
            data: [],
            lastRefreshTime: '2026-10-23T10:00:30.000Z',
            cache: { hit: true, cachedAt: '2026-10-23T10:00:00.000Z', ttlMs: 300000, ttlRemainingMs: 270000 }
          }]
        })
      })

      const resultSet = await client.load({ measures: ['Users.count'] })

      expect(resultSet.lastRefreshTime?.()).toBe('2026-10-23T10:00:30.000Z')
      expect(resultSet.cacheInfo?.()?.cachedAt).toBe('2026-10-23T10:00:00.000Z')
    })
  })
})
