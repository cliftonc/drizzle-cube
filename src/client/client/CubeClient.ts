/**
 * Minimal Cube client implementation
 * Replaces @cubejs-client/core with lighter implementation
 */

import type { CubeQuery, CubeApiOptions, CubeResultSet, ExplainResult, ExplainOptions } from '../types'

export class CubeClient {
  private apiUrl: string
  private headers: Record<string, string>
  private credentials: 'include' | 'omit' | 'same-origin'

  constructor(token?: string, options: CubeApiOptions = {}) {
    this.apiUrl = options.apiUrl || '/cubejs-api/v1'
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    this.credentials = options.credentials ?? 'include'

    if (token) {
      this.headers['Authorization'] = token
    }
  }

  async load(query: CubeQuery, options?: { bustCache?: boolean }): Promise<CubeResultSet> {
    // Use GET with query parameter for standard Cube.js compatibility
    const queryString = JSON.stringify(query)
    const queryParam = encodeURIComponent(queryString)
    const url = `${this.apiUrl}/load?query=${queryParam}`

    // Build headers, optionally adding cache bust header
    const requestHeaders: Record<string, string> = {
      // Remove Content-Type for GET request
      ...Object.fromEntries(
        Object.entries(this.headers).filter(([key]) => key !== 'Content-Type')
      )
    }
    if (options?.bustCache) {
      requestHeaders['X-Cache-Control'] = 'no-cache'
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
      credentials: this.credentials
    })

    if (!response.ok) {
      let errorMessage = `Cube query failed: ${response.status}`
      try {
        const errorText = await response.text()
        // Try to parse as JSON first to get structured error
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          } else {
            errorMessage += ` ${errorText}`
          }
        } catch {
          // If not JSON, use the raw text
          errorMessage += ` ${errorText}`
        }
      } catch {
        // If we can't read the response, just use the status
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return new ResultSet(result)
  }

  async meta(): Promise<any> {
    const url = `${this.apiUrl}/meta`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
      credentials: this.credentials
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch meta: ${response.status}`)
    }

    return response.json()
  }

  async sql(query: CubeQuery): Promise<any> {
    // Use GET with query parameter for standard Cube.js compatibility
    const queryParam = encodeURIComponent(JSON.stringify(query))
    const url = `${this.apiUrl}/sql?query=${queryParam}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Remove Content-Type for GET request
        ...Object.fromEntries(
          Object.entries(this.headers).filter(([key]) => key !== 'Content-Type')
        )
      },
      credentials: this.credentials
    })

    if (!response.ok) {
      throw new Error(`SQL generation failed: ${response.status}`)
    }

    return response.json()
  }

  async dryRun(query: CubeQuery): Promise<any> {
    const url = `${this.apiUrl}/dry-run`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      credentials: this.credentials,
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      let errorMessage = `Dry run failed: ${response.status}`
      try {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          } else {
            errorMessage += ` ${errorText}`
          }
        } catch {
          errorMessage += ` ${errorText}`
        }
      } catch {
        // If we can't read the response, just use the status
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Execute EXPLAIN on a query to get the execution plan
   * Returns normalized plan across PostgreSQL, MySQL, and SQLite
   * Accepts standard queries, funnel queries ({ funnel: {...} }), or flow queries ({ flow: {...} })
   */
  async explain(query: CubeQuery | unknown, options?: ExplainOptions): Promise<ExplainResult> {
    const url = `${this.apiUrl}/explain`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      credentials: this.credentials,
      body: JSON.stringify({ query, options })
    })

    if (!response.ok) {
      let errorMessage = `Explain failed: ${response.status}`
      try {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          } else {
            errorMessage += ` ${errorText}`
          }
        } catch {
          errorMessage += ` ${errorText}`
        }
      } catch {
        // If we can't read the response, just use the status
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Execute multiple queries in a single batch request
   * Used by BatchCoordinator to optimize network requests
   * Pass { bustCache: true } to bypass server-side cache
   */
  async batchLoad(queries: CubeQuery[], options?: { bustCache?: boolean }): Promise<CubeResultSet[]> {
    const url = `${this.apiUrl}/batch`

    // Build headers with optional cache bypass
    const requestHeaders: Record<string, string> = { ...this.headers }
    if (options?.bustCache) {
      requestHeaders['X-Cache-Control'] = 'no-cache'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      credentials: this.credentials,
      body: JSON.stringify({ queries })
    })

    if (!response.ok) {
      let errorMessage = `Batch query failed: ${response.status}`
      try {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          } else {
            errorMessage += ` ${errorText}`
          }
        } catch {
          errorMessage += ` ${errorText}`
        }
      } catch {
        // If we can't read the response, just use the status
      }
      throw new Error(errorMessage)
    }

    const batchResponse = await response.json()

    // batchResponse.results is an array of individual query results
    // Each result may have succeeded or failed
    return batchResponse.results.map((result: any) => {
      // If this individual query failed, create a ResultSet with error info
      if (!result.success && result.error) {
        // Create a result set that will throw when accessed
        return {
          ...new ResultSet({ data: [], annotation: {} }),
          error: result.error
        }
      }

      // Create ResultSet from successful result
      return new ResultSet(result)
    })
  }
}

/**
 * Simple ResultSet implementation
 */
class ResultSet implements CubeResultSet {
  public loadResponse: any

  constructor(loadResponse: any) {
    this.loadResponse = loadResponse
  }

  rawData(): any[] {
    // Handle new nested structure: loadResponse.results[0].data
    // Keep backward compatibility with old structure: loadResponse.data
    if (this.loadResponse.results && this.loadResponse.results[0]) {
      return this.loadResponse.results[0].data || []
    }
    return this.loadResponse.data || []
  }

  tablePivot(): any[] {
    // For pie charts and tables, return the raw data
    return this.rawData()
  }

  series(): any[] {
    // Simple series implementation
    return this.rawData()
  }

  annotation(): any {
    // Handle new nested structure: loadResponse.results[0].annotation
    // Keep backward compatibility with old structure: loadResponse.annotation
    if (this.loadResponse.results && this.loadResponse.results[0]) {
      return this.loadResponse.results[0].annotation || {}
    }
    return this.loadResponse.annotation || {}
  }

  /**
   * Get cache metadata if result was served from cache
   * Returns undefined if not a cache hit
   */
  cacheInfo(): { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | undefined {
    // Handle nested structure: loadResponse.results[0].cache
    if (this.loadResponse.results && this.loadResponse.results[0]) {
      return this.loadResponse.results[0].cache
    }
    return this.loadResponse.cache
  }
}

/**
 * Factory function to create a cube client
 */
export function createCubeClient(token?: string, options: CubeApiOptions = {}): CubeClient {
  return new CubeClient(token, options)
}

// Legacy compatibility export
export function cube(token?: string, options: CubeApiOptions = {}): CubeClient {
  return createCubeClient(token, options)
}