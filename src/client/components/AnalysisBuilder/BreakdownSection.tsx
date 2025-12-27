/**
 * BreakdownSection Component
 *
 * Displays the Breakdown section in the query panel with expandable list of breakdowns.
 */

import { useMemo } from 'react'
import type { BreakdownSectionProps } from './types'
import type { MetaField } from '../../shared/types'
import BreakdownItemCard from './BreakdownItemCard'
import { getIcon } from '../../icons'

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
 * BreakdownSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected breakdowns (using BreakdownItemCard)
 * - Empty state with add button
 */
export default function BreakdownSection({
  breakdowns,
  schema,
  onAdd,
  onRemove,
  onGranularityChange,
  order,
  onOrderChange
}: BreakdownSectionProps) {
  const AddIcon = getIcon('add')

  // Get the ordered keys to calculate priority
  const orderKeys = useMemo(() => order ? Object.keys(order) : [], [order])

  // Resolve field metadata for all breakdowns with sort info
  const breakdownsWithMeta = useMemo(() => {
    return breakdowns.map((breakdown) => {
      const sortDirection = order?.[breakdown.field] || null
      const sortPriority = sortDirection ? orderKeys.indexOf(breakdown.field) + 1 : undefined
      return {
        breakdown,
        fieldMeta: findFieldMeta(breakdown.field, schema),
        sortDirection,
        sortPriority
      }
    })
  }, [breakdowns, schema, order, orderKeys])

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dc-text">Breakdown</h3>
        <button
          onClick={onAdd}
          className="p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-secondary rounded transition-colors"
          title="Add breakdown"
        >
          <AddIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Breakdowns List or Empty State */}
      {breakdowns.length === 0 ? (
        <button
          onClick={onAdd}
          className="w-full p-3 border-2 border-dashed border-dc-border rounded-lg text-dc-text-muted hover:border-dc-primary hover:text-dc-primary transition-colors"
        >
          + Add Breakdown
        </button>
      ) : (
        <div className="space-y-2">
          {breakdownsWithMeta.map(({ breakdown, fieldMeta, sortDirection, sortPriority }) => (
            <BreakdownItemCard
              key={breakdown.id}
              breakdown={breakdown}
              fieldMeta={fieldMeta}
              onRemove={() => onRemove(breakdown.id)}
              onGranularityChange={
                breakdown.isTimeDimension
                  ? (granularity) => onGranularityChange(breakdown.id, granularity)
                  : undefined
              }
              sortDirection={sortDirection}
              sortPriority={sortPriority}
              onToggleSort={onOrderChange ? () => {
                const nextDirection = getNextSortDirection(sortDirection)
                onOrderChange(breakdown.field, nextDirection)
              } : undefined}
            />
          ))}

          {/* Add Another Button */}
          <button
            onClick={onAdd}
            className="w-full p-2 text-sm text-dc-text-muted hover:text-dc-primary transition-colors"
          >
            + Add Breakdown
          </button>
        </div>
      )}
    </div>
  )
}
