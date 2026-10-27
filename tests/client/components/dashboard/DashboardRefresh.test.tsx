/**
 * Dashboard interval refresh (issue #271, Phase 0b), rendered through
 * DashboardGrid with fake timers.
 *
 * AnalyticsPortlet is replaced by a stub whose imperative `refresh` records
 * calls, so these tests observe exactly what the dashboard timer and the
 * refresh button ask a portlet to do. The stub also reports freshness the way
 * the real portlet does, to drive the header indicator.
 */

import React, { useEffect, useImperativeHandle } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, fireEvent, act, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DashboardGrid from '../../../../src/client/components/DashboardGrid'
import { DashboardStoreProvider } from '../../../../src/client/stores/dashboardStore'
import type { AnalyticsPortletProps, DashboardConfig, FeaturesConfig, PortletConfig, PortletFreshness } from '../../../../src/client/types'
import type { DashboardDisplayMode } from '../../../../src/client/hooks/useResponsiveDashboard'

let mockFeatures: FeaturesConfig = {}

vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: mockFeatures,
    batchCoordinator: null,
    enableBatching: false,
    dashboardModes: ['grid', 'mobile']
  }))
}))

vi.mock('../../../../src/client/providers/CubeFeaturesProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: mockFeatures,
    dashboardModes: ['grid', 'mobile'],
    updateFeatures: vi.fn()
  })),
  CubeFeaturesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../../../../src/client/providers/CubeApiProvider', () => ({
  useCubeApi: vi.fn(() => ({
    cubeApi: { load: vi.fn(), meta: vi.fn(), sql: vi.fn() },
    options: {},
    updateConfig: vi.fn(),
  })),
  CubeApiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('react-grid-layout', () => ({
  default: (props: { children: React.ReactNode }) => <div data-testid="grid-layout">{props.children}</div>,
  verticalCompactor: { compact: () => [] }
}))

const mockResponsiveState = {
  containerRef: vi.fn(),
  containerWidth: 1200,
  displayMode: 'desktop' as DashboardDisplayMode,
  scaleFactor: 1,
  isEditable: true,
  designWidth: 1200
}
vi.mock('../../../../src/client/hooks/useResponsiveDashboard', () => ({
  useResponsiveDashboard: () => mockResponsiveState
}))

vi.mock('../../../../src/client/providers/ScrollContainerContext', () => ({
  ScrollContainerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Portlet stub: records refresh calls and reports freshness from `freshnessByTitle`
const refreshCalls: Array<{ portlet: string; options: unknown }> = []
const intervalRefreshByTitle: Record<string, boolean | undefined> = {}
const freshnessByTitle: Record<string, PortletFreshness> = {}

vi.mock('../../../../src/client/components/AnalyticsPortlet', () => ({
  default: React.forwardRef<unknown, AnalyticsPortletProps>(function PortletStub(props, ref) {
    intervalRefreshByTitle[props.title ?? ''] = props.hasIntervalRefresh
    useImperativeHandle(ref, () => ({
      refresh: (options?: unknown) => refreshCalls.push({ portlet: props.title ?? '', options }),
      getViewState: () => ({})
    }))
    const freshness = freshnessByTitle[props.title ?? '']
    const { onFreshnessChange } = props
    useEffect(() => {
      if (freshness) onFreshnessChange?.(freshness)
    }, [freshness, onFreshnessChange])
    return <div data-testid="analytics-portlet" />
  })
}))

vi.mock('../../../../src/client/components/PortletFilterConfigModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/PortletAnalysisModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/DebugModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/ColorPaletteSelector', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/DashboardFilterPanel', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/ScaledGridWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))
vi.mock('../../../../src/client/components/MobileStackedLayout', () => ({ default: () => null }))

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <DashboardStoreProvider>{children}</DashboardStoreProvider>
    </QueryClientProvider>
  )
}

function portlet(id: string, refresh?: PortletConfig['refresh']): PortletConfig {
  return {
    id,
    title: id,
    query: JSON.stringify({ measures: ['Test.count'] }),
    chartType: 'bar',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    ...(refresh ? { refresh } : {})
  }
}

function callsFor(name: string) {
  return refreshCalls.filter(call => call.portlet === name)
}

async function advanceSeconds(seconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000)
  })
}

describe('Dashboard interval refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    refreshCalls.length = 0
    for (const key of Object.keys(freshnessByTitle)) delete freshnessByTitle[key]
    mockFeatures = { refresh: { enabled: true } }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs one timer per interval group, each tick refreshing with max-age = interval', async () => {
    const config: DashboardConfig = {
      layoutMode: 'grid',
      refresh: { intervalSeconds: 30 },
      portlets: [portlet('a'), portlet('b'), portlet('c', { intervalSeconds: 10 })]
    }
    render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

    await advanceSeconds(10)
    expect(callsFor('c')).toEqual([{ portlet: 'c', options: { maxAgeSeconds: 10 } }])
    expect(callsFor('a')).toHaveLength(0)

    await advanceSeconds(20)
    expect(callsFor('c')).toHaveLength(3)
    expect(callsFor('a')).toEqual([{ portlet: 'a', options: { maxAgeSeconds: 30 } }])
    expect(callsFor('b')).toEqual([{ portlet: 'b', options: { maxAgeSeconds: 30 } }])
  })

  it('stops ticking in edit mode', async () => {
    const config: DashboardConfig = { layoutMode: 'grid', refresh: { intervalSeconds: 10 }, portlets: [portlet('a')] }
    render(<DashboardGrid config={config} editable={true} />, { wrapper: TestWrapper })

    await advanceSeconds(10)
    expect(callsFor('a')).toHaveLength(1)

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })
    await advanceSeconds(60)
    expect(callsFor('a')).toHaveLength(1)
  })

  it('stops ticking while the dashboard is paused from the toolbar, and resumes', async () => {
    const config: DashboardConfig = { layoutMode: 'grid', refresh: { intervalSeconds: 10 }, portlets: [portlet('a')] }
    // Read-only dashboards still get the toolbar for the pause toggle
    render(<DashboardGrid config={config} editable={false} />, { wrapper: TestWrapper })

    const toggle = screen.getByTestId('dashboard-refresh-pause')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await act(async () => {
      fireEvent.click(toggle)
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await advanceSeconds(60)
    expect(refreshCalls).toHaveLength(0)

    await act(async () => {
      fireEvent.click(toggle)
    })
    await advanceSeconds(10)
    expect(callsFor('a')).toHaveLength(1)
  })

  it('skips ticks while the tab is hidden when pauseWhenHidden is set', async () => {
    const config: DashboardConfig = {
      layoutMode: 'grid',
      portlets: [portlet('a', { intervalSeconds: 10, pauseWhenHidden: true }), portlet('b', { intervalSeconds: 10 })]
    }
    render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    try {
      await advanceSeconds(10)
      expect(callsFor('a')).toHaveLength(0)
      expect(callsFor('b')).toHaveLength(1)
    } finally {
      visibility.mockRestore()
    }

    await advanceSeconds(10)
    expect(callsFor('a')).toHaveLength(1)
  })

  it('tells each chart whether it refreshes on an interval', async () => {
    const config: DashboardConfig = {
      layoutMode: 'grid',
      portlets: [portlet('a', { intervalSeconds: 30 }), portlet('b')]
    }
    render(<DashboardGrid config={config} />, { wrapper: TestWrapper })
    expect(intervalRefreshByTitle).toMatchObject({ a: true, b: false })
  })

  it('keeps the refresh button on the same path (shift+click is a bust)', async () => {
    const config: DashboardConfig = { layoutMode: 'grid', portlets: [portlet('a')] }
    render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

    const refreshButton = screen.getByTitle(/Shift\+click to bypass cache/)
    await act(async () => {
      fireEvent.click(refreshButton, { shiftKey: true })
    })
    expect(callsFor('a')).toEqual([{ portlet: 'a', options: { bustCache: true } }])
  })

  describe('freshness indicator', () => {
    it('shows computed-at, and the updating pulse while fetching', async () => {
      vi.setSystemTime(new Date('2026-10-23T10:00:30Z'))
      freshnessByTitle.a = { computedAt: '2026-10-23T10:00:00Z', isFetching: true }
      const config: DashboardConfig = { layoutMode: 'grid', refresh: { intervalSeconds: 30 }, portlets: [portlet('a')] }
      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(screen.getByTestId('portlet-freshness-age')).toHaveAttribute('data-computed-at', '2026-10-23T10:00:00Z')
      expect(screen.getByTestId('portlet-freshness-age').textContent).toBe('30s ago')
      expect(screen.getByTestId('portlet-freshness-dot')).toHaveAttribute('data-updating', 'true')
    })

    it('turns stale once computed-at is older than two intervals', async () => {
      vi.setSystemTime(new Date('2026-10-23T10:00:50Z'))
      freshnessByTitle.a = { computedAt: '2026-10-23T10:00:00Z', isFetching: false }
      const config: DashboardConfig = { layoutMode: 'grid', portlets: [portlet('a', { intervalSeconds: 30 })] }
      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(screen.getByTestId('portlet-freshness')).toHaveAttribute('data-state', 'fresh')

      // 10:01:05 is 65 s after computed-at, past two 30 s intervals
      await advanceSeconds(15)
      expect(screen.getByTestId('portlet-freshness')).toHaveAttribute('data-state', 'stale')
    })

    it('shows paused instead of stale while the dashboard is paused', async () => {
      vi.setSystemTime(new Date('2026-10-23T10:05:00Z'))
      freshnessByTitle.a = { computedAt: '2026-10-23T10:00:00Z', isFetching: false }
      const config: DashboardConfig = { layoutMode: 'grid', refresh: { intervalSeconds: 30 }, portlets: [portlet('a')] }
      render(<DashboardGrid config={config} editable={false} />, { wrapper: TestWrapper })
      expect(screen.getByTestId('portlet-freshness')).toHaveAttribute('data-state', 'stale')

      await act(async () => {
        fireEvent.click(screen.getByTestId('dashboard-refresh-pause'))
      })
      expect(screen.getByTestId('portlet-freshness')).toHaveAttribute('data-state', 'paused')
    })

    it('shows no indicator and does not tick when the feature is off', async () => {
      mockFeatures = {}
      freshnessByTitle.a = { computedAt: '2026-10-23T10:00:00Z', isFetching: false }
      const config: DashboardConfig = { layoutMode: 'grid', refresh: { intervalSeconds: 30 }, portlets: [portlet('a')] }
      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(screen.queryByTestId('portlet-freshness')).toBeNull()
      await advanceSeconds(60)
      expect(refreshCalls).toHaveLength(0)
    })
  })
})
