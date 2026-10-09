/**
 * Cell rendering and sorting for the records table — the pure half, where the
 * EAV-specific edge cases live (unparseable numerics, unmapped badge values).
 */

import { describe, expect, it } from 'vitest'
import {
  applyColumnOrder,
  columnWidthStorageKey,
  moveColumn,
  renderCellValue,
  sortRows
} from '../../../src/client/utils/recordsTableUtils'

describe('renderCellValue', () => {
  it('renders empty values as empty text regardless of format', () => {
    for (const value of [null, undefined, '']) {
      expect(renderCellValue(value, { kind: 'badge' })).toEqual({ kind: 'text', text: '' })
    }
  })

  it('formats numbers through the axis formatter', () => {
    expect(renderCellValue(1250, { kind: 'number', numberFormat: { unit: 'number', abbreviate: false, decimals: 0 } }))
      .toEqual({ kind: 'text', text: '1,250' })
  })

  it('leaves a non-numeric value as text under a number format', () => {
    // A numeric EAV attribute can legitimately hold 'n/a'.
    expect(renderCellValue('n/a', { kind: 'number' })).toEqual({ kind: 'text', text: 'n/a' })
  })

  it('maps a badge value to its palette index and leaves unmapped values without one', () => {
    const format = { kind: 'badge' as const, badgeColors: [{ value: 'At risk', colorIndex: 2 }] }
    expect(renderCellValue('At risk', format)).toEqual({ kind: 'badge', text: 'At risk', colorIndex: 2 })
    expect(renderCellValue('On track', format)).toEqual({ kind: 'badge', text: 'On track', colorIndex: undefined })
  })

  // A columnFormats entry can arrive from an agent tool call: an object map
  // keyed by value, and colour names instead of palette indices, are the shapes
  // models reach for. Neither should take the table down.
  it('renders a badge neutral when badgeColors is not the expected array', () => {
    const format = { kind: 'badge', badgeColors: { 'On track': 'green' } } as any

    expect(() => renderCellValue('On track', format)).not.toThrow()
    expect(renderCellValue('On track', format)).toEqual({
      kind: 'badge',
      text: 'On track',
      colorIndex: undefined
    })
  })

  it('ignores badge entries whose colorIndex is not a palette index', () => {
    const format = {
      kind: 'badge',
      badgeColors: [{ value: 'On track', colorIndex: 'green' }, { value: 'Blocked', colorIndex: 1 }]
    } as any

    expect(renderCellValue('On track', format)).toEqual({
      kind: 'badge',
      text: 'On track',
      colorIndex: undefined
    })
    expect(renderCellValue('Blocked', format)).toEqual({
      kind: 'badge',
      text: 'Blocked',
      colorIndex: 1
    })
  })

  it('clamps progress to its bounds at both ends', () => {
    const format = { kind: 'progress' as const, progressMin: 0, progressMax: 100 }
    expect(renderCellValue(-20, format)).toMatchObject({ fraction: 0 })
    expect(renderCellValue(150, format)).toMatchObject({ fraction: 1 })
    expect(renderCellValue(25, format)).toMatchObject({ fraction: 0.25 })
  })

  it('treats a zero-width progress range as full rather than dividing by zero', () => {
    expect(renderCellValue(5, { kind: 'progress', progressMin: 5, progressMax: 5 }))
      .toMatchObject({ fraction: 1 })
  })

  it('resolves the progress style, defaulting to the bar', () => {
    // The component only ever sees the rendered cell, so the style is decided here.
    expect(renderCellValue(50, { kind: 'progress' }))
      .toMatchObject({ kind: 'progress', style: 'bar' })
    expect(renderCellValue(50, { kind: 'progress', progressStyle: 'bar' }))
      .toMatchObject({ kind: 'progress', style: 'bar' })
    expect(renderCellValue(50, { kind: 'progress', progressStyle: 'circle' }))
      .toMatchObject({ kind: 'progress', style: 'circle' })
  })

  it('colours progress with the highest band at or below the value, whatever the written order', () => {
    const format = {
      kind: 'progress' as const,
      progressBands: [
        { value: 80, colorIndex: 1 },
        { value: 0, colorIndex: 3 },
        { value: 50, colorIndex: 2 }
      ]
    }
    expect(renderCellValue(20, format)).toMatchObject({ colorIndex: 3 })
    expect(renderCellValue(50, format)).toMatchObject({ colorIndex: 2 })
    expect(renderCellValue(79.5, format)).toMatchObject({ colorIndex: 2 })
    expect(renderCellValue('95', format)).toMatchObject({ colorIndex: 1 })
  })

  it('leaves progress below every band, or without bands, in the default colour', () => {
    const format = { kind: 'progress' as const, progressBands: [{ value: 50, colorIndex: 2 }] }
    expect(renderCellValue(10, format)).toMatchObject({ kind: 'progress', colorIndex: undefined })
    expect(renderCellValue(10, { kind: 'progress' })).toMatchObject({ kind: 'progress', colorIndex: undefined })
  })

  it('lets the band written last win a tied value', () => {
    const format = {
      kind: 'progress' as const,
      progressBands: [{ value: 50, colorIndex: 1 }, { value: 50, colorIndex: 2 }]
    }
    expect(renderCellValue(60, format)).toMatchObject({ colorIndex: 2 })
  })

  it('ignores progress bands that are not the expected shape', () => {
    // Agent-written or hand-edited configs: a map, a string bound, a colour
    // name, a fractional or negative index. None of them may colour a cell.
    expect(renderCellValue(60, { kind: 'progress', progressBands: { 50: 2 } } as any))
      .toMatchObject({ kind: 'progress', colorIndex: undefined })
    expect(renderCellValue(60, {
      kind: 'progress',
      progressBands: [
        { value: '10', colorIndex: 1 },
        { value: Number.NaN, colorIndex: 1 },
        { value: 20, colorIndex: 'green' },
        { value: 30, colorIndex: 1.5 },
        { value: 40, colorIndex: -1 },
        null,
        { value: 0, colorIndex: 0 }
      ]
    } as any)).toMatchObject({ kind: 'progress', colorIndex: 0 })
  })

  it('falls back to text for an unparseable progress value', () => {
    expect(renderCellValue('n/a', { kind: 'progress' })).toEqual({ kind: 'text', text: 'n/a' })
  })

  it('defaults to text when no format is configured', () => {
    expect(renderCellValue(true, undefined)).toEqual({ kind: 'text', text: 'true' })
  })
})

describe('sortRows', () => {
  const rows = [
    { value: '68' },
    { value: '100' },
    { value: '9' }
  ]

  it('compares numeric strings as numbers', () => {
    expect(sortRows(rows, 'value', 'asc').map(r => r.value)).toEqual(['9', '68', '100'])
    expect(sortRows(rows, 'value', 'desc').map(r => r.value)).toEqual(['100', '68', '9'])
  })

  it('compares non-numeric values as text', () => {
    const words = [{ value: 'On track' }, { value: 'At risk' }, { value: 'Blocked' }]
    expect(sortRows(words, 'value', 'asc').map(r => r.value)).toEqual(['At risk', 'Blocked', 'On track'])
  })

  it('sorts empty values last in both directions', () => {
    const sparse = [{ value: null }, { value: '5' }, { value: '' }, { value: '1' }]
    expect(sortRows(sparse, 'value', 'asc').slice(0, 2).map(r => r.value)).toEqual(['1', '5'])
    expect(sortRows(sparse, 'value', 'desc').slice(0, 2).map(r => r.value)).toEqual(['5', '1'])
  })

  it('does not mutate the input', () => {
    const original = [...rows]
    sortRows(rows, 'value', 'desc')
    expect(rows).toEqual(original)
  })
})

describe('columnWidthStorageKey', () => {
  it('is order-independent, so reordering columns keeps remembered widths', () => {
    expect(columnWidthStorageKey(['b', 'a'])).toBe(columnWidthStorageKey(['a', 'b']))
  })

  it('differs for different column sets', () => {
    expect(columnWidthStorageKey(['a', 'b'])).not.toBe(columnWidthStorageKey(['a', 'c']))
  })
})

describe('column ordering', () => {
  it('applies a remembered order', () => {
    expect(applyColumnOrder(['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual(['c', 'a', 'b'])
  })

  it('keeps a column the remembered order has never seen', () => {
    // The author added `d` after the viewer last rearranged; it must still show.
    expect(applyColumnOrder(['a', 'b', 'd'], ['b', 'a'])).toEqual(['b', 'a', 'd'])
  })

  it('ignores a remembered column that no longer exists', () => {
    expect(applyColumnOrder(['a', 'b'], ['gone', 'b', 'a'])).toEqual(['b', 'a'])
  })

  it('returns the columns unchanged with no remembered order', () => {
    const columns = ['a', 'b']
    expect(applyColumnOrder(columns, [])).toBe(columns)
  })

  it('moves a column to the target position', () => {
    expect(moveColumn(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
    expect(moveColumn(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a'])
  })

  it('is a no-op for an unknown or identical column', () => {
    const columns = ['a', 'b']
    expect(moveColumn(columns, 'a', 'a')).toBe(columns)
    expect(moveColumn(columns, 'zzz', 'a')).toBe(columns)
  })
})
