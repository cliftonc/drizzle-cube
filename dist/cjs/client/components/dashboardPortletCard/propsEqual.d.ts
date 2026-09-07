import { HTMLAttributes, ReactNode, ComponentType, CSSProperties } from 'react';
import { ChartType, DashboardFilter, DashboardLayoutMode, PortletConfig } from '../../types.js';
import { PortletCardVariant } from './cardStyles.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
export interface DashboardPortletCardProps {
    portlet: PortletConfig;
    editable: boolean;
    layoutMode?: DashboardLayoutMode;
    variant?: PortletCardVariant;
    dashboardFilters?: DashboardFilter[];
    configEagerLoad?: boolean;
    loadingComponent?: ReactNode;
    colorPalette?: ColorPalette;
    containerProps?: HTMLAttributes<HTMLDivElement>;
    headerProps?: HTMLAttributes<HTMLDivElement>;
    setPortletRef: (portletId: string, element: HTMLDivElement | null) => void;
    setPortletComponentRef: (portletId: string, element: {
        refresh: (options?: {
            bustCache?: boolean;
        }) => void;
    } | null) => void;
    callbacks: {
        onToggleFilter: (portletId: string, filterId: string) => void;
        onRefresh: (portletId: string, options?: {
            bustCache?: boolean;
        }) => void;
        onDuplicate: (portletId: string) => void;
        onEdit: (portlet: PortletConfig) => void;
        onDelete: (portletId: string) => void;
        onOpenFilterConfig: (portlet: PortletConfig) => void;
    };
    icons: {
        RefreshIcon: ComponentType<{
            className?: string;
            style?: CSSProperties;
        }>;
        EditIcon: ComponentType<{
            className?: string;
            style?: CSSProperties;
        }>;
        DeleteIcon: ComponentType<{
            className?: string;
            style?: CSSProperties;
        }>;
        CopyIcon: ComponentType<{
            className?: string;
            style?: CSSProperties;
        }>;
        FilterIcon: ComponentType<{
            className?: string;
            style?: CSSProperties;
        }>;
    };
}
export type { ChartType };
export declare function shallowEqualObjects<T extends object>(a: T | undefined, b: T | undefined): boolean;
export declare function arePropsEqual(prevProps: DashboardPortletCardProps, nextProps: DashboardPortletCardProps): boolean;
