import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CubeClient } from '../../src/client/client/CubeClient'
import type { CubeQuery } from '../../src/client/types'

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
})