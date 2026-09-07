import { RefObject } from 'react';
interface ChartDimensions {
    containerRef: RefObject<HTMLDivElement>;
    dimensions: {
        width: number;
        height: number;
    };
    dimensionsReady: boolean;
}
/**
 * Shared container-measurement hook for the D3/SVG charts (BubbleChart,
 * ActivityGridChart).
 *
 * Performs an initial measurement with a requestAnimationFrame + setTimeout
 * retry ladder (handles containers that aren't laid out yet), then keeps the
 * dimensions in sync via a ResizeObserver and window resize. Mirrors the
 * original per-component effects exactly.
 */
export declare function useChartDimensions(): ChartDimensions;
export {};
