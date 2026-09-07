import { default as React } from 'react';
/**
 * Shared guard/state components for chart rendering.
 *
 * Cartesian charts (bar, line, area, pie, …) all duplicated the same
 * centred flex blocks for their empty / config-error / render-error states,
 * differing only in the hint text. These components own the duplicated wrapper
 * JSX; each chart supplies its own already-resolved `hint` (a translation key
 * resolved via `t()`, or a literal string) so per-chart messaging is preserved.
 */
interface ChartStateProps {
    height?: string | number;
    /** Already-resolved hint text (caller resolves its own i18n key) */
    hint?: React.ReactNode;
}
/**
 * Empty / no-data state (muted styling). `titleKey` defaults to the generic
 * "No data available" heading but can be overridden (e.g. for the post-transform
 * "No valid data" state).
 */
export declare function ChartEmptyState({ height, hint, titleKey }: ChartStateProps & {
    titleKey?: string;
}): React.JSX.Element;
/**
 * Invalid-configuration state (warning styling). Title is always
 * "Configuration Error"; the chart supplies a hint describing what is missing.
 */
export declare function ChartConfigError({ height, hint }: ChartStateProps): React.JSX.Element;
/**
 * Render-error state (error styling), used in chart `catch` blocks.
 */
export declare function ChartRenderError({ height, chartType, error }: {
    height?: string | number;
    /** Display name used in the "{chartType} Error" heading */
    chartType: string;
    error: unknown;
}): React.JSX.Element;
export {};
