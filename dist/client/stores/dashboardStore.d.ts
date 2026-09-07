import { ReactNode } from 'react';
import { StoreApi } from 'zustand';
import { LayoutItem } from 'react-grid-layout';
import { PortletConfig, RowLayout, PortletGroup, ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../types.js';
import { FlowChartData } from '../types/flow.js';
import { RetentionChartData } from '../types/retention.js';
/**
 * Debug data entry for a portlet (used by chart inspector)
 */
export interface PortletDebugDataEntry {
    chartConfig: ChartAxisConfig;
    displayConfig: ChartDisplayConfig;
    queryObject: CubeQuery | null;
    data: unknown[] | FlowChartData | RetentionChartData;
    chartType: ChartType;
    cacheInfo?: {
        hit: boolean;
        cachedAt: string;
        ttlMs: number;
        ttlRemainingMs: number;
    } | null;
}
/**
 * @deprecated Use PortletDebugDataEntry instead. Kept for backward compatibility.
 */
export type DebugDataEntry = PortletDebugDataEntry;
/**
 * Drag state for row-based layout
 */
export interface DragState {
    rowIndex: number;
    colIndex: number;
    portletId: string;
}
/**
 * Complete store state interface
 */
export interface DashboardStoreState {
    /** Whether dashboard is in edit mode */
    isEditMode: boolean;
    /** Currently selected filter ID for filter-assignment mode */
    selectedFilterId: string | null;
    /** Whether portlet edit modal is open */
    isPortletModalOpen: boolean;
    /** Portlet being edited (null = adding new) */
    editingPortlet: PortletConfig | null;
    /** Whether filter config modal is open */
    isFilterConfigModalOpen: boolean;
    /** Portlet for filter configuration */
    filterConfigPortlet: PortletConfig | null;
    /** Portlet ID pending delete confirmation (null = no confirmation active) */
    deleteConfirmPortletId: string | null;
    /** Group ID pending delete confirmation (null = no confirmation active) */
    deleteConfirmGroupId: string | null;
    /** Whether text portlet modal is open */
    isTextModalOpen: boolean;
    /** Portlet being edited in text modal (null = adding new) */
    editingTextPortlet: PortletConfig | null;
    /** Draft row layout during drag operations (rows mode) */
    draftRows: RowLayout[] | null;
    /** Draft group layout during drag/resize operations (rows mode) */
    draftGroups: PortletGroup[] | null;
    /** Whether a portlet is currently being dragged */
    isDraggingPortlet: boolean;
    /** Last known layout for change detection */
    lastKnownLayout: LayoutItem[];
    /** Whether component has been initialized (prevents saves during load) */
    isInitialized: boolean;
    /** Current drag state for row-based layout */
    dragState: DragState | null;
    /** Debug data keyed by portlet ID (for chart inspector) */
    debugData: Record<string, DebugDataEntry>;
    /** Whether the dashboard has been modified and needs a new thumbnail */
    thumbnailDirty: boolean;
}
/**
 * Store actions interface
 */
export interface DashboardStoreActions {
    /** Set edit mode */
    setEditMode: (isEdit: boolean) => void;
    /** Toggle edit mode */
    toggleEditMode: () => void;
    /** Set selected filter ID for filter selection mode */
    setSelectedFilterId: (filterId: string | null) => void;
    /** Exit filter selection mode */
    exitFilterSelectionMode: () => void;
    /** Open portlet modal (optionally with a portlet to edit) */
    openPortletModal: (portlet?: PortletConfig | null) => void;
    /** Close portlet modal */
    closePortletModal: () => void;
    /** Open filter config modal for a portlet */
    openFilterConfigModal: (portlet: PortletConfig) => void;
    /** Close filter config modal */
    closeFilterConfigModal: () => void;
    /** Open text portlet modal (optionally with a portlet to edit) */
    openTextModal: (portlet?: PortletConfig | null) => void;
    /** Close text portlet modal */
    closeTextModal: () => void;
    /** Open delete confirmation for a portlet */
    openDeleteConfirm: (portletId: string) => void;
    openDeleteGroupConfirm: (groupId: string) => void;
    /** Close delete confirmation */
    closeDeleteConfirm: () => void;
    /** Set draft rows during drag operations */
    setDraftRows: (rows: RowLayout[] | null) => void;
    setDraftGroups: (groups: PortletGroup[] | null) => void;
    /** Set whether a portlet is being dragged */
    setIsDraggingPortlet: (isDragging: boolean) => void;
    /** Set last known layout for change detection */
    setLastKnownLayout: (layout: LayoutItem[]) => void;
    /** Set whether component is initialized */
    setIsInitialized: (initialized: boolean) => void;
    /** Set drag state */
    setDragState: (state: DragState | null) => void;
    /** Clear drag state */
    clearDragState: () => void;
    /** Set debug data for a portlet */
    setDebugData: (portletId: string, data: DebugDataEntry) => void;
    /** Clear debug data for a portlet (or all if no portletId) */
    clearDebugData: (portletId?: string) => void;
    /** Set thumbnail dirty state (needs new capture) */
    setThumbnailDirty: (dirty: boolean) => void;
    /** Reset store to initial state */
    reset: () => void;
}
/**
 * Combined store type
 */
export type DashboardStore = DashboardStoreState & DashboardStoreActions;
/**
 * Options for creating a store instance
 */
export interface CreateDashboardStoreOptions {
    /** Initial edit mode state */
    initialEditMode?: boolean;
}
/**
 * Create a new dashboard store instance
 */
export declare function createDashboardStore(options?: CreateDashboardStoreOptions): Omit<Omit<StoreApi<DashboardStore>, "setState" | "devtools"> & {
    setState(partial: DashboardStore | Partial<DashboardStore> | ((state: DashboardStore) => DashboardStore | Partial<DashboardStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: DashboardStore | ((state: DashboardStore) => DashboardStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: DashboardStore, previousSelectedState: DashboardStore) => void): () => void;
        <U>(selector: (state: DashboardStore) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
};
/**
 * Provider props
 */
export interface DashboardStoreProviderProps {
    children: ReactNode;
    /** Initial edit mode state */
    initialEditMode?: boolean;
}
/**
 * Provider component that creates a store instance per Dashboard
 */
export declare function DashboardStoreProvider({ children, initialEditMode, }: DashboardStoreProviderProps): import("react").JSX.Element;
/**
 * Hook to access the store from context
 * @throws Error if used outside of provider
 */
export declare function useDashboardStore<T>(selector: (state: DashboardStore) => T): T;
/**
 * Hook to get the raw store API (for actions that need direct access)
 */
export declare function useDashboardStoreApi(): StoreApi<DashboardStore>;
/**
 * Optional hook that returns null if used outside provider (for optional store access)
 * Uses a fallback store to ensure useStore is always called (React hooks rules compliance)
 */
export declare function useDashboardStoreOptional<T>(selector: (state: DashboardStore) => T): T | null;
/**
 * Select edit mode state
 */
export declare const selectEditModeState: (state: DashboardStore) => {
    isEditMode: boolean;
    selectedFilterId: string | null;
};
/**
 * Select modal state
 */
export declare const selectModalState: (state: DashboardStore) => {
    isPortletModalOpen: boolean;
    editingPortlet: PortletConfig | null;
    isFilterConfigModalOpen: boolean;
    filterConfigPortlet: PortletConfig | null;
    isTextModalOpen: boolean;
    editingTextPortlet: PortletConfig | null;
};
/**
 * Select layout state
 */
export declare const selectLayoutState: (state: DashboardStore) => {
    draftRows: RowLayout[] | null;
    draftGroups: PortletGroup[] | null;
    isDraggingPortlet: boolean;
    lastKnownLayout: LayoutItem[];
    isInitialized: boolean;
    dragState: DragState | null;
};
/**
 * Select debug data
 */
export declare const selectDebugData: (state: DashboardStore) => Record<string, PortletDebugDataEntry>;
/**
 * Select debug data for a specific portlet
 */
export declare const selectPortletDebugData: (portletId: string) => (state: DashboardStore) => PortletDebugDataEntry;
/**
 * Select all edit mode actions
 */
export declare const selectEditModeActions: (state: DashboardStore) => {
    setEditMode: (isEdit: boolean) => void;
    toggleEditMode: () => void;
    setSelectedFilterId: (filterId: string | null) => void;
    exitFilterSelectionMode: () => void;
};
/**
 * Select all modal actions
 */
export declare const selectModalActions: (state: DashboardStore) => {
    openPortletModal: (portlet?: PortletConfig | null) => void;
    closePortletModal: () => void;
    openTextModal: (portlet?: PortletConfig | null) => void;
    closeTextModal: () => void;
    openFilterConfigModal: (portlet: PortletConfig) => void;
    closeFilterConfigModal: () => void;
    openDeleteConfirm: (portletId: string) => void;
    openDeleteGroupConfirm: (groupId: string) => void;
    closeDeleteConfirm: () => void;
};
/**
 * Select all layout actions
 */
export declare const selectLayoutActions: (state: DashboardStore) => {
    setDraftRows: (rows: RowLayout[] | null) => void;
    setDraftGroups: (groups: PortletGroup[] | null) => void;
    setIsDraggingPortlet: (isDragging: boolean) => void;
    setLastKnownLayout: (layout: LayoutItem[]) => void;
    setIsInitialized: (initialized: boolean) => void;
    setDragState: (state: DragState | null) => void;
    clearDragState: () => void;
};
/**
 * Select all debug data actions
 */
export declare const selectDebugDataActions: (state: DashboardStore) => {
    setDebugData: (portletId: string, data: DebugDataEntry) => void;
    clearDebugData: (portletId?: string) => void;
};
/**
 * Select thumbnail dirty state
 */
export declare const selectThumbnailDirty: (state: DashboardStore) => boolean;
/**
 * Select all actions
 */
export declare const selectAllActions: (state: DashboardStore) => {
    setEditMode: (isEdit: boolean) => void;
    toggleEditMode: () => void;
    setSelectedFilterId: (filterId: string | null) => void;
    exitFilterSelectionMode: () => void;
    openPortletModal: (portlet?: PortletConfig | null) => void;
    closePortletModal: () => void;
    openTextModal: (portlet?: PortletConfig | null) => void;
    closeTextModal: () => void;
    openFilterConfigModal: (portlet: PortletConfig) => void;
    closeFilterConfigModal: () => void;
    openDeleteConfirm: (portletId: string) => void;
    openDeleteGroupConfirm: (groupId: string) => void;
    closeDeleteConfirm: () => void;
    setDraftRows: (rows: RowLayout[] | null) => void;
    setIsDraggingPortlet: (isDragging: boolean) => void;
    setLastKnownLayout: (layout: LayoutItem[]) => void;
    setIsInitialized: (initialized: boolean) => void;
    setDragState: (state: DragState | null) => void;
    clearDragState: () => void;
    setDebugData: (portletId: string, data: DebugDataEntry) => void;
    clearDebugData: (portletId?: string) => void;
    setThumbnailDirty: (dirty: boolean) => void;
    reset: () => void;
};
