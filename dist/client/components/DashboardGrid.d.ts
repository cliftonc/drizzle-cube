import { ReactNode } from 'react';
import { ColorPalette } from '../utils/colorPalettes.js';
import { DashboardConfig, DashboardFilter, CubeMeta, DashboardLayoutMode } from '../types.js';
interface DashboardGridProps {
    config: DashboardConfig;
    editable?: boolean;
    dashboardFilters?: DashboardFilter[];
    loadingComponent?: ReactNode;
    onConfigChange?: (config: DashboardConfig) => void;
    onPortletRefresh?: (portletId: string) => void;
    onSave?: (config: DashboardConfig) => Promise<void> | void;
    /** Callback to save thumbnail separately - called on edit mode exit when thumbnail feature is enabled */
    onSaveThumbnail?: (thumbnailData: string) => Promise<string | void>;
    colorPalette?: ColorPalette;
    schema?: CubeMeta | null;
    onDashboardFiltersChange?: (filters: DashboardFilter[]) => void;
    dashboardModes?: DashboardLayoutMode[];
    /** When true, no toolbar is rendered (neither the top edit bar nor the floating toolbar) */
    hideToolbar?: boolean;
}
export default function DashboardGrid(props: DashboardGridProps): import("react").JSX.Element;
export {};
