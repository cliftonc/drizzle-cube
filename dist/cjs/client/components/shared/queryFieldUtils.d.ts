import { CubeQuery, SimpleFilter } from '../../types.js';
import { MetaResponse } from './types.js';
/** Collect the set of field names currently selected by a query. */
export declare function getSelectedFieldNames(query: CubeQuery): Set<string>;
/**
 * Validate operator compatibility / value requirements for a filter.
 * Assumes the filter member is already known to exist.
 */
export declare function validateFilterOperator(filter: SimpleFilter, schema: MetaResponse): string[];
/**
 * Get sort direction for a field from the order object
 */
export declare function getSortDirection(fieldName: string, order: Record<string, 'asc' | 'desc'> | undefined): 'asc' | 'desc' | null;
/**
 * Get tooltip text for sort button based on current direction
 */
export declare function getSortTooltip(direction: 'asc' | 'desc' | null): string;
/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
export declare function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null;
