import { default as React } from 'react';
type KpiStateVariant = 'muted' | 'danger' | 'warning';
/**
 * Resolve the shared `height`/`minHeight` style used by every KPI card state.
 *
 * `minHeight` only applies when the card is sized at `100%`; the compact layout
 * passes a smaller floor since it is meant to sit in a short metric strip.
 */
export declare function kpiHeightStyle(height: string | number, minHeight?: string | number): React.CSSProperties;
/**
 * Centred KPI state card (no-data / config-error / insufficient-data).
 *
 * Owns the duplicated centred flex wrapper shared by KpiNumber and KpiDelta.
 * Callers supply already-resolved title/hint text (i18n resolved at the call
 * site) plus an optional colour variant and extra children.
 */
export declare function KpiCenteredState({ height, title, hint, variant, children }: {
    height: string | number;
    title: React.ReactNode;
    hint?: React.ReactNode;
    variant?: KpiStateVariant;
    children?: React.ReactNode;
}): React.JSX.Element;
export {};
