import { default as React } from 'react';
import { PortletDebugDataEntry } from '../stores/dashboardStore.js';
import { LayoutItem } from 'react-grid-layout';
import { DashboardConfig, PortletConfig, RowLayout, PortletGroup, DashboardFilter, DashboardFilterMapping, DashboardGridSettings, DashboardLayoutMode } from '../types.js';
import { SnapEdge } from './dashboard/groupUtils.js';
import { LayoutUpdate } from './dashboard/useRowLayoutEngine.js';
export interface UseDashboardOptions {
    /** Dashboard configuration */
    config: DashboardConfig;
    /** Whether dashboard is editable */
    editable?: boolean;
    /** Dashboard filters */
    dashboardFilters?: DashboardFilter[];
    /** Grid settings */
    gridSettings: DashboardGridSettings;
    /** Allowed layout modes */
    allowedModes?: DashboardLayoutMode[];
    /** Whether responsive mode allows editing (desktop only) */
    isResponsiveEditable?: boolean;
    /** Config change handler */
    onConfigChange?: (config: DashboardConfig) => void;
    /** Save handler */
    onSave?: (config: DashboardConfig) => Promise<void> | void;
    /** Callback to save thumbnail separately - called on edit mode exit when thumbnail feature is enabled */
    onSaveThumbnail?: (thumbnailData: string) => Promise<string | void>;
    /** Grid width for row calculations */
    gridWidth?: number;
    /** Portlet component refs for refresh functionality */
    portletComponentRefs?: React.MutableRefObject<Record<string, {
        refresh: (options?: {
            bustCache?: boolean;
        }) => void;
    } | null>>;
    /** Portlet refresh handler (external) */
    onPortletRefresh?: (portletId: string, options?: {
        bustCache?: boolean;
    }) => void;
    /** Ref to the dashboard container element for thumbnail capture */
    dashboardRef?: React.RefObject<HTMLElement | null>;
}
export interface UseDashboardResult {
    /** Whether dashboard is in edit mode */
    isEditMode: boolean;
    /** Selected filter ID for filter assignment mode */
    selectedFilterId: string | null;
    /** Whether portlet modal is open */
    isPortletModalOpen: boolean;
    /** Portlet being edited */
    editingPortlet: PortletConfig | null;
    /** Whether text portlet modal is open */
    isTextModalOpen: boolean;
    /** Portlet being edited in text modal */
    editingTextPortlet: PortletConfig | null;
    /** Whether filter config modal is open */
    isFilterConfigModalOpen: boolean;
    /** Portlet for filter configuration */
    filterConfigPortlet: PortletConfig | null;
    /** Portlet ID pending delete confirmation */
    deleteConfirmPortletId: string | null;
    deleteConfirmGroupId: string | null;
    /** Draft rows during drag operations */
    draftRows: RowLayout[] | null;
    /** Whether a portlet is being dragged */
    isDraggingPortlet: boolean;
    /** Last known layout for change detection */
    lastKnownLayout: LayoutItem[];
    /** Whether component is initialized */
    isInitialized: boolean;
    /** Whether editing is allowed (editable && isEditMode && desktop && !filterMode) */
    canEdit: boolean;
    /** Whether layout mode can be changed */
    canChangeLayoutMode: boolean;
    /** Currently selected filter object */
    selectedFilter: DashboardFilter | null;
    /** Resolved rows for row-based layout */
    resolvedRows: RowLayout[];
    resolvedGroups: PortletGroup[];
    /** Modes the toggle should offer; a subset of allowedModes. */
    selectableModes: DashboardLayoutMode[];
    /** Current layout mode */
    layoutMode: DashboardLayoutMode;
    /** Allowed layout modes */
    allowedModes: DashboardLayoutMode[];
    actions: UseDashboardActions;
}
export interface UseDashboardActions {
    enterEditMode: () => void;
    exitEditMode: () => void;
    toggleEditMode: () => void;
    selectFilter: (filterId: string | null) => void;
    exitFilterSelectionMode: () => void;
    openAddPortlet: () => void;
    openEditPortlet: (portlet: PortletConfig) => void;
    closePortletModal: () => void;
    openAddText: () => void;
    openEditText: (portlet: PortletConfig) => void;
    closeTextModal: () => void;
    openFilterConfig: (portlet: PortletConfig) => void;
    closeFilterConfig: () => void;
    setDraftRows: (rows: RowLayout[] | null) => void;
    setDraftGroups: (groups: PortletGroup[] | null) => void;
    setIsDraggingPortlet: (isDragging: boolean) => void;
    setLastKnownLayout: (layout: LayoutItem[]) => void;
    setIsInitialized: (initialized: boolean) => void;
    setDragState: (state: {
        rowIndex: number;
        colIndex: number;
        portletId: string;
    } | null) => void;
    clearDragState: () => void;
    hasLayoutActuallyChanged: (newLayout: LayoutItem[]) => boolean;
    updateLayout: (next: LayoutUpdate, save?: boolean) => Promise<void>;
    updateRowLayout: (rows: RowLayout[], save?: boolean, portletsOverride?: PortletConfig[]) => Promise<void>;
    handleLayoutModeChange: (mode: DashboardLayoutMode) => Promise<void>;
    savePortlet: (portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => Promise<string | null>;
    deletePortlet: (portletId: string) => Promise<void>;
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
    openDeleteGroupConfirm: (groupId: string) => void;
    openDeleteConfirm: (portletId: string) => void;
    closeDeleteConfirm: () => void;
    confirmDelete: () => Promise<void>;
    setDebugData: (portletId: string, data: PortletDebugDataEntry) => void;
    clearDebugData: (portletId?: string) => void;
}
export declare function useDashboard(options: UseDashboardOptions): UseDashboardResult;
