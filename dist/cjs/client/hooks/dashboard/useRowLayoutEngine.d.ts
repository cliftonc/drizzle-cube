import { MutableRefObject } from 'react';
import { DashboardConfig, DashboardGridSettings, DashboardLayoutMode, PortletConfig, PortletGroup, RowLayout } from '../../types.js';
/** A single layout commit. Rows and groups are coupled, so they travel together. */
export interface LayoutUpdate {
    rows: RowLayout[];
    groups?: PortletGroup[];
    portlets?: PortletConfig[];
}
interface UseRowLayoutEngineOptions {
    layoutMode: DashboardLayoutMode;
    draftRows: RowLayout[] | null;
    draftGroups: PortletGroup[] | null;
    config: DashboardConfig;
    gridSettings: DashboardGridSettings;
    configRef: MutableRefObject<DashboardConfig>;
    onConfigChangeRef: MutableRefObject<((config: DashboardConfig) => void) | undefined>;
    onSaveRef: MutableRefObject<((config: DashboardConfig) => Promise<void> | void) | undefined>;
    setDraftRows: (rows: RowLayout[] | null) => void;
    setDraftGroups: (groups: PortletGroup[] | null) => void;
    setThumbnailDirty: (dirty: boolean) => void;
}
export declare function useRowLayoutEngine({ layoutMode, draftRows, draftGroups, config, gridSettings, configRef, onConfigChangeRef, onSaveRef, setDraftRows, setDraftGroups, setThumbnailDirty, }: UseRowLayoutEngineOptions): {
    resolvedRows: RowLayout[];
    resolvedGroups: PortletGroup[];
    updateLayout: (next: LayoutUpdate, save?: boolean) => Promise<void>;
    updateRowLayout: (rows: RowLayout[], save?: boolean, portletsOverride?: PortletConfig[]) => Promise<void>;
};
export {};
