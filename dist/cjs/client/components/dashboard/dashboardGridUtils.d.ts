import { CSSProperties } from 'react';
import { DashboardConfig, DashboardGridSettings } from '../../types.js';
export declare const DEFAULT_GRID_SETTINGS: DashboardGridSettings;
export { createRowId, equalizeRowColumns, equalizeColumns, adjustRowWidths, adjustInsertIndexForRemovedRow } from '../../hooks/dashboard/layoutUtils.js';
export declare const getGridSettings: (config: DashboardConfig) => DashboardGridSettings;
/**
 * Finds the nearest scrollable ancestor of an element.
 * Used to detect scroll container for lazy loading IntersectionObserver.
 */
export declare function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null;
/** Inline "Tt" typography icon for Add Text buttons */
export declare function TextIcon({ className, style }: {
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
