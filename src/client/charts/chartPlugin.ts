/**
 * Chart Plugin System
 *
 * Provides a public API for registering custom chart types at runtime.
 * Custom charts can extend the built-in set or override existing chart types.
 *
 * Registration via CubeProvider (recommended):
 * ```tsx
 * <CubeProvider customCharts={[{ type: 'gantt', label: 'Gantt', config, component }]}>
 * ```
 *
 * Imperative registration (library authors):
 * ```ts
 * import { chartPluginRegistry } from 'drizzle-cube/client'
 * chartPluginRegistry.register({ type: 'gantt', label: 'Gantt', config, component })
 * ```
 */

import type { ComponentType } from 'react'
import type { ChartProps } from '../types'
import type { ChartTypeConfig } from './chartConfigs'
import type { IconProps } from '../icons/types'
import { registerChartConfig, unregisterChartConfig, chartConfigRegistry } from './chartConfigRegistry'
import { registerConfigToCache, unregisterConfigFromCache } from './lazyChartConfigRegistry'
import { registerChartComponent, unregisterChartComponent } from './ChartLoader'
import { setCustomChartIconResolver } from '../icons/registry'

/**
 * Complete definition for registering a custom chart type.
 * Bundles component, config metadata, and optional icon.
 */
export interface ChartDefinition {
  /** Unique chart type identifier (e.g., 'myGantt', 'customBar') */
  type: string

  /** Display label for the chart type picker */
  label: string

  /** Chart type configuration (drop zones, display options, validation) */
  config: ChartTypeConfig

  /** The chart component (eager — loaded immediately) */
  component?: ComponentType<ChartProps>

  /** Lazy-loaded chart component (for code splitting). Use instead of `component`. */
  lazyComponent?: () => Promise<{ default: ComponentType<ChartProps> }>

  /** Optional icon component for the chart type picker */
  icon?: ComponentType<IconProps>

  /** Optional dependency info — shows install instructions if the import fails */
  dependencies?: {
    packageName: string
    installCommand: string
  }
}

/**
 * Central registry for custom chart plugins.
 *
 * Coordinates registration across the three internal registries
 * (config, lazy config cache, chart loader) and provides a
 * `useSyncExternalStore`-compatible subscription API for React reactivity.
 */
class ChartPluginRegistry {
  private customCharts = new Map<string, ChartDefinition>()
  private builtInBackups = new Map<string, ChartTypeConfig>()
  private iconMap = new Map<string, ComponentType<IconProps>>()
  private version = 0
  private listeners = new Set<() => void>()

  /**
   * Register a custom chart definition.
   * If `type` matches a built-in chart, the built-in is backed up and can be
   * restored by calling `unregister()`.
   */
  register(definition: ChartDefinition): void {
    // Ensure the config has the label set
    const config: ChartTypeConfig = {
      ...definition.config,
      label: definition.config.label || definition.label,
    }

    // Backup built-in config if overriding and not already backed up
    if (
      chartConfigRegistry[definition.type] &&
      !this.builtInBackups.has(definition.type) &&
      !this.customCharts.has(definition.type)
    ) {
      this.builtInBackups.set(definition.type, chartConfigRegistry[definition.type])
    }

    // Store the definition
    this.customCharts.set(definition.type, definition)

    // Register into the three internal registries
    registerChartConfig(definition.type, config)
    registerConfigToCache(definition.type, config)
    registerChartComponent(
      definition.type,
      definition.component,
      definition.lazyComponent,
      definition.dependencies
    )

    // Store icon if provided
    if (definition.icon) {
      this.iconMap.set(definition.type, definition.icon)
    }

    this.bump()
  }

  /**
   * Unregister a custom chart.
   * If the chart type was a built-in override, the original built-in is restored.
   */
  unregister(type: string): void {
    if (!this.customCharts.has(type)) return

    this.customCharts.delete(type)
    this.iconMap.delete(type)

    // Restore built-in backup if exists
    const backup = this.builtInBackups.get(type)
    if (backup) {
      registerChartConfig(type, backup)
      registerConfigToCache(type, backup)
      this.builtInBackups.delete(type)
    } else {
      unregisterChartConfig(type)
      unregisterConfigFromCache(type)
    }

    // Always unregister the custom component
    unregisterChartComponent(type)

    this.bump()
  }

  /** Get the custom icon for a chart type, if registered */
  getIcon(type: string): ComponentType<IconProps> | undefined {
    return this.iconMap.get(type)
  }

  /** Get all registered custom chart type strings */
  getCustomTypes(): string[] {
    return Array.from(this.customCharts.keys())
  }

  /** Check if a chart type is a custom plugin (not built-in) */
  isCustom(type: string): boolean {
    return this.customCharts.has(type)
  }

  /**
   * Subscribe to registry changes.
   * Compatible with React's `useSyncExternalStore`.
   */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get a snapshot of the registry version.
   * Compatible with React's `useSyncExternalStore`.
   */
  getSnapshot = (): number => {
    return this.version
  }

  private bump(): void {
    this.version++
    for (const listener of this.listeners) {
      listener()
    }
  }
}

/** Singleton chart plugin registry */
export const chartPluginRegistry = new ChartPluginRegistry()

// Wire up the icon resolver so getChartTypeIcon() can find custom chart icons
// without creating a circular import
setCustomChartIconResolver((chartType: string) => chartPluginRegistry.getIcon(chartType))
