/**
 * Pure layout maths for portlet groups ("combination portlets").
 *
 * A group is a *reference* structure: it names portlet ids, it never contains
 * portlets. The portlets themselves stay flat in `DashboardConfig.portlets`, so
 * everything that iterates them by id - filters, debug data, refresh refs,
 * thumbnails - is unaffected by grouping.
 *
 * Depth is capped at two: cells along the group's `direction`, and a stack of
 * portlets inside each cell on the other axis. A perpendicular snap onto an
 * already-stacked portlet joins that stack rather than nesting further.
 *
 * Nothing here touches React.
 */

import type {
  DashboardGridSettings,
  PortletConfig,
  PortletGroup,
  PortletGroupCell,
  RowLayout,
  RowLayoutColumn
} from '../../types.js'
import { adjustRowWidths, equalizeColumns } from './layoutUtils.js'
export { deriveGroupGeometry, partitionUnits } from './groupGeometry.js'
export type { SnapEdge } from './groupGeometry.js'

import type { SnapEdge } from './groupGeometry.js'

export interface GroupLayoutState {
  rows: RowLayout[]
  groups: PortletGroup[]
}

/** Where a portlet currently lives within the rows/groups structure. */
export interface PortletLocation {
  rowIndex: number
  colIndex: number
  /** Set when the portlet lives inside a group rather than owning its column. */
  groupId?: string
  cellIndex?: number
  stackIndex?: number
}

let groupIdCounter = 0
export const createGroupId = () => `group-${Date.now()}-${(groupIdCounter += 1)}`

/** Portlet ids in visual order: cells along the main axis, stacks within each. */
export const groupPortletIds = (group: PortletGroup): string[] =>
  group.cells.flatMap((cell) => cell.portletIds)

const cloneGroup = (group: PortletGroup): PortletGroup => ({
  ...group,
  cells: group.cells.map((cell) => ({ ...cell, portletIds: [...cell.portletIds] }))
})

const cloneRows = (rows: RowLayout[]): RowLayout[] =>
  rows.map((row) => ({ ...row, columns: row.columns.map((column) => ({ ...column })) }))

/** Locate a portlet across rows and groups. Returns null when it is unplaced. */
export function findPortletLocation(
  rows: RowLayout[],
  groups: PortletGroup[],
  portletId: string
): PortletLocation | null {
  const groupsById = new Map(groups.map((group) => [group.id, group]))

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const { columns } = rows[rowIndex]
    for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
      const column = columns[colIndex]
      if (column.portletId === portletId) return { rowIndex, colIndex }
      if (!column.groupId) continue

      const group = groupsById.get(column.groupId)
      if (!group) continue
      for (let cellIndex = 0; cellIndex < group.cells.length; cellIndex += 1) {
        const stackIndex = group.cells[cellIndex].portletIds.indexOf(portletId)
        if (stackIndex !== -1) {
          return { rowIndex, colIndex, groupId: group.id, cellIndex, stackIndex }
        }
      }
    }
  }

  return null
}

/** Remove a portlet from whichever group holds it. Empty cells/groups are pruned. */
export function removeFromGroup(
  groups: PortletGroup[],
  portletId: string
): { groups: PortletGroup[]; groupId: string | null } {
  let groupId: string | null = null

  const next = groups.flatMap((group) => {
    if (!groupPortletIds(group).includes(portletId)) return [group]
    groupId = group.id

    const cells = group.cells
      .map((cell) => ({ ...cell, portletIds: cell.portletIds.filter((id) => id !== portletId) }))
      .filter((cell) => cell.portletIds.length > 0)

    return cells.length > 0 ? [{ ...group, cells }] : []
  })

  return { groups: next, groupId }
}

/**
 * Reconcile groups against the portlets that exist and the rows that host them.
 *
 * Returns rows as well as groups, because the two are coupled: collapsing a
 * one-portlet group has to rewrite its column back to a plain `portletId`, and
 * pruning a group has to remove its column. **Always run this before
 * `normalizeRows`** - otherwise `normalizeRows` sees a `groupId` column whose
 * group has just been emptied and renders a blank card.
 */
export function normalizeGroups(
  groups: PortletGroup[] | undefined,
  portlets: PortletConfig[],
  rows: RowLayout[],
  gridSettings: DashboardGridSettings
): GroupLayoutState {
  const portletIds = new Set(portlets.map((portlet) => portlet.id))

  // Pass 1 - drop dangling ids and empty cells; a portlet belongs to at most one
  // group, first mention wins.
  const claimedBy = new Map<string, string>()
  const cleaned: PortletGroup[] = []

  for (const group of groups ?? []) {
    const cells: PortletGroupCell[] = group.cells
      .map((cell) => ({
        portletIds: cell.portletIds.filter((id) => portletIds.has(id) && !claimedBy.has(id))
      }))
      .filter((cell) => cell.portletIds.length > 0)

    if (cells.length === 0) continue
    cells.forEach((cell) => cell.portletIds.forEach((id) => claimedBy.set(id, group.id)))
    cleaned.push({ ...group, cells })
  }

  if (cleaned.length === 0) {
    return { groups: [], rows }
  }

  const byId = new Map(cleaned.map((group) => [group.id, group]))

  // Pass 2 - decide each group's fate from how the rows reference it, before
  // rebuilding any columns.
  const hosted = new Set<string>()
  const collapsed = new Set<string>()
  for (const row of rows) {
    for (const column of row.columns) {
      if (!column.groupId) continue
      const group = byId.get(column.groupId)
      if (!group || hosted.has(group.id)) continue
      hosted.add(group.id)
      if (group.cells.length === 1 && group.cells[0].portletIds.length === 1) {
        collapsed.add(group.id)
      }
    }
  }

  const surviving = cleaned.filter((group) => hosted.has(group.id) && !collapsed.has(group.id))
  const survivingIds = new Set(surviving.map((group) => group.id))
  const ownedPortletIds = new Set(surviving.flatMap(groupPortletIds))

  // Pass 3 - rebuild the columns.
  const seenGroups = new Set<string>()
  let nextRows = rows.map((row) => ({
    ...row,
    columns: row.columns.flatMap((column): RowLayoutColumn[] => {
      if (column.groupId) {
        const group = byId.get(column.groupId)
        if (!group || seenGroups.has(group.id)) return []
        seenGroups.add(group.id)
        if (collapsed.has(group.id)) {
          return [{ portletId: group.cells[0].portletIds[0], w: column.w }]
        }
        if (!survivingIds.has(group.id)) return []
        return [{ groupId: group.id, w: column.w }]
      }

      if (!column.portletId) return []
      // A portlet owned by a surviving group must not also stand alone.
      if (ownedPortletIds.has(column.portletId)) return []
      return [{ portletId: column.portletId, w: column.w }]
    })
  }))

  // A group nothing hosts would make its portlets invisible. Give them a row of
  // their own rather than silently dropping them - but skip any that already
  // kept a standalone column, or they would appear twice.
  const placedPortletIds = new Set(
    nextRows.flatMap((row) => row.columns.map((column) => column.portletId).filter(Boolean))
  )
  const orphanedPortletIds = cleaned
    .filter((group) => !hosted.has(group.id))
    .flatMap(groupPortletIds)
    .filter((portletId) => !placedPortletIds.has(portletId))

  if (orphanedPortletIds.length > 0) {
    nextRows = [
      ...nextRows,
      {
        id: `row-orphans-${Date.now()}`,
        h: Math.max(gridSettings.minH, 3),
        columns: equalizeColumns(
          orphanedPortletIds.map((portletId) => ({ portletId, w: 0 })),
          gridSettings
        )
      }
    ]
  }

  nextRows = nextRows
    .map((row) => ({ ...row, columns: adjustRowWidths(row.columns, gridSettings) }))
    .filter((row) => row.columns.length > 0)

  return { groups: surviving, rows: nextRows }
}

const EDGE_AXIS: Record<SnapEdge, 'row' | 'column'> = {
  left: 'row',
  right: 'row',
  top: 'column',
  bottom: 'column'
}

const isLeadingEdge = (edge: SnapEdge) => edge === 'left' || edge === 'top'


/** Detach a portlet from its column or its group, leaving the rest intact. */
function detachPortlet(
  state: GroupLayoutState,
  portletId: string,
  gridSettings: DashboardGridSettings
): GroupLayoutState {
  const location = findPortletLocation(state.rows, state.groups, portletId)
  if (!location) return state

  if (location.groupId) {
    return { rows: state.rows, groups: removeFromGroup(state.groups, portletId).groups }
  }

  const rows = state.rows
    .map((row, rowIndex) => {
      if (rowIndex !== location.rowIndex) return row
      const columns = row.columns.filter((_, colIndex) => colIndex !== location.colIndex)
      return { ...row, columns: equalizeColumns(columns, gridSettings) }
    })
    .filter((row) => row.columns.length > 0)

  return { rows, groups: state.groups }
}

/**
 * Snap `movedPortletId` against an edge of `targetPortletId`.
 *
 * Left/right build a `row` group, top/bottom a `column` group. When the target
 * is already grouped, a snap along the group's main axis adds a cell, and a
 * perpendicular snap joins the target's stack (the depth-2 clamp).
 *
 * Returns null when the move is a no-op.
 */
export function snapIntoGroup(
  state: GroupLayoutState,
  movedPortletId: string,
  targetPortletId: string,
  edge: SnapEdge,
  gridSettings: DashboardGridSettings
): GroupLayoutState | null {
  if (movedPortletId === targetPortletId) return null
  if (!findPortletLocation(state.rows, state.groups, targetPortletId)) return null

  const detached = detachPortlet(
    { rows: cloneRows(state.rows), groups: state.groups.map(cloneGroup) },
    movedPortletId,
    gridSettings
  )

  const target = findPortletLocation(detached.rows, detached.groups, targetPortletId)
  if (!target) return null

  const axis = EDGE_AXIS[edge]
  const leading = isLeadingEdge(edge)

  // Target stands alone - wrap the pair in a brand new group.
  if (!target.groupId) {
    const group: PortletGroup = {
      id: createGroupId(),
      direction: axis,
      cells: (leading
        ? [movedPortletId, targetPortletId]
        : [targetPortletId, movedPortletId]
      ).map((portletId) => ({ portletIds: [portletId] }))
    }

    const rows = detached.rows.map((row, rowIndex) => {
      if (rowIndex !== target.rowIndex) return row
      return {
        ...row,
        columns: row.columns.map((column, colIndex) =>
          colIndex === target.colIndex ? { groupId: group.id, w: column.w } : column
        )
      }
    })

    return { rows, groups: [...detached.groups, group] }
  }

  // Target is already grouped.
  const groups = detached.groups.map((group) => {
    if (group.id !== target.groupId) return group

    const cells = group.cells.map((cell) => ({ ...cell, portletIds: [...cell.portletIds] }))

    if (axis === group.direction) {
      // Along the main axis: a new cell beside the target's cell.
      const insertAt = leading ? target.cellIndex! : target.cellIndex! + 1
      cells.splice(insertAt, 0, { portletIds: [movedPortletId] })
    } else {
      // Perpendicular: join the target's stack (depth-2 clamp).
      const stack = cells[target.cellIndex!].portletIds
      stack.splice(leading ? target.stackIndex! : target.stackIndex! + 1, 0, movedPortletId)
    }

    return { ...group, cells }
  })

  return { rows: detached.rows, groups }
}

/**
 * Dissolve a group, replacing its column with one column per member portlet in
 * visual order. The row is re-equalised afterwards.
 */
export function ungroup(
  state: GroupLayoutState,
  groupId: string,
  gridSettings: DashboardGridSettings
): GroupLayoutState {
  const group = state.groups.find((candidate) => candidate.id === groupId)
  if (!group) return state

  const portletIds = groupPortletIds(group)

  const rows = state.rows.map((row) => {
    if (!row.columns.some((column) => column.groupId === groupId)) return row
    const columns = row.columns.flatMap((column) =>
      column.groupId === groupId
        ? portletIds.map((portletId) => ({ portletId, w: 0 }))
        : [column]
    )
    return { ...row, columns: equalizeColumns(columns, gridSettings) }
  })

  return { rows, groups: state.groups.filter((candidate) => candidate.id !== groupId) }
}

/** Remove a group and every portlet id it holds. Callers delete the portlets. */
export function deleteGroup(
  state: GroupLayoutState,
  groupId: string,
  gridSettings: DashboardGridSettings
): { state: GroupLayoutState; removedPortletIds: string[] } {
  const group = state.groups.find((candidate) => candidate.id === groupId)
  if (!group) return { state, removedPortletIds: [] }

  const rows = state.rows
    .map((row) => {
      if (!row.columns.some((column) => column.groupId === groupId)) return row
      const columns = row.columns.filter((column) => column.groupId !== groupId)
      return { ...row, columns: equalizeColumns(columns, gridSettings) }
    })
    .filter((row) => row.columns.length > 0)

  return {
    state: { rows, groups: state.groups.filter((candidate) => candidate.id !== groupId) },
    removedPortletIds: groupPortletIds(group)
  }
}
