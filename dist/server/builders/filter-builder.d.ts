import { SQL, AnyColumn } from 'drizzle-orm';
import { FilterOperator, Filter, Cube, QueryContext } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { DateTimeBuilder } from './date-time-builder.js';
export declare class FilterBuilder {
    private databaseAdapter;
    private dateTimeBuilder;
    constructor(databaseAdapter: DatabaseAdapter, dateTimeBuilder: DateTimeBuilder);
    /**
     * Build filter condition using Drizzle operators
     */
    buildFilterCondition(fieldExpr: AnyColumn | SQL, operator: FilterOperator, values: any[], field?: any, dateRange?: string | string[]): SQL | null;
    /**
     * Build a logical filter (AND/OR) - used by executor for cache preloading
     * This handles nested filter structures and builds combined SQL
     */
    buildLogicalFilter(filter: Filter, cubes: Map<string, Cube>, context: QueryContext): SQL | null;
    /** Build + AND/OR-combine a list of sub-filters, collapsing the 0- and 1-element cases. */
    private combineFilters;
    /**
     * Build SQL for a single filter condition (simple or logical)
     * Used for cache preloading to build filters independently of query context
     */
    buildSingleFilter(filter: Filter, cubes: Map<string, Cube>, context: QueryContext): SQL | null;
}
