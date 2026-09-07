import { default as React, CSSProperties } from 'react';
import { PortletConfig } from '../../types.js';
import { PortletDebugDataEntry } from '../../stores/dashboardStore.js';
import { CardIcons } from './EditActionButtons.js';
interface PortletCardHeaderProps {
    portlet: PortletConfig;
    className: string;
    headerStyle?: CSSProperties;
    restHeaderProps: Record<string, unknown>;
    headerOnClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    editable: boolean;
    isEditMode: boolean;
    isInSelectionMode: boolean;
    debugData?: PortletDebugDataEntry;
    copyAvailable: boolean;
    copySuccess: boolean;
    xlsExportAvailable: boolean;
    exportInProgress: boolean;
    showCacheBustIndicator: boolean;
    icons: CardIcons;
    onRefresh: (options?: {
        bustCache?: boolean;
    }) => void;
    onHoverRefreshChange: (hovering: boolean) => void;
    onCopyToClipboard: (event: React.MouseEvent | React.TouchEvent) => void;
    onExportXlsx: (event: React.MouseEvent | React.TouchEvent) => void;
    onOpenFilterConfig: () => void;
    onDuplicate: () => void;
    onEdit: () => void;
    onDelete: () => void;
}
export default function PortletCardHeader(props: PortletCardHeaderProps): React.JSX.Element;
export {};
