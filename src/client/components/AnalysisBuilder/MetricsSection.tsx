/**
 * MetricsSection Component
 *
 * Displays the Metrics section in the query panel with expandable list of metrics.
 */

import { useMemo } from 'react'
import type { MetricsSectionProps } from './types'
import type { MetaField } from '../../shared/types'
import MetricItemCard from './MetricItemCard'
import { getIcon } from '../../icons'

/**
 * Find field metadata by field name
 */
function findFieldMeta(fieldName: string, schema: MetricsSectionProps['schema']): MetaField | null {
  if (!schema?.cubes) return null

  const [cubeName] = fieldName.split('.')
  const cube = schema.cubes.find((c) => c.name === cubeName)
  if (!cube) return null

  return cube.measures?.find((m) => m.name === fieldName) || null
}

/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null {
  switch (current) {
    case null:
      return 'asc'
    case 'asc':
      return 'desc'
    case 'desc':
      return null
    default:
      return 'asc'
  }
}

/**
 * MetricsSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected metrics (using MetricItemCard)
 * - Empty state with add button
 */
export default function MetricsSection({
  metrics,
  schema,
  onAdd,
  onRemove,
  order,
  onOrderChange
}: MetricsSectionProps) {
  const AddIcon = getIcon('add')

  // Get the ordered keys to calculate priority
  const orderKeys = useMemo(() => order ? Object.keys(order) : [], [order])

  // Resolve field metadata for all metrics with sort info
  const metricsWithMeta = useMemo(() => {
    return metrics.map((metric) => {
      const sortDirection = order?.[metric.field] || null
      const sortPriority = sortDirection ? orderKeys.indexOf(metric.field) + 1 : undefined
      return {
        metric,
        fieldMeta: findFieldMeta(metric.field, schema),
        sortDirection,
        sortPriority
      }
    })
  }, [metrics, schema, order, orderKeys])

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dc-text">Metrics</h3>
        <button
          onClick={onAdd}
          className="p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-secondary rounded transition-colors"
          title="Add metric"
        >
          <AddIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics List or Empty State */}
      {metrics.length === 0 ? (
        <button
          onClick={onAdd}
          className="w-full p-3 border-2 border-dashed border-dc-border rounded-lg text-dc-text-muted hover:border-dc-primary hover:text-dc-primary transition-colors"
        >
          + Add Metric
        </button>
      ) : (
        <div className="space-y-2">
          {metricsWithMeta.map(({ metric, fieldMeta, sortDirection, sortPriority }) => (
            <MetricItemCard
              key={metric.id}
              metric={metric}
              fieldMeta={fieldMeta}
              onRemove={() => onRemove(metric.id)}
              sortDirection={sortDirection}
              sortPriority={sortPriority}
              onToggleSort={onOrderChange ? () => {
                const nextDirection = getNextSortDirection(sortDirection)
                onOrderChange(metric.field, nextDirection)
              } : undefined}
            />
          ))}

          {/* Add Another Button */}
          <button
            onClick={onAdd}
            className="w-full p-2 text-sm text-dc-text-muted hover:text-dc-primary transition-colors"
          >
            + Add Metric
          </button>
        </div>
      )}
    </div>
  )
}
