import { RefObject } from 'react';
interface UseElementVisibilityOptions {
    /** Threshold in pixels - element considered out of view when this much scrolls past top */
    threshold?: number;
    /** Debounce delay in milliseconds */
    debounceMs?: number;
    /** Custom scroll container ref (uses viewport if not provided) */
    containerRef?: RefObject<HTMLElement | null>;
    /** Optional state value to trigger re-initialization when container is found */
    container?: HTMLElement | null;
}
/**
 * Hook to detect whether an element is visible in the viewport/container
 *
 * @param elementRef - Ref to the element to track
 * @param options - Configuration options
 * @returns Boolean indicating if the element is visible (true when in view, false when scrolled out)
 *
 * @example
 * const editBarRef = useRef<HTMLDivElement>(null)
 * const isEditBarVisible = useElementVisibility(editBarRef, {
 *   threshold: 80,
 *   containerRef: scrollContainerRef
 * })
 *
 * // Show floating toolbar when edit bar scrolls out of view
 * {!isEditBarVisible && <FloatingToolbar />}
 */
export declare function useElementVisibility(elementRef: RefObject<HTMLElement | null>, { threshold, debounceMs, containerRef, container }?: UseElementVisibilityOptions): boolean;
export {};
