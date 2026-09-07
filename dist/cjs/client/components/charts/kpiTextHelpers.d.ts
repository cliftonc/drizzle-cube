import { ColorPalette } from '../../types.js';
/**
 * Co-located pure helpers for KpiText: value extraction, statistics, number
 * formatting, template processing, and colour resolution. Extracted so the
 * component body stays focused on dimensioning + render. Pure extraction — no
 * behaviour change.
 */
/** Extract the configured measure fields from a chart config (string or array). */
export declare function extractValueFields(yAxis: string | string[] | undefined): string[];
/**
 * Extract the values for a field from each row, falling back to the first
 * available field when the configured field is absent. Null/undefined dropped.
 */
export declare function extractValues(data: Record<string, any>[], valueField: string): any[];
export interface KpiStats {
    mainValue: any;
    min: number | null;
    max: number | null;
    showStats: boolean;
}
/**
 * Reduce extracted values to the displayed main value plus optional min/max
 * statistics. Numeric multi-value sets average and expose min/max; non-numeric
 * sets concatenate.
 */
export declare function computeKpiStats(values: any[]): KpiStats;
interface NumberFormatOptions {
    formatValue?: (value: any) => string;
    decimals?: number;
}
/** Format a number with K/M/B abbreviation, honouring a custom formatter. */
export declare function formatKpiNumber(value: number | null | undefined, options: NumberFormatOptions): string;
interface TemplateContext {
    value: any;
    valueField: string;
    fieldLabel: string;
    min: number | null;
    max: number | null;
    count: number;
    formatNumber: (value: number | null | undefined) => string;
}
/** Replace `${var}` tokens in a KPI template, falling back to the raw value. */
export declare function processKpiTemplate(template: string, ctx: TemplateContext): string;
/** Resolve the KPI text colour from the palette by index, with a fallback. */
export declare function resolveValueColor(valueColorIndex: number | undefined, colorPalette: ColorPalette | undefined): string;
export {};
