import { Cube, MeasureMetadata, DimensionMetadata, CubeRelationshipMetadata, HierarchyMetadata, TimeGranularity } from './types/index.js';
/** Default time granularities used when a time dimension omits `granularities`. */
export declare const DEFAULT_TIME_GRANULARITIES: TimeGranularity[];
/**
 * Build measure metadata, normalizing drillMembers to fully-qualified names.
 *
 * Measures with `shown: false` are omitted from the result — matching Cube.js
 * semantics, where a hidden measure remains fully usable in queries but is
 * excluded from metadata/UI surfaces. `shown: undefined` means shown, so
 * today's behaviour is preserved exactly.
 */
export declare function buildMeasureMetadata(cube: Cube): MeasureMetadata[];
/**
 * Build dimension metadata, including granularities for time dimensions.
 *
 * Dimensions with `shown: false` are omitted from the result — matching
 * Cube.js semantics, where a hidden dimension remains fully usable in queries
 * but is excluded from metadata/UI surfaces. `shown: undefined` means shown,
 * so today's behaviour is preserved exactly.
 */
export declare function buildDimensionMetadata(cube: Cube): DimensionMetadata[];
/** Build relationship metadata from a cube's joins, resolving target cubes. */
export declare function buildRelationshipMetadata(cube: Cube, cubes: Map<string, Cube>, getColumnName: (column: any) => string): CubeRelationshipMetadata[];
/**
 * Build hierarchy metadata, qualifying level names to full member names.
 *
 * Levels referencing a dimension with `shown: false` are dropped, so a
 * hierarchy never emits a dangling reference to a dimension that has been
 * omitted from the cube's own dimension metadata. A hierarchy left with no
 * visible levels is omitted entirely rather than published as empty.
 */
export declare function buildHierarchyMetadata(cube: Cube): HierarchyMetadata[];
