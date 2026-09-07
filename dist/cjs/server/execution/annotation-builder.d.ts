import { PhysicalQueryPlan, SemanticQuery, MeasureAnnotation, DimensionAnnotation, TimeDimensionAnnotation } from '../types/index.js';
/**
 * Generate annotations for UI metadata - unified approach.
 * Collects measure/dimension/timeDimension titles from every cube in the plan
 * (primary + joins + multi-fact merge groups).
 */
export declare function buildAnnotations(queryPlan: PhysicalQueryPlan, query: SemanticQuery): {
    measures: Record<string, MeasureAnnotation>;
    dimensions: Record<string, DimensionAnnotation>;
    segments: Record<string, never>;
    timeDimensions: Record<string, TimeDimensionAnnotation>;
};
