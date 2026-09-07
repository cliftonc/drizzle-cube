import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * Gauge chart: a 270° dial whose arc *is* the threshold banding — one thick,
 * rounded segment per threshold with a small gap between them — read by a
 * tapered needle, with numeric scale labels at the band boundaries and the
 * measure label + value stacked below the centre.
 *
 * All geometry lives in `gaugeChartHelpers.ts`; this component only renders it.
 */
declare const GaugeChart: React.MemoExoticComponent<({ data, chartConfig, displayConfig, height, }: ChartProps) => React.JSX.Element>;
export default GaugeChart;
