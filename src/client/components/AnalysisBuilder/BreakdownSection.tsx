/**
 * BreakdownSection Component
 *
 * Displays the Breakdown section in the query panel with expandable list of breakdowns.
 */

import { useMemo, memo } from 'react'
import type { BreakdownSectionProps } from './types'
import type { MetaField } from '../../shared/types'
import BreakdownRow from './BreakdownRow'
import SectionHeading from './SectionHeading'
import { getIcon } from '../../icons'
import { useTranslation } from '../../hooks/useTranslation'
import { useDragReorder } from './hooks/useDragReorder'

// Get icon once at module level to avoid recreating
const AddIcon = getIcon('add')

/**
 * Find field metadata by field name
 */
function findFieldMeta(fieldName: string, schema: BreakdownSectionProps['schema']): MetaField | null {
  if (!schema?.cubes) return null

  const [cubeName] = fieldName.split('.')
  const cube = schema.cubes.find((c) => c.name === cubeName)
  if (!cube) return null

  // Check dimensions first, then try to find in other arrays
  return cube.dimensions?.find((d) => d.name === fieldName) || null
}

/**
 * BreakdownSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected breakdowns (using BreakdownItemCard)
 * - Drag/drop reordering support
 */
const BreakdownSection = memo(function BreakdownSection({
  breakdowns,
  schema,
  onAdd,
  onRemove,
  onGranularityChange,
  onComparisonToggle,
  order,
  onOrderChange,
  onReorder
}: BreakdownSectionProps) {
  const { t } = useTranslation()

  const drag = useDragReorder('breakdown', (i) => breakdowns[i].field, breakdowns.length, onReorder)
  const { draggedIndex, dropTargetIndex } = drag

  // Get the ordered keys to calculate priority
  const orderKeys = useMemo(() => order ? Object.keys(order) : [], [order])

  // Calculate which breakdown has comparison enabled (only one allowed at a time)
  const activeComparisonId = useMemo(() => {
    const withComparison = breakdowns.find(b => b.isTimeDimension && b.enableComparison)
    return withComparison?.id || null
  }, [breakdowns])

  // Resolve field metadata for all breakdowns with sort info
  const breakdownsWithMeta = useMemo(() => {
    return breakdowns.map((breakdown, index) => {
      const sortDirection = order?.[breakdown.field] || null
      const sortPriority = sortDirection ? orderKeys.indexOf(breakdown.field) + 1 : undefined
      return {
        breakdown,
        fieldMeta: findFieldMeta(breakdown.field, schema),
        sortDirection,
        sortPriority,
        index
      }
    })
  }, [breakdowns, schema, order, orderKeys])

  return (
    <div>
      {/* Section Header - entire row is clickable */}
      <button
        onClick={onAdd}
        className="dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group"
        title="Add breakdown"
      >
        <SectionHeading>{t('analysis.sections.breakdown')}</SectionHeading>
        <AddIcon className="dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" />
      </button>

      {/* Breakdowns List */}
      <div
        className="dc:space-y-2"
        onDragLeave={onReorder ? drag.handleSectionDragLeave : undefined}
        onDragOver={onReorder ? (e) => e.preventDefault() : undefined}
        onDrop={onReorder ? drag.handleItemDrop : undefined}
      >
        {breakdownsWithMeta.map(({ breakdown, fieldMeta, sortDirection, sortPriority, index }) => (
          <BreakdownRow
            key={breakdown.id}
            breakdown={breakdown}
            fieldMeta={fieldMeta}
            sortDirection={sortDirection}
            sortPriority={sortPriority}
            index={index}
            transform={drag.getItemTransform(index)}
            showGapBefore={drag.shouldShowGapIndicator(index)}
            isAnyDragging={draggedIndex !== null}
            isDragging={draggedIndex === index}
            comparisonDisabled={activeComparisonId !== null && activeComparisonId !== breakdown.id}
            onRemove={onRemove}
            onGranularityChange={onGranularityChange}
            onComparisonToggle={onComparisonToggle}
            onOrderChange={onOrderChange}
            onReorder={onReorder}
            onItemDragOver={drag.handleItemDragOver}
            onItemDrop={drag.handleItemDrop}
            onDragStart={drag.handleDragStart}
            onDragEnd={drag.handleDragEnd}
          />
        ))}
        {/* Gap indicator after the last item - shows when dropping at end */}
        {onReorder && draggedIndex !== null && dropTargetIndex === breakdowns.length && (
          <div className="dc:relative dc:h-2">
            <div className="dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10">
              <div className="dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" />
            </div>
          </div>
        )}
        {/* Handle drop at the end of the list */}
        {onReorder && breakdowns.length > 0 && draggedIndex !== null && (
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

export default BreakdownSection
