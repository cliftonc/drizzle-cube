/**
 * Tests for useChartConfig
 *
 * The hook must follow the chart plugin registry after mount, and must ignore
 * a load that finishes after the chart type changed.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { clearChartConfigCache, useChartConfig } from '../../../src/client/charts/lazyChartConfigRegistry'
import { chartPluginRegistry } from '../../../src/client/charts/chartPlugin'
import type { ChartDefinition } from '../../../src/client/charts/chartPlugin'
import { registerCustomChartEntry, unregisterCustomChartEntry } from '../../../src/client/charts/chartRegistry'
import { defaultChartConfig } from '../../../src/client/charts/chartConfigs'
import type { ChartTypeConfig } from '../../../src/client/charts/chartConfigs'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'

function createDefinition(type: string, label: string): ChartDefinition {
  return { type, label, config: { label, dropZones: [] } }
}

describe('useChartConfig', () => {
  afterEach(() => {
    for (const type of chartPluginRegistry.getCustomTypes()) {
      chartPluginRegistry.unregister(type)
    }
    unregisterCustomChartEntry('slowChart')
    clearChartConfigCache()
  })

  it('should return the config of a chart registered after mount', async () => {
    const { result } = renderHook(() => useChartConfig('lateChart'))
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.config).toBe(defaultChartConfig)

    act(() => {
      chartPluginRegistry.register(createDefinition('lateChart', 'Late Chart'))
    })

    await waitFor(() => expect(result.current.config.label).toBe('Late Chart'))
  })

  it('should return the config of a chart that CubeProvider registers on mount', async () => {
    const customCharts = [createDefinition('providerChart', 'Provider Chart')]
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CubeProvider apiOptions={{ apiUrl: '/api/cubejs-api/v1' }} customCharts={customCharts} enableBatching={false}>
        {children}
      </CubeProvider>
    )

    const { result } = renderHook(() => useChartConfig('providerChart'), { wrapper })

    await waitFor(() => expect(result.current.config.label).toBe('Provider Chart'))
  })

  it('should return the new config when a chart type is registered again', async () => {
    chartPluginRegistry.register(createDefinition('reChart', 'First'))
    const { result } = renderHook(() => useChartConfig('reChart'))
    await waitFor(() => expect(result.current.config.label).toBe('First'))

    act(() => {
      chartPluginRegistry.register(createDefinition('reChart', 'Second'))
    })

    await waitFor(() => expect(result.current.config.label).toBe('Second'))
  })

  it('should not return the config of a previous chart type whose load ends late', async () => {
    let resolveSlowConfig: (config: ChartTypeConfig) => void = () => {}
    registerCustomChartEntry('slowChart', {
      label: 'Slow Chart',
      icon: 'chartBar',
      config: () => new Promise(resolve => { resolveSlowConfig = resolve })
    })
    chartPluginRegistry.register(createDefinition('fastChart', 'Fast Chart'))

    const { result, rerender } = renderHook(
      ({ chartType }) => useChartConfig(chartType),
      { initialProps: { chartType: 'slowChart' } }
    )
    expect(result.current.loading).toBe(true)

    rerender({ chartType: 'fastChart' })
    expect(result.current.config.label).toBe('Fast Chart')

    await act(async () => {
      resolveSlowConfig({ label: 'Slow Chart', dropZones: [] })
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.config.label).toBe('Fast Chart')
    expect(result.current.loading).toBe(false)
  })
})
