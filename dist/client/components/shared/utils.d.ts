import { CubeQuery, Filter, SimpleFilter } from '../../types.js';
import { MetaField, MetaResponse } from './types.js';
export { getSortDirection, getSortTooltip, getNextSortDirection, } from './queryFieldUtils.js';
export type { DatePreset } from './dateRangeUtils.js';
export { DATE_PRESETS, XTD_OPTIONS, calculateDateRange, formatDateRangeDisplay, detectPresetFromDateRange, } from './dateRangeUtils.js';
export { formatFilterValueDisplay } from './filterDisplayUtils.js';
export { isSimpleFilter, isGroupFilter, isAndFilter, isOrFilter, flattenFilters, countFilters, createSimpleFilter, createAndFilter, createOrFilter, cleanupFilters, transformFiltersForServer, transformFiltersFromServer, getAvailableOperators, } from '../../shared/filters/index.js';
export { hasQueryContent, cleanQuery, cleanQueryForServer, transformQueryForUI, getCubeNameFromField, getFieldType, getFieldTitle, getAllFilterableFields, convertDateRangeTypeToValue, requiresNumberInput, formatDateForCube, } from '../../shared/utils.js';
/**
 * Check if a field is selected in the current query
 */
export declare function isFieldSelected(fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions', query: CubeQuery): boolean;
/**
 * Get all time dimension fields from schema
 */
export declare function getTimeDimensionFields(schema: MetaResponse): MetaField[];
/**
 * Get all non-time dimension fields from schema
 */
export declare function getRegularDimensionFields(schema: MetaResponse): MetaField[];
/**
 * Get all measure fields from schema
 */
export declare function getMeasureFields(schema: MetaResponse): MetaField[];
/**
 * Get count of selected fields across all types
 */
export declare function getSelectedFieldsCount(query: CubeQuery): number;
/**
 * Group fields by cube name
 */
export declare function groupFieldsByCube(fields: MetaField[]): Record<string, MetaField[]>;
/**
 * Create an empty query object
 */
export declare function createEmptyQuery(): CubeQuery;
/**
 * Get all filterable fields from schema (measures, dimensions, and time dimensions)
 * Returns ALL fields if no query provided, or only query fields if query provided
 */
export declare function getFilterableFields(schema: MetaResponse, query?: CubeQuery): MetaField[];
/**
 * Get organized filter field options with query fields prioritized at top
 */
export declare function getOrganizedFilterFields(schema: MetaResponse, query?: CubeQuery): {
    queryFields: MetaField[];
    allFields: MetaField[];
};
/**
 * Validate a filter
 */
export declare function validateFilter(filter: SimpleFilter, schema: MetaResponse): {
    isValid: boolean;
    errors: string[];
};
/**
 * Clean up filters by removing any that reference fields not in the current query (legacy)
 * Only used for backward compatibility - filters on non-query fields are now supported
 */
export declare function cleanupFiltersLegacy(filters: Filter[], query: CubeQuery): Filter[];
/**
 * Get the time dimensions that have date ranges applied
 */
export declare function getTimeDimensionsWithDateRanges(query: CubeQuery): Record<string, string | string[]>;
/**
 * Check if a query has any time dimensions
 */
export declare function hasTimeDimensions(query: CubeQuery): boolean;
/**
 * Clean up order object by removing fields that are no longer in the query
 */
export declare function cleanupOrder(order: Record<string, 'asc' | 'desc'> | undefined, query: CubeQuery): Record<string, 'asc' | 'desc'> | undefined;
