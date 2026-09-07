/**
 * ScrollContainerContext
 *
 * Provides the scroll container element for lazy loading with IntersectionObserver.
 * This allows portlets to detect visibility relative to a custom scroll container
 * (not just the viewport) when the dashboard is embedded in a scrolling div.
 */
/**
 * Provider component to wrap dashboard content with a scroll container reference.
 * Used by DashboardGrid and MobileStackedLayout to pass the detected scroll container
 * to child portlets.
 */
export declare const ScrollContainerProvider: import('react').Provider<HTMLElement | null>;
/**
 * Hook to access the scroll container element for lazy loading.
 * Returns null if using viewport (window) scroll, or the container element
 * if the dashboard is inside a scrolling container.
 */
export declare const useScrollContainer: () => HTMLElement | null;
