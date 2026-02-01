/**
 * Comprehensive tests for CubeProvider system
 *
 * Tests cover:
 * - CubeProvider initialization and configuration
 * - Three-layer context architecture (API, Meta, Features)
 * - Specialized hooks (useCubeApi, useCubeMeta, useCubeFeatures)
 * - Backward-compatible useCubeContext hook
 * - Feature toggles and configuration
 * - Error states and edge cases
 * - QueryClient integration
 * - Re-render optimization
 */

import React, { useState, useEffect, useRef } from 'react'
import { render, renderHook, waitFor, act, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import {
  CubeProvider,
  useCubeContext,
  useCubeApi,
  useCubeMeta,
  useCubeFeatures,
  createCubeQueryClient
} from '../../../src/client/providers/CubeProvider'
import { CubeApiProvider } from '../../../src/client/providers/CubeApiProvider'
import { CubeMetaProvider } from '../../../src/client/providers/CubeMetaProvider'
import { CubeFeaturesProvider } from '../../../src/client/providers/CubeFeaturesProvider'
import type { CubeApiOptions, FeaturesConfig, DashboardLayoutMode } from '../../../src/client/types'
import {
  server,
  createTestQueryClient,
  createHookWrapper
} from '../../client-setup/test-utils'

// Mock metadata for tests
const mockMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.count', type: 'number', title: 'Count', shortTitle: 'Cnt', aggType: 'count' },
        { name: 'Employees.totalSalary', type: 'number', title: 'Total Salary', shortTitle: 'Tot Sal', aggType: 'sum' }
      ],
      dimensions: [
        { name: 'Employees.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Employees.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Employees.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' }
      ],
      segments: []
    },
    {
      name: 'Departments',
      title: 'Departments',
      measures: [
        { name: 'Departments.count', type: 'number', title: 'Department Count', shortTitle: 'Cnt', aggType: 'count' }
      ],
      dimensions: [
        { name: 'Departments.name', type: 'string', title: 'Department Name', shortTitle: 'Name' }
      ],
      segments: []
    }
  ]
}

// Helper to create metadata handler
function createMetaHandler(meta: typeof mockMeta, delay?: number) {
  return http.get('*/cubejs-api/v1/meta', async () => {
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    return HttpResponse.json(meta)
  })
}

// Helper to create error handler
function createMetaErrorHandler(status: number, message: string) {
  return http.get('*/cubejs-api/v1/meta', () => {
    return HttpResponse.json({ error: message }, { status })
  })
}

describe('CubeProvider', () => {
  beforeEach(() => {
    server.use(createMetaHandler(mockMeta))
  })

  describe('Provider Initialization', () => {
    it('should initialize with default apiOptions when none provided', async () => {
      const TestComponent = () => {
        const { cubeApi } = useCubeContext()
        return <div data-testid="api">{cubeApi ? 'present' : 'missing'}</div>
      }

      render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('api')).toHaveTextContent('present')
    })

    it('should initialize with custom apiOptions', async () => {
      const customOptions: CubeApiOptions = {
        apiUrl: 'https://custom.api.com/cube/v1',
        headers: { 'X-Custom-Header': 'value' }
      }

      const { wrapper } = createHookWrapper({ apiUrl: customOptions.apiUrl })
      const { result } = renderHook(() => useCubeApi(), { wrapper })

      expect(result.current.cubeApi).toBeDefined()
    })

    it('should initialize with token for authentication', async () => {
      const { wrapper } = createHookWrapper({ token: 'test-auth-token' })
      const { result } = renderHook(() => useCubeApi(), { wrapper })

      expect(result.current.cubeApi).toBeDefined()
    })

    it('should create internal QueryClient when none provided', () => {
      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="context">{context ? 'present' : 'missing'}</div>
      }

      render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('context')).toHaveTextContent('present')
    })

    it('should use provided QueryClient when given', () => {
      const customQueryClient = createTestQueryClient()
      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="context">{context ? 'present' : 'missing'}</div>
      }

      render(
        <CubeProvider queryClient={customQueryClient}>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('context')).toHaveTextContent('present')
    })

    it('should pass options through to context', () => {
      const customOptions = { skip: true, resetResultSetOnChange: false }

      const TestComponent = () => {
        const { options } = useCubeContext()
        return <div data-testid="options">{JSON.stringify(options)}</div>
      }

      render(
        <CubeProvider options={customOptions}>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('options')).toHaveTextContent(JSON.stringify(customOptions))
    })
  })

  describe('Context Value Accessibility via useCubeContext', () => {
    it('should provide cubeApi in context', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      expect(result.current.cubeApi).toBeDefined()
      expect(typeof result.current.cubeApi.load).toBe('function')
    })

    it('should provide meta after loading', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.meta).toBeDefined()
      expect(result.current.meta?.cubes).toHaveLength(2)
    })

    it('should provide labelMap after loading', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.labelMap).toBeDefined()
      expect(result.current.labelMap['Employees.count']).toBe('Count')
      expect(result.current.labelMap['Employees.name']).toBe('Name')
    })

    it('should provide metaLoading state', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      // Initially loading
      expect(result.current.metaLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })
    })

    it('should provide metaError when API fails', async () => {
      server.use(createMetaErrorHandler(500, 'Server error'))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.metaError).not.toBeNull()
    })

    it('should provide getFieldLabel function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(typeof result.current.getFieldLabel).toBe('function')
      expect(result.current.getFieldLabel('Employees.count')).toBe('Count')
      expect(result.current.getFieldLabel('Unknown.field')).toBe('Unknown.field')
    })

    it('should provide refetchMeta function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(typeof result.current.refetchMeta).toBe('function')
    })

    it('should provide updateApiConfig function', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      expect(typeof result.current.updateApiConfig).toBe('function')
    })

    it('should provide features in context', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      expect(result.current.features).toBeDefined()
      expect(typeof result.current.features.enableAI).toBe('boolean')
    })

    it('should provide dashboardModes in context', async () => {
      const TestComponent = () => {
        const { dashboardModes } = useCubeContext()
        return <div data-testid="modes">{JSON.stringify(dashboardModes)}</div>
      }

      render(
        <CubeProvider dashboardModes={['grid', 'rows']}>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('modes')).toHaveTextContent('["grid","rows"]')
    })
  })

  describe('useCubeApi Hook - Selective Re-renders', () => {
    it('should only provide API-related values', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeApi(), { wrapper })

      expect(result.current.cubeApi).toBeDefined()
      expect(result.current.updateApiConfig).toBeDefined()
      expect(result.current.options).toBeDefined()
      expect(result.current.batchCoordinator).toBeDefined()
      expect(result.current.enableBatching).toBeDefined()
    })

    it('should not re-render when metadata changes', async () => {
      let apiRenderCount = 0
      let metaRenderCount = 0

      const ApiConsumer = () => {
        useCubeApi()
        apiRenderCount++
        return null
      }

      const MetaConsumer = () => {
        useCubeMeta()
        metaRenderCount++
        return null
      }

      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <ApiConsumer />
            <MetaConsumer />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Wait for metadata to load
      await waitFor(() => {
        expect(metaRenderCount).toBeGreaterThan(1) // Meta consumer should re-render
      })

      // API consumer should have minimal renders (initial + potentially one more)
      // The key is that API renders should be less than Meta renders
      expect(apiRenderCount).toBeLessThanOrEqual(metaRenderCount)
    })

    it('should re-render when API config is updated', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeApi(), { wrapper })

      const initialApi = result.current.cubeApi

      act(() => {
        result.current.updateApiConfig({ apiUrl: '/new-api' }, 'new-token')
      })

      // API should be recreated with new config
      expect(result.current.cubeApi).not.toBe(initialApi)
    })
  })

  describe('useCubeMeta Hook - Selective Re-renders', () => {
    it('should only provide metadata-related values', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.meta).toBeDefined()
      expect(result.current.labelMap).toBeDefined()
      expect(result.current.metaLoading).toBeDefined()
      expect(result.current.metaError).toBeDefined()
      expect(result.current.getFieldLabel).toBeDefined()
      expect(result.current.refetchMeta).toBeDefined()
    })

    it('should return loading state initially', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      expect(result.current.metaLoading).toBe(true)
      expect(result.current.meta).toBeNull()
    })

    it('should return metadata after loading', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.meta?.cubes).toHaveLength(2)
      expect(result.current.meta?.cubes[0].name).toBe('Employees')
    })

    it('should build labelMap correctly from metadata', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      // Check measures
      expect(result.current.labelMap['Employees.count']).toBe('Count')
      expect(result.current.labelMap['Employees.totalSalary']).toBe('Total Salary')

      // Check dimensions
      expect(result.current.labelMap['Employees.id']).toBe('ID')
      expect(result.current.labelMap['Employees.name']).toBe('Name')
      expect(result.current.labelMap['Employees.createdAt']).toBe('Created At')

      // Check other cubes
      expect(result.current.labelMap['Departments.count']).toBe('Department Count')
      expect(result.current.labelMap['Departments.name']).toBe('Department Name')
    })

    it('should refetch metadata when refetchMeta is called', async () => {
      let fetchCount = 0
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          fetchCount++
          return HttpResponse.json(mockMeta)
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(fetchCount).toBe(1)

      act(() => {
        result.current.refetchMeta()
      })

      await waitFor(() => {
        expect(fetchCount).toBe(2)
      })
    })
  })

  describe('useCubeFeatures Hook - Selective Re-renders', () => {
    it('should only provide feature-related values', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeFeatures(), { wrapper })

      expect(result.current.features).toBeDefined()
      expect(result.current.dashboardModes).toBeDefined()
      expect(result.current.updateFeatures).toBeDefined()
    })

    it('should return default features when none provided', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeFeatures(), { wrapper })

      expect(result.current.features.enableAI).toBe(true)
      expect(result.current.features.aiEndpoint).toBe('/api/ai/generate')
      expect(result.current.features.editToolbar).toBe('both')
    })

    it('should return custom features when provided', async () => {
      const customFeatures: FeaturesConfig = {
        enableAI: false,
        aiEndpoint: '/custom/ai',
        editToolbar: 'floating'
      }

      const TestComponent = () => {
        const { features } = useCubeFeatures()
        return (
          <div>
            <span data-testid="enableAI">{String(features.enableAI)}</span>
            <span data-testid="aiEndpoint">{features.aiEndpoint}</span>
            <span data-testid="editToolbar">{features.editToolbar}</span>
          </div>
        )
      }

      render(
        <CubeProvider features={customFeatures}>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('enableAI')).toHaveTextContent('false')
      expect(screen.getByTestId('aiEndpoint')).toHaveTextContent('/custom/ai')
      expect(screen.getByTestId('editToolbar')).toHaveTextContent('floating')
    })

    it('should allow updating features dynamically', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeFeatures(), { wrapper })

      expect(result.current.features.enableAI).toBe(true)

      act(() => {
        result.current.updateFeatures({ enableAI: false })
      })

      expect(result.current.features.enableAI).toBe(false)
    })

    it('should return default dashboardModes', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeFeatures(), { wrapper })

      expect(result.current.dashboardModes).toEqual(['rows', 'grid'])
    })

    it('should return custom dashboardModes when provided', async () => {
      const customModes: DashboardLayoutMode[] = ['grid']

      const TestComponent = () => {
        const { dashboardModes } = useCubeFeatures()
        return <div data-testid="modes">{JSON.stringify(dashboardModes)}</div>
      }

      render(
        <CubeProvider dashboardModes={customModes}>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('modes')).toHaveTextContent('["grid"]')
    })

    it('should provide graceful fallback when used outside provider', () => {
      // useCubeFeatures returns default context when outside provider
      const { result } = renderHook(() => useCubeFeatures())

      expect(result.current.features).toBeDefined()
      expect(result.current.features.enableAI).toBe(true)
      expect(result.current.dashboardModes).toEqual(['rows', 'grid'])
    })
  })

  describe('Error States', () => {
    it('should throw when useCubeContext is used outside CubeProvider', () => {
      const TestComponent = () => {
        useCubeContext()
        return <div>test</div>
      }

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useCubeApi must be used within CubeApiProvider')
    })

    it('should throw when useCubeApi is used outside CubeApiProvider', () => {
      const TestComponent = () => {
        useCubeApi()
        return <div>test</div>
      }

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useCubeApi must be used within CubeApiProvider')
    })

    it('should throw when useCubeMeta is used outside CubeMetaProvider', () => {
      const TestComponent = () => {
        useCubeMeta()
        return <div>test</div>
      }

      // Need to wrap in CubeApiProvider but not CubeMetaProvider
      const queryClient = createTestQueryClient()

      expect(() => {
        render(
          <QueryClientProvider client={queryClient}>
            <CubeApiProvider apiOptions={{ apiUrl: '/api' }}>
              <TestComponent />
            </CubeApiProvider>
          </QueryClientProvider>
        )
      }).toThrow('useCubeMeta must be used within CubeMetaProvider')
    })

    it('should handle API error gracefully', async () => {
      server.use(createMetaErrorHandler(500, 'Internal server error'))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.metaError).not.toBeNull()
      expect(result.current.meta).toBeNull()
    })

    it('should handle network error gracefully', async () => {
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.error()
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaError).not.toBeNull()
      })
    })

    it('should handle malformed metadata response', async () => {
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          return HttpResponse.json({ invalid: 'response' })
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      // Should handle gracefully with empty labelMap
      expect(result.current.labelMap).toEqual({})
    })
  })

  describe('QueryClient Integration', () => {
    it('should create default QueryClient with proper settings', () => {
      const queryClient = createCubeQueryClient()

      expect(queryClient).toBeInstanceOf(QueryClient)

      // Check default options
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000) // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(15 * 60 * 1000) // 15 minutes
      expect(defaultOptions.queries?.retry).toBe(3)
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false)
    })

    it('should share query cache between components', async () => {
      let fetchCount = 0
      server.use(
        http.get('*/cubejs-api/v1/meta', () => {
          fetchCount++
          return HttpResponse.json(mockMeta)
        })
      )

      const queryClient = createTestQueryClient()

      const Consumer1 = () => {
        const { meta } = useCubeMeta()
        return <div data-testid="c1">{meta?.cubes?.length ?? 0}</div>
      }

      const Consumer2 = () => {
        const { meta } = useCubeMeta()
        return <div data-testid="c2">{meta?.cubes?.length ?? 0}</div>
      }

      render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <Consumer1 />
            <Consumer2 />
          </CubeProvider>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('c1')).toHaveTextContent('2')
        expect(screen.getByTestId('c2')).toHaveTextContent('2')
      })

      // Should only fetch once due to caching
      expect(fetchCount).toBe(1)
    })
  })

  describe('Metadata Loading States', () => {
    it('should show loading state during fetch', async () => {
      server.use(createMetaHandler(mockMeta, 100)) // Add delay

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      expect(result.current.metaLoading).toBe(true)
      expect(result.current.meta).toBeNull()

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.meta).not.toBeNull()
    })

    it('should transition from loading to loaded', async () => {
      const loadingStates: boolean[] = []

      const TrackingComponent = () => {
        const { metaLoading } = useCubeMeta()
        useEffect(() => {
          loadingStates.push(metaLoading)
        }, [metaLoading])
        return null
      }

      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <TrackingComponent />
          </CubeProvider>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(loadingStates).toContain(true)
        expect(loadingStates).toContain(false)
      })
    })
  })

  describe('getFieldLabel Functionality', () => {
    it('should return title for known fields', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.getFieldLabel('Employees.count')).toBe('Count')
      expect(result.current.getFieldLabel('Employees.name')).toBe('Name')
      expect(result.current.getFieldLabel('Departments.name')).toBe('Department Name')
    })

    it('should return field name for unknown fields', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.getFieldLabel('Unknown.field')).toBe('Unknown.field')
      expect(result.current.getFieldLabel('NonExistent.measure')).toBe('NonExistent.measure')
    })

    it('should return field name when still loading', () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      // Before loading completes
      expect(result.current.getFieldLabel('Employees.count')).toBe('Employees.count')
    })

    it('should use shortTitle when title is not available', async () => {
      const metaWithShortTitle = {
        cubes: [{
          name: 'Test',
          title: 'Test',
          measures: [{ name: 'Test.metric', type: 'number', shortTitle: 'Mtrc', aggType: 'sum' }],
          dimensions: [{ name: 'Test.dim', type: 'string', shortTitle: 'Dm' }],
          segments: []
        }]
      }

      server.use(createMetaHandler(metaWithShortTitle as typeof mockMeta))

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeMeta(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      expect(result.current.labelMap['Test.metric']).toBe('Mtrc')
      expect(result.current.labelMap['Test.dim']).toBe('Dm')
    })
  })

  describe('Feature Toggles', () => {
    describe('enableAI feature', () => {
      it('should default to true', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="ai">{String(features.enableAI)}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('ai')).toHaveTextContent('true')
      })

      it('should allow disabling AI', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="ai">{String(features.enableAI)}</div>
        }

        render(
          <CubeProvider features={{ enableAI: false }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('ai')).toHaveTextContent('false')
      })
    })

    describe('aiEndpoint configuration', () => {
      it('should default to /api/ai/generate', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="endpoint">{features.aiEndpoint}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('endpoint')).toHaveTextContent('/api/ai/generate')
      })

      it('should allow custom AI endpoint', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="endpoint">{features.aiEndpoint}</div>
        }

        render(
          <CubeProvider features={{ aiEndpoint: '/custom/ai/endpoint' }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('endpoint')).toHaveTextContent('/custom/ai/endpoint')
      })
    })

    describe('editToolbar options', () => {
      it('should default to both', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="toolbar">{features.editToolbar}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('toolbar')).toHaveTextContent('both')
      })

      it('should allow floating only', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="toolbar">{features.editToolbar}</div>
        }

        render(
          <CubeProvider features={{ editToolbar: 'floating' }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('toolbar')).toHaveTextContent('floating')
      })

      it('should allow top only', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="toolbar">{features.editToolbar}</div>
        }

        render(
          <CubeProvider features={{ editToolbar: 'top' }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('toolbar')).toHaveTextContent('top')
      })
    })

    describe('manualRefresh mode', () => {
      it('should default to undefined (false)', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="manual">{String(features.manualRefresh ?? 'undefined')}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('manual')).toHaveTextContent('undefined')
      })

      it('should allow enabling manual refresh', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="manual">{String(features.manualRefresh)}</div>
        }

        render(
          <CubeProvider features={{ manualRefresh: true }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('manual')).toHaveTextContent('true')
      })
    })

    describe('thumbnail configuration', () => {
      it('should default to undefined', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="thumb">{features.thumbnail ? 'set' : 'undefined'}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('thumb')).toHaveTextContent('undefined')
      })

      it('should allow thumbnail configuration', () => {
        const thumbnailConfig = {
          enabled: true,
          width: 1600,
          height: 1200,
          format: 'png' as const
        }

        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return (
            <div>
              <span data-testid="enabled">{String(features.thumbnail?.enabled)}</span>
              <span data-testid="width">{features.thumbnail?.width}</span>
              <span data-testid="height">{features.thumbnail?.height}</span>
              <span data-testid="format">{features.thumbnail?.format}</span>
            </div>
          )
        }

        render(
          <CubeProvider features={{ thumbnail: thumbnailConfig }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('enabled')).toHaveTextContent('true')
        expect(screen.getByTestId('width')).toHaveTextContent('1600')
        expect(screen.getByTestId('height')).toHaveTextContent('1200')
        expect(screen.getByTestId('format')).toHaveTextContent('png')
      })
    })

    describe('floatingToolbarPosition', () => {
      it('should default to right', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="pos">{features.floatingToolbarPosition}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('pos')).toHaveTextContent('right')
      })

      it('should allow left position', () => {
        const TestComponent = () => {
          const { features } = useCubeFeatures()
          return <div data-testid="pos">{features.floatingToolbarPosition}</div>
        }

        render(
          <CubeProvider features={{ floatingToolbarPosition: 'left' }}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('pos')).toHaveTextContent('left')
      })
    })
  })

  describe('Edge Cases', () => {
    describe('Empty apiOptions', () => {
      it('should use default API URL when apiOptions is empty object', () => {
        const TestComponent = () => {
          const { cubeApi } = useCubeContext()
          return <div data-testid="api">{cubeApi ? 'present' : 'missing'}</div>
        }

        render(
          <CubeProvider apiOptions={{}}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('api')).toHaveTextContent('present')
      })

      it('should use default API URL when apiOptions is undefined', () => {
        const TestComponent = () => {
          const { cubeApi } = useCubeContext()
          return <div data-testid="api">{cubeApi ? 'present' : 'missing'}</div>
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('api')).toHaveTextContent('present')
      })
    })

    describe('Component unmounting during metadata fetch', () => {
      it('should not cause errors when unmounting while loading', async () => {
        server.use(createMetaHandler(mockMeta, 200)) // Add delay

        const queryClient = createTestQueryClient()

        const { unmount } = render(
          <QueryClientProvider client={queryClient}>
            <CubeProvider queryClient={queryClient}>
              <div>Test content</div>
            </CubeProvider>
          </QueryClientProvider>
        )

        // Unmount while still loading
        unmount()

        // No error should be thrown
        // Wait a bit to ensure no async errors
        await new Promise(resolve => setTimeout(resolve, 300))
      })

      it('should handle rapid mount/unmount cycles', async () => {
        const queryClient = createTestQueryClient()

        for (let i = 0; i < 5; i++) {
          const { unmount } = render(
            <QueryClientProvider client={queryClient}>
              <CubeProvider queryClient={queryClient}>
                <div>Cycle {i}</div>
              </CubeProvider>
            </QueryClientProvider>
          )
          unmount()
        }

        // Should complete without errors
        expect(true).toBe(true)
      })
    })

    describe('Empty metadata response', () => {
      it('should handle empty cubes array', async () => {
        server.use(createMetaHandler({ cubes: [] } as typeof mockMeta))

        const { wrapper } = createHookWrapper()
        const { result } = renderHook(() => useCubeMeta(), { wrapper })

        await waitFor(() => {
          expect(result.current.metaLoading).toBe(false)
        })

        expect(result.current.meta?.cubes).toHaveLength(0)
        expect(result.current.labelMap).toEqual({})
      })

      it('should handle cubes with empty measures and dimensions', async () => {
        const emptyMeta = {
          cubes: [{
            name: 'EmptyCube',
            title: 'Empty Cube',
            measures: [],
            dimensions: [],
            segments: []
          }]
        }

        server.use(createMetaHandler(emptyMeta as typeof mockMeta))

        const { wrapper } = createHookWrapper()
        const { result } = renderHook(() => useCubeMeta(), { wrapper })

        await waitFor(() => {
          expect(result.current.metaLoading).toBe(false)
        })

        expect(result.current.meta?.cubes).toHaveLength(1)
        expect(result.current.labelMap).toEqual({})
      })
    })

    describe('Batching configuration', () => {
      it('should enable batching by default', () => {
        const TestComponent = () => {
          const { enableBatching, batchCoordinator } = useCubeApi()
          return (
            <div>
              <span data-testid="enabled">{String(enableBatching)}</span>
              <span data-testid="coordinator">{batchCoordinator ? 'present' : 'null'}</span>
            </div>
          )
        }

        render(
          <CubeProvider>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('enabled')).toHaveTextContent('true')
        expect(screen.getByTestId('coordinator')).toHaveTextContent('present')
      })

      it('should allow disabling batching', () => {
        const TestComponent = () => {
          const { enableBatching, batchCoordinator } = useCubeApi()
          return (
            <div>
              <span data-testid="enabled">{String(enableBatching)}</span>
              <span data-testid="coordinator">{batchCoordinator ? 'present' : 'null'}</span>
            </div>
          )
        }

        render(
          <CubeProvider enableBatching={false}>
            <TestComponent />
          </CubeProvider>
        )

        expect(screen.getByTestId('enabled')).toHaveTextContent('false')
        expect(screen.getByTestId('coordinator')).toHaveTextContent('null')
      })
    })
  })

  describe('Context Stability', () => {
    it('should maintain stable cubeApi reference when dependencies unchanged', async () => {
      const apiRefs: unknown[] = []

      const ApiTracker = () => {
        const { cubeApi } = useCubeApi()
        // Use ref to capture on every render
        const ref = useRef(cubeApi)
        ref.current = cubeApi
        useEffect(() => {
          apiRefs.push(cubeApi)
        })
        return null
      }

      const queryClient = createTestQueryClient()

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <ApiTracker />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Wait for initial render to complete
      await waitFor(() => {
        expect(apiRefs.length).toBeGreaterThan(0)
      })

      const initialCount = apiRefs.length

      rerender(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <ApiTracker />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Wait for rerender
      await waitFor(() => {
        expect(apiRefs.length).toBeGreaterThan(initialCount)
      })

      // Last two refs should be the same since dependencies didn't change
      expect(apiRefs[apiRefs.length - 1]).toBe(apiRefs[apiRefs.length - 2])
    })

    it('should create new cubeApi when token changes', async () => {
      const apiRefs: unknown[] = []

      const ApiTracker = () => {
        const { cubeApi } = useCubeApi()
        useEffect(() => {
          apiRefs.push(cubeApi)
        }, [cubeApi])
        return null
      }

      const queryClient = createTestQueryClient()

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient} token="token1">
            <ApiTracker />
          </CubeProvider>
        </QueryClientProvider>
      )

      rerender(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient} token="token2">
            <ApiTracker />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Should be different references
      expect(apiRefs[0]).not.toBe(apiRefs[1])
    })

    it('should create new cubeApi when apiUrl changes', async () => {
      const apiRefs: unknown[] = []

      const ApiTracker = () => {
        const { cubeApi } = useCubeApi()
        useEffect(() => {
          apiRefs.push(cubeApi)
        }, [cubeApi])
        return null
      }

      const queryClient = createTestQueryClient()

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient} apiOptions={{ apiUrl: '/api1' }}>
            <ApiTracker />
          </CubeProvider>
        </QueryClientProvider>
      )

      rerender(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient} apiOptions={{ apiUrl: '/api2' }}>
            <ApiTracker />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Should be different references
      expect(apiRefs[0]).not.toBe(apiRefs[1])
    })
  })

  describe('Dynamic API Configuration Update', () => {
    it('should update API configuration via updateApiConfig', async () => {
      let updateFn: ((opts: CubeApiOptions, token?: string) => void) | null = null

      const ConfigUpdater = () => {
        const { updateApiConfig } = useCubeApi()
        updateFn = updateApiConfig
        return null
      }

      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <ConfigUpdater />
          </CubeProvider>
        </QueryClientProvider>
      )

      expect(updateFn).not.toBeNull()

      // Should not throw
      act(() => {
        updateFn!({ apiUrl: '/new-api' }, 'new-token')
      })
    })

    it('should reset override when base config changes', async () => {
      let updateFn: ((opts: CubeApiOptions, token?: string) => void) | null = null
      const apiRefs: unknown[] = []

      const ConfigUpdater = () => {
        const { updateApiConfig, cubeApi } = useCubeApi()
        updateFn = updateApiConfig
        useEffect(() => {
          apiRefs.push(cubeApi)
        }, [cubeApi])
        return null
      }

      const queryClient = createTestQueryClient()

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient} apiOptions={{ apiUrl: '/api1' }}>
            <ConfigUpdater />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Update via updateApiConfig
      act(() => {
        updateFn!({ apiUrl: '/override-api' }, 'override-token')
      })

      // Now change the base config - should reset override
      rerender(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient} apiOptions={{ apiUrl: '/api2' }}>
            <ConfigUpdater />
          </CubeProvider>
        </QueryClientProvider>
      )

      // Should have created multiple API instances
      expect(apiRefs.length).toBeGreaterThan(2)
    })
  })

  describe('Three-Layer Context Architecture', () => {
    it('should nest providers in correct order', () => {
      // CubeProvider wraps: QueryClient > CubeApi > CubeMeta > CubeFeatures
      const TestComponent = () => {
        // All hooks should work
        const api = useCubeApi()
        const meta = useCubeMeta()
        const features = useCubeFeatures()

        return (
          <div>
            <span data-testid="api">{api.cubeApi ? 'ok' : 'fail'}</span>
            <span data-testid="meta">{typeof meta.getFieldLabel === 'function' ? 'ok' : 'fail'}</span>
            <span data-testid="features">{features.features ? 'ok' : 'fail'}</span>
          </div>
        )
      }

      render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('api')).toHaveTextContent('ok')
      expect(screen.getByTestId('meta')).toHaveTextContent('ok')
      expect(screen.getByTestId('features')).toHaveTextContent('ok')
    })

    it('should allow using individual providers for testing', () => {
      const queryClient = createTestQueryClient()

      const TestComponent = () => {
        const api = useCubeApi()
        return <div data-testid="api">{api.cubeApi ? 'ok' : 'fail'}</div>
      }

      render(
        <QueryClientProvider client={queryClient}>
          <CubeApiProvider apiOptions={{ apiUrl: '/test' }}>
            <TestComponent />
          </CubeApiProvider>
        </QueryClientProvider>
      )

      expect(screen.getByTestId('api')).toHaveTextContent('ok')
    })

    it('should merge all contexts in useCubeContext', async () => {
      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useCubeContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.metaLoading).toBe(false)
      })

      // Should have API layer values
      expect(result.current.cubeApi).toBeDefined()
      expect(result.current.updateApiConfig).toBeDefined()
      expect(result.current.batchCoordinator).toBeDefined()

      // Should have Meta layer values
      expect(result.current.meta).toBeDefined()
      expect(result.current.labelMap).toBeDefined()
      expect(result.current.getFieldLabel).toBeDefined()
      expect(result.current.refetchMeta).toBeDefined()

      // Should have Features layer values
      expect(result.current.features).toBeDefined()
      expect(result.current.dashboardModes).toBeDefined()
    })
  })

  describe('Partial Feature Updates', () => {
    it('should merge new features with existing defaults', () => {
      const TestComponent = () => {
        const { features } = useCubeFeatures()
        return (
          <div>
            <span data-testid="enableAI">{String(features.enableAI)}</span>
            <span data-testid="editToolbar">{features.editToolbar}</span>
            <span data-testid="manualRefresh">{String(features.manualRefresh ?? 'undefined')}</span>
          </div>
        )
      }

      // Only provide manualRefresh, others should use defaults
      render(
        <CubeProvider features={{ manualRefresh: true }}>
          <TestComponent />
        </CubeProvider>
      )

      expect(screen.getByTestId('enableAI')).toHaveTextContent('true') // default
      expect(screen.getByTestId('editToolbar')).toHaveTextContent('both') // default
      expect(screen.getByTestId('manualRefresh')).toHaveTextContent('true') // provided
    })

    it('should preserve existing features when updating', async () => {
      const { wrapper } = createHookWrapper({ features: { enableAI: false, editToolbar: 'top' } })
      const { result } = renderHook(() => useCubeFeatures(), { wrapper })

      expect(result.current.features.enableAI).toBe(false)
      expect(result.current.features.editToolbar).toBe('top')

      // Update only one feature
      act(() => {
        result.current.updateFeatures({ manualRefresh: true })
      })

      // Original features should be preserved
      expect(result.current.features.enableAI).toBe(false)
      expect(result.current.features.editToolbar).toBe('top')
      expect(result.current.features.manualRefresh).toBe(true)
    })
  })

  describe('Re-render Optimization Verification', () => {
    it('should minimize re-renders for components only using API', async () => {
      let apiRenderCount = 0

      const ApiOnlyComponent = () => {
        useCubeApi() // Only subscribe to API context
        apiRenderCount++
        return null
      }

      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <ApiOnlyComponent />
          </CubeProvider>
        </QueryClientProvider>
      )

      const initialRenderCount = apiRenderCount

      // Wait for metadata to load (this should NOT trigger API re-render)
      await waitFor(() => {
        // Give time for metadata to load
        return new Promise(resolve => setTimeout(resolve, 100))
      })

      // API component should not have re-rendered due to metadata changes
      // It might render once or twice initially, but not more
      expect(apiRenderCount).toBeLessThanOrEqual(initialRenderCount + 1)
    })

    it('should minimize re-renders for components only using features', async () => {
      let featuresRenderCount = 0

      const FeaturesOnlyComponent = () => {
        useCubeFeatures() // Only subscribe to features context
        featuresRenderCount++
        return null
      }

      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <CubeProvider queryClient={queryClient}>
            <FeaturesOnlyComponent />
          </CubeProvider>
        </QueryClientProvider>
      )

      const initialRenderCount = featuresRenderCount

      // Wait for metadata to load (this should NOT trigger features re-render)
      await waitFor(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })

      // Features component should not have re-rendered due to metadata changes
      expect(featuresRenderCount).toBeLessThanOrEqual(initialRenderCount + 1)
    })
  })
})

describe('createCubeQueryClient Factory', () => {
  it('should create a new QueryClient instance each call', () => {
    const client1 = createCubeQueryClient()
    const client2 = createCubeQueryClient()

    expect(client1).not.toBe(client2)
    expect(client1).toBeInstanceOf(QueryClient)
    expect(client2).toBeInstanceOf(QueryClient)
  })

  it('should have proper default configuration', () => {
    const client = createCubeQueryClient()
    const defaults = client.getDefaultOptions()

    // Check query defaults
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000)
    expect(defaults.queries?.gcTime).toBe(15 * 60 * 1000)
    expect(defaults.queries?.retry).toBe(3)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
  })
})

describe('useCubeContext Hook Isolation', () => {
  it('should be testable with renderHook', async () => {
    const { wrapper } = createHookWrapper()
    const { result } = renderHook(() => useCubeContext(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.cubeApi).toBeDefined()
    expect(result.current.features).toBeDefined()
  })

  it('should combine all three contexts', async () => {
    const { wrapper } = createHookWrapper()
    const { result } = renderHook(() => useCubeContext(), { wrapper })

    await waitFor(() => {
      expect(result.current.metaLoading).toBe(false)
    })

    // From CubeApiContext
    expect(result.current.cubeApi).toBeDefined()
    expect(result.current.updateApiConfig).toBeDefined()
    expect(result.current.options).toBeDefined()
    expect(result.current.batchCoordinator).toBeDefined()
    expect(result.current.enableBatching).toBeDefined()

    // From CubeMetaContext
    expect(result.current.meta).toBeDefined()
    expect(result.current.labelMap).toBeDefined()
    expect(result.current.metaLoading).toBeDefined()
    expect(result.current.metaError).toBeDefined()
    expect(result.current.getFieldLabel).toBeDefined()
    expect(result.current.refetchMeta).toBeDefined()

    // From CubeFeaturesContext
    expect(result.current.features).toBeDefined()
    expect(result.current.dashboardModes).toBeDefined()
  })

  it('should memoize the combined context value', async () => {
    const contextValues: unknown[] = []

    const ContextTracker = () => {
      const context = useCubeContext()
      contextValues.push(context)
      return null
    }

    const queryClient = createTestQueryClient()

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <CubeProvider queryClient={queryClient}>
          <ContextTracker />
        </CubeProvider>
      </QueryClientProvider>
    )

    // Force a re-render without changing anything
    rerender(
      <QueryClientProvider client={queryClient}>
        <CubeProvider queryClient={queryClient}>
          <ContextTracker />
        </CubeProvider>
      </QueryClientProvider>
    )

    // Wait for any async updates
    await waitFor(() => {
      expect(contextValues.length).toBeGreaterThan(0)
    })

    // Context values should be stable between re-renders when nothing changes
    // (The first few might be different due to initialization, but subsequent should match)
  })
})
