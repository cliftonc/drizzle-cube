/**
 * Tests for section banding: which rows form a section under a markdown header.
 */

import { describe, it, expect } from 'vitest'
import {
  computeRowBands,
  isSectionHeaderRow,
  isAutoHeightMarkdownPortlet,
  headerHasBottomRule
} from '../../../../src/client/components/rowManagedLayout/sections'
import type { PortletConfig, RowLayout } from '../../../../src/client/types'

let seq = 0
function portlet(overrides: Partial<PortletConfig> = {}): PortletConfig {
  return {
    id: `portlet-${seq++}`,
    title: 'Test Portlet',
    query: JSON.stringify({ measures: ['Test.count'] }),
    chartType: 'bar',
    x: 0, y: 0, w: 12, h: 4,
    ...overrides
  }
}

const markdown = (overrides: Partial<PortletConfig> = {}) =>
  portlet({ chartType: 'markdown', displayConfig: { autoHeight: true }, ...overrides })

function row(columns: RowLayout['columns']): RowLayout {
  return { id: `row-${seq++}`, h: 4, columns }
}

const full = (p: PortletConfig) => row([{ portletId: p.id, w: 12 }])
const half = (a: PortletConfig, b: PortletConfig) =>
  row([{ portletId: a.id, w: 6 }, { portletId: b.id, w: 6 }])

const mapOf = (...ps: PortletConfig[]) => new Map(ps.map(p => [p.id, p]))

describe('isAutoHeightMarkdownPortlet', () => {
  it('is true for markdown defaulting to autoHeight', () => {
    expect(isAutoHeightMarkdownPortlet(portlet({ chartType: 'markdown' }))).toBe(true)
  })

  it('is false when autoHeight is explicitly off', () => {
    expect(isAutoHeightMarkdownPortlet(markdown({ displayConfig: { autoHeight: false } }))).toBe(false)
  })

  it('is false for a chart', () => {
    expect(isAutoHeightMarkdownPortlet(portlet())).toBe(false)
  })
})

describe('isSectionHeaderRow', () => {
  it('accepts a lone full-width auto-height markdown row', () => {
    const header = markdown()
    expect(isSectionHeaderRow(full(header), mapOf(header), 12)).toBe(true)
  })

  it('rejects a markdown row narrower than the grid', () => {
    const header = markdown()
    const other = markdown()
    expect(isSectionHeaderRow(half(header, other), mapOf(header, other), 12)).toBe(false)
  })

  it('rejects a group column', () => {
    expect(isSectionHeaderRow(row([{ groupId: 'group-1', w: 12 }]), new Map(), 12)).toBe(false)
  })

  it('rejects a chart portlet', () => {
    const chart = portlet()
    expect(isSectionHeaderRow(full(chart), mapOf(chart), 12)).toBe(false)
  })

  it('rejects markdown with autoHeight off', () => {
    const fixed = markdown({ displayConfig: { autoHeight: false } })
    expect(isSectionHeaderRow(full(fixed), mapOf(fixed), 12)).toBe(false)
  })
})

describe('computeRowBands', () => {
  it('leaves rows before the first header loose', () => {
    const chart = portlet()
    const header = markdown()
    const body = portlet()
    const rows = [full(chart), full(header), full(body)]
    const bands = computeRowBands(rows, mapOf(chart, header, body), 12)

    expect(bands).toEqual([
      { kind: 'loose', rowIndex: 0 },
      { kind: 'section', headerRowIndex: 1, bodyRowIndices: [2] }
    ])
  })

  it('absorbs every row up to the next header', () => {
    const h1 = markdown(), a = portlet(), b = portlet()
    const h2 = markdown(), c = portlet()
    const rows = [full(h1), full(a), full(b), full(h2), full(c)]
    const bands = computeRowBands(rows, mapOf(h1, a, b, h2, c), 12)

    expect(bands).toEqual([
      { kind: 'section', headerRowIndex: 0, bodyRowIndices: [1, 2] },
      { kind: 'section', headerRowIndex: 3, bodyRowIndices: [4] }
    ])
  })

  it('leaves a header with no body row loose, so a trailing note is unchanged', () => {
    const header = markdown(), chart = portlet()
    const rows = [full(chart), full(header)]
    const bands = computeRowBands(rows, mapOf(chart, header), 12)

    expect(bands).toEqual([
      { kind: 'loose', rowIndex: 0 },
      { kind: 'loose', rowIndex: 1 }
    ])
  })

  it('leaves back-to-back headers loose until one has content', () => {
    const h1 = markdown(), h2 = markdown(), body = portlet()
    const rows = [full(h1), full(h2), full(body)]
    const bands = computeRowBands(rows, mapOf(h1, h2, body), 12)

    expect(bands).toEqual([
      { kind: 'loose', rowIndex: 0 },
      { kind: 'section', headerRowIndex: 1, bodyRowIndices: [2] }
    ])
  })

  it('returns all-loose bands for a dashboard with no markdown at all', () => {
    const a = portlet(), b = portlet()
    const bands = computeRowBands([full(a), full(b)], mapOf(a, b), 12)
    expect(bands).toEqual([
      { kind: 'loose', rowIndex: 0 },
      { kind: 'loose', rowIndex: 1 }
    ])
  })
})

describe('headerHasBottomRule', () => {
  it('detects the accentBorder bottom display option', () => {
    expect(headerHasBottomRule(portlet({
      chartType: 'markdown',
      displayConfig: { autoHeight: true, accentBorder: 'bottom' }
    }))).toBe(true)
  })

  it.each(['none', 'left', 'top'] as const)('ignores accentBorder %s', (accentBorder) => {
    expect(headerHasBottomRule(portlet({
      chartType: 'markdown',
      displayConfig: { autoHeight: true, accentBorder }
    }))).toBe(false)
  })

  const withContent = (content: string) =>
    portlet({
      chartType: 'markdown',
      displayConfig: { autoHeight: true, content }
    })

  it.each([
    ['dashes', '# Title\n\nSome text\n\n---'],
    ['asterisks', '# Title\n***'],
    ['underscores', '# Title\n___'],
    ['spaced dashes', '# Title\n- - -'],
    ['trailing newlines', '# Title\n\n---\n\n']
  ])('detects a trailing rule (%s)', (_label, content) => {
    expect(headerHasBottomRule(withContent(content))).toBe(true)
  })

  it.each([
    ['no rule', '# Title\n\nSome text'],
    ['rule not last', '# Title\n\n---\n\nMore text'],
    ['too few dashes', '# Title\n--'],
    ['a list item', '# Title\n- one'],
    ['empty', '']
  ])('returns false when there is no trailing rule (%s)', (_label, content) => {
    expect(headerHasBottomRule(withContent(content))).toBe(false)
  })

  it('returns false when there is no content at all', () => {
    expect(headerHasBottomRule(markdown())).toBe(false)
  })
})
