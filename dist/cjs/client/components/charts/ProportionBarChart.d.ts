import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * A single 100%-wide stacked bar plus a labelled percentage legend.
 *
 * A flatter alternative to a pie chart for part-to-whole breakdowns: shares are
 * far easier to compare along one axis than as angles, and it costs a fraction
 * of the vertical space. Deliberately plain HTML rather than Recharts — there is
 * no axis, scale or interaction to justify an SVG chart.
 */
declare const ProportionBarChart: React.MemoExoticComponent<({ data, chartConfig, displayConfig, height, colorPalette }: ChartProps) => React.JSX.Element>;
export default ProportionBarChart;
