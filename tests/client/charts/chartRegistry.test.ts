/**
 * Tests for the unified chartRegistry — the single source of truth for a chart.
 *
 * Slice 1 (issue #910) migrates Bar end-to-end through chartRegistry while every
 * other chart keeps working off the legacy registries. These tests assert the
 * entry shape and that all five derivation sites read Bar from the one entry.
 */

import { describe, it, expect, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import { createElement } from 'react'
import { renderWithProviders } from '../../client-setup/test-utils'
import { chartRegistry, composeChartConfig } from '../../../src/client/charts/chartRegistry'
import { chartConfigRegistry } from '../../../src/client/charts/chartConfigRegistry'
import { barChartConfig } from '../../../src/client/components/charts/BarChart.config'
import {
  getChartConfigAsync,
  clearChartConfigCache,
} from '../../../src/client/charts/lazyChartConfigRegistry'
import {
  isValidChartType,
  getAvailableChartTypes,
} from '../../../src/client/charts/ChartLoader'
import { getChartTypeIcon, getIcon } from '../../../src/client/icons/registry'
import { createFallbackComponent } from '../../../src/client/charts/chartComponentRegistry'
import { chartPluginRegistry } from '../../../src/client/charts/chartPlugin'
import type { ChartProps } from '../../../src/client/types'

describe('chartRegistry — entry shape', () => {
  it('has a bar entry that is the single source of truth (DOM-free)', () => {
    const bar = chartRegistry.bar
    expect(bar).toBeDefined()
    expect(bar!.label).toBe('chart.bar.label')
    expect(bar!.icon).toBe('chartBar')
    expect(typeof bar!.config).toBe('function')
    expect(typeof bar!.isAvailable).toBe('function')
    expect(bar!.dependencies).toEqual({
      packageName: 'recharts',
      installCommand: 'npm install recharts',
    })
    // The DOM-bearing React component thunk is intentionally NOT on the entry —
    // it is a client-only concern owned by the loader's component map.
    expect('component' in bar!).toBe(false)
  })
})

describe('chartRegistry — composeChartConfig', () => {
  it('composes the entry metadata over the full config shape', () => {
    const bar = chartRegistry.bar!
    const composed = composeChartConfig(bar, barChartConfig)

    // Metadata comes from the entry (its single declaration site)...
    expect(composed.label).toBe('chart.bar.label')
    expect(composed.description).toBe('chart.bar.description')
    expect(composed.useCase).toBe('chart.bar.useCase')
    expect(composed.isAvailable).toBe(bar.isAvailable)
    // ...while the real drop zones / display options come from the config shape,
    // so the composed config stays usable for agent validation + the config panel.
    expect(composed.dropZones.map((z) => z.key)).toEqual(['xAxis', 'yAxis', 'series'])
    expect(composed.clickableElements).toEqual({ bar: true })
  })
})

describe('chartRegistry — eager chartConfigRegistry derivation (site 1)', () => {
  it('derives the eager bar config from the single entry, keeping real drop zones', () => {
    const entry = chartRegistry.bar!
    const eager = chartConfigRegistry.bar

    expect(eager.label).toBe(entry.label)
    expect(eager.description).toBe(entry.description)
    expect(eager.useCase).toBe(entry.useCase)
    expect(eager.isAvailable).toBe(entry.isAvailable)
    // Eager config is the server/full source — must retain real drop zones for
    // the agent's mandatory-zone validation and tool guidance.
    expect(eager.dropZones.map((z) => z.key)).toEqual(['xAxis', 'yAxis', 'series'])
  })

  it('keeps the label as a translation key, not resolved text', () => {
    expect(chartConfigRegistry.bar.label).toBe('chart.bar.label')
  })
})

describe('chartRegistry — lazy config derivation (site 2)', () => {
  it('resolves the real, non-empty dropZones for bar via the entry config thunk', async () => {
    clearChartConfigCache()
    const config = await getChartConfigAsync('bar')

    expect(config).not.toBeNull()
    expect(config!.dropZones.length).toBeGreaterThan(0)
    expect(config!.dropZones.map((z) => z.key)).toEqual(['xAxis', 'yAxis', 'series'])
  })

  it('composes the entry metadata over the lazy config so the public shape is complete', async () => {
    // Public lazy API parity: getChartConfigAsync must return the same full
    // metadata-bearing shape as non-migrated charts, not the stripped *.config.ts.
    clearChartConfigCache()
    const entry = chartRegistry.bar!
    const config = await getChartConfigAsync('bar')

    expect(config!.label).toBe(entry.label)
    expect(config!.description).toBe(entry.description)
    expect(config!.useCase).toBe(entry.useCase)
    expect(config!.isAvailable).toBe(entry.isAvailable)
  })

  it('still resolves a sibling chart (line) via the legacy registry', async () => {
    clearChartConfigCache()
    const config = await getChartConfigAsync('line')
    expect(config).not.toBeNull()
    expect(config!.dropZones.length).toBeGreaterThan(0)
  })
})

describe('chartRegistry — loader (client component map)', () => {
  // The component thunk is the one DOM-bearing, client-only piece, so it stays
  // in the loader's component map rather than the shared (server-safe) entry.
  it('recognizes bar as a valid chart type', () => {
    expect(isValidChartType('bar')).toBe(true)
  })

  it('lists bar among available chart types', () => {
    expect(getAvailableChartTypes()).toContain('bar')
  })

  it('still recognizes a sibling chart (line)', () => {
    expect(isValidChartType('line')).toBe(true)
    expect(getAvailableChartTypes()).toContain('line')
  })
})

describe('chartRegistry — icon derivation (site 4)', () => {
  it('resolves the bar icon from the entry, identical to the registered icon', () => {
    expect(getChartTypeIcon('bar')).toBe(getIcon('chartBar'))
  })

  it('still resolves a sibling chart (line) icon via the legacy typeMap', () => {
    expect(getChartTypeIcon('line')).toBe(getIcon('chartLine'))
  })
})

describe('chartRegistry — dependency derivation (site 5)', () => {
  it('builds the missing-dependency fallback for bar from the entry deps', () => {
    // After bar is removed from the legacy chartDependencyMap, its deps must
    // still resolve via the entry — the fallback shows recharts, not "unknown".
    const Fallback = createFallbackComponent('bar')
    renderWithProviders(createElement(Fallback, { data: [] }))
    expect(screen.getByText('npm install recharts')).toBeInTheDocument()
  })
})

describe('chartRegistry — plugin override precedence (regression)', () => {
  const CustomBar = ({ data }: ChartProps) =>
    createElement('div', { 'data-testid': 'custom-bar' }, `rows:${data?.length ?? 0}`)

  afterEach(() => {
    chartPluginRegistry.unregister('bar')
    clearChartConfigCache()
  })

  it('lets a custom bar override win over the migrated built-in, then restores it', async () => {
    chartPluginRegistry.register({
      type: 'bar',
      label: 'Custom Bar',
      component: CustomBar,
      config: {
        label: 'Custom Bar',
        dropZones: [{ key: 'custom', label: 'Custom Zone', acceptTypes: ['measure'] }],
      },
    })

    // Eager registry + async config both reflect the override (cache precedence
    // stays ahead of the unified entry lookup).
    expect(chartConfigRegistry.bar.label).toBe('Custom Bar')
    expect(chartPluginRegistry.isCustom('bar')).toBe(true)
    const overridden = await getChartConfigAsync('bar')
    expect(overridden!.dropZones.map((z) => z.key)).toEqual(['custom'])

    // Unregistering restores the built-in derived from the entry.
    chartPluginRegistry.unregister('bar')
    clearChartConfigCache()
    expect(chartConfigRegistry.bar.label).toBe('chart.bar.label')
    const restored = await getChartConfigAsync('bar')
    expect(restored!.dropZones.map((z) => z.key)).toEqual(['xAxis', 'yAxis', 'series'])
  })

  it('lets a custom bar icon override win over the unified entry icon, then restores it', () => {
    const CustomIcon = () => createElement('svg', { 'data-testid': 'custom-bar-icon' })

    chartPluginRegistry.register({
      type: 'bar',
      label: 'Custom Bar',
      component: CustomBar,
      icon: CustomIcon,
      config: { label: 'Custom Bar', dropZones: [] },
    })

    // Plugin icon precedence must stay ahead of the unified entry lookup.
    expect(getChartTypeIcon('bar')).toBe(CustomIcon)

    chartPluginRegistry.unregister('bar')
    expect(getChartTypeIcon('bar')).toBe(getIcon('chartBar'))
  })
})
