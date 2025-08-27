/**
 * Tests for CubeProvider and useCubeContext
 * Covers context management, API config updates, dynamic client creation, feature flags, and error boundaries
 */

import React from 'react'
import { render, renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CubeProvider, useCubeContext } from '../../src/client/providers/CubeProvider'
import { createCubeClient } from '../../src/client/client/CubeClient'
import { useCubeMeta } from '../../src/client/hooks/useCubeMeta'
import type { CubeApiOptions, FeaturesConfig } from '../../src/client/types'

// Mock the CubeClient creation and useCubeMeta hook
vi.mock('../../src/client/client/CubeClient', () => ({
  createCubeClient: vi.fn()
}))

vi.mock('../../src/client/hooks/useCubeMeta', () => ({
  useCubeMeta: vi.fn(() => ({
    meta: { cubes: [] },
    labelMap: {},
    loading: false,
    error: null,
    getFieldLabel: (field: string) => field,
    refetch: vi.fn()
  }))
}))

const mockCreateCubeClient = createCubeClient as any
const mockUseCubeMeta = vi.mocked(useCubeMeta)

describe('CubeProvider', () => {
  let mockCubeClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockCubeClient = {
      load: vi.fn(),
      sql: vi.fn(),
      meta: vi.fn()
    }

    mockCreateCubeClient.mockReturnValue(mockCubeClient)
  })

  describe('provider creation', () => {
    it('should create provider with default configuration', () => {
      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="cube-api">{context.cubeApi ? 'present' : 'missing'}</div>
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('cube-api')).toHaveTextContent('present')
      expect(mockCreateCubeClient).toHaveBeenCalledWith(undefined, { apiUrl: '/cubejs-api/v1' })
    })

    it('should create provider with custom API options', () => {
      const apiOptions: CubeApiOptions = {
        apiUrl: 'https://api.example.com/cube',
        headers: { 'X-Custom': 'header' }
      }

      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="test">rendered</div>
      }

      render(
        <CubeProvider apiOptions={apiOptions} token="test-token">
          <TestComponent />
        </CubeProvider>
      )

      expect(mockCreateCubeClient).toHaveBeenCalledWith('test-token', apiOptions)
    })

    it('should use provided cubeApi client directly', () => {
      const providedClient = {
        load: vi.fn(),
        sql: vi.fn(),
        meta: vi.fn()
      }

      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="client-match">{context.cubeApi === providedClient ? 'match' : 'no-match'}</div>
      }

      const { getByTestId } = render(
        <CubeProvider cubeApi={providedClient}>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('client-match')).toHaveTextContent('match')
      expect(mockCreateCubeClient).not.toHaveBeenCalled()
    })
  })

  describe('context values', () => {
    it('should provide all required context values', () => {
      const TestComponent = () => {
        const context = useCubeContext()
        
        return (
          <div>
            <div data-testid="cube-api">{context.cubeApi ? 'present' : 'missing'}</div>
            <div data-testid="meta">{context.meta ? 'present' : 'missing'}</div>
            <div data-testid="label-map">{typeof context.labelMap === 'object' ? 'object' : 'not-object'}</div>
            <div data-testid="meta-loading">{context.metaLoading ? 'true' : 'false'}</div>
            <div data-testid="meta-error">{context.metaError ? 'present' : 'null'}</div>
            <div data-testid="get-field-label">{typeof context.getFieldLabel === 'function' ? 'function' : 'not-function'}</div>
            <div data-testid="refetch-meta">{typeof context.refetchMeta === 'function' ? 'function' : 'not-function'}</div>
            <div data-testid="update-api-config">{typeof context.updateApiConfig === 'function' ? 'function' : 'not-function'}</div>
            <div data-testid="features">{context.features ? 'present' : 'missing'}</div>
          </div>
        )
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('cube-api')).toHaveTextContent('present')
      expect(getByTestId('meta')).toHaveTextContent('present')
      expect(getByTestId('label-map')).toHaveTextContent('object')
      expect(getByTestId('meta-loading')).toHaveTextContent('false')
      expect(getByTestId('meta-error')).toHaveTextContent('null')
      expect(getByTestId('get-field-label')).toHaveTextContent('function')
      expect(getByTestId('refetch-meta')).toHaveTextContent('function')
      expect(getByTestId('update-api-config')).toHaveTextContent('function')
      expect(getByTestId('features')).toHaveTextContent('present')
    })

    it('should pass through custom options', () => {
      const customOptions = { skip: true, resetResultSetOnChange: false }

      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="options">{JSON.stringify(context.options)}</div>
      }

      const { getByTestId } = render(
        <CubeProvider options={customOptions}>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('options')).toHaveTextContent(JSON.stringify(customOptions))
    })
  })

  describe('features configuration', () => {
    it('should have AI enabled by default', () => {
      const TestComponent = () => {
        const context = useCubeContext()
        return (
          <div>
            <div data-testid="enable-ai">{context.features.enableAI ? 'true' : 'false'}</div>
            <div data-testid="ai-endpoint">{context.features.aiEndpoint}</div>
          </div>
        )
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('enable-ai')).toHaveTextContent('true')
      expect(getByTestId('ai-endpoint')).toHaveTextContent('/api/ai/generate')
    })

    it('should use custom features configuration', () => {
      const customFeatures: FeaturesConfig = {
        enableAI: false,
        aiEndpoint: '/custom/ai/endpoint'
      }

      const TestComponent = () => {
        const context = useCubeContext()
        return (
          <div>
            <div data-testid="enable-ai">{context.features.enableAI ? 'true' : 'false'}</div>
            <div data-testid="ai-endpoint">{context.features.aiEndpoint}</div>
          </div>
        )
      }

      const { getByTestId } = render(
        <CubeProvider features={customFeatures}>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('enable-ai')).toHaveTextContent('false')
      expect(getByTestId('ai-endpoint')).toHaveTextContent('/custom/ai/endpoint')
    })
  })

  describe('dynamic API configuration', () => {
    it('should update API configuration and recreate client', () => {
      const TestComponent = () => {
        const context = useCubeContext()
        
        const handleUpdate = () => {
          context.updateApiConfig(
            { apiUrl: 'https://new-api.example.com' },
            'new-token'
          )
        }

        return <button data-testid="update-btn" onClick={handleUpdate}>Update</button>
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      // Initially called with default config
      expect(mockCreateCubeClient).toHaveBeenCalledWith(undefined, { apiUrl: '/cubejs-api/v1' })

      // Click update button
      act(() => {
        getByTestId('update-btn').click()
      })

      // Should be called again with new config
      expect(mockCreateCubeClient).toHaveBeenCalledWith('new-token', { apiUrl: 'https://new-api.example.com' })
      expect(mockCreateCubeClient).toHaveBeenCalledTimes(2)
    })

    it('should not recreate client when using provided cubeApi', () => {
      const providedClient = { load: vi.fn(), sql: vi.fn(), meta: vi.fn() }

      const TestComponent = () => {
        const context = useCubeContext()
        
        const handleUpdate = () => {
          context.updateApiConfig({ apiUrl: 'https://should-not-recreate.com' })
        }

        return <button data-testid="update-btn" onClick={handleUpdate}>Update</button>
      }

      const { getByTestId } = render(
        <CubeProvider cubeApi={providedClient}>
          <TestComponent />
        </CubeProvider>
      )

      act(() => {
        getByTestId('update-btn').click()
      })

      // Should not create any new clients when using provided client
      expect(mockCreateCubeClient).not.toHaveBeenCalled()
    })
  })

  describe('client recreation behavior', () => {
    it('should recreate client when configuration dependencies change', () => {
      let updateConfig: any

      const TestComponent = () => {
        const context = useCubeContext()
        updateConfig = context.updateApiConfig
        return <div>test</div>
      }

      const { rerender } = render(
        <CubeProvider apiOptions={{ apiUrl: '/initial' }} token="initial-token">
          <TestComponent />
        </CubeProvider>
      )

      expect(mockCreateCubeClient).toHaveBeenCalledWith('initial-token', { apiUrl: '/initial' })

      // Update via context method
      act(() => {
        updateConfig({ apiUrl: '/updated' }, 'updated-token')
      })

      expect(mockCreateCubeClient).toHaveBeenCalledWith('updated-token', { apiUrl: '/updated' })
      expect(mockCreateCubeClient).toHaveBeenCalledTimes(2)
    })

    it('should handle client recreation when initial props change', () => {
      const TestComponent = () => <div>test</div>

      const { rerender } = render(
        <CubeProvider apiOptions={{ apiUrl: '/v1' }} token="token1">
          <TestComponent />
        </CubeProvider>
      )

      expect(mockCreateCubeClient).toHaveBeenCalledWith('token1', { apiUrl: '/v1' })

      rerender(
        <CubeProvider apiOptions={{ apiUrl: '/v2' }} token="token2">
          <TestComponent />
        </CubeProvider>
      )

      // The CubeProvider should recreate the client with new props
      expect(mockCreateCubeClient).toHaveBeenNthCalledWith(2, 'token2', { apiUrl: '/v2' })
      expect(mockCreateCubeClient).toHaveBeenCalledTimes(2)
    })
  })

  describe('metadata integration', () => {
    it('should call useCubeMeta with the cube client', () => {
      render(
        <CubeProvider>
          <div>test</div>
        </CubeProvider>
      )

      expect(mockUseCubeMeta).toHaveBeenCalledWith(mockCubeClient)
    })

    it('should provide metadata values from useCubeMeta hook', () => {
      const mockMeta = { cubes: [{ name: 'TestCube' }] }
      const mockLabelMap = { 'TestCube.field': 'Test Field' }
      const mockGetFieldLabel = vi.fn((field) => mockLabelMap[field] || field)
      const mockRefetch = vi.fn()

      mockUseCubeMeta.mockReturnValue({
        meta: mockMeta,
        labelMap: mockLabelMap,
        loading: false,
        error: null,
        getFieldLabel: mockGetFieldLabel,
        refetch: mockRefetch
      })

      const TestComponent = () => {
        const context = useCubeContext()
        return (
          <div>
            <div data-testid="meta">{JSON.stringify(context.meta)}</div>
            <div data-testid="label-map">{JSON.stringify(context.labelMap)}</div>
            <div data-testid="meta-loading">{context.metaLoading ? 'true' : 'false'}</div>
            <div data-testid="meta-error">{context.metaError || 'null'}</div>
            <div data-testid="field-label">{context.getFieldLabel('TestCube.field')}</div>
          </div>
        )
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('meta')).toHaveTextContent(JSON.stringify(mockMeta))
      expect(getByTestId('label-map')).toHaveTextContent(JSON.stringify(mockLabelMap))
      expect(getByTestId('meta-loading')).toHaveTextContent('false')
      expect(getByTestId('meta-error')).toHaveTextContent('null')
      expect(getByTestId('field-label')).toHaveTextContent('Test Field')
    })

    it('should handle metadata loading state', () => {
      mockUseCubeMeta.mockReturnValue({
        meta: null,
        labelMap: {},
        loading: true,
        error: null,
        getFieldLabel: (field: string) => field,
        refetch: vi.fn()
      })

      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="loading">{context.metaLoading ? 'loading' : 'not-loading'}</div>
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('loading')).toHaveTextContent('loading')
    })

    it('should handle metadata error state', () => {
      mockUseCubeMeta.mockReturnValue({
        meta: null,
        labelMap: {},
        loading: false,
        error: 'Failed to load metadata',
        getFieldLabel: (field: string) => field,
        refetch: vi.fn()
      })

      const TestComponent = () => {
        const context = useCubeContext()
        return <div data-testid="error">{context.metaError || 'no-error'}</div>
      }

      const { getByTestId } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      expect(getByTestId('error')).toHaveTextContent('Failed to load metadata')
    })
  })

  describe('error handling', () => {
    it('should throw error when useCubeContext is used outside provider', () => {
      const TestComponent = () => {
        useCubeContext() // This should throw
        return <div>test</div>
      }

      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useCubeContext must be used within a CubeProvider')

      console.error = originalError
    })
  })

  describe('context stability', () => {
    it('should provide stable cubeApi when dependencies do not change', () => {
      let cubeApiInstances: any[] = []

      const TestComponent = () => {
        const context = useCubeContext()
        cubeApiInstances.push(context.cubeApi)
        return <div>test</div>
      }

      const { rerender } = render(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      rerender(
        <CubeProvider>
          <TestComponent />
        </CubeProvider>
      )

      // CubeApi should be stable between rerenders when dependencies don't change
      expect(cubeApiInstances).toHaveLength(2)
      expect(cubeApiInstances[0]).toBe(cubeApiInstances[1])
    })

    it('should update context when dependencies change', () => {
      let contextValues: any[] = []

      const TestComponent = () => {
        const context = useCubeContext()
        contextValues.push(context)
        return <div>test</div>
      }

      const { rerender } = render(
        <CubeProvider token="token1">
          <TestComponent />
        </CubeProvider>
      )

      rerender(
        <CubeProvider token="token2">
          <TestComponent />
        </CubeProvider>
      )

      // Context should change when token changes
      expect(contextValues).toHaveLength(2)
      expect(contextValues[0]).not.toBe(contextValues[1])
    })
  })
})

describe('useCubeContext hook', () => {
  it('should be testable in isolation using renderHook', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <CubeProvider>{children}</CubeProvider>
    )

    const { result } = renderHook(() => useCubeContext(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.cubeApi).toBeDefined()
    expect(typeof result.current.updateApiConfig).toBe('function')
    expect(typeof result.current.getFieldLabel).toBe('function')
  })
})