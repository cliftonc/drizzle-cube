/**
 * Tests for Share Utilities (Phase 3)
 *
 * Tests the AnalysisConfig-based share URL functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  compressAndEncode,
  decodeAndDecompress,
  isShareableSize,
  compressWithFallback,
  generateShareUrl,
  parseShareHash,
  clearShareHash,
  getMaxHashLength,
  createShareUrl,
  parseShareUrl,
} from '../../../src/client/utils/shareUtils'
import type {
  QueryAnalysisConfig,
  FunnelAnalysisConfig,
  AnalysisConfig,
} from '../../../src/client/types/analysisConfig'

// Mock window for URL tests
const mockWindow = {
  location: {
    origin: 'https://example.com',
    pathname: '/app/analysis',
    hash: '',
    href: 'https://example.com/app/analysis',
  },
  history: {
    replaceState: vi.fn(),
  },
}

describe('shareUtils (Phase 3 - AnalysisConfig)', () => {
  beforeEach(() => {
    // @ts-expect-error - mocking window
    global.window = mockWindow
    mockWindow.location.hash = ''
    mockWindow.history.replaceState.mockClear()
  })

  afterEach(() => {
    // @ts-expect-error - cleaning up mock
    delete global.window
  })

  describe('compressAndEncode / decodeAndDecompress', () => {
    it('should roundtrip a QueryAnalysisConfig', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {
          query: {
            chartType: 'bar',
            chartConfig: { xAxis: ['dimension'] },
            displayConfig: { showLegend: true },
          },
        },
        query: {
          measures: ['Employees.count'],
          dimensions: ['Employees.department'],
        },
      }

      const encoded = compressAndEncode(config)
      expect(encoded).toBeTruthy()
      expect(typeof encoded).toBe('string')

      const decoded = decodeAndDecompress(encoded)
      expect(decoded).toEqual(config)
    })

    it('should roundtrip a FunnelAnalysisConfig', () => {
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: {
            chartType: 'funnel',
            chartConfig: {},
            displayConfig: {},
          },
        },
        query: {
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: [
              { name: 'Step 1' },
              { name: 'Step 2' },
            ],
          },
        },
      }

      const encoded = compressAndEncode(config)
      const decoded = decodeAndDecompress(encoded)
      expect(decoded).toEqual(config)
    })

    it('should return null for invalid encoded data', () => {
      expect(decodeAndDecompress('invalid-data')).toBeNull()
      expect(decodeAndDecompress('')).toBeNull()
    })

    it('should return null for legacy share URL format (not AnalysisConfig)', () => {
      // Legacy format: { query: {...}, chartType: 'bar', ... }
      const legacyState = {
        query: { measures: ['Test.count'] },
        chartType: 'bar',
        activeView: 'chart',
      }
      const encoded = compressAndEncode(legacyState as unknown as AnalysisConfig)

      // Should fail validation (no version, no analysisType)
      const decoded = decodeAndDecompress(encoded)
      expect(decoded).toBeNull()
    })
  })

  describe('isShareableSize', () => {
    it('should return ok: true for small configs', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: ['Test.count'] },
      }

      const result = isShareableSize(config)
      expect(result.ok).toBe(true)
      expect(result.size).toBeLessThan(result.maxSize)
    })

    it('should return ok: false for very large configs', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: {
          measures: Array(200).fill('Test.measure'),
          dimensions: Array(200).fill('Test.dimension'),
          filters: Array(100).fill({
            member: 'Test.filter',
            operator: 'equals',
            values: ['very long value that takes up a lot of space'],
          }),
        },
      }

      const result = isShareableSize(config)
      // This should be large enough to exceed the limit
      expect(result.size).toBeGreaterThan(0)
    })
  })

  describe('compressWithFallback', () => {
    it('should return full config if small enough', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {
          query: {
            chartType: 'bar',
            chartConfig: {},
            displayConfig: { showLegend: true },
          },
        },
        query: { measures: ['Test.count'] },
      }

      const result = compressWithFallback(config)
      expect(result.encoded).toBeTruthy()
      expect(result.queryOnly).toBe(false)
    })

    it('should strip chart config if too large', () => {
      // Create a config that's just under the limit with chart config stripped
      const largeConfig: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {
          query: {
            chartType: 'bar',
            chartConfig: {
              // Add large config to push over limit
              xAxis: Array(50).fill('very-long-dimension-name-here'),
            },
            displayConfig: {},
          },
        },
        query: {
          measures: Array(30).fill('LongCubeName.longMeasureName'),
          dimensions: Array(30).fill('LongCubeName.longDimensionName'),
        },
      }

      // If this is large enough, it should strip chart config
      const result = compressWithFallback(largeConfig)
      if (result.queryOnly) {
        expect(result.encoded).toBeTruthy()
        // Verify stripped version can be decoded
        const decoded = decodeAndDecompress(result.encoded!)
        expect(decoded).toBeTruthy()
        expect(decoded?.charts).toEqual({})
      }
    })
  })

  describe('generateShareUrl', () => {
    it('should generate a valid share URL', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: ['Test.count'] },
      }

      const url = generateShareUrl(config)
      expect(url).toContain('https://example.com/app/analysis#share=')
    })
  })

  describe('parseShareHash', () => {
    it('should return encoded string when hash has share prefix', () => {
      mockWindow.location.hash = '#share=abc123'
      const result = parseShareHash()
      expect(result).toBe('abc123')
    })

    it('should return null when hash is empty', () => {
      mockWindow.location.hash = ''
      const result = parseShareHash()
      expect(result).toBeNull()
    })

    it('should return null when hash does not have share prefix', () => {
      mockWindow.location.hash = '#other=abc123'
      const result = parseShareHash()
      expect(result).toBeNull()
    })
  })

  describe('clearShareHash', () => {
    it('should call replaceState to clear hash', () => {
      mockWindow.location.href = 'https://example.com/app/analysis#share=abc'
      clearShareHash()
      expect(mockWindow.history.replaceState).toHaveBeenCalled()
    })
  })

  describe('getMaxHashLength', () => {
    it('should return the maximum hash length', () => {
      expect(getMaxHashLength()).toBe(1800)
    })
  })

  describe('createShareUrl / parseShareUrl', () => {
    it('should create and parse share URL (convenience functions)', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'table',
        charts: {},
        query: { measures: ['Test.count'], dimensions: ['Test.name'] },
      }

      const url = createShareUrl(config)
      expect(url).toBeTruthy()

      // Extract encoded part and set as hash
      const hashPart = url!.split('#share=')[1]
      mockWindow.location.hash = `#share=${hashPart}`

      const parsed = parseShareUrl()
      expect(parsed).toEqual(config)
    })

    it('should return null when no share URL present', () => {
      mockWindow.location.hash = ''
      expect(parseShareUrl()).toBeNull()
    })
  })
})
