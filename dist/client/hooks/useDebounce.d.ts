/**
 * Custom hook for debouncing values
 * Delays updating the value until after the specified delay has passed
 * since the last change
 */
/**
 * Debounces a value by the specified delay
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export declare function useDebounce<T>(value: T, delay: number): T;
