/**
 * AnalysisTypeSelector Component
 *
 * Displays a horizontal button group for selecting analysis type:
 * - Query: Single query analysis
 * - Multi: Multiple queries with merge/concat
 * - Funnel: Funnel analysis with sequential steps
 */

import React, { memo } from 'react'
import type { AnalysisType } from '../../types'
import { getIcon } from '../../icons'

const ChartBarIcon = getIcon('chartBar')
const ChartFunnelIcon = getIcon('chartFunnel')
const ChartSankeyIcon = getIcon('chartSankey')

interface AnalysisTypeSelectorProps {
  /** Currently selected analysis type */
  value: AnalysisType
  /** Called when analysis type changes */
  onChange: (type: AnalysisType) => void
  /** Disable the selector */
  disabled?: boolean
}

interface TypeOption {
  type: AnalysisType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const typeOptions: TypeOption[] = [
  {
    type: 'query',
    label: 'Query',
    description: 'Standard analysis (single or multi-query)',
    icon: ChartBarIcon,
  },
  {
    type: 'funnel',
    label: 'Funnel',
    description: 'Sequential conversion analysis',
    icon: ChartFunnelIcon,
  },
  {
    type: 'flow',
    label: 'Flow',
    description: 'Bidirectional path analysis with Sankey visualization',
    icon: ChartSankeyIcon,
  },
]

/**
 * AnalysisTypeSelector - Horizontal tabs for analysis type selection
 */
const AnalysisTypeSelector = memo(function AnalysisTypeSelector({
  value,
  onChange,
  disabled = false,
}: AnalysisTypeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-dc-border bg-dc-surface">
      {typeOptions.map((option) => {
        const isSelected = value === option.type
        const Icon = option.icon

        return (
          <button
            key={option.type}
            onClick={() => !disabled && onChange(option.type)}
            disabled={disabled}
            title={option.description}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              transition-colors duration-150
              ${
                isSelected
                  ? 'bg-dc-primary/10 text-dc-primary border border-dc-primary/30'
                  : 'text-dc-text-secondary hover:bg-dc-bg-secondary hover:text-dc-text border border-transparent'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
})

export default AnalysisTypeSelector
