import { RefObject } from 'react';
interface UseScrollDetectionOptions {
    /** Scroll threshold in pixels (default: 20) */
    threshold?: number;
    /** Debounce delay in milliseconds (default: 150) */
    debounceMs?: number;
    /** Optional container state to trigger re-initialization when found */
    container?: HTMLElement | null;
}
/**
 * Hook to detect scroll position in a container
 *
 * @param containerRef - Ref to the scrollable container element
 * @param options - Configuration options for threshold and debounce
 * @returns Boolean indicating if scrolled past threshold
 *
 * @example
 * const scrollContainerRef = useRef<HTMLDivElement>(null)
 * const isScrolled = useScrollDetection(scrollContainerRef, {
 *   threshold: 20,
 *   debounceMs: 150
 * })
 *
 * <div ref={scrollContainerRef} className="overflow-y-auto">
 *   {isScrolled && <div>Shadow visible</div>}
 * </div>
 */
export declare function useScrollDetection(containerRef: RefObject<HTMLElement | null>, { threshold, debounceMs, container }?: UseScrollDetectionOptions): boolean;
export {};
