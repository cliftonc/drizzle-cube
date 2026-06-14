/**
 * Unit tests for resolveChartAxisFields — the shared axis-field resolver used
 * by the Cartesian charts (bar, line, area, pie).
 */

import { describe, it, expect } from 'vitest'
import { resolveChartAxisFields } from '../../../../src/client/components/charts/chartAxisResolution'

describe('resolveChartAxisFields', () => {
  describe('new format (xAxis / yAxis / series)', () => {
    it('resolves array xAxis/yAxis with series', () => {
      const result = resolveChartAxisFields({
        xAxis: ['Orders.createdAt'],
        yAxis: ['Sales.revenue', 'Sales.margin'],
        series: ['Products.category']
      })
      expect(result).toEqual({
        xAxisField: 'Orders.createdAt',
        yAxisFields: ['Sales.revenue', 'Sales.margin'],
        seriesFields: ['Products.category'],
        errorCode: null
      })
    })

    it('takes the first xAxis entry when multiple are provided', () => {
      const result = resolveChartAxisFields({
        xAxis: ['A', 'B'],
        yAxis: ['Sales.revenue']
      })
      expect(result.xAxisField).toBe('A')
      expect(result.errorCode).toBeNull()
    })

    it('handles non-array xAxis/yAxis (defensive)', () => {
      const result = resolveChartAxisFields({
        xAxis: 'Orders.createdAt' as unknown as string[],
        yAxis: 'Sales.revenue' as unknown as string[]
      })
      expect(result.xAxisField).toBe('Orders.createdAt')
      expect(result.yAxisFields).toEqual(['Sales.revenue'])
      expect(result.errorCode).toBeNull()
    })

    it('defaults seriesFields to an empty array when absent', () => {
      const result = resolveChartAxisFields({
        xAxis: ['x'],
        yAxis: ['y']
      })
      expect(result.seriesFields).toEqual([])
    })
  })

  describe('legacy format (x / y)', () => {
    it('resolves legacy x/y', () => {
      const result = resolveChartAxisFields({
        x: 'Orders.createdAt',
        y: ['Sales.revenue']
      })
      expect(result).toEqual({
        xAxisField: 'Orders.createdAt',
        yAxisFields: ['Sales.revenue'],
        seriesFields: [],
        errorCode: null
      })
    })

    it('wraps a non-array legacy y in an array', () => {
      const result = resolveChartAxisFields({
        x: 'Orders.createdAt',
        y: 'Sales.revenue' as unknown as string[]
      })
      expect(result.yAxisFields).toEqual(['Sales.revenue'])
      expect(result.errorCode).toBeNull()
    })
  })

  describe('error cases', () => {
    it('returns axisInvalid when config is undefined', () => {
      expect(resolveChartAxisFields(undefined).errorCode).toBe('axisInvalid')
    })

    it('returns axisInvalid for an empty config', () => {
      expect(resolveChartAxisFields({}).errorCode).toBe('axisInvalid')
    })

    it('returns axisInvalid when only yAxis is present', () => {
      const result = resolveChartAxisFields({ yAxis: ['Sales.revenue'] })
      expect(result.errorCode).toBe('axisInvalid')
    })

    it('returns axisInvalid when only xAxis is present', () => {
      const result = resolveChartAxisFields({ xAxis: ['Orders.createdAt'] })
      expect(result.errorCode).toBe('axisInvalid')
    })

    it('returns axisFields when yAxis is an empty array', () => {
      const result = resolveChartAxisFields({ xAxis: ['Orders.createdAt'], yAxis: [] })
      expect(result.errorCode).toBe('axisFields')
    })

    it('returns axisFields when xAxis is an empty array', () => {
      const result = resolveChartAxisFields({ xAxis: [], yAxis: ['Sales.revenue'] })
      expect(result.errorCode).toBe('axisFields')
    })
  })
})
