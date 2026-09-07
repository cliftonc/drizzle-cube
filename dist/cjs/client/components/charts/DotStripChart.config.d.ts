import { ChartTypeConfig } from '../../charts/chartConfigs.js';
/**
 * Configuration for the dot strip (beeswarm) chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 *
 * The zone *keys* are the standard `xAxis` / `yAxis` / `series` (so no
 * `ChartAxisConfig` change is needed), but the visual axes are transposed —
 * bands are rows and the measure runs horizontally — so the labels name the
 * roles rather than the axes.
 */
export declare const dotStripChartConfig: ChartTypeConfig;
