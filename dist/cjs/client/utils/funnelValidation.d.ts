import { CubeQuery, CubeMeta } from '../types.js';
import { FunnelBindingKey, FunnelConfig, FunnelStep, FunnelValidationError, FunnelValidationResult } from '../types/funnel.js';
/**
 * Validate that a binding key dimension exists in the given cubes
 */
export declare function validateBindingKeyExists(bindingKey: FunnelBindingKey, meta: CubeMeta | null): FunnelValidationError[];
/**
 * Validate that each step has a valid query
 */
export declare function validateStepQueries(steps: FunnelStep[]): FunnelValidationError[];
/**
 * Check if binding key can be resolved for a given query
 */
export declare function canResolveBindingKey(bindingKey: FunnelBindingKey, query: CubeQuery): boolean;
/**
 * Validate binding key for all funnel steps
 */
export declare function validateBindingKeyForSteps(bindingKey: FunnelBindingKey, steps: FunnelStep[]): FunnelValidationError[];
/**
 * Validate time window format (ISO 8601 duration)
 */
export declare function validateTimeWindow(duration: string | undefined): FunnelValidationError | null;
/**
 * Validate complete funnel configuration
 */
export declare function validateFunnelConfig(config: FunnelConfig, meta: CubeMeta | null): FunnelValidationResult;
/**
 * Quick check if minimum funnel requirements are met
 */
export declare function isMinimumFunnelConfigValid(bindingKey: FunnelBindingKey | null, queryCount: number): {
    isValid: boolean;
    message?: string;
};
/**
 * Get available dimensions that can serve as binding keys
 * These should be dimensions that identify entities (e.g., user IDs, order IDs)
 */
export declare function getAvailableBindingKeyDimensions(meta: CubeMeta | null): Array<{
    cube: string;
    dimension: string;
    label: string;
}>;
/**
 * Get the display label for a binding key
 */
export declare function getBindingKeyLabel(bindingKey: FunnelBindingKey | null): string;
