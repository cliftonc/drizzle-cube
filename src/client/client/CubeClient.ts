/**
 * Minimal Cube client implementation
 * Replaces @cubejs-client/core with lighter implementation
 */

import type { CubeQuery, CubeApiOptions, CubeResultSet } from '../types'

export class CubeClient {
  private apiUrl: string
  private headers: Record<string, string>

  constructor(token?: string, options: CubeApiOptions = {}) {
    this.apiUrl = options.apiUrl || '/cubejs-api/v1'
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`
    }
  }

  async load(query: CubeQuery): Promise<CubeResultSet> {
    const url = `${this.apiUrl}/load`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      credentials: 'include', // Include cookies for session auth
      body: JSON.stringify({ query })
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
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch meta: ${response.status}`)
    }

    return response.json()
  }

  async sql(query: CubeQuery): Promise<any> {
    const url = `${this.apiUrl}/sql`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      credentials: 'include',
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      throw new Error(`SQL generation failed: ${response.status}`)
    }

    return response.json()
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
    return this.loadResponse.annotation || {}
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