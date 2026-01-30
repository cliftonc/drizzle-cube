/**
 * Tests for targetUtils
 * Covers target value parsing, spreading, and variance calculations for chart target lines
 */

import { describe, it, expect } from 'vitest'
import {
  parseTargetValues,
  spreadTargetValues,
  calculateVariance,
  formatVariance,
  getUniqueTargets
} from '../../../src/client/utils/targetUtils'

describe('targetUtils', () => {
  describe('parseTargetValues', () => {
    it('should parse a single target value', () => {
      expect(parseTargetValues('100')).toEqual([100])
    })

    it('should parse multiple comma-separated values', () => {
      expect(parseTargetValues('50,75,100')).toEqual([50, 75, 100])
    })

    it('should handle decimal values', () => {
      expect(parseTargetValues('10.5,20.75')).toEqual([10.5, 20.75])
    })

    it('should handle negative values', () => {
      expect(parseTargetValues('-10,0,10')).toEqual([-10, 0, 10])
    })

    it('should trim whitespace around values', () => {
      expect(parseTargetValues(' 100 , 200 , 300 ')).toEqual([100, 200, 300])
    })

    it('should return empty array for empty string', () => {
      expect(parseTargetValues('')).toEqual([])
    })

    it('should return empty array for whitespace-only string', () => {
      expect(parseTargetValues('   ')).toEqual([])
    })

    it('should return empty array for null', () => {
      expect(parseTargetValues(null as unknown as string)).toEqual([])
    })

    it('should return empty array for undefined', () => {
      expect(parseTargetValues(undefined as unknown as string)).toEqual([])
    })

    it('should return empty array for non-string input', () => {
      expect(parseTargetValues(123 as unknown as string)).toEqual([])
    })

    it('should return empty array for invalid numeric values', () => {
      // Invalid values cause the entire parse to fail
      expect(parseTargetValues('abc')).toEqual([])
    })

    it('should filter out empty segments from trailing comma', () => {
      expect(parseTargetValues('100,200,')).toEqual([100, 200])
    })

    it('should filter out empty segments from leading comma', () => {
      expect(parseTargetValues(',100,200')).toEqual([100, 200])
    })
  })

  describe('spreadTargetValues', () => {
    describe('single target value', () => {
      it('should repeat single value for all data points', () => {
        expect(spreadTargetValues([100], 5)).toEqual([100, 100, 100, 100, 100])
      })

      it('should handle single data point', () => {
        expect(spreadTargetValues([100], 1)).toEqual([100])
      })
    })

    describe('multiple target values', () => {
      it('should spread values evenly across data points', () => {
        // 2 targets, 6 data points -> 3 each
        expect(spreadTargetValues([50, 100], 6)).toEqual([50, 50, 50, 100, 100, 100])
      })

      it('should handle uneven distribution', () => {
        // 2 targets, 5 data points -> first gets 3, second gets 2
        expect(spreadTargetValues([50, 100], 5)).toEqual([50, 50, 50, 100, 100])
      })

      it('should spread three targets across data points', () => {
        // 3 targets, 9 data points -> 3 each
        expect(spreadTargetValues([25, 50, 75], 9)).toEqual([25, 25, 25, 50, 50, 50, 75, 75, 75])
      })

      it('should handle more targets than data points', () => {
        // 5 targets, 3 data points -> first 3 targets get 1 each
        expect(spreadTargetValues([10, 20, 30, 40, 50], 3)).toEqual([10, 20, 30])
      })

      it('should handle equal targets and data points', () => {
        expect(spreadTargetValues([1, 2, 3], 3)).toEqual([1, 2, 3])
      })
    })

    describe('edge cases', () => {
      it('should return empty array for empty targets', () => {
        expect(spreadTargetValues([], 5)).toEqual([])
      })

      it('should return empty array for zero data length', () => {
        expect(spreadTargetValues([100], 0)).toEqual([])
      })

      it('should return empty array for negative data length', () => {
        expect(spreadTargetValues([100], -1)).toEqual([])
      })
    })
  })

  describe('calculateVariance', () => {
    it('should calculate positive variance', () => {
      // actual 120, target 100 -> 20% above target
      expect(calculateVariance(120, 100)).toBe(20)
    })

    it('should calculate negative variance', () => {
      // actual 80, target 100 -> 20% below target
      expect(calculateVariance(80, 100)).toBe(-20)
    })

    it('should handle exact match (zero variance)', () => {
      expect(calculateVariance(100, 100)).toBe(0)
    })

    it('should handle zero target with positive actual', () => {
      // When target is 0 and actual is positive, return 100
      expect(calculateVariance(50, 0)).toBe(100)
    })

    it('should handle zero target with negative actual', () => {
      // When target is 0 and actual is negative, return -100
      expect(calculateVariance(-50, 0)).toBe(-100)
    })

    it('should handle both zero', () => {
      expect(calculateVariance(0, 0)).toBe(0)
    })

    it('should handle decimal values', () => {
      // actual 1.1, target 1.0 -> 10% above
      expect(calculateVariance(1.1, 1.0)).toBeCloseTo(10, 1)
    })

    it('should handle negative target', () => {
      // actual -80, target -100: ((-80 - -100) / -100) * 100 = (20 / -100) * 100 = -20%
      // Variance is negative because actual is "higher" (less negative) than target,
      // but the target itself is negative, so the percentage is inverted
      expect(calculateVariance(-80, -100)).toBe(-20)
    })
  })

  describe('formatVariance', () => {
    it('should format positive variance with plus sign', () => {
      expect(formatVariance(12.5)).toBe('+12.5%')
    })

    it('should format negative variance with minus sign', () => {
      expect(formatVariance(-8.3)).toBe('-8.3%')
    })

    it('should format zero variance with plus sign', () => {
      expect(formatVariance(0)).toBe('+0.0%')
    })

    it('should respect custom decimal places', () => {
      expect(formatVariance(12.567, 2)).toBe('+12.57%')
      expect(formatVariance(12.567, 0)).toBe('+13%')
    })

    it('should handle large values', () => {
      expect(formatVariance(150.5)).toBe('+150.5%')
    })
  })

  describe('getUniqueTargets', () => {
    it('should return unique values sorted ascending', () => {
      expect(getUniqueTargets([100, 50, 100, 75, 50])).toEqual([50, 75, 100])
    })

    it('should handle single value', () => {
      expect(getUniqueTargets([100])).toEqual([100])
    })

    it('should handle empty array', () => {
      expect(getUniqueTargets([])).toEqual([])
    })

    it('should handle all same values', () => {
      expect(getUniqueTargets([100, 100, 100])).toEqual([100])
    })

    it('should sort negative values correctly', () => {
      expect(getUniqueTargets([10, -5, 0, 5])).toEqual([-5, 0, 5, 10])
    })
  })
})
