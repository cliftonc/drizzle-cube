/**
 * Tests for Chart Plugin System
 *
 * Tests registration, override, unregistration, and UI integration
 * of custom chart plugins.
 */

import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { chartPluginRegistry } from '../../../src/client/charts/chartPlugin'
import type { ChartDefinition } from '../../../src/client/charts/chartPlugin'
import { chartConfigRegistry } from '../../../src/client/charts/chartConfigRegistry'
import {
  isValidChartType,
  getAvailableChartTypes,
} from '../../../src/client/charts/ChartLoader'
import type { ChartTypeConfig } from '../../../src/client/charts/chartConfigs'
import type { ChartProps } from '../../../src/client/types'

// Simple test component
const TestChart: React.FC<ChartProps> = ({ data }) =>
  React.createElement('div', { 'data-testid': 'test-chart' }, `Items: ${data?.length ?? 0}`)

// Test chart config
const testConfig: ChartTypeConfig = {
  label: 'Test Chart',
  description: 'A test chart for unit tests',
  dropZones: [
    {
      key: 'yAxis',
      label: 'Values',
      mandatory: true,
      acceptTypes: ['measure'],
    },
  ],
}

function createTestDefinition(overrides?: Partial<ChartDefinition>): ChartDefinition {
  return {
    type: 'testCustom',
    label: 'Test Custom Chart',
    config: testConfig,
    component: TestChart,
    ...overrides,
  }
}

describe('ChartPluginRegistry', () => {
  afterEach(() => {
    // Clean up any registered custom charts
    for (const type of chartPluginRegistry.getCustomTypes()) {
      chartPluginRegistry.unregister(type)
    }
  })

  describe('register', () => {
    it('should register a custom chart type', () => {
      const def = createTestDefinition()
      chartPluginRegistry.register(def)

      expect(chartPluginRegistry.isCustom('testCustom')).toBe(true)
      expect(chartPluginRegistry.getCustomTypes()).toContain('testCustom')
    })

    it('should add chart config to chartConfigRegistry', () => {
      const def = createTestDefinition()
      chartPluginRegistry.register(def)

      expect(chartConfigRegistry['testCustom']).toBeDefined()
      expect(chartConfigRegistry['testCustom'].label).toBe('Test Chart')
    })

    it('should make chart type valid in ChartLoader', () => {
      const def = createTestDefinition()
      chartPluginRegistry.register(def)

      expect(isValidChartType('testCustom')).toBe(true)
    })

    it('should include custom chart in getAvailableChartTypes', () => {
      const def = createTestDefinition()
      chartPluginRegistry.register(def)

      const types = getAvailableChartTypes()
      expect(types).toContain('testCustom')
    })

    it('should use label from config when config has label', () => {
      const def = createTestDefinition({
        config: { ...testConfig, label: 'Config Label' },
      })
      chartPluginRegistry.register(def)

      expect(chartConfigRegistry['testCustom'].label).toBe('Config Label')
    })

    it('should fall back to definition label when config has no label', () => {
      const configWithoutLabel = { ...testConfig }
      delete (configWithoutLabel as any).label
      const def = createTestDefinition({
        label: 'Definition Label',
        config: configWithoutLabel,
      })
      chartPluginRegistry.register(def)

      expect(chartConfigRegistry['testCustom'].label).toBe('Definition Label')
    })
  })

  describe('override built-in', () => {
    it('should allow overriding a built-in chart type', () => {
      const originalConfig = chartConfigRegistry['bar']
      expect(originalConfig).toBeDefined()

      const def = createTestDefinition({
        type: 'bar',
        label: 'Custom Bar',
        config: { ...testConfig, label: 'Custom Bar Chart' },
      })
      chartPluginRegistry.register(def)

      expect(chartConfigRegistry['bar'].label).toBe('Custom Bar Chart')
      expect(chartPluginRegistry.isCustom('bar')).toBe(true)
    })

    it('should restore built-in on unregister', () => {
      const originalLabel = chartConfigRegistry['bar'].label

      chartPluginRegistry.register(
        createTestDefinition({
          type: 'bar',
          config: { ...testConfig, label: 'Override' },
        })
      )

      expect(chartConfigRegistry['bar'].label).toBe('Override')

      chartPluginRegistry.unregister('bar')

      expect(chartConfigRegistry['bar'].label).toBe(originalLabel)
      expect(chartPluginRegistry.isCustom('bar')).toBe(false)
    })
  })

  describe('unregister', () => {
    it('should remove custom chart from registry', () => {
      chartPluginRegistry.register(createTestDefinition())
      expect(chartPluginRegistry.isCustom('testCustom')).toBe(true)

      chartPluginRegistry.unregister('testCustom')

      expect(chartPluginRegistry.isCustom('testCustom')).toBe(false)
      expect(chartConfigRegistry['testCustom']).toBeUndefined()
    })

    it('should be a no-op for unregistered types', () => {
      // Should not throw
      chartPluginRegistry.unregister('nonexistent')
    })

    it('should remove custom chart from getAvailableChartTypes', () => {
      chartPluginRegistry.register(createTestDefinition())
      expect(getAvailableChartTypes()).toContain('testCustom')

      chartPluginRegistry.unregister('testCustom')
      expect(getAvailableChartTypes()).not.toContain('testCustom')
    })
  })

  describe('icons', () => {
    it('should store and retrieve custom icon', () => {
      const TestIcon: React.FC<any> = () => React.createElement('svg')
      chartPluginRegistry.register(
        createTestDefinition({ icon: TestIcon })
      )

      expect(chartPluginRegistry.getIcon('testCustom')).toBe(TestIcon)
    })

    it('should return undefined for chart without icon', () => {
      chartPluginRegistry.register(createTestDefinition())
      expect(chartPluginRegistry.getIcon('testCustom')).toBeUndefined()
    })

    it('should remove icon on unregister', () => {
      const TestIcon: React.FC<any> = () => React.createElement('svg')
      chartPluginRegistry.register(
        createTestDefinition({ icon: TestIcon })
      )
      chartPluginRegistry.unregister('testCustom')

      expect(chartPluginRegistry.getIcon('testCustom')).toBeUndefined()
    })
  })

  describe('subscribe / getSnapshot', () => {
    it('should bump version on register', () => {
      const v1 = chartPluginRegistry.getSnapshot()
      chartPluginRegistry.register(createTestDefinition())
      const v2 = chartPluginRegistry.getSnapshot()
      expect(v2).toBeGreaterThan(v1)
    })

    it('should bump version on unregister', () => {
      chartPluginRegistry.register(createTestDefinition())
      const v1 = chartPluginRegistry.getSnapshot()
      chartPluginRegistry.unregister('testCustom')
      const v2 = chartPluginRegistry.getSnapshot()
      expect(v2).toBeGreaterThan(v1)
    })

    it('should notify subscribers on register', () => {
      let callCount = 0
      const unsub = chartPluginRegistry.subscribe(() => { callCount++ })

      chartPluginRegistry.register(createTestDefinition())
      expect(callCount).toBe(1)

      chartPluginRegistry.unregister('testCustom')
      expect(callCount).toBe(2)

      unsub()

      chartPluginRegistry.register(createTestDefinition())
      expect(callCount).toBe(2) // No more calls after unsubscribe
    })
  })

  describe('unknown chart types', () => {
    it('should report unknown types as invalid before registration', () => {
      expect(isValidChartType('gantt')).toBe(false)
    })

    it('should report unknown types as valid after registration', () => {
      chartPluginRegistry.register(
        createTestDefinition({ type: 'gantt' })
      )
      expect(isValidChartType('gantt')).toBe(true)
    })
  })

  describe('multiple registrations', () => {
    it('should support registering multiple custom charts', () => {
      chartPluginRegistry.register(createTestDefinition({ type: 'custom1' }))
      chartPluginRegistry.register(createTestDefinition({ type: 'custom2' }))
      chartPluginRegistry.register(createTestDefinition({ type: 'custom3' }))

      expect(chartPluginRegistry.getCustomTypes()).toHaveLength(3)
      expect(isValidChartType('custom1')).toBe(true)
      expect(isValidChartType('custom2')).toBe(true)
      expect(isValidChartType('custom3')).toBe(true)
    })

    it('should allow re-registering same type (update)', () => {
      chartPluginRegistry.register(
        createTestDefinition({
          type: 'myChart',
          config: { ...testConfig, label: 'Version 1' },
        })
      )
      expect(chartConfigRegistry['myChart'].label).toBe('Version 1')

      chartPluginRegistry.register(
        createTestDefinition({
          type: 'myChart',
          config: { ...testConfig, label: 'Version 2' },
        })
      )
      expect(chartConfigRegistry['myChart'].label).toBe('Version 2')
    })
  })
})
