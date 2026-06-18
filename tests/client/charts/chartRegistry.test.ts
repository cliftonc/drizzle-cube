/**
 * Tests for the unified chartRegistry — the single source of truth for a chart.
 *
 * Slice 1 (issue #910) migrates Bar end-to-end through chartRegistry while every
 * other chart keeps working off the legacy registries. These tests assert the
 * entry shape and that all five derivation sites read Bar from the one entry.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import { createElement } from 'react'
import { renderWithProviders } from '../../client-setup/test-utils'
import { chartRegistry, composeChartConfig, getChartEntry } from '../../../src/client/charts/chartRegistry'
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
    // Bar's deps resolve via its entry (the legacy chartDependencyMap is gone) —
    // the fallback shows recharts, not "unknown".
    const Fallback = createFallbackComponent('bar')
    renderWithProviders(createElement(Fallback, { data: [] }))
    expect(screen.getByText('npm install recharts')).toBeInTheDocument()
  })
})

// All built-in chart types, sourced from the loader's component map (the one
// place every built-in must appear). Slice 2 requires each to be fully wired
// through its chartRegistry entry — these assertions parametrize the Bar tests
// above over every type.
const BUILT_IN_TYPES = getAvailableChartTypes()

describe('chartRegistry — completeness (every built-in has an entry)', () => {
  it('has an entry for every built-in chart type the loader knows about', () => {
    const missing = BUILT_IN_TYPES.filter((type) => !chartRegistry[type as keyof typeof chartRegistry])
    expect(missing).toEqual([])
  })

  it('declares only known built-in types (no stray entries)', () => {
    const stray = Object.keys(chartRegistry).filter((type) => !BUILT_IN_TYPES.includes(type as never))
    expect(stray).toEqual([])
  })
})

describe.each(BUILT_IN_TYPES)('chartRegistry — %s is wired through its entry', (type) => {
  const entry = () => chartRegistry[type as keyof typeof chartRegistry]!

  it('has a well-formed DOM-free entry (label key, icon, lazy config thunk, no component)', () => {
    const e = entry()
    expect(e).toBeDefined()
    expect(typeof e.label).toBe('string')
    expect(e.label.startsWith('chart.')).toBe(true)
    expect(typeof e.icon).toBe('string')
    expect(typeof e.config).toBe('function')
    expect('component' in e).toBe(false)
  })

  it('derives eager chartConfigRegistry metadata from the single entry (site 1)', () => {
    const e = entry()
    const eager = chartConfigRegistry[type]
    expect(eager).toBeDefined()
    // Metadata is referentially the entry's — proves it is composed from the
    // entry, not still read from the (now metadata-free) *.config.ts.
    expect(eager.label).toBe(e.label)
    expect(eager.description).toBe(e.description)
    expect(eager.useCase).toBe(e.useCase)
    expect(eager.isAvailable).toBe(e.isAvailable)
    // Eager config is the server/full source — real drop zones must survive.
    expect(Array.isArray(eager.dropZones)).toBe(true)
  })

  it('resolves the full composed shape via the lazy thunk (site 2)', async () => {
    clearChartConfigCache()
    const e = entry()
    const config = await getChartConfigAsync(type)
    expect(config).not.toBeNull()
    expect(config!.label).toBe(e.label)
    expect(config!.isAvailable).toBe(e.isAvailable)
    // Lazy and eager derivations agree on the real drop zones.
    expect(config!.dropZones.map((z) => z.key)).toEqual(
      chartConfigRegistry[type].dropZones.map((z) => z.key)
    )
  })

  it('resolves its icon from the entry (site 4)', () => {
    const icon = entry().icon
    // Built-ins always declare a string IconName; resolve it the same way the
    // helper does so this stays valid against the widened entry icon type.
    const expected = typeof icon === 'string' ? getIcon(icon) : icon
    expect(getChartTypeIcon(type)).toBe(expected)
  })

  it('exposes dependencies (if any) through the entry for the fallback (site 5)', () => {
    const deps = entry().dependencies
    if (!deps) return
    const Fallback = createFallbackComponent(type)
    renderWithProviders(createElement(Fallback, { data: [] }))
    expect(screen.getByText(deps.installCommand)).toBeInTheDocument()
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

describe('chartRegistry — plugin unification (custom + built-in share one entry path)', () => {
  const CustomChart = ({ data }: ChartProps) =>
    createElement('div', { 'data-testid': 'plugin-chart' }, `rows:${data?.length ?? 0}`)
  const CustomIcon = () => createElement('svg', { 'data-testid': 'plugin-icon' })

  afterEach(() => {
    chartPluginRegistry.unregister('myPlugin')
    chartPluginRegistry.unregister('line')
    clearChartConfigCache()
  })

  it('getChartEntry resolves a built-in via its registry entry', () => {
    expect(getChartEntry('bar')).toBe(chartRegistry.bar)
    expect(getChartEntry('line')).toBe(chartRegistry.line)
    expect(getChartEntry('nope')).toBeUndefined()
  })

  it('register() produces a ChartRegistryEntry consumed through the unified lookup', async () => {
    chartPluginRegistry.register({
      type: 'myPlugin',
      label: 'My Plugin',
      component: CustomChart,
      icon: CustomIcon,
      dependencies: { packageName: 'cool-charts', installCommand: 'npm install cool-charts' },
      config: {
        label: 'My Plugin',
        dropZones: [{ key: 'value', label: 'Value', acceptTypes: ['measure'] }],
      },
    })

    const entry = getChartEntry('myPlugin')
    expect(entry).toBeDefined()
    // Same shape as a built-in entry: metadata, icon, deps, lazy config thunk.
    expect(entry!.label).toBe('My Plugin')
    expect(entry!.icon).toBe(CustomIcon)
    expect(entry!.dependencies).toEqual({ packageName: 'cool-charts', installCommand: 'npm install cool-charts' })
    expect(typeof entry!.config).toBe('function')
    const resolved = await entry!.config()
    expect(resolved.dropZones.map((z) => z.key)).toEqual(['value'])
  })

  it('routes a custom chart icon through the unified icon resolver', () => {
    chartPluginRegistry.register({
      type: 'myPlugin',
      label: 'My Plugin',
      component: CustomChart,
      icon: CustomIcon,
      config: { label: 'My Plugin', dropZones: [] },
    })
    expect(getChartTypeIcon('myPlugin')).toBe(CustomIcon)
  })

  it('resolves a plugin chart’s config after the cache is cleared (custom-first lookup)', async () => {
    // clearChartConfigCache() is a public API. A registered plugin keeps a
    // ChartRegistryEntry with a config thunk, so getChartConfigAsync must
    // rehydrate from getChartEntry() rather than only the built-in registry.
    chartPluginRegistry.register({
      type: 'myPlugin',
      label: 'My Plugin',
      component: CustomChart,
      config: {
        label: 'My Plugin',
        dropZones: [{ key: 'value', label: 'Value', acceptTypes: ['measure'] }],
      },
    })
    clearChartConfigCache()
    const config = await getChartConfigAsync('myPlugin')
    expect(config).not.toBeNull()
    expect(config!.dropZones.map((z) => z.key)).toEqual(['value'])
  })

  it('surfaces a custom chart’s dependencies in the fallback via its entry', () => {
    chartPluginRegistry.register({
      type: 'myPlugin',
      label: 'My Plugin',
      component: CustomChart,
      dependencies: { packageName: 'cool-charts', installCommand: 'npm install cool-charts' },
      config: { label: 'My Plugin', dropZones: [] },
    })
    const Fallback = createFallbackComponent('myPlugin')
    renderWithProviders(createElement(Fallback, { data: [] }))
    expect(screen.getByText('npm install cool-charts')).toBeInTheDocument()
  })

  it('lets a custom override of a non-bar built-in (line) win, then restores it', async () => {
    chartPluginRegistry.register({
      type: 'line',
      label: 'Custom Line',
      component: CustomChart,
      icon: CustomIcon,
      config: {
        label: 'Custom Line',
        dropZones: [{ key: 'custom', label: 'Custom', acceptTypes: ['measure'] }],
      },
    })

    // Custom entry takes precedence over the built-in across the unified path.
    expect(getChartEntry('line')!.icon).toBe(CustomIcon)
    expect(getChartTypeIcon('line')).toBe(CustomIcon)
    expect(chartConfigRegistry.line.label).toBe('Custom Line')
    const overridden = await getChartConfigAsync('line')
    expect(overridden!.dropZones.map((z) => z.key)).toEqual(['custom'])

    // Unregistering restores the built-in line entry.
    chartPluginRegistry.unregister('line')
    clearChartConfigCache()
    expect(getChartEntry('line')).toBe(chartRegistry.line)
    expect(getChartTypeIcon('line')).toBe(getIcon('chartLine'))
    expect(chartConfigRegistry.line.label).toBe('chart.line.label')
  })
})

describe('chartRegistry — icon resolution is import-order independent', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('resolves built-in icons when the icon helper is imported standalone', async () => {
    // A consumer may import the icon helper by itself (e.g. drizzle-cube/client
    // icons) without any chart-registry import. Built-in icons must still resolve
    // from the entry rather than silently falling back to the bar icon — i.e. the
    // resolver cannot depend on chartRegistry's side-effectful module init.
    vi.resetModules()
    const icons = await import('../../../src/client/icons/registry')

    expect(icons.getChartTypeIcon('line')).toBe(icons.getIcon('chartLine'))
    expect(icons.getChartTypeIcon('line')).not.toBe(icons.getIcon('chartBar'))
    expect(icons.getChartTypeIcon('gauge')).toBe(icons.getIcon('chartGauge'))
  })
})
