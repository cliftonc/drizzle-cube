/**
 * Unified Color Palette System
 * Each palette contains coordinated series and gradient colors that work well together
 */
export interface ColorPalette {
    name: string;
    label: string;
    colors: string[];
    gradient: string[];
}
export declare const COLOR_PALETTES: ColorPalette[];
/**
 * Get a color palette by name, with fallback to default
 */
export declare function getColorPalette(paletteName?: string): ColorPalette;
/**
 * Get just the series colors for a palette
 */
export declare function getSeriesColors(paletteName?: string): string[];
/**
 * Get just the gradient colors for a palette
 */
export declare function getGradientColors(paletteName?: string): string[];
/**
 * Chart types that use series colors (discrete categories)
 */
export declare const SERIES_CHART_TYPES: readonly ["bar", "line", "area", "pie", "scatter", "radar", "radialBar", "treeMap"];
/**
 * Chart types that use gradient colors (continuous values)
 */
export declare const GRADIENT_CHART_TYPES: readonly ["bubble", "activityGrid"];
/**
 * Determine if a chart type uses gradient colors
 */
export declare function usesGradientColors(chartType: string): boolean;
