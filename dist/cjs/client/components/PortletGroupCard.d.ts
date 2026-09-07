import { DragEvent, HTMLAttributes, ReactNode } from 'react';
import { PortletConfig, PortletGroup } from '../types.js';
export interface PortletGroupCardProps {
    group: PortletGroup;
    portlets: Map<string, PortletConfig>;
    canEdit: boolean;
    /** Renders one child portlet with group chrome (no border, no header). */
    renderChild: (portlet: PortletConfig, wrapperProps: HTMLAttributes<HTMLDivElement>) => ReactNode;
    onRename: (groupId: string, title: string) => void;
    onUngroup: (groupId: string) => void;
    onDelete: (groupId: string) => void;
    /** Fired when a child starts being dragged out of, or around within, the group. */
    onChildDragStart: (groupId: string, portletId: string, event: DragEvent<HTMLDivElement>) => void;
    onChildDragEnd: () => void;
    /** Snap bands rendered inside each child; supplied by the row layout. */
    renderSnapBands?: (portletId: string) => ReactNode;
    /** Set inside a section card, which draws the only frame for the whole band. */
    frameless?: boolean;
}
export default function PortletGroupCard({ group, portlets, canEdit, renderChild, onRename, onUngroup, onDelete, onChildDragStart, onChildDragEnd, renderSnapBands, frameless }: PortletGroupCardProps): import("react").JSX.Element;
