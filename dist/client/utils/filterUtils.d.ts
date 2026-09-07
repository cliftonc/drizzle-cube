import { Filter, DashboardFilter, DashboardFilterMapping, DashboardFilterMappingEntry, CubeMeta, DashboardConfig } from '../types.js';
import { validateFilterForCube } from '../shared/filters/index.js';
export { validateFilterForCube };
/**
 * Normalize a portlet filter mapping to entry objects.
 * Plain string entries (the legacy format) become { filterId } with no override.
 */
export declare function normalizeFilterMapping(mapping: DashboardFilterMapping | undefined): DashboardFilterMappingEntry[];
/**
 * Serialize mapping entries for storage.
 * Entries without a member override collapse back to plain strings so saved
 * configs only change shape when an override is actually used.
 */
export declare function serializeFilterMapping(entries: DashboardFilterMappingEntry[]): DashboardFilterMapping;
/**
 * Check whether a mapping (either format) includes a given dashboard filter
 */
export declare function mappingIncludesFilter(mapping: DashboardFilterMapping | undefined, filterId: string): boolean;
/**
 * Get the per-portlet member override for a dashboard filter, if any
 */
export declare function getMappingMemberOverride(mapping: DashboardFilterMapping | undefined, filterId: string): string | undefined;
/**
 * Clone a filter with its member rewritten to the override field.
 * Only SimpleFilters can be rewritten; GroupFilters pass through unchanged.
 */
export declare function applyMemberOverride(filter: Filter, member?: string): Filter;
/**
 * Check if a filter should be included in the query (has valid values or doesn't require values)
 * @param filter - The filter to check
 * @returns true if the filter should be included, false otherwise
 */
export declare function shouldIncludeFilter(filter: Filter): boolean;
/**
 * Get dashboard filters that should be applied to a portlet based on its mapping configuration
 *
 * Mapping entries may carry a per-portlet member override, in which case the
 * filter is applied with its member rewritten to the override field (operator
 * and values stay shared across all portlets).
 *
 * @param dashboardFilters - All available dashboard filters
 * @param filterMapping - The portlet's filter mapping (filter IDs or entries with member overrides)
 * @returns Array of filters that should be applied to the portlet
 */
export declare function getApplicableDashboardFilters(dashboardFilters: DashboardFilter[] | undefined, filterMapping: DashboardFilterMapping | undefined): Filter[];
/**
 * Filter format for merge operation:
 * - 'server': Returns {and: [...]} or {or: [...]} format (for API queries)
 * - 'client': Returns {type: 'and', filters: [...]} format (for UI components)
 */
export type FilterFormat = 'server' | 'client';
/**
 * Merge dashboard filters with portlet filters using AND logic
 * Dashboard filters are combined with portlet filters so both sets of filters apply
 *
 * @param dashboardFilters - Filters from dashboard-level configuration
 * @param portletFilters - Filters from portlet query
 * @param format - Output format: 'server' for API queries, 'client' for UI (default: 'server')
 * @returns Merged filter array with AND logic in the specified format
 */
export declare function mergeDashboardAndPortletFilters(dashboardFilters: Filter[], portletFilters: Filter[] | undefined, format?: FilterFormat): Filter[] | undefined;
/**
 * @deprecated Use mergeDashboardAndPortletFilters(filters, portletFilters, 'client') instead
 */
export declare function mergeDashboardAndPortletFiltersClientFormat(dashboardFilters: Filter[], portletFilters: Filter[] | undefined): Filter[] | undefined;
/**
 * Validate that all dashboard filters in a portlet's mapping exist and are valid
 * @param dashboardFilters - All available dashboard filters
 * @param filterMapping - The portlet's filter mapping
 * @param cubeMeta - Cube metadata for validation
 * @returns Object with validation result and list of invalid filter IDs
 */
export declare function validatePortletFilterMapping(dashboardFilters: DashboardFilter[] | undefined, filterMapping: DashboardFilterMapping | undefined, cubeMeta: CubeMeta | null): {
    isValid: boolean;
    invalidFilterIds: string[];
    missingFilterIds: string[];
};
/**
 * Extract all unique measures, dimensions, and timeDimensions used across all portlets in a dashboard
 * This helps create a filtered schema view showing only fields relevant to the dashboard
 * @param dashboardConfig - Dashboard configuration
 * @returns Object with unique measures, dimensions, and timeDimensions
 */
export declare function extractDashboardFields(dashboardConfig: DashboardConfig): {
    measures: Set<string>;
    dimensions: Set<string>;
    timeDimensions: Set<string>;
};
/**
 * Time dimension type from CubeQuery
 */
type TimeDimension = {
    dimension: string;
    granularity?: string;
    dateRange?: string[] | string;
};
/**
 * Apply the dashboard's universal time filter to a portlet's regular
 * `filters`: every `inDateRange` filter has its value replaced by the
 * universal date range. This is what lets portlets WITHOUT timeDimensions
 * (e.g. total KPIs windowed via an inDateRange filter) follow the dashboard
 * date filter — `applyUniversalTimeFilters` only rewrites timeDimensions.
 */
export declare function applyUniversalTimeToDateFilters(dashboardFilters: DashboardFilter[] | undefined, portletFilters: Filter[] | undefined): Filter[] | undefined;
/**
 * Apply universal time filters to a portlet's timeDimensions
 * Universal time filters apply their dateRange to ALL time dimensions in the portlet
 *
 * @param dashboardFilters - All dashboard filters
 * @param filterMapping - Filter IDs that apply to this portlet
 * @param portletTimeDimensions - The portlet's existing timeDimensions array
 * @returns Updated timeDimensions array with date ranges applied
 */
export declare function applyUniversalTimeFilters(dashboardFilters: DashboardFilter[] | undefined, _filterMapping: DashboardFilterMapping | undefined, portletTimeDimensions: TimeDimension[] | undefined): TimeDimension[] | undefined;
