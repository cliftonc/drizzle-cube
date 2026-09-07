import { SQL } from 'drizzle-orm';
import { Cube, Filter, QueryContext } from '../types/index.js';
/**
 * Type for CTE objects created by db.$with()
 * These can be used with db.with(...ctes).select().from(cte)
 */
export type WithSubquery = ReturnType<ReturnType<any['$with']>['as']>;
/**
 * Combine an array of WHERE/JOIN conditions into a single SQL expression.
 *
 * - `[]`            → undefined (no condition)
 * - single element  → that element verbatim
 * - multiple        → `and(...conditions)`
 *
 * Mirrors the inline `conditions.length === 1 ? conditions[0] : and(...conditions) as SQL`
 * pattern that was duplicated across the analysis builders.
 */
export declare function combineWhere(conditions: SQL[]): SQL | undefined;
/** The combinator + children of a client-style group filter. */
export interface GroupFilterParts {
    /** True for an AND group, false for OR. */
    isAnd: boolean;
    filters: Filter[];
}
/**
 * Normalise a client-style group filter.
 *
 * The analysis UIs sometimes emit groups as `{ type: 'and' | 'or', filters: [...] }`
 * rather than the canonical `{ and: [...] }` / `{ or: [...] }` (this shape is not part
 * of the `Filter` type; the builders accept it defensively). Returns the group's
 * combinator + children, or `null` if `filter` isn't a client group filter.
 */
export declare function asGroupFilter(filter: Filter): GroupFilterParts | null;
/**
 * A single multi-cube field mapping (binding key or time dimension), e.g.
 * `{ cube: 'Events', dimension: 'Events.userId' }`.
 */
type FieldMapping = {
    cube: string;
    dimension: string;
};
/**
 * The i18n namespaces whose binding-key / time-dimension leaf keys are identical.
 * Funnel and flow share the exact same leaf keys under these two prefixes, which
 * is what lets the resolution logic below be shared. (Retention uses a different
 * leaf-key set — see `bindingKeyErrorsForPrefix` vs the bespoke config it passes.)
 */
type AnalysisErrorPrefix = 'server.errors.funnel' | 'server.errors.flow';
/**
 * Extract the dimension name from a `'Cube.dim'` or bare `'dim'` reference.
 * (`'Cube.dim'` → `'dim'`, `'dim'` → `'dim'`.) Funnel/flow only ever pass the
 * qualified form, so this is a strict superset of their old `.split('.')[1]`.
 */
export declare function extractDimensionName(dimension: string): string;
/**
 * Builders of the i18n error strings thrown while resolving a binding key.
 * Each builder receives the resolved context so callers can preserve their exact
 * existing message keys/params (funnel/flow and retention use different leaf keys).
 */
export interface BindingKeyErrors {
    /** Array form: no mapping in the array matched the current cube. */
    noMapping: (ctx: {
        cubeName: string;
    }) => string;
    /** The cube named in the key/mapping was not found in the `cubes` registry. */
    cubeNotFound?: (ctx: {
        cubeName: string;
    }) => string;
    /** String form: the binding-key dimension was not found on the resolved cube. */
    keyDimNotFound: (ctx: {
        bindingKey: string;
        cubeName: string;
        dimName: string;
    }) => string;
    /** Array form: the mapped dimension was not found on the resolved cube. */
    mappingDimNotFound: (ctx: {
        dimension: string;
        cubeName: string;
        dimName: string;
    }) => string;
}
/**
 * Build the binding-key error messages for funnel/flow from their shared i18n
 * namespace (the leaf keys are identical across the two prefixes).
 */
export declare function bindingKeyErrorsForPrefix(errorPrefix: AnalysisErrorPrefix): BindingKeyErrors;
/**
 * Resolve a binding-key SQL expression for the analysis builders.
 *
 * Accepts a `'Cube.dim'` string or an array of `{ cube, dimension }` mappings.
 * `errors` supplies the i18n messages (funnel/flow share one leaf-key set via
 * `bindingKeyErrorsForPrefix`; retention passes its own). When `cubes` is given,
 * the dimension is resolved on the cube named in the key (retention's multi-cube
 * semantics); otherwise it is resolved on `cube` (funnel/flow).
 */
export declare function resolveBindingKeyExpr(bindingKey: string | FieldMapping[], cube: Cube, context: QueryContext, errors: BindingKeyErrors, cubes?: Map<string, Cube>): SQL;
/**
 * Resolve a time-dimension SQL expression for funnel/flow builders.
 *
 * Accepts a `'Cube.dim'` string or an array of `{ cube, dimension }` mappings.
 * `errorPrefix` selects the i18n namespace (the leaf keys are identical across
 * funnel and flow): `<prefix>.timeDimNotFound`, `<prefix>.noTimeDimMapping`,
 * `<prefix>.timeDimMappingNotFound`.
 */
export declare function resolveTimeDimensionExpr(timeDimension: string | FieldMapping[], cube: Cube, context: QueryContext, errorPrefix: AnalysisErrorPrefix): SQL;
export {};
