interface DataHistogramProps {
    /** Array of numeric values to create histogram from */
    values: number[];
    /** Minimum value in the dataset */
    min: number;
    /** Maximum value in the dataset */
    max: number;
    /** Color for the histogram bars */
    color?: string;
    /** Number of buckets/bars to create (default: 12) */
    bucketCount?: number;
    /** Height of the histogram in pixels (default: 32) */
    height?: number;
    /** Format function for min/max labels */
    formatValue?: (value: number) => string;
    /** Width of the histogram to match text above */
    width?: number;
    /** Whether to show average indicator line (default: true) */
    showAverageIndicator?: boolean;
    /** Target value to show as green line */
    targetValue?: number;
}
/**
 * Reusable histogram component that shows the distribution of actual data values
 */
export default function DataHistogram({ values, min, max, color, bucketCount, height, formatValue, width, showAverageIndicator, targetValue }: DataHistogramProps): import("react").JSX.Element;
export {};
