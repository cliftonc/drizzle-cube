/**
 * Unified Chart Registry — the single source of truth for a chart type.
 *
 * Historically, adding a chart required coordinated edits across four central
 * registries (eager config, lazy config, the loader, the icon map) plus the
 * per-chart component/config/helper/icon files, with the same dynamic-import
 * path repeated three times. A typo in one failed silently.
 *
 * `chartRegistry` collapses that into one entry per chart. The eager config
 * registry, the lazy config registry, the icon lookup, and the dependency map
 * become **derived** from this map. Charts not yet migrated keep working off the
 * legacy registries — `Partial<Record<…>>` models that half-migrated state and
 * the `| undefined` from a lookup drives the legacy fallback.
 *
 * Client/server boundary: this module is DOM-free so the server agent and the
 * eager config registry can import it. The React **component** thunk (which
 * pulls recharts / ChartContainer / DOM globals) is a client-only concern and
 * lives in the loader's component map — NOT here. Lazy loading is purely a
 * client optimisation; server/MCP/agent code reads the eager config directly.
 *
 * Slice 1 (issue #910) migrates Bar end-to-end as the tracer.
 */

import type { BuiltInChartType } from '../types.js'
import type { IconName } from '../icons/types.js'
import type {
  ChartTypeConfig,
  ChartAvailabilityContext,
  ChartAvailability,
} from './chartConfigs.js'
import { requiresMeasureAndDimension } from './chartConfigHelpers.js'
import { setRegistryIconResolver } from '../icons/registry.js'

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
  label: string
  /** Icon name resolved via the icon registry (override-able via registerIcons/setIcon). */
  icon: IconName
  /** Brief description — i18n key. */
  description?: string
  /** When to use this chart — i18n key. */
  useCase?: string
  /** Whether the chart can render with the current query shape. */
  isAvailable?: (ctx: ChartAvailabilityContext) => ChartAvailability
  /** Optional peer dependency — shows install instructions if the import fails. */
  dependencies?: { packageName: string; installCommand: string }
  /** Lazy config import — resolves the config OBJECT directly (client lazy path). */
  config: () => Promise<ChartTypeConfig>
}

/**
 * The unified registry. Typed `Partial` while migration is in progress: only
 * migrated charts have an entry; everything else falls back to the legacy maps.
 * Slice 2 drops `Partial` → `Record` and deletes the dead fallbacks.
 */
export const chartRegistry: Partial<Record<BuiltInChartType, ChartRegistryEntry>> = {
  bar: {
    label: 'chart.bar.label',
    icon: 'chartBar',
    description: 'chart.bar.description',
    useCase: 'chart.bar.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: {
      packageName: 'recharts',
      installCommand: 'npm install recharts',
    },
    config: async () => (await import('../components/charts/BarChart.config.js')).barChartConfig,
  },
}

// Wire the icon resolver so getChartTypeIcon() derives migrated charts' icons
// from their entry, without the icon module statically depending on this one.
// Mirrors the `setCustomChartIconResolver` plugin pattern.
setRegistryIconResolver((chartType) => chartRegistry[chartType as BuiltInChartType]?.icon)

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
export function composeChartConfig(entry: ChartRegistryEntry, base: ChartTypeConfig): ChartTypeConfig {
  return {
    ...base,
    label: entry.label,
    description: entry.description,
    useCase: entry.useCase,
    isAvailable: entry.isAvailable,
  }
}
