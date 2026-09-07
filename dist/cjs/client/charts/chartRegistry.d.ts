import { ComponentType } from 'react';
import { BuiltInChartType } from '../types.js';
import { IconName, IconProps } from '../icons/types.js';
import { ChartTypeConfig, ChartAvailabilityContext, ChartAvailability } from './chartConfigs.js';
/**
 * The single source of truth for one chart type's DOM-free metadata: the eager
 * picker fields, the lazy config thunk, the icon name, and dependency info.
 *
 * The React component thunk is deliberately NOT part of the entry — it is the
 * one DOM-bearing piece and is owned by the client loader, keeping this entry
 * (and its consumers, incl. the server agent) free of the chart component graph.
 */
export interface ChartRegistryEntry {
    /** Display label for the picker — an i18n key, resolved at render time. */
    label: string;
    /**
     * The chart's icon. Built-ins use an `IconName` resolved via the icon registry
     * (override-able via registerIcons/setIcon). Plugins may instead supply a
     * ready-made icon component — both flow through the same entry field so custom
     * and built-in charts resolve their icon along one path.
     */
    icon: IconName | ComponentType<IconProps>;
    /** Brief description — i18n key. */
    description?: string;
    /** When to use this chart — i18n key. */
    useCase?: string;
    /** Whether the chart can render with the current query shape. */
    isAvailable?: (ctx: ChartAvailabilityContext) => ChartAvailability;
    /** Optional peer dependency — shows install instructions if the import fails. */
    dependencies?: {
        packageName: string;
        installCommand: string;
    };
    /** Lazy config import — resolves the config OBJECT directly (client lazy path). */
    config: () => Promise<ChartTypeConfig>;
}
/**
 * The unified registry — one entry per built-in chart type, the single source of
 * truth for its DOM-free metadata. The eager config registry, the lazy config
 * registry, the icon lookup, and the dependency lookup all derive from this map.
 *
 * Adding a chart is now one entry here plus its component/config files.
 */
export declare const chartRegistry: Record<BuiltInChartType, ChartRegistryEntry>;
/**
 * The single, unified chart-entry lookup. Custom plugin entries take precedence
 * over built-ins, so a plugin override of a built-in type resolves through the
 * same path. Returns `undefined` for unknown types.
 *
 * Every entry-shaped consumer (icon resolution, dependency fallback, plugin
 * icon API) reads through this so built-in and custom charts flow as one.
 */
export declare function getChartEntry(chartType: string): ChartRegistryEntry | undefined;
/** Register a custom chart's entry (plugin system). */
export declare function registerCustomChartEntry(chartType: string, entry: ChartRegistryEntry): void;
/** Remove a custom chart's entry, falling back to the built-in if one exists. */
export declare function unregisterCustomChartEntry(chartType: string): void;
/** The custom entry for a type, if one is registered (no built-in fallback). */
export declare function getCustomChartEntry(chartType: string): ChartRegistryEntry | undefined;
/**
 * Composes a migrated chart's full `ChartTypeConfig` from its entry: the entry's
 * metadata (its single declaration site) laid over the chart's config shape
 * (`base` — drop zones, display options, clickable elements, validation).
 *
 * Used by BOTH derivation paths so they return the same full shape as a
 * non-migrated chart's `*.config.ts`:
 * - eager `chartConfigRegistry` (server/full source — read synchronously for the
 *   picker AND by the server agent's chart validation + tool guidance), with
 *   `base` = the statically-imported config;
 * - lazy `getChartConfigAsync` (client code-split path), with `base` = the
 *   config resolved from the entry's `config` thunk.
 */
export declare function composeChartConfig(entry: ChartRegistryEntry, base: ChartTypeConfig): ChartTypeConfig;
