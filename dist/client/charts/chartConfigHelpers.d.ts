import { ChartAvailabilityContext, ChartAvailability, DisplayOptionConfig } from './chartConfigs.js';
/**
 * Shared building blocks for chart `*.config.ts` files.
 *
 * Most chart configs repeated the same `isAvailable` guard and the same
 * display-option definitions (target line, Y-axis format, stacking, …).
 * These factories centralise that boilerplate so each chart config only
 * declares what is genuinely unique to it.
 */
/**
 * Standard availability rule shared by most chart types: at least one measure
 * and at least one dimension (regular or time) must be selected.
 */
export declare function requiresMeasureAndDimension({ measureCount, dimensionCount }: ChartAvailabilityContext): ChartAvailability;
/**
 * Availability rule for charts that only need a single measure (KPI-style
 * charts and gauges): at least one measure, no dimension requirement.
 */
export declare function requiresMeasure({ measureCount }: ChartAvailabilityContext): ChartAvailability;
/** Target-line display option (single value or comma-separated spread). */
export declare const targetDisplayOption: DisplayOptionConfig;
/** Connect-nulls toggle for line/area charts. */
export declare const connectNullsDisplayOption: DisplayOptionConfig;
/** Left Y-axis numeric format control (dual-axis charts). */
export declare const leftYAxisFormatDisplayOption: DisplayOptionConfig;
/** Right Y-axis numeric format control (dual-axis charts). */
export declare const rightYAxisFormatDisplayOption: DisplayOptionConfig;
/**
 * Single value-format control used by charts that only have one numeric scale
 * (pie, radar, radial bar, treemap). Stored under `leftYAxisFormat` for
 * backward compatibility with existing saved configs.
 */
export declare function valueFormatDisplayOption(description?: string): DisplayOptionConfig;
/**
 * Stacking-mode select shared by bar and area charts. `description` differs
 * per chart (bar vs area series wording).
 */
export declare function stackTypeDisplayOption(description: string): DisplayOptionConfig;
/**
 * Layout density for the KPI charts.
 *
 * `auto` keeps the historic behaviour, where the value's font size is derived
 * from the portlet box — which makes a wide portlet render an enormous number.
 * `compact` uses a fixed type scale so several KPIs read as a tidy metric strip.
 */
export declare const kpiLayoutDisplayOption: DisplayOptionConfig;
/**
 * Summary-band toggle for the time-series charts.
 *
 * Renders each series' latest value and its change since the start of the
 * window above the plot, so the chart is readable without hovering.
 */
export declare const showSummaryDisplayOption: DisplayOptionConfig;
/**
 * Data-point marker toggle for the time-series charts. Dense series (hundreds
 * of points) read far better without a marker on every one.
 */
export declare function showPointsDisplayOption(defaultValue?: boolean): DisplayOptionConfig;
