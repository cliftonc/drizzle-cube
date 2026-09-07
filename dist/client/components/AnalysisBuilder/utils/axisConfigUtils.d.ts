import { ChartAxisConfig } from '../../../types.js';
interface DropZoneShape {
    key: string;
    maxItems?: number;
    enableDualAxis?: boolean;
}
/**
 * Compute the new config after dropping `field` onto `toAxis` (optionally moving
 * it from `fromAxis`). Applies the default left/right yAxisAssignment for dual-axis
 * drop zones.
 */
export declare function applyAxisDrop(chartConfig: ChartAxisConfig, field: string, fromAxis: string, toAxis: string, dropZoneConfig: DropZoneShape | undefined): ChartAxisConfig;
/**
 * Compute the new config after removing `field` from `fromAxis`, cleaning up any
 * yAxisAssignment entry.
 */
export declare function applyAxisRemove(chartConfig: ChartAxisConfig, field: string, fromAxis: string): ChartAxisConfig;
/**
 * Compute the new config after reordering items within `axisKey`. Returns null
 * when no reorder is applicable (non-array, single item, or no-op move).
 */
export declare function applyAxisReorder(chartConfig: ChartAxisConfig, fromIndex: number, toIndex: number, axisKey: string): ChartAxisConfig | null;
export {};
