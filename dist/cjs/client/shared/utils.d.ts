import { CubeQuery } from '../types.js';
import { MetaField, MetaResponse } from './types.js';
import { cleanQuery } from './queryTransforms.js';
export { cleanQuery };
/**
 * Check if query has any content (measures, dimensions, or timeDimensions)
 */
export declare function hasQueryContent(query: CubeQuery): boolean;
/**
 * Clean a query and transform filters for server compatibility
 * This version transforms GroupFilter to legacy and/or format
 */
export declare function cleanQueryForServer(query: CubeQuery): CubeQuery;
/**
 * Transform a Cube.js query from external format to UI internal format
 * This handles format differences between server/API queries and QueryBuilder state
 */
export declare function transformQueryForUI(query: any): CubeQuery;
/**
 * Get cube name from field name (e.g., "Employees.count" -> "Employees")
 */
export declare function getCubeNameFromField(fieldName: string): string;
/**
 * Get field type from schema
 */
export declare function getFieldType(fieldName: string, schema: MetaResponse): string;
/**
 * Get field title from schema metadata, falling back to field name
 */
export declare function getFieldTitle(fieldName: string, schema: MetaResponse | null): string;
/**
 * Get ALL filterable fields from schema
 */
export declare function getAllFilterableFields(schema: MetaResponse): MetaField[];
/**
 * Convert DateRangeType to Cube.js compatible date range format
 */
export declare function convertDateRangeTypeToValue(rangeType: string, number?: number): string;
/**
 * Check if a date range type requires a number input
 */
export declare function requiresNumberInput(rangeType: string): boolean;
/**
 * Format date for Cube.js (YYYY-MM-DD)
 */
export declare function formatDateForCube(date: Date): string;
