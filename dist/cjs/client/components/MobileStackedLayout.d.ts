import { DashboardFilter, DashboardConfig } from '../types.js';
import { ColorPalette } from '../utils/colorPalettes.js';
interface MobileStackedLayoutProps {
    config: DashboardConfig;
    colorPalette?: ColorPalette;
    dashboardFilters?: DashboardFilter[];
    onPortletRefresh?: (portletId: string) => void;
}
/**
 * Mobile-optimized stacked layout for dashboard portlets
 * Renders portlets in a single column, sorted by grid position
 */
export default function MobileStackedLayout({ config, colorPalette, dashboardFilters, onPortletRefresh }: MobileStackedLayoutProps): import("react").JSX.Element;
export {};
