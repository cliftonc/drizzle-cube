import { PortletConfig, DashboardConfig } from '../types.js';
export * from './chartUtils.js';
export * from './chartConstants.js';
export * from './measureIcons.js';
export * from './periodUtils.js';
export * from './pivotUtils.js';
export * from './syntaxHighlighting.js';
export * from './comparisonUtils.js';
export { captureThumbnail, isThumbnailCaptureAvailable } from './thumbnail.js';
export { exportPortletToXlsx, isExportAvailable } from './exportXlsx.js';
/**
 * Create a dashboard layout from portlet configurations
 */
export declare function createDashboardLayout(portlets: PortletConfig[]): DashboardConfig;
/**
 * Generate responsive layouts for different breakpoints
 */
export declare function generateResponsiveLayouts(portlets: PortletConfig[]): {
    lg: {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        minW: number;
        minH: number;
    }[];
    md: {
        w: number;
        i: string;
        x: number;
        y: number;
        h: number;
        minW: number;
        minH: number;
    }[];
    sm: {
        w: number;
        i: string;
        x: number;
        y: number;
        h: number;
        minW: number;
        minH: number;
    }[];
    xs: {
        w: number;
        i: string;
        x: number;
        y: number;
        h: number;
        minW: number;
        minH: number;
    }[];
    xxs: {
        w: number;
        i: string;
        x: number;
        y: number;
        h: number;
        minW: number;
        minH: number;
    }[];
};
/**
 * Format chart data for display
 */
export declare function formatChartData(data: any[], options?: {
    formatNumbers?: boolean;
    precision?: number;
}): any[];
/**
 * Generate a unique ID for new portlets
 */
export declare function generatePortletId(): string;
/**
 * Find the next available position in a grid
 */
export declare function findNextPosition(existingPortlets: PortletConfig[], _w?: number, _h?: number): {
    x: number;
    y: number;
};
/**
 * Validate a cube query JSON string
 */
export declare function validateCubeQuery(queryString: string): {
    valid: boolean;
    error?: string;
    query?: any;
};
/**
 * Create a sample portlet configuration
 */
export declare function createSamplePortlet(): Omit<PortletConfig, 'id'>;
