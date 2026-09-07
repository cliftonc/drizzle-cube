import { FieldOption, FieldType } from '../types.js';
import { MetaResponse, MetaField } from '../../../shared/types.js';
/**
 * Get cube name from a field name (e.g., "Employees.count" -> "Employees")
 */
export declare function getCubeNameFromField(fieldName: string): string;
/**
 * Get field short name from full name (e.g., "Employees.count" -> "count")
 */
export declare function getFieldShortName(fieldName: string): string;
/**
 * Find field metadata from schema
 */
export declare function findFieldInSchema(fieldName: string, schema: MetaResponse | null): {
    field: MetaField;
    cubeName: string;
    fieldType: FieldType;
} | null;
/**
 * Get display title for a field
 */
export declare function getFieldTitle(fieldName: string, schema: MetaResponse | null): string;
/**
 * Determine field type from metadata
 */
export declare function getFieldType(field: MetaField): FieldType;
/**
 * Convert schema to flat list of field options
 *
 * - 'metrics': measures only
 * - 'breakdown' / 'dimensionFilter': dimensions only ('dimensionFilter' is used
 *   for funnel step filters where measures don't work)
 * - 'filter': both measures and dimensions
 */
export declare function schemaToFieldOptions(schema: MetaResponse | null, mode: 'metrics' | 'breakdown' | 'filter' | 'dimensionFilter'): FieldOption[];
/**
 * Filter field options by search term
 */
export declare function filterFieldOptions(options: FieldOption[], searchTerm: string, selectedCube?: string | null): FieldOption[];
/**
 * Group field options by cube
 */
export declare function groupFieldsByCube(options: FieldOption[]): Map<string, FieldOption[]>;
/**
 * Get list of cube names from schema
 */
export declare function getCubeNames(schema: MetaResponse | null): string[];
/**
 * Get cube title by name
 */
export declare function getCubeTitle(cubeName: string, schema: MetaResponse | null): string;
/**
 * Get all cubes reachable from a source cube via join relationships
 * Includes the source cube itself plus all cubes it has joins to
 *
 * @param sourceCube - Name of the cube to find related cubes for
 * @param schema - Full schema with all cubes
 * @returns Set of cube names that are reachable from the source
 */
export declare function getRelatedCubeNames(sourceCube: string, schema: MetaResponse | null): Set<string>;
/**
 * Filter schema to include only cubes reachable from a source cube
 * This is used for funnel step filters where cross-cube filtering is supported
 *
 * @param sourceCube - Name of the cube to find related cubes for
 * @param schema - Full schema with all cubes
 * @returns Filtered schema containing only reachable cubes
 */
export declare function getRelatedCubesSchema(sourceCube: string, schema: MetaResponse | null): MetaResponse | null;
