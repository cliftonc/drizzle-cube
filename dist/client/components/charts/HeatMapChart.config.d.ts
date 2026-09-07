import { ChartTypeConfig } from '../../charts/chartConfigs.js';
/**
 * Configuration for the heatmap chart type.
 *
 * Heatmap charts visualize intensity across two dimensions as a color matrix.
 * Best for showing patterns in matrix data like correlations, schedules, or category comparisons.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export declare const heatmapChartConfig: ChartTypeConfig;
