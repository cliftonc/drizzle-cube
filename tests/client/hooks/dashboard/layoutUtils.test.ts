/**
 * Tests for the row-layout maths, focused on the places portlet groups changed
 * the contract.
 *
 * Two regressions are pinned here because both fail silently rather than
 * throwing: re-equalising a row used to rebuild columns from portlet ids alone
 * (dropping `groupId`), and `normalizeRows` used to treat a column with no
 * `portletId` as dead — deleting the group column and, with it, the whole row.
 */

import { describe, it, expect } from 'vitest'
import {
  adjustInsertIndexForRemovedRow,
  adjustRowWidths,
  convertPortletsToRows,
  convertRowsToPortlets,
  equalizeColumns,
  equalizeRowColumns,
  normalizeRows
} from '../../../../src/client/hooks/dashboard/layoutUtils'
import type {
  DashboardGridSettings,
  PortletConfig,
  PortletGroup,
  RowLayout,
  RowLayoutColumn
} from '../../../../src/client/types'

const GRID: DashboardGridSettings = { cols: 12, rowHeight: 80, minW: 2, minH: 1 }

const makePortlets = (ids: string[]): PortletConfig[] =>
  ids.map((id, index) => ({ id, title: id, w: 3, h: 3, x: index * 3, y: 0 }))

const row = (columns: RowLayoutColumn[], id = 'row-1', h = 4): RowLayout => ({ id, h, columns })

const group = (id: string, direction: 'row' | 'column', cells: string[][]): PortletGroup => ({
  id,
  direction,
  cells: cells.map((portletIds) => ({ portletIds }))
})

const totalWidth = (columns: RowLayoutColumn[]) => columns.reduce((sum, c) => sum + c.w, 0)

const byId = (portlets: PortletConfig[], id: string) => portlets.find((p) => p.id === id)!

describe('equalizeColumns', () => {
  it('spreads the full width across the columns', () => {
    const result = equalizeColumns(
      [{ portletId: 'a', w: 0 }, { portletId: 'b', w: 0 }, { portletId: 'c', w: 0 }],
      GRID
    )

    expect(totalWidth(result)).toBe(GRID.cols)
    expect(result.map((column) => column.w)).toEqual([4, 4, 4])
  })

  it('distributes the remainder to the leading columns', () => {
    const result = equalizeColumns(
      [{ portletId: 'a', w: 0 }, { portletId: 'b', w: 0 }, { portletId: 'c', w: 0 }, { portletId: 'd', w: 0 }, { portletId: 'e', w: 0 }],
      GRID
    )

    expect(result.map((column) => column.w)).toEqual([3, 3, 2, 2, 2])
    expect(totalWidth(result)).toBe(GRID.cols)
  })

  it('preserves groupId as well as portletId', () => {
    // The regression: rebuilding columns from ids alone silently dropped the
    // group reference and orphaned every portlet inside it.
    const result = equalizeColumns([{ groupId: 'g1', w: 0 }, { portletId: 'a', w: 0 }], GRID)

    expect(result[0].groupId).toBe('g1')
    expect(result[0].portletId).toBeUndefined()
    expect(result[1].portletId).toBe('a')
    expect(result[1].groupId).toBeUndefined()
    expect(totalWidth(result)).toBe(GRID.cols)
  })

  it('never sizes a column below one unit when minW cannot be honoured', () => {
    const columns = Array.from({ length: 7 }, (_, index) => ({ portletId: `p${index}`, w: 0 }))
    const result = equalizeColumns(columns, GRID)

    expect(result).toHaveLength(7)
    expect(totalWidth(result)).toBe(GRID.cols)
    result.forEach((column) => expect(column.w).toBeGreaterThanOrEqual(1))
    expect(result.map((column) => column.portletId)).toEqual(columns.map((c) => c.portletId))
  })

  it('returns an empty list for no columns', () => {
    expect(equalizeColumns([], GRID)).toEqual([])
  })
})

describe('equalizeRowColumns', () => {
  it('still builds evenly-sized portlet columns from ids', () => {
    expect(equalizeRowColumns(['a', 'b'], GRID)).toEqual([
      { portletId: 'a', w: 6 },
      { portletId: 'b', w: 6 }
    ])
    expect(equalizeRowColumns([], GRID)).toEqual([])
  })
})

describe('adjustRowWidths', () => {
  it('grows narrow columns up to the full width, preserving groupId', () => {
    const result = adjustRowWidths([{ groupId: 'g1', w: 1 }, { portletId: 'a', w: 1 }], GRID)

    expect(totalWidth(result)).toBe(GRID.cols)
    expect(result[0].groupId).toBe('g1')
    expect(result[1].portletId).toBe('a')
  })

  it('clamps each column to minW', () => {
    const result = adjustRowWidths([{ portletId: 'a', w: 0 }, { portletId: 'b', w: 10 }], GRID)

    expect(result[0].w).toBeGreaterThanOrEqual(GRID.minW)
    expect(totalWidth(result)).toBe(GRID.cols)
  })

  it('shrinks an over-wide row from the right, never below minW', () => {
    const result = adjustRowWidths(
      [{ portletId: 'a', w: 8 }, { portletId: 'b', w: 8 }, { portletId: 'c', w: 8 }],
      GRID
    )

    expect(totalWidth(result)).toBe(GRID.cols)
    result.forEach((column) => expect(column.w).toBeGreaterThanOrEqual(GRID.minW))
  })

  it('leaves an already-exact row alone', () => {
    const columns = [{ portletId: 'a', w: 6 }, { groupId: 'g1', w: 6 }]
    expect(adjustRowWidths(columns, GRID)).toEqual(columns)
  })

  it('returns an empty list for no columns', () => {
    expect(adjustRowWidths([], GRID)).toEqual([])
  })
})

describe('normalizeRows', () => {
  it('keeps a group column when its group is passed in', () => {
    // The regression: without the groups argument this column had no portletId,
    // was treated as dead, and took the entire row with it.
    const rows = [row([{ groupId: 'g1', w: 6 }, { portletId: 'c', w: 6 }])]
    const groups = [group('g1', 'row', [['a'], ['b']])]

    const result = normalizeRows(rows, makePortlets(['a', 'b', 'c']), GRID, groups)

    expect(result).toHaveLength(1)
    expect(result[0].columns.map((column) => column.groupId ?? column.portletId)).toEqual([
      'g1',
      'c'
    ])
    expect(totalWidth(result[0].columns)).toBe(GRID.cols)
  })

  it('drops a group column whose group is gone, and the row with it', () => {
    const rows = [row([{ groupId: 'g1', w: 12 }])]

    expect(normalizeRows(rows, makePortlets(['a', 'b']), GRID, [])).toEqual([])
    // Same result when the caller omits the groups argument entirely.
    expect(normalizeRows(rows, makePortlets(['a', 'b']), GRID)).toEqual([])
  })

  it('drops a column whose portlet no longer exists', () => {
    const rows = [row([{ portletId: 'a', w: 6 }, { portletId: 'gone', w: 6 }])]

    const result = normalizeRows(rows, makePortlets(['a']), GRID)

    expect(result[0].columns.map((column) => column.portletId)).toEqual(['a'])
    expect(totalWidth(result[0].columns)).toBe(GRID.cols)
  })

  it('clamps row height to minH', () => {
    const rows = [{ id: 'row-1', h: 0, columns: [{ portletId: 'a', w: 12 }] }]

    expect(normalizeRows(rows, makePortlets(['a']), GRID)[0].h).toBe(GRID.minH)
    expect(normalizeRows(rows, makePortlets(['a']), { ...GRID, minH: 3 })[0].h).toBe(3)
  })

  it('leaves a taller row alone', () => {
    const rows = [row([{ portletId: 'a', w: 12 }], 'row-1', 7)]
    expect(normalizeRows(rows, makePortlets(['a']), GRID)[0].h).toBe(7)
  })
})

describe('convertRowsToPortlets', () => {
  it('gives every grouped child real grid coordinates', () => {
    const rows = [row([{ groupId: 'g1', w: 12 }], 'row-1', 4)]
    const groups = [group('g1', 'row', [['a'], ['b', 'c']])]

    const result = convertRowsToPortlets(rows, makePortlets(['a', 'b', 'c']), groups)

    expect(byId(result, 'a')).toMatchObject({ x: 0, y: 0, w: 6, h: 4 })
    expect(byId(result, 'b')).toMatchObject({ x: 6, y: 0, w: 6, h: 2 })
    expect(byId(result, 'c')).toMatchObject({ x: 6, y: 2, w: 6, h: 2 })
  })

  it('advances x past a group column so later columns land correctly', () => {
    // The regression: an early return after handling the group left currentX at
    // the group's start, stacking the next portlet on top of it.
    const rows = [row([{ groupId: 'g1', w: 6 }, { portletId: 'd', w: 6 }], 'row-1', 4)]
    const groups = [group('g1', 'row', [['a'], ['b']])]

    const result = convertRowsToPortlets(rows, makePortlets(['a', 'b', 'd']), groups)

    expect(byId(result, 'a')).toMatchObject({ x: 0, w: 3 })
    expect(byId(result, 'b')).toMatchObject({ x: 3, w: 3 })
    expect(byId(result, 'd')).toMatchObject({ x: 6, y: 0, w: 6, h: 4 })
  })

  it('advances x even when the group is missing', () => {
    const rows = [row([{ groupId: 'missing', w: 6 }, { portletId: 'd', w: 6 }], 'row-1', 4)]

    const result = convertRowsToPortlets(rows, makePortlets(['d']), [])

    expect(byId(result, 'd')).toMatchObject({ x: 6, y: 0, w: 6, h: 4 })
  })

  it('stacks rows vertically by accumulated row height', () => {
    const rows = [
      row([{ portletId: 'a', w: 12 }], 'row-1', 4),
      row([{ portletId: 'b', w: 12 }], 'row-2', 3)
    ]

    const result = convertRowsToPortlets(rows, makePortlets(['a', 'b']))

    expect(byId(result, 'a')).toMatchObject({ y: 0, h: 4 })
    expect(byId(result, 'b')).toMatchObject({ y: 4, h: 3 })
  })

  it('keeps the existing coordinates of portlets no row references', () => {
    const portlets = makePortlets(['a', 'orphan'])
    const rows = [row([{ portletId: 'a', w: 12 }])]

    const result = convertRowsToPortlets(rows, portlets, [])

    expect(result).toHaveLength(2)
    expect(byId(result, 'orphan')).toEqual(byId(portlets, 'orphan'))
  })

  it('does not mutate the input portlets', () => {
    const portlets = makePortlets(['a'])
    convertRowsToPortlets([row([{ portletId: 'a', w: 12 }])], portlets)

    expect(portlets[0]).toMatchObject({ x: 0, y: 0, w: 3, h: 3 })
  })
})

describe('convertPortletsToRows', () => {
  it('groups portlets by y and orders each row by x', () => {
    const portlets: PortletConfig[] = [
      { id: 'b', title: 'b', x: 6, y: 0, w: 6, h: 4 },
      { id: 'a', title: 'a', x: 0, y: 0, w: 6, h: 4 },
      { id: 'c', title: 'c', x: 0, y: 4, w: 12, h: 3 }
    ]

    const rows = convertPortletsToRows(portlets, GRID)

    expect(rows).toHaveLength(2)
    expect(rows[0].columns.map((column) => column.portletId)).toEqual(['a', 'b'])
    expect(rows[1].columns.map((column) => column.portletId)).toEqual(['c'])
    expect(totalWidth(rows[0].columns)).toBe(GRID.cols)
  })

  it('takes each row height from its tallest portlet, floored at minH', () => {
    const portlets: PortletConfig[] = [
      { id: 'a', title: 'a', x: 0, y: 0, w: 6, h: 4 },
      { id: 'b', title: 'b', x: 6, y: 0, w: 6, h: 7 },
      { id: 'c', title: 'c', x: 0, y: 9, w: 12, h: 0 }
    ]

    const rows = convertPortletsToRows(portlets, { ...GRID, minH: 2 })

    expect(rows[0].h).toBe(7)
    expect(rows[1].h).toBe(2)
  })

  it('returns no rows for no portlets', () => {
    expect(convertPortletsToRows([], GRID)).toEqual([])
  })
})

describe('fractional sizing (freeform / half-unit resize)', () => {
  const GRID = { cols: 12, rowHeight: 80, minW: 2, minH: 1 }

  it('adjustRowWidths leaves fractional widths alone when they already fill the row', () => {
    const columns = [
      { portletId: 'a', w: 5.5 },
      { portletId: 'b', w: 6.5 }
    ]

    const adjusted = adjustRowWidths(columns, GRID)

    expect(adjusted.map(c => c.w)).toEqual([5.5, 6.5])
  })

  it('adjustRowWidths absorbs float drift so the row stays exactly cols wide', () => {
    const columns = [
      { portletId: 'a', w: 4.000000001 },
      { portletId: 'b', w: 3.999999998 },
      { portletId: 'c', w: 4 }
    ]

    const total = adjustRowWidths(columns, GRID).reduce((sum, c) => sum + c.w, 0)

    expect(total).toBe(12)
  })

  it('convertRowsToPortlets rounds fractional columns into whole, non-overlapping grid units', () => {
    const portlets = [
      { id: 'a', title: 'A', w: 0, h: 0, x: 0, y: 0 },
      { id: 'b', title: 'B', w: 0, h: 0, x: 0, y: 0 },
      { id: 'c', title: 'C', w: 0, h: 0, x: 0, y: 0 }
    ]
    const rows = [
      {
        id: 'row-1',
        h: 2.5,
        columns: [
          { portletId: 'a', w: 3.5 },
          { portletId: 'b', w: 4.25 },
          { portletId: 'c', w: 4.25 }
        ]
      }
    ]

    const result = convertRowsToPortlets(rows, portlets)
    const byId = new Map(result.map(p => [p.id, p]))

    for (const p of result) {
      expect(Number.isInteger(p.x)).toBe(true)
      expect(Number.isInteger(p.w)).toBe(true)
      expect(Number.isInteger(p.h)).toBe(true)
      expect(p.w).toBeGreaterThanOrEqual(1)
    }

    // Tiles the row exactly: each starts where the previous one ended.
    const a = byId.get('a')!
    const b = byId.get('b')!
    const c = byId.get('c')!
    expect(a.x).toBe(0)
    expect(b.x).toBe(a.x + a.w)
    expect(c.x).toBe(b.x + b.w)
    expect(c.x + c.w).toBe(12)
  })

  it('convertRowsToPortlets rounds a fractional row height', () => {
    const portlets = [{ id: 'a', title: 'A', w: 0, h: 0, x: 0, y: 0 }]
    const rows = [{ id: 'row-1', h: 2.5, columns: [{ portletId: 'a', w: 12 }] }]

    expect(convertRowsToPortlets(rows, portlets)[0].h).toBe(3)
  })
})

describe('adjustInsertIndexForRemovedRow', () => {
  it('should shift the index up when the emptied source row sat above it', () => {
    // Row 0 was the group's only column, so dropping onto row 3's top edge has
    // to land at 2 once row 0 is spliced out - otherwise it lands one row low.
    expect(adjustInsertIndexForRemovedRow(3, 0, true)).toBe(2)
  })

  it('should leave the index alone when the source row sat below it', () => {
    expect(adjustInsertIndexForRemovedRow(1, 4, true)).toBe(1)
  })

  it('should leave the index alone when the source row survived', () => {
    expect(adjustInsertIndexForRemovedRow(3, 0, false)).toBe(3)
  })

  it('should leave an index equal to the source row alone', () => {
    // Dropping a sole-column row onto its own position is already a no-op move.
    expect(adjustInsertIndexForRemovedRow(2, 2, true)).toBe(2)
  })
})
