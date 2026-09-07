import { SemanticQuery, Cube } from './types/index.js';
/**
 * A member the query references that no cube provides, reported alongside the
 * human-readable errors.
 *
 * The joined error string cannot be split back apart reliably — the per-field
 * "did you mean" hints contain the same separator — so a caller that wants to
 * react to a *specific* missing member (a dashboard dropping a column for a
 * deleted attribute, say) needs this rather than the prose. `source` is the
 * part that matters: dropping a projected member narrows what is displayed,
 * whereas dropping a filter would widen the result set, so the two cannot be
 * treated alike.
 */
export interface QueryValidationIssue {
    source: 'measure' | 'dimension' | 'timeDimension' | 'filter';
    /** The full `Cube.field` reference as the query wrote it. */
    member: string;
    message: string;
}
/**
 * Thrown when a query fails validation during execution.
 *
 * Carries the structured issues alongside the joined message so a caller can
 * react to a specific unknown member — the batch endpoint, which validates
 * inside execution rather than ahead of it, would otherwise only have prose.
 */
export declare class QueryValidationError extends Error {
    readonly issues: QueryValidationIssue[];
    constructor(message: string, issues: QueryValidationIssue[]);
}
export interface QueryValidationResult {
    isValid: boolean;
    errors: string[];
    /** Unknown members, when any — see {@link QueryValidationIssue}. */
    issues: QueryValidationIssue[];
}
/**
 * Validate a query against a cubes map
 * Standalone function that can be used by both compiler and executor
 */
export declare function validateQueryAgainstCubes(cubes: Map<string, Cube>, query: SemanticQuery): QueryValidationResult;
