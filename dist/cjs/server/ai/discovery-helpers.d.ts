import { CubeMetadata } from '../types/metadata.js';
/** A measure or dimension as carried in cube metadata. */
type Field = CubeMetadata['measures'][number] | CubeMetadata['dimensions'][number];
/** Scoring callbacks shared with discovery.ts (avoids a circular import). */
export interface ScoreFns {
    fuzzyMatchScore: (query: string, target: string) => number;
    matchAgainstArray: (query: string, targets: string[]) => number;
}
/**
 * Score a single field (measure or dimension) against a keyword.
 * Returns the best score across name, title, description and synonyms.
 */
export declare function scoreField(keyword: string, field: Field, fns: ScoreFns): number;
/**
 * Accumulate field scores for a keyword into a running totals map.
 * Adds to `totalScore` (returned) and records the per-field best score when the
 * field clears the relevance threshold, mutating `scores` and `matchedOn`.
 */
export declare function accumulateFieldScores(keyword: string, fields: Field[], fns: ScoreFns, scores: Map<string, number>, matchedOn: {
    hit: boolean;
}): number;
/** Return the top-N field names from a score map, highest score first. */
export declare function topScoredFields(scores: Map<string, number>, limit: number): string[];
/**
 * Titles for suggested fields whose name does not already say what they are.
 *
 * Most field names describe themselves (`Employees.salary`), so repeating the
 * title would be noise. A user-defined (EAV) attribute is the case this exists
 * for: it is addressed by a generated slot name like `attr_2`, and the title is
 * the only thing that says it means "Completion %". Discovery scores against
 * that title, so without this the caller is handed an opaque identifier and told
 * it is relevant.
 *
 * Returned as a separate name-keyed map rather than annotated into the field
 * lists, which callers are told to copy verbatim into queries.
 */
export declare function buildFieldTitles(fields: Field[], suggested: string[]): Record<string, string> | undefined;
/**
 * Score a single field as a best-match candidate (used by findBestFieldMatch).
 * Returns the best score across name, title and synonyms (no description match).
 */
export declare function scoreFieldForBestMatch(fieldName: string, field: Field, fns: ScoreFns): number;
export {};
