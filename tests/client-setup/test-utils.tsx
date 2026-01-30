import React, { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '../../src/client/providers/CubeProvider'

/**
 * Creates a fresh QueryClient configured for testing.
 * Disables retries and caching to make tests deterministic.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,           // Don't retry failed queries in tests
        gcTime: 0,              // Immediately garbage collect
        staleTime: 0,           // Always consider data stale
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * API URL for the CubeProvider
   * @default '/api/cubejs-api/v1'
   */
  apiUrl?: string

  /**
   * Auth token for the CubeProvider
   */
  token?: string

  /**
   * Custom QueryClient instance for the test
   */
  queryClient?: QueryClient

  /**
   * Feature flags to enable
   */
  features?: Record<string, boolean>
}

/**
 * Renders a React element wrapped with all necessary providers for testing.
 *
 * Includes:
 * - QueryClientProvider (TanStack Query)
 * - CubeProvider (API client, metadata, features)
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen, userEvent } from '../client-setup/test-utils'
 *
 * it('should render component', async () => {
 *   const user = userEvent.setup()
 *   renderWithProviders(<MyComponent />)
 *
 *   await user.click(screen.getByRole('button', { name: /submit/i }))
 *   expect(screen.getByText('Success')).toBeInTheDocument()
 * })
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    apiUrl = '/api/cubejs-api/v1',
    token,
    queryClient = createTestQueryClient(),
    features,
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <CubeProvider
          apiOptions={{ apiUrl }}
          token={token}
          features={features}
          queryClient={queryClient}
          enableBatching={false}  // Disable batching in tests for more predictable behavior
        >
          {children}
        </CubeProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

/**
 * Renders a React element with only QueryClientProvider.
 * Use this for testing hooks that don't need CubeProvider context.
 */
export function renderWithQueryClient(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: Omit<RenderWithProvidersOptions, 'apiUrl' | 'token' | 'features'> = {}
) {
  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

/**
 * Creates a wrapper component for testing hooks with renderHook.
 *
 * @example
 * ```tsx
 * import { renderHook, waitFor } from '@testing-library/react'
 * import { createHookWrapper } from '../client-setup/test-utils'
 *
 * it('should fetch data', async () => {
 *   const wrapper = createHookWrapper()
 *   const { result } = renderHook(() => useCubeLoadQuery(query), { wrapper })
 *
 *   await waitFor(() => expect(result.current.data).toBeDefined())
 * })
 * ```
 */
export function createHookWrapper(options: Omit<RenderWithProvidersOptions, 'queryClient'> = {}) {
  const queryClient = createTestQueryClient()

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={{ apiUrl: options.apiUrl || '/api/cubejs-api/v1' }}
        token={options.token}
        features={options.features}
        queryClient={queryClient}
        enableBatching={false}  // Disable batching in tests for more predictable behavior
      >
        {children}
      </CubeProvider>
    </QueryClientProvider>
  )

  return { wrapper, queryClient }
}

/**
 * Creates a wrapper for hooks that only need QueryClient (not CubeProvider).
 */
export function createQueryClientWrapper() {
  const queryClient = createTestQueryClient()

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return { wrapper, queryClient }
}

// Re-export everything from testing-library for convenience
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Re-export MSW utilities for test customization
export { server } from './msw-server'
export {
  handlers,
  mockMeta,
  mockQueryData,
  createLoadHandler,
  createErrorHandler,
  createMetaHandler,
} from './msw-handlers'
