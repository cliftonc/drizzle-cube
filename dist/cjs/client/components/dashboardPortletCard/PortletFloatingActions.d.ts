import { default as React } from 'react';
import { PortletConfig } from '../../types.js';
import { CardIcons } from './EditActionButtons.js';
interface PortletFloatingActionsProps {
    portlet: PortletConfig;
    icons: CardIcons;
    /** Show the edit-only actions (drag, filter config, duplicate, edit, delete). */
    showEditActions: boolean;
    copyAvailable: boolean;
    copySuccess: boolean;
    xlsExportAvailable: boolean;
    exportInProgress: boolean;
    onRefresh: (options?: {
        bustCache?: boolean;
    }) => void;
    onCopyToClipboard: (event: React.MouseEvent | React.TouchEvent) => void;
    onExportXlsx: (event: React.MouseEvent | React.TouchEvent) => void;
    onOpenFilterConfig: () => void;
    onDuplicate: () => void;
    onEdit: () => void;
    onDelete: () => void;
}
export default function PortletFloatingActions({ portlet, icons, showEditActions, copyAvailable, copySuccess, xlsExportAvailable, exportInProgress, onRefresh, onCopyToClipboard, onExportXlsx, onOpenFilterConfig, onDuplicate, onEdit, onDelete }: PortletFloatingActionsProps): React.JSX.Element;
export {};
