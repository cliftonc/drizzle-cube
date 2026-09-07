import { Cube, PhysicalQueryPlan } from '../types/index.js';
import { SemanticQuery } from '../types/query.js';
import { CubeRef, MeasureRef, DimensionRef, TimeDimensionRef, LogicalSchema } from './types.js';
export declare function toCubeRef(cube: Cube): CubeRef;
export declare function buildMeasureRefs(query: SemanticQuery, cubes: Map<string, Cube>): MeasureRef[];
export declare function buildDimensionRefs(query: SemanticQuery, cubes: Map<string, Cube>): DimensionRef[];
export declare function buildTimeDimensionRefs(query: SemanticQuery, cubes: Map<string, Cube>): TimeDimensionRef[];
/**
 * Compose the full logical schema (measures, dimensions, time dimensions) for a
 * query. This is the primary public interface: `(query, cubes) => LogicalSchema`.
 */
export declare function buildLogicalSchema(query: SemanticQuery, cubes: Map<string, Cube>): LogicalSchema;
/**
 * Derive the measures-only schema for a pre-aggregation CTE. Unlike the
 * query-driven builders above, this intentionally does NOT throw on a missing
 * cube (the cube is guaranteed present by the planner that produced the CTE
 * descriptor) — preserving exact prior behavior keeps generated SQL unchanged.
 */
export declare function buildCTESchema(cteInfo: NonNullable<PhysicalQueryPlan['preAggregationCTEs']>[number], cubes: Map<string, Cube>): LogicalSchema;
