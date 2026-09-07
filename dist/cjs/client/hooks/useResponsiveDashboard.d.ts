import { RefCallback } from 'react';
export type DashboardDisplayMode = 'desktop' | 'scaled' | 'mobile';
export interface UseResponsiveDashboardResult {
    containerRef: RefCallback<HTMLDivElement>;
    containerWidth: number;
    displayMode: DashboardDisplayMode;
    scaleFactor: number;
    isEditable: boolean;
    designWidth: number;
}
/**
 * Hook for managing responsive dashboard layouts
 * Uses ResizeObserver for accurate width detection and calculates
 * the appropriate display mode and scale factor
 */
export declare function useResponsiveDashboard(): UseResponsiveDashboardResult;
