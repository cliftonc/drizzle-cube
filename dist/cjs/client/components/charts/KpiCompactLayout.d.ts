import { default as React } from 'react';
interface KpiCompactLayoutProps {
    /** Resolved measure label, rendered small and uppercase. */
    label: string;
    /** Optional adornment next to the label (e.g. the incomplete-period info icon). */
    labelAdornment?: React.ReactNode;
    /** Pre-formatted main value. */
    value: string;
    /** Colour for the main value; falls back to the themed text colour. */
    valueColor?: string;
    /** Unit rendered next to the value at a smaller size. */
    suffix?: string;
    /**
     * Rendered immediately after the value — used for the coloured delta so the
     * headline number keeps its usual meaning.
     */
    valueAdornment?: React.ReactNode;
    /** Quiet sub-line — a before/after pair, a target comparison, etc. */
    detail?: React.ReactNode;
    /** Forwarded so callers can keep measuring the container if they need to. */
    containerRef?: React.Ref<HTMLDivElement>;
}
/**
 * Dense KPI presentation shared by KpiNumber and KpiDelta.
 *
 * Unlike the default layout, nothing here scales with the container: the type
 * sizes are fixed so that a row of KPI portlets reads as a consistent metric
 * strip rather than a wall of differently-sized numbers.
 */
declare const KpiCompactLayout: React.MemoExoticComponent<({ label, labelAdornment, value, valueColor, suffix, valueAdornment, detail, containerRef }: KpiCompactLayoutProps) => React.JSX.Element>;
export default KpiCompactLayout;
