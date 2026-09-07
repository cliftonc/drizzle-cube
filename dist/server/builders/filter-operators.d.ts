import { SQL, AnyColumn } from 'drizzle-orm';
import { FilterOperator } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { DateTimeBuilder } from './date-time-builder.js';
/**
 * Context passed to every operator handler. Carries the resolved field
 * expression, the (already filtered/converted) value list, plus the
 * collaborators a handler may need.
 */
export interface FilterOperatorContext {
    fieldExpr: AnyColumn | SQL;
    values: any[];
    filteredValues: any[];
    value: any;
    field?: any;
    databaseAdapter: DatabaseAdapter;
    dateTimeBuilder: DateTimeBuilder;
}
/**
 * Dispatch a single filter operator to its handler. Returns null for any
 * unknown operator (matching the original `default` case).
 */
export declare function applyFilterOperator(operator: FilterOperator, ctx: FilterOperatorContext): SQL | null;
