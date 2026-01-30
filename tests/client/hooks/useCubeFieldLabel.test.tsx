import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { useCubeFieldLabel } from '../../../src/client/hooks/useCubeFieldLabel'
import { CubeMetaContext, type CubeMetaContextValue } from '../../../src/client/providers/CubeMetaContext'
import { createHookWrapper } from '../../client-setup/test-utils'
import { server } from '../../client-setup/msw-server'
import { http, HttpResponse } from 'msw'

/**
 * Tests for useCubeFieldLabel hook
 *
 * This hook provides optimized access to field labels from CubeMeta context,
 * preventing re-renders when unrelated context values change.
 */
describe('useCubeFieldLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('context requirements', () => {
    it('should throw error when used outside CubeProvider', () => {
      // Suppress console.error for expected error
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useCubeFieldLabel())
      }).toThrow('useCubeFieldLabel must be used within CubeProvider')

      console.error = originalError
    })

    it('should not throw when used within CubeProvider', async () => {
      const { wrapper } = createHookWrapper()

      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      // Wait for metadata to load
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      expect(typeof result.current).toBe('function')
    })
  })

  describe('getFieldLabel function', () => {
    it('should return a function that resolves field labels', async () => {
      const { wrapper } = createHookWrapper()

      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      const getFieldLabel = result.current
      expect(typeof getFieldLabel).toBe('function')
    })

    it('should return human-readable label for known field', async () => {
      // Custom meta with specific labels
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.json({
            cubes: [
              {
                name: 'Employees',
                title: 'Employees',
                measures: [
                  { name: 'Employees.count', type: 'number', title: 'Employee Count', aggType: 'count' }
                ],
                dimensions: [
                  { name: 'Employees.name', type: 'string', title: 'Employee Name' }
                ],
                segments: []
              }
            ]
          })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      // Wait for metadata to be loaded and labels to be available
      await waitFor(() => {
        const getFieldLabel = result.current
        expect(getFieldLabel('Employees.count')).toBe('Employee Count')
      }, { timeout: 3000 })

      const getFieldLabel = result.current

      // The label should come from the metadata
      expect(getFieldLabel('Employees.count')).toBe('Employee Count')
      expect(getFieldLabel('Employees.name')).toBe('Employee Name')
    })

    it('should handle unknown field gracefully by returning field name', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      const getFieldLabel = result.current

      // Unknown fields should return a formatted version or the field itself
      const label = getFieldLabel('Unknown.field')
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })

    it('should return consistent results after rerender', async () => {
      const { wrapper } = createHookWrapper()
      const { result, rerender } = renderHook(() => useCubeFieldLabel(), { wrapper })

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      const getFieldLabel1 = result.current
      const label1 = getFieldLabel1('Employees.count')

      rerender()

      const getFieldLabel2 = result.current
      const label2 = getFieldLabel2('Employees.count')

      // Labels should be consistent across rerenders
      expect(label1).toBe(label2)
    })
  })

  describe('with custom context', () => {
    it('should use getFieldLabel from provided context', () => {
      const mockGetFieldLabel = vi.fn((field: string) => `Label for ${field}`)

      const mockContextValue: CubeMetaContextValue = {
        meta: null,
        labelMap: {},
        metaLoading: false,
        metaError: null,
        getFieldLabel: mockGetFieldLabel,
        refetchMeta: vi.fn()
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CubeMetaContext.Provider value={mockContextValue}>
          {children}
        </CubeMetaContext.Provider>
      )

      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      const getFieldLabel = result.current
      const label = getFieldLabel('Test.field')

      expect(label).toBe('Label for Test.field')
      expect(mockGetFieldLabel).toHaveBeenCalledWith('Test.field')
    })

    it('should handle empty string field name', () => {
      const mockGetFieldLabel = vi.fn((field: string) => field || 'Unknown')

      const mockContextValue: CubeMetaContextValue = {
        meta: null,
        labelMap: {},
        metaLoading: false,
        metaError: null,
        getFieldLabel: mockGetFieldLabel,
        refetchMeta: vi.fn()
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CubeMetaContext.Provider value={mockContextValue}>
          {children}
        </CubeMetaContext.Provider>
      )

      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      const getFieldLabel = result.current
      const label = getFieldLabel('')

      expect(mockGetFieldLabel).toHaveBeenCalledWith('')
      expect(label).toBe('Unknown')
    })

    it('should handle field names with special characters', () => {
      const mockGetFieldLabel = vi.fn((field: string) => `Formatted: ${field}`)

      const mockContextValue: CubeMetaContextValue = {
        meta: null,
        labelMap: {},
        metaLoading: false,
        metaError: null,
        getFieldLabel: mockGetFieldLabel,
        refetchMeta: vi.fn()
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CubeMetaContext.Provider value={mockContextValue}>
          {children}
        </CubeMetaContext.Provider>
      )

      const { result } = renderHook(() => useCubeFieldLabel(), { wrapper })

      const getFieldLabel = result.current

      // Test various field name formats
      expect(getFieldLabel('Cube.snake_case_field')).toBe('Formatted: Cube.snake_case_field')
      expect(getFieldLabel('Cube.camelCaseField')).toBe('Formatted: Cube.camelCaseField')
      expect(getFieldLabel('Cube.field-with-dashes')).toBe('Formatted: Cube.field-with-dashes')
    })
  })

  describe('memoization behavior', () => {
    it('should only update reference when getFieldLabel changes', () => {
      const getFieldLabelV1 = vi.fn((field: string) => `V1: ${field}`)
      const getFieldLabelV2 = vi.fn((field: string) => `V2: ${field}`)

      const createMockContextValue = (getFieldLabel: (field: string) => string): CubeMetaContextValue => ({
        meta: null,
        labelMap: {},
        metaLoading: false,
        metaError: null,
        getFieldLabel,
        refetchMeta: vi.fn()
      })

      let contextValue = createMockContextValue(getFieldLabelV1)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CubeMetaContext.Provider value={contextValue}>
          {children}
        </CubeMetaContext.Provider>
      )

      const { result, rerender } = renderHook(() => useCubeFieldLabel(), { wrapper })

      const firstRef = result.current
      expect(firstRef('test')).toBe('V1: test')

      // Update context with new getFieldLabel
      contextValue = createMockContextValue(getFieldLabelV2)
      rerender()

      const secondRef = result.current
      expect(secondRef('test')).toBe('V2: test')

      // Reference should change when getFieldLabel changes
      expect(firstRef).not.toBe(secondRef)
    })
  })
})
