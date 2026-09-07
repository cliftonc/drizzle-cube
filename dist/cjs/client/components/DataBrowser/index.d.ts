/**
 * DataBrowser Component
 *
 * A Neon-style full-page data browser for exploring raw cube data.
 * Uses ungrouped queries to display row-level data with:
 * - Cube list sidebar (left)
 * - Sortable data table (right)
 * - Filter bar and column picker
 * - Server-side pagination
 *
 * Must be wrapped in a CubeProvider.
 */
export interface DataBrowserProps {
    /** Additional CSS classes */
    className?: string;
    /** Initially selected cube */
    defaultCube?: string;
    /** Default page size (default: 20) */
    defaultPageSize?: number;
    /** Max height for the component (default: '100vh') */
    maxHeight?: string;
    /** Custom loading indicator (defaults to LoadingIndicator) */
    loadingComponent?: import('react').ReactNode;
}
/**
 * DataBrowser — standalone data browsing component
 */
export default function DataBrowser({ className, defaultCube, defaultPageSize, maxHeight, loadingComponent, }: DataBrowserProps): import("react").JSX.Element;
