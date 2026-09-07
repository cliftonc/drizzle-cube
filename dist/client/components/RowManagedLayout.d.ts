import { HTMLAttributes, ReactNode, MouseEvent, DragEvent } from 'react';
import { DashboardGridSettings, PortletConfig, PortletGroup, RowLayout } from '../types.js';
import { SnapEdge } from '../hooks/dashboard/groupUtils.js';
import { PortletCardVariant } from './dashboardPortletCard/cardStyles.js';
interface RowManagedLayoutProps {
    rows: RowLayout[];
    portlets: PortletConfig[];
    groups?: PortletGroup[];
    gridSettings: DashboardGridSettings;
    gridWidth: number;
    canEdit: boolean;
    isDragging: boolean;
    onRowResize: (rowIndex: number, event: MouseEvent<HTMLDivElement>) => void;
    onColumnResize: (rowIndex: number, columnIndex: number, event: MouseEvent<HTMLDivElement>) => void;
    onPortletDragStart: (rowIndex: number, columnIndex: number, portletId: string, event: DragEvent<HTMLDivElement>, 
    /** Set when the whole column is a group being moved, not a single portlet. */
    groupId?: string) => void;
    onPortletDragEnd: () => void;
    onRowDrop: (rowIndex: number, insertIndex: number | null) => void;
    onNewRowDrop: (insertIndex: number) => void;
    /** Snap the dragged portlet against `edge` of `targetPortletId`. */
    onSnapDrop?: (targetPortletId: string, edge: SnapEdge) => void;
    /** Id of the portlet currently being dragged, so it can ignore its own bands. */
    draggingPortletId?: string | null;
    /** Id of the group currently being dragged, so its members ignore their bands. */
    draggingGroupId?: string | null;
    renderPortlet: (portlet: PortletConfig, containerProps?: HTMLAttributes<HTMLDivElement>, headerProps?: HTMLAttributes<HTMLDivElement>, variant?: PortletCardVariant) => ReactNode;
    /** Renders a group column. Omitted in contexts that have no groups. */
    renderGroup?: (group: PortletGroup, renderSnapBands: (portletId: string) => ReactNode, 
    /** Set inside a section, where the section card draws the only frame. */
    frameless?: boolean) => ReactNode;
}
export default function RowManagedLayout({ rows, portlets, groups, gridSettings, gridWidth, canEdit, isDragging, onRowResize, onColumnResize, onPortletDragStart, onPortletDragEnd, onRowDrop, onNewRowDrop, onSnapDrop, draggingPortletId, draggingGroupId, renderPortlet, renderGroup }: RowManagedLayoutProps): import("react").JSX.Element;
export {};
