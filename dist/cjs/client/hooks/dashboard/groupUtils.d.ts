import { DashboardGridSettings, PortletConfig, PortletGroup, RowLayout } from '../../types.js';
import { SnapEdge } from './groupGeometry.js';
export { deriveGroupGeometry, partitionUnits } from './groupGeometry.js';
export type { SnapEdge } from './groupGeometry.js';
export interface GroupLayoutState {
    rows: RowLayout[];
    groups: PortletGroup[];
}
/** Where a portlet currently lives within the rows/groups structure. */
export interface PortletLocation {
    rowIndex: number;
    colIndex: number;
    /** Set when the portlet lives inside a group rather than owning its column. */
    groupId?: string;
    cellIndex?: number;
    stackIndex?: number;
}
export declare const createGroupId: () => string;
/** Portlet ids in visual order: cells along the main axis, stacks within each. */
export declare const groupPortletIds: (group: PortletGroup) => string[];
/** Locate a portlet across rows and groups. Returns null when it is unplaced. */
export declare function findPortletLocation(rows: RowLayout[], groups: PortletGroup[], portletId: string): PortletLocation | null;
/** Remove a portlet from whichever group holds it. Empty cells/groups are pruned. */
export declare function removeFromGroup(groups: PortletGroup[], portletId: string): {
    groups: PortletGroup[];
    groupId: string | null;
};
/**
 * Reconcile groups against the portlets that exist and the rows that host them.
 *
 * Returns rows as well as groups, because the two are coupled: collapsing a
 * one-portlet group has to rewrite its column back to a plain `portletId`, and
 * pruning a group has to remove its column. **Always run this before
 * `normalizeRows`** - otherwise `normalizeRows` sees a `groupId` column whose
 * group has just been emptied and renders a blank card.
 */
export declare function normalizeGroups(groups: PortletGroup[] | undefined, portlets: PortletConfig[], rows: RowLayout[], gridSettings: DashboardGridSettings): GroupLayoutState;
/**
 * Snap `movedPortletId` against an edge of `targetPortletId`.
 *
 * Left/right build a `row` group, top/bottom a `column` group. When the target
 * is already grouped, a snap along the group's main axis adds a cell, and a
 * perpendicular snap joins the target's stack (the depth-2 clamp).
 *
 * Returns null when the move is a no-op.
 */
export declare function snapIntoGroup(state: GroupLayoutState, movedPortletId: string, targetPortletId: string, edge: SnapEdge, gridSettings: DashboardGridSettings): GroupLayoutState | null;
/**
 * Dissolve a group, replacing its column with one column per member portlet in
 * visual order. The row is re-equalised afterwards.
 */
export declare function ungroup(state: GroupLayoutState, groupId: string, gridSettings: DashboardGridSettings): GroupLayoutState;
/** Remove a group and every portlet id it holds. Callers delete the portlets. */
export declare function deleteGroup(state: GroupLayoutState, groupId: string, gridSettings: DashboardGridSettings): {
    state: GroupLayoutState;
    removedPortletIds: string[];
};
