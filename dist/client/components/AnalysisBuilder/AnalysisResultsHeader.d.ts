/**
 * AnalysisResultsHeader
 *
 * Presentational header for AnalysisResultsPanel: the status / row-count line,
 * the toolbar of action buttons (display limit, AI, palette, share, refresh,
 * clear, schema, debug) and the large-dataset performance warning. Extracted to
 * keep the panel's renderHeader flat. Behaviour and markup are identical to the
 * previous inline rendering.
 *
 * Props are grouped into cohesive named slices instead of a flat bag, and each
 * sub-component receives only the slice it needs:
 *   - `summary`  → results state / row-count line + debug-error indicator
 *   - `toolbar`  → action handlers and their transient state
 *   - `display`  → view / visibility flags driving which controls render
 */
type Row = Record<string, unknown>;
/** Results state + row counts that drive the status line, warning and error dot. */
export interface ResultsSummary {
    executionResults: Row[] | null | undefined;
    executionStatus: string;
    totalRowCount: number | null;
    resultsStale: boolean;
    executionError: unknown;
    debugDataPerQuery: Array<{
        error?: unknown;
    }>;
}
/** Action handlers and their transient state for the toolbar buttons. */
export interface ResultsToolbarActions {
    displayLimit: number;
    onDisplayLimitChange?: (limit: number) => void;
    isAIOpen?: boolean;
    onAIToggle?: () => void;
    onColorPaletteChange?: (palette: string) => void;
    currentPaletteName?: string;
    onShareClick?: () => void;
    shareButtonState: string;
    canShare: boolean;
    onRefreshClick?: (opts: {
        bustCache: boolean;
    }) => void;
    canRefresh: boolean;
    isRefreshing: boolean;
    showCacheBustIndicator: boolean;
    setIsHoveringRefresh: (v: boolean) => void;
    onClearClick?: () => void;
    canClear: boolean;
    setIsClearConfirmOpen: (v: boolean) => void;
    setShowDebug: (v: boolean) => void;
    setShowSchema: (v: boolean) => void;
}
/** View / visibility flags deciding which controls render. */
export interface ResultsDisplayFlags {
    activeView: string;
    showDebug: boolean;
    showSchema: boolean;
    enableAI?: boolean;
    isFunnelMode: boolean;
    showSchemaDiagram: boolean;
}
export interface ResultsHeaderProps {
    summary: ResultsSummary;
    toolbar: ResultsToolbarActions;
    display: ResultsDisplayFlags;
}
export default function ResultsHeader({ summary, toolbar, display }: ResultsHeaderProps): import("react").JSX.Element;
export {};
