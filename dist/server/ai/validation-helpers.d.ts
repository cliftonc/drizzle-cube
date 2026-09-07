import { TranslationKey } from '../../i18n/types.js';
import { CubeMetadata } from '../types/metadata.js';
import { SemanticQuery, Filter } from '../types/query.js';
import { ValidationError, ValidationWarning } from './validation.js';
/** Validate that a required event-stream field is present and (if a string) a valid dimension. */
export declare function validateRequiredDimensionField(value: unknown, missingMessageKey: TranslationKey, validateDimension: (dimension: string, errors: ValidationError[]) => void, errors: ValidationError[]): void;
/** Apply field-name corrections to a measures/dimensions string array. */
export declare function applyCorrectionsToList(list: string[], corrections: Map<string, string>): string[];
/** Build the corrected query by applying field corrections (returns undefined if none). */
export declare function buildCorrectedQuery(query: SemanticQuery, corrections: Map<string, string>): SemanticQuery | undefined;
/** Push performance/best-practice warnings for an oversized standard query. */
export declare function collectPerformanceWarnings(query: SemanticQuery, warnings: ValidationWarning[]): void;
/** Warn when a declared time dimension is not actually of time type. */
export declare function checkTimeDimensionType(dimensionRef: string, metadata: CubeMetadata[], warnings: ValidationWarning[]): void;
/** Validate a single member-style filter (cube + field existence). */
export declare function validateMemberFilter(filter: Extract<Filter, {
    member: string;
}>, metadata: CubeMetadata[], errors: ValidationError[], corrections: Map<string, string>, findClosestField: (fieldName: string, available: string[]) => {
    field: string;
    distance: number;
} | null): void;
