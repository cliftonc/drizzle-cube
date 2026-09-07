/**
 * Optimized hook that only subscribes to field label functionality
 * from CubeMeta context. This prevents re-renders when unrelated
 * contexts (CubeApi, Features) change.
 *
 * Use this instead of useCubeContext() when you only need getFieldLabel.
 */
/**
 * Returns a stable reference to the getFieldLabel function.
 * Components using this hook will only re-render when the field label
 * mapping actually changes, not when unrelated API or feature contexts update.
 *
 * @returns Function to get human-readable label for a field name
 * @throws Error if used outside CubeProvider
 */
export declare function useCubeFieldLabel(): (fieldName: string) => string;
