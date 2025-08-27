/**
 * Simple working test for useCubeMeta to verify the mocking approach
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCubeMeta, clearMetaCache, type CubeMeta } from '../../src/client/hooks/useCubeMeta'
import type { CubeClient } from '../../src/client/client/CubeClient'

describe('useCubeMeta - Simple Working Test', () => {
  let mockCubeClient: CubeClient
  let mockMeta: vi.Mock

  beforeEach(() => {
    vi.clearAllMocks()
    clearMetaCache()

    mockMeta = vi.fn()
    mockCubeClient = {
      load: vi.fn(),
      sql: vi.fn(),
      meta: mockMeta
    } as any

    // Ensure the mock returns a resolved promise immediately
    mockMeta.mockImplementation(() => Promise.resolve({ cubes: [] }))
  })

  it('should work with basic metadata fetch', async () => {
    const { result } = renderHook(() => useCubeMeta(mockCubeClient))

    // Should start loading
    expect(result.current.loading).toBe(true)

    // Wait for the hook to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 2000 })

    // Should have called the mock
    expect(mockMeta).toHaveBeenCalled()
    expect(result.current.meta).toEqual({ cubes: [] })
    expect(result.current.error).toBe(null)
  })
})