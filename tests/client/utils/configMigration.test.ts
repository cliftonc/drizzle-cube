/**
 * Tests for Config Migration Utilities
 */

import { describe, it, expect } from 'vitest'
import {
  migrateLegacyPortlet,
  migrateLegacyFunnelMerge,
  migrateConfig,
  hasAnalysisConfig,
  type LegacyPortlet,
  type LegacyFunnelMultiQuery,
} from '../../../src/client/utils/configMigration'
import type { QueryAnalysisConfig, FunnelAnalysisConfig } from '../../../src/client/types/analysisConfig'

describe('configMigration', () => {
  describe('migrateLegacyPortlet', () => {
    it('should migrate single CubeQuery', () => {
      const portlet: LegacyPortlet = {
        query: JSON.stringify({
          measures: ['Employees.count'],
          dimensions: ['Employees.department'],
        }),
        chartType: 'bar',
        chartConfig: { xAxis: ['department'] },
        displayConfig: { showLegend: true },
      }

      const config = migrateLegacyPortlet(portlet)

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('query')
      expect(config.charts.query?.chartType).toBe('bar')
      expect((config as QueryAnalysisConfig).query.measures).toEqual(['Employees.count'])
    })

    it('should migrate MultiQueryConfig (non-funnel)', () => {
      const portlet: LegacyPortlet = {
        query: JSON.stringify({
          queries: [
            { measures: ['Sales.count'] },
            { measures: ['Returns.count'] },
          ],
          mergeStrategy: 'concat',
        }),
        chartType: 'line',
      }

      const config = migrateLegacyPortlet(portlet) as QueryAnalysisConfig

      expect(config.analysisType).toBe('query')
      expect('queries' in config.query).toBe(true)
    })

    it('should migrate ServerFunnelQuery to funnel config', () => {
      const portlet: LegacyPortlet = {
        query: JSON.stringify({
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: [
              { name: 'Step 1' },
              { name: 'Step 2' },
            ],
          },
        }),
        chartType: 'funnel',
        funnelChartType: 'funnel',
        funnelDisplayConfig: { showLegend: false },
      }

      const config = migrateLegacyPortlet(portlet) as FunnelAnalysisConfig

      expect(config.analysisType).toBe('funnel')
      expect(config.query.funnel.bindingKey).toBe('Events.userId')
      expect(config.charts.funnel?.chartType).toBe('funnel')
    })

    it('should migrate portlet with explicit funnel analysisType', () => {
      const portlet: LegacyPortlet = {
        query: JSON.stringify({
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: [],
          },
        }),
        analysisType: 'funnel',
        chartType: 'funnel',
      }

      const config = migrateLegacyPortlet(portlet)

      expect(config.analysisType).toBe('funnel')
    })

    it('should return default config for invalid JSON', () => {
      const portlet: LegacyPortlet = {
        query: 'invalid json',
        chartType: 'bar',
      }

      const config = migrateLegacyPortlet(portlet)

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('query')
    })

    it('should use default chart type when not specified', () => {
      const portlet: LegacyPortlet = {
        query: JSON.stringify({ measures: ['Test.count'] }),
      }

      const config = migrateLegacyPortlet(portlet)

      expect(config.charts.query?.chartType).toBe('bar')
    })
  })

  describe('migrateLegacyFunnelMerge', () => {
    it('should convert mergeStrategy funnel to FunnelAnalysisConfig', () => {
      const legacyQuery: LegacyFunnelMultiQuery = {
        queries: [
          { measures: ['Events.count'], filters: [{ member: 'Events.type', operator: 'equals', values: ['a'] }] },
          { measures: ['Events.count'], filters: [{ member: 'Events.type', operator: 'equals', values: ['b'] }] },
        ],
        mergeStrategy: 'funnel',
        funnelBindingKey: { dimension: 'Events.userId' },
        stepTimeToConvert: [null, 'P7D'],
      }

      const config = migrateLegacyFunnelMerge(legacyQuery)

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('funnel')
      expect(config.query.funnel.bindingKey).toBe('Events.userId')
      expect(config.query.funnel.steps).toHaveLength(2)
      expect(config.query.funnel.steps[1].timeToConvert).toBe('P7D')
    })

    it('should extract time dimension from first query', () => {
      const legacyQuery: LegacyFunnelMultiQuery = {
        queries: [
          { measures: ['Events.count'], timeDimensions: [{ dimension: 'Events.timestamp', granularity: 'day' }] },
        ],
        mergeStrategy: 'funnel',
      }

      const config = migrateLegacyFunnelMerge(legacyQuery)

      expect(config.query.funnel.timeDimension).toBe('Events.timestamp')
    })

    it('should use queryLabels for step names', () => {
      const legacyQuery: LegacyFunnelMultiQuery = {
        queries: [{ measures: ['Events.count'] }, { measures: ['Events.count'] }],
        mergeStrategy: 'funnel',
        queryLabels: ['Page View', 'Sign Up'],
      }

      const config = migrateLegacyFunnelMerge(legacyQuery)

      expect(config.query.funnel.steps[0].name).toBe('Page View')
      expect(config.query.funnel.steps[1].name).toBe('Sign Up')
    })

    it('should handle array binding key', () => {
      const legacyQuery: LegacyFunnelMultiQuery = {
        queries: [],
        mergeStrategy: 'funnel',
        funnelBindingKey: {
          dimension: [
            { cube: 'Events', dimension: 'userId' },
            { cube: 'Orders', dimension: 'customerId' },
          ],
        },
      }

      const config = migrateLegacyFunnelMerge(legacyQuery)

      expect(config.query.funnel.bindingKey).toEqual([
        { cube: 'Events', dimension: 'userId' },
        { cube: 'Orders', dimension: 'customerId' },
      ])
    })

    it('should preserve portlet chart config', () => {
      const legacyQuery: LegacyFunnelMultiQuery = {
        queries: [],
        mergeStrategy: 'funnel',
      }

      const portlet: LegacyPortlet = {
        query: '',
        funnelChartType: 'funnel',
        funnelDisplayConfig: { showLegend: false },
      }

      const config = migrateLegacyFunnelMerge(legacyQuery, portlet)

      expect(config.charts.funnel?.chartType).toBe('funnel')
    })
  })

  describe('migrateConfig', () => {
    it('should return valid AnalysisConfig unchanged', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
        query: { measures: ['Test.count'] },
      }

      const result = migrateConfig(config)

      expect(result).toEqual(config)
    })

    it('should migrate legacy portlet format', () => {
      const legacy = {
        query: JSON.stringify({ measures: ['Test.count'] }),
        chartType: 'bar',
      }

      const result = migrateConfig(legacy)

      expect(result.version).toBe(1)
      expect(result.analysisType).toBe('query')
    })

    it('should migrate raw query object', () => {
      const rawQuery = {
        measures: ['Test.count'],
        dimensions: ['Test.name'],
      }

      const result = migrateConfig(rawQuery)

      expect(result.version).toBe(1)
      expect(result.analysisType).toBe('query')
    })

    it('should return default for null', () => {
      const result = migrateConfig(null)

      expect(result.version).toBe(1)
      expect(result.analysisType).toBe('query')
    })

    it('should return default for invalid object', () => {
      const result = migrateConfig({ invalid: true })

      expect(result.version).toBe(1)
    })
  })

  describe('hasAnalysisConfig', () => {
    it('should return true for object with valid analysisConfig', () => {
      const portlet = {
        analysisConfig: {
          version: 1,
          analysisType: 'query',
          activeView: 'chart',
          charts: {},
          query: { measures: [] },
        },
        query: '{}',
        chartType: 'bar',
      }

      expect(hasAnalysisConfig(portlet)).toBe(true)
    })

    it('should return false for object without analysisConfig', () => {
      const portlet = {
        query: '{}',
        chartType: 'bar',
      }

      expect(hasAnalysisConfig(portlet)).toBe(false)
    })

    it('should return false for invalid analysisConfig', () => {
      const portlet = {
        analysisConfig: {
          version: 2, // Invalid version
          analysisType: 'query',
        },
      }

      expect(hasAnalysisConfig(portlet)).toBe(false)
    })

    it('should return false for null', () => {
      expect(hasAnalysisConfig(null)).toBe(false)
    })
  })
})
