import { DashboardGridSettings, PortletConfig, PortletGroup, RowLayout, RowLayoutColumn } from '../../types.js';
export declare const createRowId: () => string;
/**
 * Correct a row insertion index for a source row that the move emptied.
 *
 * Splicing the source row out shifts every later index up by one, so an
 * unadjusted index lands the row one position too low. `handleRowDrop` has
 * always done this for column moves; new-row drops need it too, and hit it more
 * often, because a group is usually the only column in its row.
 */
export declare const adjustInsertIndexForRemovedRow: (insertIndex: number, sourceRowIndex: number, sourceRowRemoved: boolean) => number;
/**
 * Distribute `cols` evenly across the given columns, preserving each column's
 * identity (`portletId` **or** `groupId`) so re-equalisation never drops a group
 * reference. This is the function to use; `equalizeRowColumns` below is the
 * legacy id-only wrapper.
 */
export declare const equalizeColumns: (columns: RowLayoutColumn[], gridSettings: DashboardGridSettings) => RowLayoutColumn[];
/**
 * @deprecated Loses `groupId`. Use {@link equalizeColumns} with the real columns.
 */
export declare const equalizeRowColumns: (portletIds: string[], gridSettings: DashboardGridSettings) => RowLayoutColumn[];
export declare const adjustRowWidths: (columns: RowLayoutColumn[], gridSettings: DashboardGridSettings) => RowLayoutColumn[];
export declare const convertPortletsToRows: (portlets: PortletConfig[], gridSettings: DashboardGridSettings) => RowLayout[];
/**
 * Drop columns whose target no longer exists, clamp row height, re-balance
 * widths. `groups` must be the already-normalized group list - a column
 * referencing a group is kept only when that group survives, so run
 * `normalizeGroups` first.
 */
export declare const normalizeRows: (rows: RowLayout[], portlets: PortletConfig[], gridSettings: DashboardGridSettings, groups?: PortletGroup[]) => RowLayout[];
/**
 * Re-derive every portlet's x/y/w/h from the row layout. Group columns are
 * subdivided via `deriveGroupGeometry`, so grouped children get real grid
 * coordinates too - that is what keeps grid mode, the mobile stack and
 * thumbnails working without any knowledge of groups.
 */
export declare const convertRowsToPortlets: (rows: RowLayout[], portlets: PortletConfig[], groups?: PortletGroup[]) => PortletConfig[];
