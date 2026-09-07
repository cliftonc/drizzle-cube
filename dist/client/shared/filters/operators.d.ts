import { FilterOperator } from '../../types.js';
export interface FilterOperatorMeta {
    label: string;
    description: string;
    requiresValues: boolean;
    supportsMultipleValues: boolean;
    valueType: 'string' | 'number' | 'date' | 'boolean' | 'any';
    fieldTypes: string[];
}
export declare const FILTER_OPERATORS: Record<FilterOperator, FilterOperatorMeta>;
/**
 * Normalize a raw field/measure type to the category used by FILTER_OPERATORS.
 * Measure aggregation types collapse to 'number' so the numeric operators apply
 * (without this, e.g. a `countDistinct` measure would expose no operators).
 */
export declare function normalizeFilterFieldType(fieldType: string): string;
/**
 * Get available operators for a field type
 */
export declare function getAvailableOperators(fieldType: string): Array<{
    operator: string;
    label: string;
}>;
