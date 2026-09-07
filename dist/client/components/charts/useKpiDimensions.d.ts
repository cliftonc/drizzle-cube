import { RefObject } from 'react';
interface KpiDimensionOptions {
    /** Container divisor for the width-based font size candidate. */
    widthDivisor: number;
    /** Container divisor for the height-based font size candidate. */
    heightDivisor: number;
    /** Minimum clamped font size. */
    minFontSize: number;
    /** Maximum clamped font size. */
    maxFontSize: number;
    /** Computes the measured-text width from the value element's box + container width. */
    measureWidth: (measuredWidth: number, containerWidth: number) => number;
    /** Re-run measurement whenever any of these change. */
    deps: unknown[];
}
interface KpiDimensions {
    containerRef: RefObject<HTMLDivElement>;
    valueRef: RefObject<HTMLDivElement>;
    fontSize: number;
    textWidth: number;
}
/**
 * Shared container-measurement hook for KPI cards (KpiNumber / KpiDelta).
 *
 * Measures the container to derive a responsive font size, then (after the font
 * is applied) measures the rendered value element to size the histogram. Mirrors
 * the original per-component effects exactly — only the tunable constants differ.
 */
export declare function useKpiDimensions({ widthDivisor, heightDivisor, minFontSize, maxFontSize, measureWidth, deps }: KpiDimensionOptions): KpiDimensions;
export {};
