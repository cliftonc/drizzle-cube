import { ModeAdapter } from './modeAdapter.js';
import { AnalysisType } from '../types/analysisConfig.js';
/**
 * Adapter registry - manages mode adapters
 */
export declare const adapterRegistry: {
    /**
     * Register an adapter for a specific analysis type.
     * Should be called once at app initialization.
     *
     * @param adapter - The adapter to register
     */
    register<T>(adapter: ModeAdapter<T>): void;
    /**
     * Get the adapter for a specific analysis type.
     * Built-in adapters (query, funnel) are initialized automatically.
     *
     * @param type - The analysis type to get adapter for
     * @returns The registered adapter
     * @throws Error if no adapter is registered for the type
     */
    get<T>(type: AnalysisType): ModeAdapter<T>;
    /**
     * Check if an adapter is registered for a specific type.
     * Built-in adapters (query, funnel) are initialized automatically.
     *
     * @param type - The analysis type to check
     * @returns True if an adapter is registered
     */
    has(type: AnalysisType): boolean;
    /**
     * Get all registered analysis types.
     * Built-in adapters (query, funnel) are initialized automatically.
     *
     * @returns Array of registered types
     */
    getRegisteredTypes(): AnalysisType[];
    /**
     * Clear all registered adapters.
     * Primarily useful for testing.
     * Note: Built-in adapters will be re-initialized on next access.
     */
    clear(): void;
};
