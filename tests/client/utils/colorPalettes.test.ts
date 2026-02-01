/**
 * Tests for colorPalettes utility
 * Covers palette retrieval, series/gradient colors, and chart type detection
 */

import { describe, it, expect } from 'vitest'
import {
  COLOR_PALETTES,
  getColorPalette,
  getSeriesColors,
  getGradientColors,
  SERIES_CHART_TYPES,
  GRADIENT_CHART_TYPES,
  usesGradientColors,
  type ColorPalette
} from '../../../src/client/utils/colorPalettes'

describe('colorPalettes', () => {
  describe('COLOR_PALETTES', () => {
    it('should export an array of palettes', () => {
      expect(Array.isArray(COLOR_PALETTES)).toBe(true)
      expect(COLOR_PALETTES.length).toBeGreaterThan(0)
    })

    it('should have a default palette as the first entry', () => {
      expect(COLOR_PALETTES[0].name).toBe('default')
      expect(COLOR_PALETTES[0].label).toBe('Default')
    })

    it('should have all required properties for each palette', () => {
      COLOR_PALETTES.forEach((palette: ColorPalette) => {
        expect(palette).toHaveProperty('name')
        expect(palette).toHaveProperty('label')
        expect(palette).toHaveProperty('colors')
        expect(palette).toHaveProperty('gradient')
        expect(typeof palette.name).toBe('string')
        expect(typeof palette.label).toBe('string')
        expect(Array.isArray(palette.colors)).toBe(true)
        expect(Array.isArray(palette.gradient)).toBe(true)
      })
    })

    it('should have valid hex colors in all palettes', () => {
      const hexColorPattern = /^#[0-9a-fA-F]{6}$/
      COLOR_PALETTES.forEach((palette: ColorPalette) => {
        palette.colors.forEach(color => {
          expect(color).toMatch(hexColorPattern)
        })
        palette.gradient.forEach(color => {
          expect(color).toMatch(hexColorPattern)
        })
      })
    })

    it('should have unique palette names', () => {
      const names = COLOR_PALETTES.map(p => p.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should include well-known palette sets', () => {
      const names = COLOR_PALETTES.map(p => p.name)
      expect(names).toContain('default')
      expect(names).toContain('ocean')
      expect(names).toContain('sunset')
      expect(names).toContain('viridis')
      expect(names).toContain('d3Category10')
    })
  })

  describe('getColorPalette', () => {
    it('should return default palette when no name provided', () => {
      const palette = getColorPalette()
      expect(palette.name).toBe('default')
    })

    it('should return default palette for undefined', () => {
      const palette = getColorPalette(undefined)
      expect(palette.name).toBe('default')
    })

    it('should return correct palette for valid name', () => {
      const palette = getColorPalette('ocean')
      expect(palette.name).toBe('ocean')
      expect(palette.label).toBe('Ocean')
    })

    it('should return default palette for invalid name', () => {
      const palette = getColorPalette('nonexistent-palette')
      expect(palette.name).toBe('default')
    })

    it('should return default palette for empty string', () => {
      const palette = getColorPalette('')
      expect(palette.name).toBe('default')
    })

    it('should return palette with colors and gradient arrays', () => {
      const palette = getColorPalette('sunset')
      expect(palette.colors.length).toBeGreaterThan(0)
      expect(palette.gradient.length).toBeGreaterThan(0)
    })
  })

  describe('getSeriesColors', () => {
    it('should return default series colors when no palette specified', () => {
      const colors = getSeriesColors()
      expect(colors).toEqual(COLOR_PALETTES[0].colors)
    })

    it('should return default series colors for undefined', () => {
      const colors = getSeriesColors(undefined)
      expect(colors).toEqual(COLOR_PALETTES[0].colors)
    })

    it('should return correct series colors for valid palette', () => {
      const colors = getSeriesColors('ocean')
      const oceanPalette = COLOR_PALETTES.find(p => p.name === 'ocean')
      expect(colors).toEqual(oceanPalette?.colors)
    })

    it('should return default colors for invalid palette name', () => {
      const colors = getSeriesColors('invalid')
      expect(colors).toEqual(COLOR_PALETTES[0].colors)
    })
  })

  describe('getGradientColors', () => {
    it('should return default gradient colors when no palette specified', () => {
      const colors = getGradientColors()
      expect(colors).toEqual(COLOR_PALETTES[0].gradient)
    })

    it('should return default gradient colors for undefined', () => {
      const colors = getGradientColors(undefined)
      expect(colors).toEqual(COLOR_PALETTES[0].gradient)
    })

    it('should return correct gradient colors for valid palette', () => {
      const colors = getGradientColors('viridis')
      const viridisPalette = COLOR_PALETTES.find(p => p.name === 'viridis')
      expect(colors).toEqual(viridisPalette?.gradient)
    })

    it('should return default gradient colors for invalid palette name', () => {
      const colors = getGradientColors('nonexistent')
      expect(colors).toEqual(COLOR_PALETTES[0].gradient)
    })
  })

  describe('SERIES_CHART_TYPES', () => {
    it('should contain common series-based chart types', () => {
      expect(SERIES_CHART_TYPES).toContain('bar')
      expect(SERIES_CHART_TYPES).toContain('line')
      expect(SERIES_CHART_TYPES).toContain('area')
      expect(SERIES_CHART_TYPES).toContain('pie')
      expect(SERIES_CHART_TYPES).toContain('scatter')
      expect(SERIES_CHART_TYPES).toContain('radar')
    })

    it('should be an array with expected length', () => {
      expect(Array.isArray(SERIES_CHART_TYPES)).toBe(true)
      expect(SERIES_CHART_TYPES.length).toBeGreaterThan(0)
    })
  })

  describe('GRADIENT_CHART_TYPES', () => {
    it('should contain gradient-based chart types', () => {
      expect(GRADIENT_CHART_TYPES).toContain('bubble')
      expect(GRADIENT_CHART_TYPES).toContain('activityGrid')
    })

    it('should be an array with expected length', () => {
      expect(Array.isArray(GRADIENT_CHART_TYPES)).toBe(true)
      expect(GRADIENT_CHART_TYPES.length).toBeGreaterThan(0)
    })
  })

  describe('usesGradientColors', () => {
    it('should return true for bubble chart', () => {
      expect(usesGradientColors('bubble')).toBe(true)
    })

    it('should return true for activityGrid chart', () => {
      expect(usesGradientColors('activityGrid')).toBe(true)
    })

    it('should return false for bar chart', () => {
      expect(usesGradientColors('bar')).toBe(false)
    })

    it('should return false for line chart', () => {
      expect(usesGradientColors('line')).toBe(false)
    })

    it('should return false for pie chart', () => {
      expect(usesGradientColors('pie')).toBe(false)
    })

    it('should return false for unknown chart type', () => {
      expect(usesGradientColors('unknown')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(usesGradientColors('')).toBe(false)
    })
  })

  describe('ColorPalette type', () => {
    it('should allow creation of custom palettes matching the interface', () => {
      const customPalette: ColorPalette = {
        name: 'custom',
        label: 'Custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        gradient: ['#ffffff', '#000000']
      }

      expect(customPalette.name).toBe('custom')
      expect(customPalette.colors).toHaveLength(3)
      expect(customPalette.gradient).toHaveLength(2)
    })
  })
})
