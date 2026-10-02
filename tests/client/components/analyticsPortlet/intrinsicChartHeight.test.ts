/**
 * Tests for the portlet minimum-height exemption.
 *
 * The 200px floor stops a chart collapsing, but it overflows a card shorter
 * than that — content centred in the oversized box then renders near the bottom
 * and clips. Charts that are short by design opt out.
 */

import { describe, it, expect } from 'vitest'
import { hasIntrinsicChartHeight } from '../../../../src/client/components/analyticsPortlet/intrinsicChartHeight'

describe('hasIntrinsicChartHeight', () => {
  it('exempts chart types that size to their content', () => {
    expect(hasIntrinsicChartHeight('markdown')).toBe(true)
    expect(hasIntrinsicChartHeight('proportionBar')).toBe(true)
  })

  it('exempts KPI charts in the compact layout', () => {
    expect(hasIntrinsicChartHeight('kpiNumber', { layout: 'compact' })).toBe(true)
    expect(hasIntrinsicChartHeight('kpiDelta', { layout: 'compact' })).toBe(true)
  })

  it('keeps the floor for KPI charts in the default layout', () => {
    expect(hasIntrinsicChartHeight('kpiNumber', { layout: 'auto' })).toBe(false)
    expect(hasIntrinsicChartHeight('kpiNumber', {})).toBe(false)
    expect(hasIntrinsicChartHeight('kpiNumber')).toBe(false)
  })

  it('keeps the floor for ordinary charts', () => {
    expect(hasIntrinsicChartHeight('bar')).toBe(false)
    expect(hasIntrinsicChartHeight('line')).toBe(false)
    expect(hasIntrinsicChartHeight('table')).toBe(false)
  })

  it('ignores a stale compact layout left behind by a chart type change', () => {
    // setChartType carries the whole displayConfig across, so a portlet that
    // was a compact KPI still holds layout: 'compact' once it becomes a bar or
    // line chart. Honouring it there would strip the floor from a chart that
    // needs it, collapsing it in exactly the short rows this exemption exists
    // to fix.
    expect(hasIntrinsicChartHeight('bar', { layout: 'compact' })).toBe(false)
    expect(hasIntrinsicChartHeight('line', { layout: 'compact' })).toBe(false)
    expect(hasIntrinsicChartHeight('area', { layout: 'compact' })).toBe(false)
    expect(hasIntrinsicChartHeight('pie', { layout: 'compact' })).toBe(false)
  })

  it('exempts content-sized types regardless of layout', () => {
    expect(hasIntrinsicChartHeight('markdown', { layout: 'compact' })).toBe(true)
    expect(hasIntrinsicChartHeight('proportionBar', { layout: 'auto' })).toBe(true)
  })
})
