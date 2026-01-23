/**
 * AnalysisChartConfigPanel Component
 *
 * A single-column chart configuration panel for the AnalysisBuilder.
 * Uses fields from the Query tab (metrics/breakdowns) as available fields.
 * Renders axis drop zones and display options based on chart type.
 */

import { useMemo, useEffect, useState, useCallback, DragEvent } from 'react'
import { getIcon, getMeasureTypeIcon } from '../../icons'
import SectionHeading from './SectionHeading'
import AnalysisAxisDropZone from './AnalysisAxisDropZone'
import ChartTypeSelector from '../ChartTypeSelector'
import { useChartConfig } from '../../charts/lazyChartConfigRegistry'
import type { ChartType, ChartAxisConfig } from '../../types'
import type { MetricItem, BreakdownItem } from './types'
import type { ChartAvailabilityMap } from '../../shared/chartDefaults'
import type { MetaResponse } from '../../shared/types'

const MeasureIcon = getIcon('measure')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')

interface AnalysisChartConfigPanelProps {
  chartType: ChartType
  chartConfig: ChartAxisConfig
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  /** Schema metadata for resolving field titles */
  schema?: MetaResponse | null
  /** Map of chart type availability for disabling unavailable chart types */
  chartAvailability?: ChartAvailabilityMap
  onChartTypeChange: (type: ChartType) => void
  onChartConfigChange: (config: ChartAxisConfig) => void
}

export default function AnalysisChartConfigPanel({
  chartType,
  chartConfig,
  metrics,
  breakdowns,
  schema,
  chartAvailability,
  onChartTypeChange,
  onChartConfigChange
}: AnalysisChartConfigPanelProps) {
  // Track currently dragging item for immediate state updates
  const [draggedItem, setDraggedItem] = useState<{
    field: string
    fromAxis: string
    fromIndex?: number
  } | null>(null)

  // Derive available fields from metrics and breakdowns
  const availableFields = useMemo(
    () => ({
      measures: metrics.map((m) => m.field),
      dimensions: breakdowns.filter((b) => !b.isTimeDimension).map((b) => b.field),
      timeDimensions: breakdowns.filter((b) => b.isTimeDimension).map((b) => b.field)
    }),
    [metrics, breakdowns]
  )

  // Get configuration for current chart type
  const { config: chartTypeConfig, loaded: chartConfigLoaded } = useChartConfig(chartType)

  // Check if this chart type skips queries
  const shouldSkipQuery = chartTypeConfig.skipQuery === true

  // Get fields for each drop zone
  const getFieldsForDropZone = useCallback((key: string): string[] => {
    const value = chartConfig[key as keyof ChartAxisConfig]
    const result = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? [value]
        : []
    return result
  }, [chartConfig])

  // Clean up chart config when available fields change
  useEffect(() => {
    if (!chartConfigLoaded) return
    const allAvailableFields = [
      ...availableFields.dimensions,
      ...availableFields.timeDimensions,
      ...availableFields.measures
    ]

    let hasChanges = false
    const newConfig = { ...chartConfig }

    // Check each axis and remove fields that are no longer available
    chartTypeConfig.dropZones.forEach((dropZone) => {
      const currentFields = getFieldsForDropZone(dropZone.key)
      const validFields = currentFields.filter((field) => allAvailableFields.includes(field))

      if (validFields.length !== currentFields.length) {
        hasChanges = true
        if (validFields.length === 0) {
          // Remove the axis property entirely if no valid fields remain
          delete newConfig[dropZone.key as keyof ChartAxisConfig]
        } else if (dropZone.maxItems === 1) {
          // Single field axis - always store as string
          newConfig[dropZone.key as keyof ChartAxisConfig] = validFields[0] as any
        } else {
          // Multi-field axis - always store as array
          newConfig[dropZone.key as keyof ChartAxisConfig] = validFields as any
        }
      }
    })

    if (hasChanges) {
      onChartConfigChange(newConfig)
    }
  }, [availableFields, chartConfig, chartTypeConfig.dropZones, onChartConfigChange, getFieldsForDropZone, chartConfigLoaded])

  // Helper to determine field type and styling
  const getFieldType = (field: string): 'dimension' | 'timeDimension' | 'measure' => {
    if (availableFields.measures.includes(field)) return 'measure'
    if (availableFields.timeDimensions.includes(field)) return 'timeDimension'
    return 'dimension'
  }

  // Helper to find field metadata from schema
  const findFieldMeta = (fieldName: string) => {
    if (!schema?.cubes) return null

    const [cubeName] = fieldName.split('.')
    const cube = schema.cubes.find((c) => c.name === cubeName)
    if (!cube) return null

    // Check measures first, then dimensions
    const measure = cube.measures?.find((m) => m.name === fieldName)
    if (measure) return { ...measure, fieldType: 'measure' as const }

    const dimension = cube.dimensions?.find((d) => d.name === fieldName)
    if (dimension) return { ...dimension, fieldType: dimension.type === 'time' ? 'timeDimension' as const : 'dimension' as const }

    return null
  }

  // Get field metadata for display in AnalysisAxisDropZone
  const getFieldMeta = (field: string) => {
    const fieldType = getFieldType(field)
    const parts = field.split('.')
    const cubeName = parts[0] || field
    const fieldName = parts[1] || field

    // Look up field metadata from schema
    const schemaMeta = findFieldMeta(field)

    // Try to find the field in breakdowns for isTimeDimension flag
    const breakdownItem = breakdowns.find((b) => b.field === field)

    if (schemaMeta) {
      return {
        title: schemaMeta.title || fieldName,
        shortTitle: schemaMeta.shortTitle || schemaMeta.title || fieldName,
        cubeName,
        type: schemaMeta.fieldType,
        measureType: schemaMeta.fieldType === 'measure' ? schemaMeta.type : undefined
      }
    }

    // Fallback when schema lookup fails
    if (breakdownItem) {
      return {
        title: fieldName,
        shortTitle: fieldName,
        cubeName,
        type: breakdownItem.isTimeDimension ? ('timeDimension' as const) : ('dimension' as const)
      }
    }

    return {
      title: fieldName,
      shortTitle: fieldName,
      cubeName,
      type: fieldType
    }
  }

  // Drag and drop handlers
  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    field: string,
    fromAxis: string,
    fromIndex?: number
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ field, fromAxis, fromIndex }))
    setDraggedItem({ field, fromAxis, fromIndex })
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, toAxis: string) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { field, fromAxis } = data

    const newConfig = { ...chartConfig }

    // Remove from old location if moving between axes
    if (fromAxis !== 'available' && fromAxis !== toAxis) {
      const fromValue = newConfig[fromAxis as keyof ChartAxisConfig]
      if (Array.isArray(fromValue)) {
        const filteredValue = fromValue.filter((f) => f !== field)
        if (filteredValue.length === 0) {
          delete newConfig[fromAxis as keyof ChartAxisConfig]
        } else {
          newConfig[fromAxis as keyof ChartAxisConfig] = filteredValue as any
        }
      } else if (fromValue === field) {
        delete newConfig[fromAxis as keyof ChartAxisConfig]
      }
    }

    // Add to new location
    const toValue = newConfig[toAxis as keyof ChartAxisConfig]
    const dropZoneConfig = chartTypeConfig.dropZones.find((dz) => dz.key === toAxis)

    if (dropZoneConfig?.maxItems === 1) {
      // Single field - always store as string
      newConfig[toAxis as keyof ChartAxisConfig] = field as any
    } else {
      // Multiple fields - always store as array
      if (Array.isArray(toValue)) {
        if (!toValue.includes(field)) {
          newConfig[toAxis as keyof ChartAxisConfig] = [...toValue, field] as any
        }
      } else {
        newConfig[toAxis as keyof ChartAxisConfig] = [field] as any
      }
    }

    // Apply default yAxisAssignment when adding to yAxis with dual axis enabled
    if (toAxis === 'yAxis' && dropZoneConfig?.enableDualAxis) {
      const currentYAxisFields = Array.isArray(newConfig.yAxis) ? newConfig.yAxis : [field]
      const fieldIndex = currentYAxisFields.indexOf(field)
      // Default: 1st field = left, 2nd field = right, 3rd+ = left
      if (!newConfig.yAxisAssignment?.[field]) {
        newConfig.yAxisAssignment = {
          ...newConfig.yAxisAssignment,
          [field]: fieldIndex === 1 ? 'right' : 'left'
        }
      }
    }

    setDraggedItem(null)
    onChartConfigChange(newConfig)
  }

  const handleRemoveFromAxis = (field: string, fromAxis: string) => {
    const newConfig = { ...chartConfig }
    const value = newConfig[fromAxis as keyof ChartAxisConfig]

    if (Array.isArray(value)) {
      const filteredValue = value.filter((f) => f !== field)
      if (filteredValue.length === 0) {
        delete newConfig[fromAxis as keyof ChartAxisConfig]
      } else {
        newConfig[fromAxis as keyof ChartAxisConfig] = filteredValue as any
      }
    } else if (value === field) {
      delete newConfig[fromAxis as keyof ChartAxisConfig]
    }

    // Clean up yAxisAssignment when removing from yAxis
    if (fromAxis === 'yAxis' && newConfig.yAxisAssignment?.[field]) {
      const { [field]: _removed, ...rest } = newConfig.yAxisAssignment
      newConfig.yAxisAssignment = Object.keys(rest).length > 0 ? rest : undefined
    }

    onChartConfigChange(newConfig)
  }

  const handleReorder = (fromIndex: number, toIndex: number, axisKey: string) => {
    const newConfig = { ...chartConfig }
    const value = newConfig[axisKey as keyof ChartAxisConfig]

    // Only reorder if we have an array with multiple items
    if (Array.isArray(value) && value.length > 1 && fromIndex !== toIndex) {
      const newArray = [...value]
      const [movedItem] = newArray.splice(fromIndex, 1)
      newArray.splice(toIndex, 0, movedItem)
      newConfig[axisKey as keyof ChartAxisConfig] = newArray as any

      setDraggedItem(null)
      onChartConfigChange(newConfig)
    }
  }

  // Handler for Y-axis assignment changes (dual Y-axis support)
  const handleYAxisAssignmentChange = useCallback(
    (field: string, axis: 'left' | 'right') => {
      onChartConfigChange({
        ...chartConfig,
        yAxisAssignment: {
          ...chartConfig.yAxisAssignment,
          [field]: axis
        }
      })
    },
    [chartConfig, onChartConfigChange]
  )

  if (!chartConfigLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <SectionHeading className="mb-2">Chart Type</SectionHeading>
          <ChartTypeSelector
            selectedType={chartType}
            onTypeChange={onChartTypeChange}
            availability={chartAvailability}
            excludeTypes={['funnel', 'sankey', 'sunburst', 'retentionHeatmap', 'retentionCombined']}
            compact
          />
        </div>
        <div className="text-center text-dc-text-muted text-sm py-4">
          Loading chart configuration...
        </div>
      </div>
    )
  }

  // Get unassigned fields (fields selected in Query tab but not yet assigned to chart axes)
  const getUnassignedFields = () => {
    const assignedFields = new Set<string>()
    chartTypeConfig.dropZones.forEach((dz) => {
      getFieldsForDropZone(dz.key).forEach((field) => assignedFields.add(field))
    })

    // Exclude the currently dragged field only if it's being dragged FROM a configured axis
    if (draggedItem && draggedItem.fromAxis !== 'available') {
      assignedFields.add(draggedItem.field)
    }

    return {
      dimensions: availableFields.dimensions.filter((f) => !assignedFields.has(f)),
      timeDimensions: availableFields.timeDimensions.filter((f) => !assignedFields.has(f)),
      measures: availableFields.measures.filter((f) => !assignedFields.has(f))
    }
  }

  const unassignedFields = getUnassignedFields()
  const hasUnassignedFields =
    unassignedFields.dimensions.length > 0 ||
    unassignedFields.timeDimensions.length > 0 ||
    unassignedFields.measures.length > 0

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div>
        <SectionHeading className="mb-2">Chart Type</SectionHeading>
        <ChartTypeSelector
          selectedType={chartType}
          onTypeChange={onChartTypeChange}
          availability={chartAvailability}
          excludeTypes={['funnel', 'sankey', 'sunburst', 'retentionHeatmap', 'retentionCombined']}
          compact
        />
      </div>

      {/* Chart Axis Configuration - Dynamic Drop Zones */}
      {!shouldSkipQuery && chartTypeConfig.dropZones.length > 0 && (
        <div>
          <SectionHeading className="mb-2">
            Chart Configuration
          </SectionHeading>
          <div className="space-y-1">
            {chartTypeConfig.dropZones.map((dropZone) => (
              <AnalysisAxisDropZone
                key={dropZone.key}
                config={dropZone}
                fields={getFieldsForDropZone(dropZone.key)}
                onDrop={handleDrop}
                onRemove={handleRemoveFromAxis}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onReorder={handleReorder}
                draggedItem={draggedItem}
                getFieldMeta={getFieldMeta}
                yAxisAssignment={chartConfig.yAxisAssignment}
                onYAxisAssignmentChange={
                  dropZone.enableDualAxis ? handleYAxisAssignmentChange : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Fields - Show fields from Query tab that haven't been assigned yet */}
      {!shouldSkipQuery && hasUnassignedFields && (
        <div>
          <div className="mb-2">
            <SectionHeading>Unassigned Fields</SectionHeading>
            <div className="text-xs text-dc-text-muted mt-0.5">
              Drag fields to chart axes above
            </div>
          </div>
          <div className="border-2 border-dashed border-dc-border rounded-lg p-2 bg-dc-surface-secondary">
            <div className="space-y-2">
              {/* Measures */}
              {unassignedFields.measures.map((field) => {
                const meta = getFieldMeta(field)
                const isBeingDragged =
                  draggedItem && draggedItem.field === field && draggedItem.fromAxis === 'available'
                const IconComponent = getMeasureTypeIcon(meta.measureType || 'count') || MeasureIcon
                return (
                  <div
                    key={field}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field, 'available')}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 bg-dc-surface rounded-lg hover:bg-dc-surface-tertiary transition-colors cursor-move ${isBeingDragged ? 'opacity-50 cursor-grabbing' : ''}`}
                    title={field}
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-measure text-dc-measure-text flex-shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dc-text truncate">{meta.shortTitle}</div>
                      <div className="text-xs text-dc-text-muted truncate">{meta.cubeName}</div>
                    </div>
                  </div>
                )
              })}

              {/* Dimensions */}
              {unassignedFields.dimensions.map((field) => {
                const meta = getFieldMeta(field)
                const isBeingDragged =
                  draggedItem && draggedItem.field === field && draggedItem.fromAxis === 'available'
                return (
                  <div
                    key={field}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field, 'available')}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 bg-dc-surface rounded-lg hover:bg-dc-surface-tertiary transition-colors cursor-move ${isBeingDragged ? 'opacity-50 cursor-grabbing' : ''}`}
                    title={field}
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-dimension text-dc-dimension-text flex-shrink-0">
                      <DimensionIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dc-text truncate">{meta.shortTitle}</div>
                      <div className="text-xs text-dc-text-muted truncate">{meta.cubeName}</div>
                    </div>
                  </div>
                )
              })}

              {/* Time Dimensions */}
              {unassignedFields.timeDimensions.map((field) => {
                const meta = getFieldMeta(field)
                const isBeingDragged =
                  draggedItem && draggedItem.field === field && draggedItem.fromAxis === 'available'
                return (
                  <div
                    key={field}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field, 'available')}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 bg-dc-surface rounded-lg hover:bg-dc-surface-tertiary transition-colors cursor-move ${isBeingDragged ? 'opacity-50 cursor-grabbing' : ''}`}
                    title={field}
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-time-dimension text-dc-time-dimension-text flex-shrink-0">
                      <TimeDimensionIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dc-text truncate">{meta.shortTitle}</div>
                      <div className="text-xs text-dc-text-muted truncate">{meta.cubeName}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Help text when no fields are available */}
      {!shouldSkipQuery &&
        availableFields.measures.length === 0 &&
        availableFields.dimensions.length === 0 &&
        availableFields.timeDimensions.length === 0 && (
          <div className="text-center text-dc-text-muted text-sm py-4">
            <p>Add metrics and breakdowns in the Query tab to configure your chart.</p>
          </div>
        )}
    </div>
  )
}
