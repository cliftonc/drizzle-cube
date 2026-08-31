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
