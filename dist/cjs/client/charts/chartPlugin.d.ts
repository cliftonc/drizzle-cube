import { ComponentType } from 'react';
import { ChartProps } from '../types.js';
import { ChartTypeConfig } from './chartConfigs.js';
import { IconProps } from '../icons/types.js';
/**
 * Complete definition for registering a custom chart type.
 * Bundles component, config metadata, and optional icon.
 */
export interface ChartDefinition {
    /** Unique chart type identifier (e.g., 'myGantt', 'customBar') */
    type: string;
    /** Display label for the chart type picker */
    label: string;
    /** Chart type configuration (drop zones, display options, validation) */
    config: ChartTypeConfig;
    /** The chart component (eager — loaded immediately) */
    component?: ComponentType<ChartProps>;
    /** Lazy-loaded chart component (for code splitting). Use instead of `component`. */
    lazyComponent?: () => Promise<{
        default: ComponentType<ChartProps>;
    }>;
    /** Optional icon component for the chart type picker */
    icon?: ComponentType<IconProps>;
    /** Optional dependency info — shows install instructions if the import fails */
    dependencies?: {
        packageName: string;
        installCommand: string;
    };
}
/**
 * Central registry for custom chart plugins.
 *
 * Coordinates registration across the three internal registries
 * (config, lazy config cache, chart loader) and provides a
 * `useSyncExternalStore`-compatible subscription API for React reactivity.
 */
declare class ChartPluginRegistry {
    private customCharts;
    private builtInBackups;
    private version;
    private listeners;
    /**
     * Register a custom chart definition.
     * If `type` matches a built-in chart, the built-in is backed up and can be
     * restored by calling `unregister()`.
     */
    register(definition: ChartDefinition): void;
    /**
     * Unregister a custom chart.
     * If the chart type was a built-in override, the original built-in is restored.
     */
    unregister(type: string): void;
    /** Get the custom icon component for a chart type, if one was registered. */
    getIcon(type: string): ComponentType<IconProps> | undefined;
    /** Get all registered custom chart type strings */
    getCustomTypes(): string[];
    /** Check if a chart type is a custom plugin (not built-in) */
    isCustom(type: string): boolean;
    /**
     * Subscribe to registry changes.
     * Compatible with React's `useSyncExternalStore`.
     */
    subscribe: (listener: () => void) => (() => void);
    /**
     * Get a snapshot of the registry version.
     * Compatible with React's `useSyncExternalStore`.
     */
    getSnapshot: () => number;
    private bump;
}
/** Singleton chart plugin registry */
export declare const chartPluginRegistry: ChartPluginRegistry;
export {};
