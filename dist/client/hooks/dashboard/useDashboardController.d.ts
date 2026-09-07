import { MutableRefObject, RefObject } from 'react';
import { StoreApi } from 'zustand';
import { DashboardConfig, DashboardFilterMapping, DashboardGridSettings, DashboardLayoutMode, PortletConfig, PortletGroup, RowLayout, ThumbnailFeatureConfig } from '../../types.js';
import { DashboardStore, DashboardStoreActions } from '../../stores/dashboardStore.js';
import { LayoutUpdate } from './useRowLayoutEngine.js';
import { SnapEdge } from './groupUtils.js';
interface UseDashboardControllerOptions {
    allowedModes: DashboardLayoutMode[];
    canChangeLayoutMode: boolean;
    isResponsiveEditable: boolean;
    layoutMode: DashboardLayoutMode;
    resolvedRows: RowLayout[];
    resolvedGroups: PortletGroup[];
    gridSettings: DashboardGridSettings;
    thumbnailConfig?: ThumbnailFeatureConfig;
    dashboardRef?: RefObject<HTMLElement | null>;
    storeApi: StoreApi<DashboardStore>;
    storeActions: Pick<DashboardStoreActions, 'setEditMode' | 'exitFilterSelectionMode' | 'openPortletModal' | 'closePortletModal' | 'openTextModal' | 'closeTextModal' | 'openFilterConfigModal' | 'closeFilterConfigModal' | 'openDeleteConfirm' | 'openDeleteGroupConfirm' | 'setDraftGroups' | 'closeDeleteConfirm' | 'setThumbnailDirty'>;
    configRef: MutableRefObject<DashboardConfig>;
    onConfigChangeRef: MutableRefObject<((config: DashboardConfig) => void) | undefined>;
    onSaveRef: MutableRefObject<((config: DashboardConfig) => Promise<void> | void) | undefined>;
    onSaveThumbnailRef: MutableRefObject<((thumbnailData: string) => Promise<string | void>) | undefined>;
    updateLayout: (next: LayoutUpdate, save?: boolean) => Promise<void>;
    updateRowLayout: (rows: RowLayout[], save?: boolean, portletsOverride?: PortletConfig[]) => Promise<void>;
    portletComponentRefs?: MutableRefObject<Record<string, {
        refresh: (options?: {
            bustCache?: boolean;
        }) => void;
    } | null>>;
    onPortletRefresh?: (portletId: string, options?: {
        bustCache?: boolean;
    }) => void;
}
export declare function useDashboardController({ allowedModes, canChangeLayoutMode, isResponsiveEditable, layoutMode, resolvedRows, resolvedGroups, gridSettings, thumbnailConfig, dashboardRef, storeApi, storeActions, configRef, onConfigChangeRef, onSaveRef, onSaveThumbnailRef, updateLayout, updateRowLayout, portletComponentRefs, onPortletRefresh, }: UseDashboardControllerOptions): {
    enterEditMode: () => void;
    exitEditMode: () => void;
    toggleEditMode: () => void;
    selectFilter: (filterId: string | null) => void;
    openAddPortlet: () => void;
    openEditPortlet: (portlet: PortletConfig) => void;
    openAddText: () => void;
    openEditText: (portlet: PortletConfig) => void;
    openFilterConfig: (portlet: PortletConfig) => void;
    handleLayoutModeChange: (mode: DashboardLayoutMode) => Promise<void>;
    savePortlet: (portletData: PortletConfig | Omit<PortletConfig, "id" | "x" | "y">) => Promise<string | null>;
    deletePortlet: (portletId: string) => Promise<void>;
    confirmDelete: () => Promise<void>;
    duplicatePortlet: (portletId: string) => Promise<string | undefined>;
    refreshPortlet: (portletId: string, options?: {
        bustCache?: boolean;
    }) => void;
    toggleFilterForPortlet: (portletId: string, filterId: string) => Promise<void>;
    selectAllForFilter: (filterId: string) => Promise<void>;
    saveFilterConfig: (mapping: DashboardFilterMapping) => Promise<void>;
    handlePaletteChange: (paletteName: string) => Promise<void>;
    snapPortletIntoGroup: (movedPortletId: string, targetPortletId: string, edge: SnapEdge) => Promise<void>;
    ungroupGroup: (groupId: string) => Promise<void>;
    deleteGroup: (groupId: string) => void;
    renameGroup: (groupId: string, title: string) => Promise<void>;
};
export {};
