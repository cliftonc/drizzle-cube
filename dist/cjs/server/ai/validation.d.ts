import { CubeMetadata } from '../types/metadata.js';
import { SemanticQuery } from '../types/query.js';
/**
 * Validation result with corrections
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    correctedQuery?: SemanticQuery;
}
/**
 * Validation error with optional correction
 */
export interface ValidationError {
    type: 'cube_not_found' | 'measure_not_found' | 'dimension_not_found' | 'invalid_filter' | 'invalid_time_dimension' | 'syntax_error';
    message: string;
    field?: string;
    suggestion?: string;
    correctedValue?: string;
}
/**
 * Validation warning (query will work but may have issues)
 */
export interface ValidationWarning {
    type: 'ambiguous_field' | 'performance' | 'best_practice';
    message: string;
    field?: string;
    suggestion?: string;
}
export declare function validateQuery(query: SemanticQuery, metadata: CubeMetadata[]): ValidationResult;
