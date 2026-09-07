import { ChartTypeConfig } from '../../charts/chartConfigs.js';
/**
 * Configuration for the sunburst chart type
 *
 * Sunburst charts visualize hierarchical flow data as concentric rings.
 * They work with the same flow data as Sankey but show only "after" steps
 * radiating outward from the central starting step.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export declare const sunburstChartConfig: ChartTypeConfig;
