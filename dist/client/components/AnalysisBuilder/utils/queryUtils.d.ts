import { CubeQuery, Filter } from '../../../types.js';
import { MetricItem, BreakdownItem } from '../types.js';
/**
 * Convert metrics and breakdowns to CubeQuery format
 * Handles comparison mode by building compareDateRange for time dimensions
 */
export declare function buildCubeQuery(metrics: MetricItem[], breakdowns: BreakdownItem[], filters: Filter[], order?: Record<string, 'asc' | 'desc'>, preserveComparisonFilters?: boolean, limit?: number, 
/**
 * Record-grain charts list rows rather than aggregates — see
 * `ChartTypeConfig.recordGrain`. Without this, editing a records-table
 * portlet in the builder silently rebuilds its query as a grouped one.
 */
ungrouped?: boolean): CubeQuery;
/**
 * Check if a query has any content
 */
export declare function hasQueryContent(metrics: MetricItem[], breakdowns: BreakdownItem[], filters: Filter[]): boolean;
