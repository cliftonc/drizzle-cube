import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { CubeClient } from '../../src/client/client/CubeClient'
import type { CubeQuery } from '../../src/client/types'
import { server } from '../client-setup/msw-server'
import { BatchCoordinator } from '../../src/client/client/BatchCoordinator'

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

  describe('batchLoad method', () => {
    const issues = [
      { source: 'dimension', member: 'Users.removed', message: "Dimension 'Users.removed' not found" }
    ]

    function mockBatchResponse() {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          results: [
            { success: true, data: [{ 'Users.count': 5 }], annotation: {} },
            {
              success: false,
              error: "Dimension 'Users.removed' not found",
              issues,
              query: { dimensions: ['Users.removed'] }
            }
          ]
        })
      })
    }

    it('should keep the error and the validation issues of a failed query', async () => {
      mockBatchResponse()

      const [succeeded, failed] = await client.batchLoad([
        { measures: ['Users.count'] },
        { dimensions: ['Users.removed'] }
      ])

      expect(succeeded.rawData()).toEqual([{ 'Users.count': 5 }])
      expect(failed).toMatchObject({ error: "Dimension 'Users.removed' not found", issues })
    })

    it('should reject a batched query with the validation issues of its failed result', async () => {
      mockBatchResponse()
      const coordinator = new BatchCoordinator(queries => client.batchLoad(queries), 0)

      const succeeded = coordinator.register({ measures: ['Users.count'] })
      const failed = coordinator.register({ dimensions: ['Users.removed'] })

      await expect(failed).rejects.toMatchObject({ name: 'CubeQueryError', status: 400, issues })
      await expect(succeeded.then(result => result.rawData())).resolves.toEqual([{ 'Users.count': 5 }])
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