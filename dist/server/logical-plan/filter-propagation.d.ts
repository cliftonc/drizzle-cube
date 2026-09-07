import { Cube, SemanticQuery, PropagatingFilter, Filter } from '../types/index.js';
export declare class FilterPropagation {
    /**
     * Find filters that need to propagate from related cubes to a CTE cube.
     * When cube A has filters and a hasMany relationship to cube B (the CTE cube),
     * A's filters should propagate into B's CTE via a subquery.
     *
     * Example: Employees.createdAt filter should propagate to Productivity CTE
     * via: employee_id IN (SELECT id FROM employees WHERE created_at >= $date)
     */
    findPropagatingFilters(query: SemanticQuery, cteCube: Cube, allCubes: Map<string, Cube>): PropagatingFilter[];
    /**
     * Collect cube names referenced by filters and by time-dimension date ranges.
     */
    private collectFilterCubeNames;
    /**
     * Build a single PropagatingFilter for a filterCube → cteCube hasMany edge,
     * or null when the cube contributes no filters / the join has no keys.
     */
    private buildPropagatingFilter;
    /**
     * Extract cube names from filters into a Set (helper for findPropagatingFilters)
     */
    extractFilterCubeNamesToSet(filters: Filter[], cubesSet: Set<string>): void;
    /**
     * Extract filters for a specific cube from the filter array
     *
     * Logic for preserving filter semantics:
     * - AND: Safe to extract only matching branches (AND of fewer conditions is more permissive)
     * - OR: Must include ALL branches or skip entirely (partial OR changes semantics)
     *       If any branch belongs to another cube, skip the entire OR to be safe
     *       since we can't evaluate the other cube's conditions
     */
    extractFiltersForCube(filters: Filter[], targetCubeName: string): Filter[];
    /**
     * Check if all simple filters in a filter array belong to the specified cube
     * Recursively checks nested AND/OR filters
     */
    allFiltersFromCube(filters: Filter[], targetCubeName: string): boolean;
    /**
     * Extract time dimension date range filters as regular filters for a specific cube
     */
    extractTimeDimensionFiltersForCube(query: SemanticQuery, targetCubeName: string): Filter[];
}
