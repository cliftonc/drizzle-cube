/**
 * Tests for the pure-logic layer behind "portlet groups" (combination portlets).
 *
 * A group is a *reference* structure — it names portlet ids and never owns the
 * portlets themselves. That makes two invariants load-bearing: a portlet must
 * belong to at most one group, and it must never end up both inside a group and
 * standing alone in a row column. Depth is clamped at two, so a perpendicular
 * snap joins the target's stack rather than nesting a third level.
 */

import { describe, it, expect } from 'vitest'
import {
  deleteGroup,
  deriveGroupGeometry,
  findPortletLocation,
  groupPortletIds,
  normalizeGroups,
  partitionUnits,
  removeFromGroup,
  snapIntoGroup,
  ungroup
} from '../../../../src/client/hooks/dashboard/groupUtils'
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

const group = (
  id: string,
  direction: 'row' | 'column',
  cells: string[][],
): PortletGroup => ({
  id,
  direction,
  cells: cells.map((portletIds) => ({ portletIds }))
})

const totalWidth = (columns: RowLayoutColumn[]) => columns.reduce((sum, c) => sum + c.w, 0)

type Rect = { portletId: string; x: number; y: number; w: number; h: number }

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const expectNoOverlaps = (rects: Rect[]) => {
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      expect(overlaps(rects[i], rects[j])).toBe(false)
    }
  }
}

describe('partitionUnits', () => {
  it('sums exactly to the total when there is room for every entry', () => {
    for (const [total, weights] of [
      [12, [1, 1, 1]],
      [12, [1, 1, 1, 1, 1]],
      [7, [3, 1, 1]],
      [5, [1, 1, 1, 1, 1]]
    ] as Array<[number, number[]]>) {
      const result = partitionUnits(total, weights)
      expect(result).toHaveLength(weights.length)
      expect(result.reduce((sum, value) => sum + value, 0)).toBe(total)
      result.forEach((value) => expect(value).toBeGreaterThanOrEqual(1))
    }
  })

  it('never hands out less than one unit, overflowing when the total is too small', () => {
    // Accepted overflow: better a group that is one unit too wide than a portlet
    // rendered at zero size.
    expect(partitionUnits(2, [1, 1, 1])).toEqual([1, 1, 1])
    expect(partitionUnits(0, [1, 1])).toEqual([1, 1])
  })

  it('respects relative weights', () => {
    expect(partitionUnits(12, [1, 3])).toEqual([3, 9])
    expect(partitionUnits(12, [1, 1, 2])).toEqual([3, 3, 6])
  })

  it('returns an empty result for no weights', () => {
    expect(partitionUnits(12, [])).toEqual([])
  })
})

describe('deriveGroupGeometry', () => {
  it('splits a row group of single-portlet cells across the width', () => {
    const rects = deriveGroupGeometry(group('g1', 'row', [['a'], ['b'], ['c']]), 0, 0, 12, 4)

    expect(rects).toHaveLength(3)
    expect(rects.reduce((sum, rect) => sum + rect.w, 0)).toBe(12)
    rects.forEach((rect) => expect(rect.h).toBe(4))
    rects.forEach((rect) => expect(rect.y).toBe(0))
    expectNoOverlaps(rects)
  })

  it('stacks a row cell perpendicular to the main axis', () => {
    const rects = deriveGroupGeometry(group('g1', 'row', [['a'], ['b', 'c']]), 0, 0, 12, 4)
    const [a, b, c] = rects

    expect(rects).toHaveLength(3)
    // The stacked pair share their cell's width...
    expect(b.w).toBe(c.w)
    expect(b.x).toBe(c.x)
    expect(a.w + b.w).toBe(12)
    // ...and split its height.
    expect(b.h + c.h).toBe(4)
    expect(a.h).toBe(4)
    expectNoOverlaps(rects)
  })

  it('transposes for a column group', () => {
    const rects = deriveGroupGeometry(group('g1', 'column', [['a'], ['b'], ['c']]), 0, 0, 12, 6)

    expect(rects).toHaveLength(3)
    expect(rects.reduce((sum, rect) => sum + rect.h, 0)).toBe(6)
    rects.forEach((rect) => expect(rect.w).toBe(12))
    expectNoOverlaps(rects)
  })

  it('stacks a column cell across the width', () => {
    const rects = deriveGroupGeometry(group('g1', 'column', [['a'], ['b', 'c']]), 0, 0, 12, 6)
    const [a, b, c] = rects

    expect(b.h).toBe(c.h)
    expect(b.y).toBe(c.y)
    expect(b.w + c.w).toBe(12)
    expect(a.h + b.h).toBe(6)
    expect(a.w).toBe(12)
    expectNoOverlaps(rects)
  })

  it('honours the origin offset', () => {
    const rects = deriveGroupGeometry(group('g1', 'row', [['a'], ['b']]), 4, 3, 8, 5)

    expect(rects[0].x).toBe(4)
    expect(rects.every((rect) => rect.y === 3)).toBe(true)
    expect(rects[0].x + rects[0].w).toBe(rects[1].x)
    expect(rects[1].x + rects[1].w).toBe(12)
  })

  it('never emits a zero width or height, even in a cramped rectangle', () => {
    const cramped = group('g1', 'row', [['a'], ['b'], ['c', 'd', 'e']])
    const rects = deriveGroupGeometry(cramped, 0, 0, 2, 1)

    expect(rects).toHaveLength(5)
    rects.forEach((rect) => {
      expect(rect.w).toBeGreaterThan(0)
      expect(rect.h).toBeGreaterThan(0)
    })
  })

  it('returns nothing for a group with no populated cells', () => {
    expect(deriveGroupGeometry(group('g1', 'row', []), 0, 0, 12, 4)).toEqual([])
    expect(deriveGroupGeometry(group('g1', 'row', [[]]), 0, 0, 12, 4)).toEqual([])
  })
})

describe('normalizeGroups', () => {
  it('drops ids for portlets that no longer exist', () => {
    const rows = [row([{ groupId: 'g1', w: 12 }])]
    const groups = [group('g1', 'row', [['a'], ['b'], ['ghost', 'c']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b', 'c']), rows, GRID)

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['b'], ['c']])
  })

  it('drops cells emptied by missing portlets', () => {
    const rows = [row([{ groupId: 'g1', w: 12 }])]
    const groups = [group('g1', 'row', [['a'], ['ghost'], ['b', 'c']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b', 'c']), rows, GRID)

    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['b', 'c']])
  })

  it('collapses a group reduced to a single portlet back into a plain column', () => {
    const rows = [row([{ groupId: 'g1', w: 6 }, { portletId: 'b', w: 6 }])]
    const groups = [group('g1', 'row', [['a']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b']), rows, GRID)

    expect(result.groups).toEqual([])
    expect(result.rows[0].columns.map((column) => column.portletId)).toEqual(['a', 'b'])
    expect(result.rows[0].columns.every((column) => column.groupId === undefined)).toBe(true)
    expect(totalWidth(result.rows[0].columns)).toBe(GRID.cols)
  })

  it('lets the first group claim a portlet listed in two', () => {
    const rows = [row([{ groupId: 'g1', w: 6 }, { groupId: 'g2', w: 6 }])]
    const groups = [group('g1', 'row', [['a'], ['b']]), group('g2', 'row', [['b'], ['c'], ['d']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b', 'c', 'd']), rows, GRID)

    expect(result.groups).toHaveLength(2)
    expect(groupPortletIds(result.groups[0])).toEqual(['a', 'b'])
    expect(groupPortletIds(result.groups[1])).toEqual(['c', 'd'])
  })

  it('dissolves an unreferenced group into a new row rather than losing its portlets', () => {
    const rows = [row([{ portletId: 'c', w: 12 }])]
    const groups = [group('g1', 'row', [['a'], ['b']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b', 'c']), rows, GRID)

    expect(result.groups).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[1].columns.map((column) => column.portletId)).toEqual(['a', 'b'])
    expect(totalWidth(result.rows[1].columns)).toBe(GRID.cols)
  })

  it('does not leave a grouped portlet standing alone in its own column', () => {
    const rows = [
      row([{ groupId: 'g1', w: 6 }, { portletId: 'a', w: 3 }, { portletId: 'c', w: 3 }])
    ]
    const groups = [group('g1', 'row', [['a'], ['b']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b', 'c']), rows, GRID)

    expect(result.groups).toHaveLength(1)
    expect(result.rows[0].columns.map((column) => column.groupId ?? column.portletId)).toEqual([
      'g1',
      'c'
    ])
    expect(totalWidth(result.rows[0].columns)).toBe(GRID.cols)
  })

  it('keeps only the first column referencing a group', () => {
    const rows = [row([{ groupId: 'g1', w: 6 }, { groupId: 'g1', w: 6 }])]
    const groups = [group('g1', 'row', [['a'], ['b']])]

    const result = normalizeGroups(groups, makePortlets(['a', 'b']), rows, GRID)

    expect(result.rows[0].columns).toEqual([{ groupId: 'g1', w: 12 }])
  })

  it('returns no groups and untouched rows when every group is empty', () => {
    const rows = [row([{ groupId: 'g1', w: 12 }])]
    const groups = [group('g1', 'row', [['ghost']])]

    const result = normalizeGroups(groups, makePortlets(['a']), rows, GRID)

    // The dangling group column is left for normalizeRows to drop.
    expect(result.groups).toEqual([])
    expect(result.rows).toEqual(rows)
  })

  it('handles an undefined group list', () => {
    const rows = [row([{ portletId: 'a', w: 12 }])]
    const result = normalizeGroups(undefined, makePortlets(['a']), rows, GRID)

    expect(result.groups).toEqual([])
    expect(result.rows).toEqual(rows)
  })
})

describe('findPortletLocation', () => {
  const rows = [
    row([{ portletId: 'd', w: 6 }, { groupId: 'g1', w: 6 }], 'row-1'),
    row([{ portletId: 'e', w: 12 }], 'row-2')
  ]
  const groups = [group('g1', 'row', [['a'], ['b', 'c']])]

  it('finds a standalone column', () => {
    expect(findPortletLocation(rows, groups, 'd')).toEqual({ rowIndex: 0, colIndex: 0 })
    expect(findPortletLocation(rows, groups, 'e')).toEqual({ rowIndex: 1, colIndex: 0 })
  })

  it('finds a grouped portlet with its cell and stack position', () => {
    expect(findPortletLocation(rows, groups, 'a')).toEqual({
      rowIndex: 0,
      colIndex: 1,
      groupId: 'g1',
      cellIndex: 0,
      stackIndex: 0
    })
    expect(findPortletLocation(rows, groups, 'c')).toEqual({
      rowIndex: 0,
      colIndex: 1,
      groupId: 'g1',
      cellIndex: 1,
      stackIndex: 1
    })
  })

  it('returns null for an unknown portlet', () => {
    expect(findPortletLocation(rows, groups, 'nope')).toBeNull()
    expect(findPortletLocation([], [], 'a')).toBeNull()
  })

  it('returns null when the hosting group is missing', () => {
    expect(findPortletLocation(rows, [], 'a')).toBeNull()
  })
})

describe('removeFromGroup', () => {
  it('removes the leaf and reports the group it came from', () => {
    const groups = [group('g1', 'row', [['a'], ['b', 'c']])]
    const result = removeFromGroup(groups, 'c')

    expect(result.groupId).toBe('g1')
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['b']])
  })

  it('prunes a cell emptied by the removal', () => {
    const groups = [group('g1', 'row', [['a'], ['b'], ['c']])]
    const result = removeFromGroup(groups, 'b')

    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['c']])
  })

  it('removes the whole group when the last portlet leaves', () => {
    const groups = [group('g1', 'row', [['a']]), group('g2', 'row', [['b'], ['c']])]
    const result = removeFromGroup(groups, 'a')

    expect(result.groupId).toBe('g1')
    expect(result.groups.map((g) => g.id)).toEqual(['g2'])
  })

  it('is a no-op for an ungrouped portlet', () => {
    const groups = [group('g1', 'row', [['a'], ['b']])]
    const result = removeFromGroup(groups, 'z')

    expect(result.groupId).toBeNull()
    expect(result.groups).toEqual(groups)
  })
})

describe('snapIntoGroup', () => {
  const twoStandalone = () => ({
    rows: [row([{ portletId: 'a', w: 6 }, { portletId: 'b', w: 6 }])],
    groups: [] as PortletGroup[]
  })

  it('returns null when a portlet is snapped onto itself', () => {
    expect(snapIntoGroup(twoStandalone(), 'a', 'a', 'right', GRID)).toBeNull()
  })

  it('returns null for an unknown target', () => {
    expect(snapIntoGroup(twoStandalone(), 'a', 'ghost', 'right', GRID)).toBeNull()
  })

  it('wraps two standalone portlets into a row group on a right snap', () => {
    const result = snapIntoGroup(twoStandalone(), 'b', 'a', 'right', GRID)!

    expect(result.groups).toHaveLength(1)
    const created = result.groups[0]
    expect(created.direction).toBe('row')
    expect(created.cells.map((cell) => cell.portletIds)).toEqual([['a'], ['b']])

    // The row now carries a single group column; b's old column is gone.
    expect(result.rows[0].columns).toHaveLength(1)
    expect(result.rows[0].columns[0].groupId).toBe(created.id)
    expect(result.rows[0].columns[0].portletId).toBeUndefined()
    expect(totalWidth(result.rows[0].columns)).toBe(GRID.cols)
  })

  it('puts the moved portlet first on a left snap', () => {
    const result = snapIntoGroup(twoStandalone(), 'b', 'a', 'left', GRID)!

    expect(result.groups[0].direction).toBe('row')
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['b'], ['a']])
  })

  it('builds a column group on a bottom snap', () => {
    const result = snapIntoGroup(twoStandalone(), 'b', 'a', 'bottom', GRID)!

    expect(result.groups[0].direction).toBe('column')
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['b']])
  })

  it('builds a column group with the moved portlet first on a top snap', () => {
    const result = snapIntoGroup(twoStandalone(), 'b', 'a', 'top', GRID)!

    expect(result.groups[0].direction).toBe('column')
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['b'], ['a']])
  })

  const groupPlusStandalone = () => ({
    rows: [row([{ groupId: 'g1', w: 8 }, { portletId: 'c', w: 4 }])],
    groups: [group('g1', 'row', [['a'], ['b']])]
  })

  it('adds a cell to an existing group when snapping along its main axis', () => {
    const result = snapIntoGroup(groupPlusStandalone(), 'c', 'a', 'right', GRID)!

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].id).toBe('g1')
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['c'], ['b']])

    expect(result.rows[0].columns).toHaveLength(1)
    expect(result.rows[0].columns[0].groupId).toBe('g1')
  })

  it('inserts before the target cell when snapping onto its leading edge', () => {
    const result = snapIntoGroup(groupPlusStandalone(), 'c', 'b', 'left', GRID)!

    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['c'], ['b']])
  })

  it('joins the target stack on a perpendicular snap (the 1:2 shape)', () => {
    const result = snapIntoGroup(groupPlusStandalone(), 'c', 'b', 'bottom', GRID)!

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].direction).toBe('row')
    // Depth-2 clamp: no nested group, the target's cell just becomes a stack.
    expect(result.groups[0].cells).toHaveLength(2)
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['b', 'c']])
  })

  it('stacks above the target on a perpendicular leading snap', () => {
    const result = snapIntoGroup(groupPlusStandalone(), 'c', 'b', 'top', GRID)!

    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['a'], ['c', 'b']])
  })

  it('detaches a grouped portlet from its old group before re-snapping it', () => {
    const state = {
      rows: [row([{ groupId: 'g1', w: 6 }, { portletId: 'd', w: 6 }])],
      groups: [group('g1', 'row', [['a'], ['b']])]
    }

    const result = snapIntoGroup(state, 'a', 'd', 'right', GRID)!

    expect(result.groups).toHaveLength(2)
    const old = result.groups.find((g) => g.id === 'g1')!
    expect(groupPortletIds(old)).toEqual(['b'])

    const created = result.groups.find((g) => g.id !== 'g1')!
    expect(created.cells.map((cell) => cell.portletIds)).toEqual([['d'], ['a']])
    expect(result.rows[0].columns[1].groupId).toBe(created.id)
  })

  it('removes the old group entirely when the detach empties it', () => {
    const state = {
      rows: [row([{ groupId: 'g1', w: 6 }, { portletId: 'd', w: 6 }])],
      groups: [group('g1', 'column', [['a']])]
    }

    const result = snapIntoGroup(state, 'a', 'd', 'right', GRID)!

    expect(result.groups).toHaveLength(1)
    expect(result.groups.some((g) => g.id === 'g1')).toBe(false)
    expect(result.groups[0].cells.map((cell) => cell.portletIds)).toEqual([['d'], ['a']])
  })

  it('does not mutate the input state', () => {
    const state = twoStandalone()
    const before = JSON.parse(JSON.stringify(state))

    snapIntoGroup(state, 'b', 'a', 'right', GRID)

    expect(state).toEqual(before)
  })
})

describe('ungroup', () => {
  it('replaces the group column with one column per member in visual order', () => {
    const state = {
      rows: [row([{ groupId: 'g1', w: 12 }])],
      groups: [group('g1', 'row', [['a'], ['b', 'c']])]
    }

    const result = ungroup(state, 'g1', GRID)

    expect(result.groups).toEqual([])
    expect(result.rows[0].columns.map((column) => column.portletId)).toEqual(['a', 'b', 'c'])
    expect(totalWidth(result.rows[0].columns)).toBe(GRID.cols)
  })

  it('re-equalises the whole row, keeping sibling columns', () => {
    const state = {
      rows: [row([{ groupId: 'g1', w: 8 }, { portletId: 'd', w: 4 }])],
      groups: [group('g1', 'row', [['a'], ['b']])]
    }

    const result = ungroup(state, 'g1', GRID)

    expect(result.rows[0].columns.map((column) => column.portletId)).toEqual(['a', 'b', 'd'])
    expect(totalWidth(result.rows[0].columns)).toBe(GRID.cols)
  })

  it('is a no-op for an unknown group', () => {
    const state = { rows: [row([{ portletId: 'a', w: 12 }])], groups: [] }
    expect(ungroup(state, 'nope', GRID)).toBe(state)
  })
})

describe('deleteGroup', () => {
  it('returns the member ids and removes the group column', () => {
    const state = {
      rows: [row([{ groupId: 'g1', w: 6 }, { portletId: 'd', w: 6 }])],
      groups: [group('g1', 'row', [['a'], ['b', 'c']])]
    }

    const result = deleteGroup(state, 'g1', GRID)

    expect(result.removedPortletIds).toEqual(['a', 'b', 'c'])
    expect(result.state.groups).toEqual([])
    expect(result.state.rows[0].columns).toEqual([{ portletId: 'd', w: 12 }])
  })

  it('drops a row left with no columns', () => {
    const state = {
      rows: [row([{ groupId: 'g1', w: 12 }], 'row-1'), row([{ portletId: 'd', w: 12 }], 'row-2')],
      groups: [group('g1', 'row', [['a'], ['b']])]
    }

    const result = deleteGroup(state, 'g1', GRID)

    expect(result.state.rows.map((r) => r.id)).toEqual(['row-2'])
  })

  it('is a no-op for an unknown group', () => {
    const state = { rows: [row([{ portletId: 'a', w: 12 }])], groups: [] }
    const result = deleteGroup(state, 'nope', GRID)

    expect(result.removedPortletIds).toEqual([])
    expect(result.state).toBe(state)
  })
})
