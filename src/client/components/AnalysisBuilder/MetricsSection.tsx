/**
 * MetricsSection Component
 *
 * Displays the Metrics section in the query panel with expandable list of metrics.
 */

import { useMemo, memo } from 'react'
import type { MetricsSectionProps } from './types.js'
import type { MetaField } from '../../shared/types.js'
import MetricRow from './MetricRow.js'
import SectionHeading from './SectionHeading.js'
import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useDragReorder } from './hooks/useDragReorder.js'

// Get icon once at module level to avoid recreating
const AddIcon = getIcon('add')

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
 * MetricsSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected metrics (using MetricItemCard)
 * - Drag/drop reordering support
 */
const MetricsSection = memo(function MetricsSection({
  metrics,
  schema,
  onAdd,
  onRemove,
  order,
  onOrderChange,
  onReorder
}: MetricsSectionProps) {
  const { t } = useTranslation()

  const drag = useDragReorder('metric', (i) => metrics[i].field, metrics.length, onReorder)
  const { draggedIndex, dropTargetIndex } = drag

  // Get the ordered keys to calculate priority
  const orderKeys = useMemo(() => order ? Object.keys(order) : [], [order])

  // Resolve field metadata for all metrics with sort info
  const metricsWithMeta = useMemo(() => {
    return metrics.map((metric, index) => {
      const sortDirection = order?.[metric.field] || null
      const sortPriority = sortDirection ? orderKeys.indexOf(metric.field) + 1 : undefined
      return {
        metric,
        fieldMeta: findFieldMeta(metric.field, schema),
        sortDirection,
        sortPriority,
        index
      }
    })
  }, [metrics, schema, order, orderKeys])

  return (
    <div>
      {/* Section Header - entire row is clickable */}
      <button
        onClick={onAdd}
        className="dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group"
        title="Add metric"
      >
        <SectionHeading>{t('analysis.sections.metrics')}</SectionHeading>
        <AddIcon className="dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" />
      </button>

      {/* Metrics List */}
      <div
        className="dc:space-y-2"
        onDragLeave={onReorder ? drag.handleSectionDragLeave : undefined}
        onDragOver={onReorder ? (e) => e.preventDefault() : undefined}
        onDrop={onReorder ? drag.handleItemDrop : undefined}
      >
        {metricsWithMeta.map(({ metric, fieldMeta, sortDirection, sortPriority, index }) => (
          <MetricRow
            key={metric.id}
            metric={metric}
            fieldMeta={fieldMeta}
            sortDirection={sortDirection}
            sortPriority={sortPriority}
            index={index}
            transform={drag.getItemTransform(index)}
            showGapBefore={drag.shouldShowGapIndicator(index)}
            isAnyDragging={draggedIndex !== null}
            isDragging={draggedIndex === index}
            onRemove={onRemove}
            onOrderChange={onOrderChange}
            onReorder={onReorder}
            onItemDragOver={drag.handleItemDragOver}
            onItemDrop={drag.handleItemDrop}
            onDragStart={drag.handleDragStart}
            onDragEnd={drag.handleDragEnd}
          />
        ))}
        {/* Gap indicator after the last item - shows when dropping at end */}
        {onReorder && draggedIndex !== null && dropTargetIndex === metrics.length && (
          <div className="dc:relative dc:h-2">
            <div className="dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10">
              <div className="dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" />
            </div>
          </div>
        )}
        {/* Handle drop at the end of the list */}
        {onReorder && metrics.length > 0 && draggedIndex !== null && (
          <div
            className="dc:h-8"
            onDragOver={drag.handleEndZoneDragOver}
            onDrop={drag.handleItemDrop}
          />
        )}
      </div>
    </div>
  )
})

export default MetricsSection
