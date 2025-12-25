/**
 * Tests for AnalyticsDashboard
 * Covers config rendering, filter merging, dirty state tracking, and save coordination
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AnalyticsDashboard from '../../src/client/components/AnalyticsDashboard'
import type { DashboardConfig, DashboardFilter, PortletConfig, CubeMeta } from '../../src/client/types'

// Mock CubeProvider context
vi.mock('../../src/client/providers/CubeProvider', () => ({
  useCubeContext: vi.fn(() => ({
    cubeApi: {},
    meta: { cubes: [] } as CubeMeta,
    labelMap: {},
    metaLoading: false,
    metaError: null,
    getFieldLabel: (field: string) => field,
    refetchMeta: vi.fn(),
    updateApiConfig: vi.fn(),
    features: {}
  }))
}))

// Mock DashboardGrid to capture props without rendering full grid
let capturedDashboardGridProps: any = null
vi.mock('../../src/client/components/DashboardGrid', () => ({
  default: (props: any) => {
    capturedDashboardGridProps = props
    return <div data-testid="dashboard-grid" data-config={JSON.stringify(props.config)} />
  }
}))

// Mock colorPalettes
vi.mock('../../src/client/utils/colorPalettes', () => ({
  getColorPalette: vi.fn((name?: string) => ({
    name: name || 'default',
    colors: ['#8884d8', '#82ca9d'],
    gradient: ['#8884d8', '#82ca9d']
  }))
}))

// Helper to create test config
function createTestConfig(overrides: Partial<DashboardConfig> = {}): DashboardConfig {
  return {
    portlets: [
      {
        id: 'test-portlet-1',
        title: 'Test Portlet',
        query: JSON.stringify({ measures: ['Test.count'] }),
        chartType: 'bar',
        x: 0,
        y: 0,
        w: 6,
        h: 4
      } as PortletConfig
    ],
    ...overrides
  }
}

// Helper to create test filter
function createTestFilter(id: string, label: string): DashboardFilter {
  return {
    id,
    label,
    filter: {
      member: 'Test.field',
      operator: 'equals',
      values: ['value1']
    }
  }
}

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedDashboardGridProps = null
  })

  describe('config rendering', () => {
    it('should render dashboard with provided config', () => {
      const config = createTestConfig()

      render(<AnalyticsDashboard config={config} />)

      expect(capturedDashboardGridProps).not.toBeNull()
      expect(capturedDashboardGridProps.config).toEqual(config)
    })

    it('should pass editable prop to DashboardGrid', () => {
      const config = createTestConfig()

      render(<AnalyticsDashboard config={config} editable={true} />)

      expect(capturedDashboardGridProps.editable).toBe(true)
    })

    it('should default editable to false', () => {
      const config = createTestConfig()

      render(<AnalyticsDashboard config={config} />)

      expect(capturedDashboardGridProps.editable).toBe(false)
    })

    it('should resolve color palette from config', () => {
      const config = createTestConfig({ colorPalette: 'ocean' })

      render(<AnalyticsDashboard config={config} />)

      expect(capturedDashboardGridProps.colorPalette).toBeDefined()
      expect(capturedDashboardGridProps.colorPalette.name).toBe('ocean')
    })

    it('should pass loading component to DashboardGrid', () => {
      const config = createTestConfig()
      const loadingComponent = <div data-testid="custom-loader">Loading...</div>

      render(<AnalyticsDashboard config={config} loadingComponent={loadingComponent} />)

      expect(capturedDashboardGridProps.loadingComponent).toEqual(loadingComponent)
    })
  })

  describe('filter merging', () => {
    it('should use config filters when no prop filters provided', () => {
      const configFilters: DashboardFilter[] = [
        createTestFilter('filter-1', 'Config Filter 1'),
        createTestFilter('filter-2', 'Config Filter 2')
      ]
      const config = createTestConfig({ filters: configFilters })

      render(<AnalyticsDashboard config={config} />)

      expect(capturedDashboardGridProps.dashboardFilters).toEqual(configFilters)
    })

    it('should use prop filters when no config filters exist', () => {
      const propFilters: DashboardFilter[] = [
        createTestFilter('prop-filter-1', 'Prop Filter 1')
      ]
      const config = createTestConfig({ filters: [] })

      render(<AnalyticsDashboard config={config} dashboardFilters={propFilters} />)

      expect(capturedDashboardGridProps.dashboardFilters).toEqual(propFilters)
    })

    it('should merge prop filter values with config filter structure by ID', () => {
      const configFilters: DashboardFilter[] = [
        {
          id: 'shared-filter',
          label: 'Config Label',
          isUniversalTime: true,
          filter: {
            member: 'Test.field',
            operator: 'equals',
            values: ['config-value']
          }
        }
      ]
      const propFilters: DashboardFilter[] = [
        {
          id: 'shared-filter',
          label: 'Prop Label',
          filter: {
            member: 'Test.field',
            operator: 'equals',
            values: ['prop-value']
          }
        }
      ]
      const config = createTestConfig({ filters: configFilters })

      render(<AnalyticsDashboard config={config} dashboardFilters={propFilters} />)

      const mergedFilters = capturedDashboardGridProps.dashboardFilters
      expect(mergedFilters).toHaveLength(1)
      // Should preserve config metadata (label, isUniversalTime)
      expect(mergedFilters[0].label).toBe('Config Label')
      expect(mergedFilters[0].isUniversalTime).toBe(true)
      // Should use prop filter values
      expect(mergedFilters[0].filter.values).toEqual(['prop-value'])
    })

    it('should add new prop filters that do not exist in config', () => {
      const configFilters: DashboardFilter[] = [
        createTestFilter('config-filter', 'Config Filter')
      ]
      const propFilters: DashboardFilter[] = [
        createTestFilter('new-prop-filter', 'New Prop Filter')
      ]
      const config = createTestConfig({ filters: configFilters })

      render(<AnalyticsDashboard config={config} dashboardFilters={propFilters} />)

      const mergedFilters = capturedDashboardGridProps.dashboardFilters
      expect(mergedFilters).toHaveLength(2)
      expect(mergedFilters.find((f: DashboardFilter) => f.id === 'config-filter')).toBeDefined()
      expect(mergedFilters.find((f: DashboardFilter) => f.id === 'new-prop-filter')).toBeDefined()
    })
  })

  describe('dirty state tracking', () => {
    it('should not mark as dirty on initial render', async () => {
      const config = createTestConfig()
      const onDirtyStateChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          onDirtyStateChange={onDirtyStateChange}
        />
      )

      // Should not have been called during initial render
      expect(onDirtyStateChange).not.toHaveBeenCalled()
    })

    it('should mark as dirty when config changes from initial', async () => {
      const config = createTestConfig()
      const onDirtyStateChange = vi.fn()
      const onConfigChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onConfigChange={onConfigChange}
          onDirtyStateChange={onDirtyStateChange}
        />
      )

      // Simulate a config change via the passed callback
      const newConfig = {
        ...config,
        portlets: [...config.portlets, {
          id: 'new-portlet',
          title: 'New',
          query: '{}',
          chartType: 'bar' as const,
          x: 0, y: 0, w: 6, h: 4
        }]
      }

      // Call the onConfigChange handler that was passed to DashboardGrid
      capturedDashboardGridProps.onConfigChange(newConfig)

      await waitFor(() => {
        expect(onDirtyStateChange).toHaveBeenCalledWith(true)
      })
    })

    it('should call onConfigChange when config is modified', () => {
      const config = createTestConfig()
      const onConfigChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onConfigChange={onConfigChange}
        />
      )

      const newConfig = { ...config, colorPalette: 'newPalette' }
      capturedDashboardGridProps.onConfigChange(newConfig)

      expect(onConfigChange).toHaveBeenCalledWith(newConfig)
    })
  })

  describe('save coordination', () => {
    it('should not call onSave during initial load', async () => {
      const config = createTestConfig()
      const onSave = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onSave={onSave}
        />
      )

      // Try to call save immediately (before any actual changes)
      await capturedDashboardGridProps.onSave(config)

      // Should not save because hasConfigChangedFromInitial is false
      expect(onSave).not.toHaveBeenCalled()
    })

    it('should call onSave after config has been changed', async () => {
      const config = createTestConfig()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onDirtyStateChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onSave={onSave}
          onDirtyStateChange={onDirtyStateChange}
        />
      )

      // First change the config (this sets hasConfigChangedFromInitial = true)
      const newConfig = { ...config, colorPalette: 'ocean' }
      capturedDashboardGridProps.onConfigChange(newConfig)

      // Now save should work
      await capturedDashboardGridProps.onSave(newConfig)

      expect(onSave).toHaveBeenCalledWith(newConfig)
    })

    it('should set dirty state to true when save starts', async () => {
      const config = createTestConfig()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const onDirtyStateChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onSave={onSave}
          onDirtyStateChange={onDirtyStateChange}
        />
      )

      // Change config first
      const newConfig = { ...config, colorPalette: 'ocean' }
      capturedDashboardGridProps.onConfigChange(newConfig)

      // Clear the calls from config change
      onDirtyStateChange.mockClear()

      // Save
      await capturedDashboardGridProps.onSave(newConfig)

      // Should mark dirty true, then false after save completes
      expect(onDirtyStateChange).toHaveBeenCalledWith(true)
      expect(onDirtyStateChange).toHaveBeenCalledWith(false)
    })

    it('should keep dirty state true if save fails', async () => {
      const config = createTestConfig()
      const saveError = new Error('Save failed')
      const onSave = vi.fn().mockRejectedValue(saveError)
      const onDirtyStateChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onSave={onSave}
          onDirtyStateChange={onDirtyStateChange}
        />
      )

      // Change config first
      const newConfig = { ...config, colorPalette: 'ocean' }
      capturedDashboardGridProps.onConfigChange(newConfig)
      onDirtyStateChange.mockClear()

      // Save should throw
      await expect(capturedDashboardGridProps.onSave(newConfig)).rejects.toThrow('Save failed')

      // Should only have been called with true (not false since save failed)
      expect(onDirtyStateChange).toHaveBeenCalledWith(true)
      expect(onDirtyStateChange).not.toHaveBeenCalledWith(false)
    })
  })

  describe('dashboard filter changes', () => {
    it('should update config when filters change (no prop filters)', () => {
      const config = createTestConfig({ filters: [] })
      const onConfigChange = vi.fn()

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          onConfigChange={onConfigChange}
        />
      )

      const newFilters: DashboardFilter[] = [
        createTestFilter('new-filter', 'New Filter')
      ]

      capturedDashboardGridProps.onDashboardFiltersChange(newFilters)

      expect(onConfigChange).toHaveBeenCalledWith({
        ...config,
        filters: newFilters
      })
    })

    it('should not update config when prop filters are provided', () => {
      const config = createTestConfig({ filters: [] })
      const propFilters: DashboardFilter[] = [
        createTestFilter('prop-filter', 'Prop Filter')
      ]
      const onConfigChange = vi.fn()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      render(
        <AnalyticsDashboard
          config={config}
          editable={true}
          dashboardFilters={propFilters}
          onConfigChange={onConfigChange}
        />
      )

      const newFilters: DashboardFilter[] = [
        createTestFilter('new-filter', 'New Filter')
      ]

      capturedDashboardGridProps.onDashboardFiltersChange(newFilters)

      // Should not call onConfigChange when filters are controlled via props
      expect(onConfigChange).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Dashboard filters are controlled via props - config changes ignored'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('empty state', () => {
    it('should render with empty portlets array', () => {
      const config = createTestConfig({ portlets: [] })

      render(<AnalyticsDashboard config={config} />)

      expect(capturedDashboardGridProps.config.portlets).toEqual([])
    })
  })
})
