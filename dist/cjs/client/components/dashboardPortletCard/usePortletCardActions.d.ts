import { default as React } from 'react';
import { PortletDebugDataEntry } from '../../stores/dashboardStore.js';
export declare function usePortletCardActions(params: {
    portletTitle: string;
    debugData?: PortletDebugDataEntry;
}): {
    chartContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    copySuccess: boolean;
    copyAvailable: boolean;
    xlsExportAvailable: boolean;
    exportInProgress: boolean;
    showCacheBustIndicator: boolean;
    setIsHoveringRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleExportXlsx: (event: React.MouseEvent | React.TouchEvent) => Promise<void>;
    handleCopyToClipboard: (event: React.MouseEvent | React.TouchEvent) => Promise<void>;
};
