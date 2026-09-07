import { ChartTypeConfig } from '../../charts/chartConfigs.js';
/**
 * Configuration for the records table.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry — see `src/client/charts/chartRegistry.ts`. This
 * file owns the lazy-loaded shape: drop zones, display options, clickable
 * elements, validation.
 */
export declare const recordsTableConfig: ChartTypeConfig;
