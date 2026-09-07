import { AxisFormatConfig } from '../types.js';
/**
 * Get the currency code for a given locale.
 * Maps common locales to their default currency.
 */
export declare function getCurrencyCodeForLocale(locale: string): string;
/**
 * Abbreviation result: the (possibly scaled) display value and its suffix.
 */
export interface AbbreviatedValue {
    displayValue: number;
    abbreviationSuffix: string;
}
/**
 * Scale a number to a K/M/B abbreviation when `abbreviate` is enabled.
 */
export declare function abbreviateValue(num: number, abbreviate: boolean): AbbreviatedValue;
/**
 * Resolved formatting parameters shared by the per-unit formatters.
 */
export interface AxisFormatParams {
    displayValue: number;
    abbreviate: boolean;
    abbreviationSuffix: string;
    decimals: number;
    locale: string;
    config: AxisFormatConfig;
}
/**
 * Format an abbreviated/scaled value according to its configured unit type.
 */
export declare function formatByUnit(params: AxisFormatParams): string;
