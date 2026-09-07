import { FieldOption, RecentFieldsStorage } from '../types.js';
import { MetaResponse } from '../../../shared/types.js';
/**
 * Get recent fields from localStorage
 */
export declare function getRecentFields(): RecentFieldsStorage;
/**
 * Add a field to recent fields
 */
export declare function addRecentField(fieldName: string, mode: 'metrics' | 'breakdowns'): void;
/**
 * Get recent field options from schema
 */
export declare function getRecentFieldOptions(schema: MetaResponse | null, mode: 'metrics' | 'breakdown' | 'filter' | 'dimensionFilter', recentFieldNames: string[]): FieldOption[];
