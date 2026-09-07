import { ChartTypeConfig } from '../../charts/chartConfigs.js';
/**
 * Configuration for the sankey chart type
 *
 * Sankey charts visualize flow data between nodes.
 * They work with data from flow queries which provide
 * nodes and links representing user journeys.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export declare const sankeyChartConfig: ChartTypeConfig;
