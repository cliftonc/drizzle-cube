import { SQL } from 'drizzle-orm';
import { Cube, QueryContext } from './types/cube.js';
/**
 * Resolved measure SQL builders
 * Maps full measure names (e.g., "Cube.measure") to functions that build their SQL
 * Using functions instead of SQL objects avoids mutation and shared reference issues
 */
export type ResolvedMeasures = Map<string, () => SQL>;
/**
 * Substitution context
 */
export interface SubstitutionContext {
    /** The cube being processed */
    cube: Cube;
    /** All available cubes for cross-cube references */
    allCubes: Map<string, Cube>;
    /** Already resolved measure SQL expressions */
    resolvedMeasures: ResolvedMeasures;
    /** Query context for SQL generation */
    queryContext: QueryContext;
}
/**
 * Substitute {member} references in calculatedSql template
 *
 * Replaces {member} with the corresponding SQL expression from resolvedMeasures.
 * Supports both same-cube ({measure}) and cross-cube ({Cube.measure}) references.
 *
 * @param calculatedSql - Template string with {member} references
 * @param context - Substitution context
 * @returns SQL expression with substituted values
 * @throws Error if referenced measure is not resolved
 */
export declare function substituteTemplate(calculatedSql: string, context: SubstitutionContext): SQL;
/**
 * Validate calculatedSql template syntax
 *
 * @param calculatedSql - Template string to validate
 * @returns Validation result
 */
export declare function validateTemplateSyntax(calculatedSql: string): {
    isValid: boolean;
    errors: string[];
};
/**
 * Check if a template contains any member references
 *
 * @param calculatedSql - Template string to check
 * @returns True if template contains {member} references
 */
export declare function hasMemberReferences(calculatedSql: string): boolean;
/**
 * Get list of all unique member references in a template
 *
 * @param calculatedSql - Template string
 * @returns Array of unique full member names (e.g., ["Cube.measure", "otherMeasure"])
 */
export declare function getMemberReferences(calculatedSql: string, currentCube: string): string[];
