/**
 * useDirtyStateTracking - Track configuration changes and dirty state
 *
 * Extracts dirty state tracking logic from AnalyticsDashboard:
 * - Tracks initial config to prevent saves during initial load
 * - Detects meaningful changes from initial state
 * - Manages dirty state through onDirtyStateChange callback
 *
 * @example
 * const { handleConfigChange, handleSave } = useDirtyStateTracking({
 *   initialConfig: config,
 *   onConfigChange,
 *   onSave,
 *   onDirtyStateChange,
 * })
 */
export interface UseDirtyStateTrackingOptions<T> {
    /** Initial configuration to compare against */
    initialConfig: T;
    /** Original config change handler */
    onConfigChange?: (config: T) => void;
    /** Original save handler */
    onSave?: (config: T) => Promise<void> | void;
    /** Dirty state change callback */
    onDirtyStateChange?: (isDirty: boolean) => void;
}
export interface UseDirtyStateTrackingResult<T> {
    /** Wrapped config change handler that tracks dirty state */
    handleConfigChange: (config: T) => void;
    /** Wrapped save handler that tracks dirty state */
    handleSave: (config: T) => Promise<void>;
    /** Whether config has changed from initial */
    hasChanged: () => boolean;
    /** Reset the initial config reference (e.g., after external config update) */
    resetInitialConfig: (config: T) => void;
}
export declare function useDirtyStateTracking<T>({ initialConfig, onConfigChange, onSave, onDirtyStateChange, }: UseDirtyStateTrackingOptions<T>): UseDirtyStateTrackingResult<T>;
