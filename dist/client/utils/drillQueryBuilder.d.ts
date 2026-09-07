import { CubeQuery, CubeMeta, CubeMetaHierarchy, TimeGranularity, DashboardFilter, DashboardFilterMapping } from '../types.js';
import { DrillOption, DrillResult, ChartDataPointClickEvent } from '../types/drill.js';
/**
 * Check if a dimension is a time dimension based on metadata
 */
export declare function isTimeDimension(dimensionName: string, metadata: CubeMeta): boolean;
/**
 * Get the granularities available for a time dimension
 */
export declare function getTimeDimensionGranularities(dimensionName: string, metadata: CubeMeta): TimeGranularity[];
/**
 * Get the current granularity from a query's time dimensions
 */
export declare function getCurrentGranularity(query: CubeQuery): TimeGranularity | null;
/**
 * Get drillMembers for a measure from metadata
 */
export declare function getMeasureDrillMembers(measureName: string, metadata: CubeMeta): string[] | null;
/**
 * Get hierarchy by name from metadata
 */
export declare function getHierarchy(hierarchyName: string, cubeName: string, metadata: CubeMeta): CubeMetaHierarchy | null;
/**
 * Get all hierarchies for a cube
 */
export declare function getCubeHierarchies(cubeName: string, metadata: CubeMeta): CubeMetaHierarchy[];
/**
 * Find which hierarchy (if any) contains a dimension
 */
export declare function findHierarchyForDimension(dimensionName: string, metadata: CubeMeta): {
    hierarchy: CubeMetaHierarchy;
    levelIndex: number;
} | null;
/**
 * Build drill options for a clicked data point
 */
export declare function buildDrillOptions(event: ChartDataPointClickEvent, query: CubeQuery, metadata: CubeMeta | null, dashboardFilters?: DashboardFilter[], dashboardFilterMapping?: DashboardFilterMapping): DrillOption[];
/**
 * Build a drill query based on the selected option
 */
export declare function buildDrillQuery(option: DrillOption, event: ChartDataPointClickEvent, query: CubeQuery, metadata: CubeMeta): DrillResult;
