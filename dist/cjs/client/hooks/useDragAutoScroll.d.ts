import { RefObject } from 'react';
interface UseDragAutoScrollOptions {
    /** Distance from edge that triggers scrolling (default: 80px) */
    edgeThreshold?: number;
    /** Maximum scroll speed in pixels per frame (default: 15) */
    maxScrollSpeed?: number;
    /** Whether auto-scroll is currently enabled */
    enabled?: boolean;
}
/**
 * Hook to enable auto-scrolling when dragging near the edges of a scroll container.
 * Works with HTML5 native drag-and-drop API by listening to dragover events.
 *
 * @param scrollContainerRef - Ref to the scrollable container element
 * @param options - Configuration options
 */
export declare function useDragAutoScroll(scrollContainerRef: RefObject<HTMLElement | null>, options?: UseDragAutoScrollOptions): void;
export {};
