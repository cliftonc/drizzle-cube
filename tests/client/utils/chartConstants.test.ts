/**
 * Tests for chartConstants utility
 * Covers chart colors, margins, and color constants
 */

import { describe, it, expect } from 'vitest'
import {
  CHART_COLORS,
  CHART_COLORS_GRADIENT,
  POSITIVE_COLOR,
  NEGATIVE_COLOR,
  CHART_MARGINS,
  RESPONSIVE_CHART_MARGINS
} from '../../../src/client/utils/chartConstants'

describe('chartConstants', () => {
  describe('CHART_COLORS', () => {
    it('should export an array of color strings', () => {
      expect(Array.isArray(CHART_COLORS)).toBe(true)
      expect(CHART_COLORS.length).toBeGreaterThan(0)
    })

    it('should contain valid hex color codes', () => {
      const hexColorPattern = /^#[0-9a-fA-F]{6}$/
      CHART_COLORS.forEach(color => {
        expect(color).toMatch(hexColorPattern)
      })
    })

    it('should have 8 colors for sufficient series differentiation', () => {
      expect(CHART_COLORS).toHaveLength(8)
    })

    it('should contain distinct colors', () => {
      const uniqueColors = new Set(CHART_COLORS)
      expect(uniqueColors.size).toBe(CHART_COLORS.length)
    })
  })

  describe('CHART_COLORS_GRADIENT', () => {
    it('should export an array of gradient color strings', () => {
      expect(Array.isArray(CHART_COLORS_GRADIENT)).toBe(true)
      expect(CHART_COLORS_GRADIENT.length).toBeGreaterThan(0)
    })

    it('should contain valid hex color codes', () => {
      const hexColorPattern = /^#[0-9a-fA-F]{6}$/
      CHART_COLORS_GRADIENT.forEach(color => {
        expect(color).toMatch(hexColorPattern)
      })
    })

    it('should have 6 colors for gradient scales', () => {
      expect(CHART_COLORS_GRADIENT).toHaveLength(6)
    })

    it('should contain distinct colors', () => {
      const uniqueColors = new Set(CHART_COLORS_GRADIENT)
      expect(uniqueColors.size).toBe(CHART_COLORS_GRADIENT.length)
    })
  })

  describe('POSITIVE_COLOR', () => {
    it('should be a valid hex color code', () => {
      expect(POSITIVE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should be a green color for positive values', () => {
      expect(POSITIVE_COLOR).toBe('#10b981')
    })
  })

  describe('NEGATIVE_COLOR', () => {
    it('should be a valid hex color code', () => {
      expect(NEGATIVE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should be a red color for negative values', () => {
      expect(NEGATIVE_COLOR).toBe('#ef4444')
    })
  })

  describe('CHART_MARGINS', () => {
    it('should have all required margin properties', () => {
      expect(CHART_MARGINS).toHaveProperty('top')
      expect(CHART_MARGINS).toHaveProperty('right')
      expect(CHART_MARGINS).toHaveProperty('left')
      expect(CHART_MARGINS).toHaveProperty('bottom')
    })

    it('should have positive numeric margin values', () => {
      expect(typeof CHART_MARGINS.top).toBe('number')
      expect(typeof CHART_MARGINS.right).toBe('number')
      expect(typeof CHART_MARGINS.left).toBe('number')
      expect(typeof CHART_MARGINS.bottom).toBe('number')

      expect(CHART_MARGINS.top).toBeGreaterThanOrEqual(0)
      expect(CHART_MARGINS.right).toBeGreaterThanOrEqual(0)
      expect(CHART_MARGINS.left).toBeGreaterThanOrEqual(0)
      expect(CHART_MARGINS.bottom).toBeGreaterThanOrEqual(0)
    })

    it('should have expected default values', () => {
      expect(CHART_MARGINS.top).toBe(5)
      expect(CHART_MARGINS.right).toBe(30)
      expect(CHART_MARGINS.left).toBe(20)
      expect(CHART_MARGINS.bottom).toBe(5)
    })
  })

  describe('RESPONSIVE_CHART_MARGINS', () => {
    it('should have all required margin properties', () => {
      expect(RESPONSIVE_CHART_MARGINS).toHaveProperty('top')
      expect(RESPONSIVE_CHART_MARGINS).toHaveProperty('right')
      expect(RESPONSIVE_CHART_MARGINS).toHaveProperty('left')
      expect(RESPONSIVE_CHART_MARGINS).toHaveProperty('bottom')
    })

    it('should have positive numeric margin values', () => {
      expect(typeof RESPONSIVE_CHART_MARGINS.top).toBe('number')
      expect(typeof RESPONSIVE_CHART_MARGINS.right).toBe('number')
      expect(typeof RESPONSIVE_CHART_MARGINS.left).toBe('number')
      expect(typeof RESPONSIVE_CHART_MARGINS.bottom).toBe('number')
    })

    it('should have larger bottom margin than standard for rotated labels', () => {
      expect(RESPONSIVE_CHART_MARGINS.bottom).toBeGreaterThan(CHART_MARGINS.bottom)
    })

    it('should have expected default values', () => {
      expect(RESPONSIVE_CHART_MARGINS.top).toBe(5)
      expect(RESPONSIVE_CHART_MARGINS.right).toBe(30)
      expect(RESPONSIVE_CHART_MARGINS.left).toBe(20)
      expect(RESPONSIVE_CHART_MARGINS.bottom).toBe(60)
    })
  })
})
