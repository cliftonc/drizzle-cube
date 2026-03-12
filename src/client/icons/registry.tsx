/**
 * Icon Registry - Centralized icon management following the theme pattern
 * Allows users to override any icon with their own implementations
 */

import { Icon } from '@iconify/react'
import type { IconifyIcon } from '@iconify/types'
import type { ComponentType } from 'react'
import { DEFAULT_ICONS } from './defaultIcons'
import type { IconRegistry, IconName, IconDefinition, IconCategory, IconProps, PartialIconRegistry } from './types'

// Internal mutable registry - starts with defaults
let _registry: IconRegistry = { ...DEFAULT_ICONS }

// Cache for icon components to avoid recreating on every getIcon() call
// This prevents React from unmounting/remounting icons on each render
const _iconComponentCache = new Map<IconName, ComponentType<IconProps>>()

/**
 * Get the full icon registry
 */
export function getIconRegistry(): IconRegistry {
  return _registry
}

/**
 * Get a specific icon as a React component
 * @param name The icon name from the registry
 * @returns A React component that renders the icon (cached for stable references)
 */
export function getIcon(name: IconName): ComponentType<IconProps> {
  // Check cache first for stable component references
  const cached = _iconComponentCache.get(name)
  if (cached) {
    return cached
  }

  const iconDef = _registry[name]
  if (!iconDef) {
    console.warn(`Icon "${name}" not found in registry, using fallback`)
    // Create and cache fallback component
    const FallbackIcon = ({ className, ...props }: IconProps) => (
      <Icon icon={_registry.info.icon} className={className} {...props} />
    )
    return FallbackIcon
  }

  // Create and cache the icon component
  const IconComponent = ({ className, ...props }: IconProps) => (
    <Icon icon={iconDef.icon} className={className} {...props} />
  )
  _iconComponentCache.set(name, IconComponent)
  return IconComponent
}

/**
 * Get icon data directly (for use with Iconify's Icon component)
 * @param name The icon name from the registry
 * @returns The IconifyIcon data
 */
export function getIconData(name: IconName): IconifyIcon {
  return _registry[name]?.icon ?? _registry.info.icon
}

/**
 * Override a single icon in the registry
 * @param name The icon name to override
 * @param icon The new IconifyIcon data
 */
export function setIcon(name: IconName, icon: IconifyIcon): void {
  if (_registry[name]) {
    _registry[name] = {
      ..._registry[name],
      icon
    }
    // Clear cache for this icon so it gets recreated with new definition
    _iconComponentCache.delete(name)
  }
}

/**
 * Register multiple icon overrides at once
 * @param overrides Partial registry with icons to override
 */
export function registerIcons(overrides: PartialIconRegistry): void {
  for (const [key, value] of Object.entries(overrides)) {
    if (value && key in _registry) {
      const iconKey = key as IconName

      // Check if it's a raw IconifyIcon or a full IconDefinition
      if ('body' in value) {
        // It's an IconifyIcon
        _registry[iconKey] = {
          ..._registry[iconKey],
          icon: value as IconifyIcon
        }
      } else {
        // It's a partial IconDefinition
        const partial = value as Partial<IconDefinition>
        _registry[iconKey] = {
          ..._registry[iconKey],
          ...partial,
          icon: partial.icon ?? _registry[iconKey].icon
        }
      }
      // Clear cache for this icon so it gets recreated with new definition
      _iconComponentCache.delete(iconKey)
    }
  }
}

/**
 * Reset the registry to default icons
 */
export function resetIcons(): void {
  _registry = { ...DEFAULT_ICONS }
  // Clear all cached icon components
  _iconComponentCache.clear()
}

/**
 * Get all icons in a specific category
 * @param category The icon category to filter by
 * @returns Record of icon names to their components
 */
export function getIconsByCategory(category: IconCategory): Record<string, ComponentType<IconProps>> {
  const result: Record<string, ComponentType<IconProps>> = {}

  for (const [key, value] of Object.entries(_registry)) {
    if (value.category === category) {
      result[key] = getIcon(key as IconName)
    }
  }

  return result
}

/**
 * Helper to get measure type icon component
 * @param measureType The measure type (count, avg, sum, etc.)
 * @returns React component for the icon
 */
export function getMeasureTypeIcon(measureType: string | undefined): ComponentType<IconProps> {
  const typeMap: Record<string, IconName> = {
    count: 'measureCount',
    countDistinct: 'measureCountDistinct',
    countDistinctApprox: 'measureCountDistinctApprox',
    sum: 'measureSum',
    avg: 'measureAvg',
    min: 'measureMin',
    max: 'measureMax',
    runningTotal: 'measureRunningTotal',
    calculated: 'measureCalculated',
    number: 'measureNumber'
  }

  const iconName = typeMap[measureType || ''] || 'measureCount'
  return getIcon(iconName)
}

/**
 * Helper to get chart type icon component
 * @param chartType The chart type (bar, line, pie, etc.)
 * @returns React component for the icon
 */
export function getChartTypeIcon(chartType: string): ComponentType<IconProps> {
  const typeMap: Record<string, IconName> = {
    bar: 'chartBar',
    line: 'chartLine',
    area: 'chartArea',
    pie: 'chartPie',
    scatter: 'chartScatter',
    bubble: 'chartBubble',
    radar: 'chartRadar',
    radialBar: 'chartRadialBar',
    treemap: 'chartTreemap',
    table: 'chartTable',
    activityGrid: 'chartActivityGrid',
    kpiNumber: 'chartKpiNumber',
    kpiDelta: 'chartKpiDelta',
    kpiText: 'chartKpiText',
    markdown: 'chartMarkdown',
    funnel: 'chartFunnel',
    sankey: 'chartSankey',
    sunburst: 'chartSunburst',
    heatmap: 'chartHeatmap'
  }

  const iconName = typeMap[chartType] || 'chartBar'
  return getIcon(iconName)
}

/**
 * Helper to get field type icon component
 * @param fieldType The field type (measure, dimension, timeDimension)
 * @returns React component for the icon
 */
export function getFieldTypeIcon(fieldType: string): ComponentType<IconProps> {
  const typeMap: Record<string, IconName> = {
    measure: 'measure',
    dimension: 'dimension',
    timeDimension: 'timeDimension',
    time: 'timeDimension',
    segment: 'segment'
  }

  const iconName = typeMap[fieldType] || 'dimension'
  return getIcon(iconName)
}
