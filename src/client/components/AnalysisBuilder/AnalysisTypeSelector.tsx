/**
 * AnalysisTypeSelector Component
 *
 * Displays a horizontal button group for selecting analysis type:
 * - Query: Single query analysis
 * - Multi: Multiple queries with merge/concat
 * - Funnel: Funnel analysis with sequential steps
 */

import React, { memo, useMemo } from 'react'
import type { AnalysisType, CubeMeta } from '../../types'
import { getIcon } from '../../icons'

const ChartBarIcon = getIcon('chartBar')
const ChartFunnelIcon = getIcon('chartFunnel')
const ChartSankeyIcon = getIcon('chartSankey')
const ChartRetentionIcon = getIcon('chartRetention')

interface AnalysisTypeSelectorProps {
  /** Currently selected analysis type */
  value: AnalysisType
  /** Called when analysis type changes */
  onChange: (type: AnalysisType) => void
  /** Disable the selector */
  disabled?: boolean
  /** Cube metadata for eventStream detection */
  schema?: CubeMeta | null
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
  {
    type: 'retention',
    label: 'Retention',
    description: 'Cohort-based retention analysis over time periods',
    icon: ChartRetentionIcon,
  },
]

/**
 * AnalysisTypeSelector - Horizontal tabs for analysis type selection
 */
const AnalysisTypeSelector = memo(function AnalysisTypeSelector({
  value,
  onChange,
  disabled = false,
  schema,
}: AnalysisTypeSelectorProps) {
  // Check if any cubes have eventStream metadata
  const hasEventStreamCubes = useMemo(() => {
    return schema?.cubes?.some((cube) => cube.meta?.eventStream) ?? false
  }, [schema])

  // Filter type options - event-based modes require eventStream cubes
  const availableOptions = useMemo(() => {
    return typeOptions.filter((option) => {
      // Query mode is always available
      if (option.type === 'query') return true
      // Event-based modes (funnel, flow, retention) require eventStream cubes
      return hasEventStreamCubes
    })
  }, [hasEventStreamCubes])

  return (
    <div className="flex items-center gap-0.5 p-1.5 border-b border-dc-border bg-dc-surface">
      {availableOptions.map((option) => {
        const isSelected = value === option.type
        const Icon = option.icon

        return (
          <button
            key={option.type}
            onClick={() => !disabled && onChange(option.type)}
            disabled={disabled}
            title={option.description}
            className={`
              flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium
              transition-colors duration-150
              ${
                isSelected
                  ? 'bg-dc-primary/10 text-dc-primary border border-dc-primary/30'
                  : 'text-dc-text-secondary hover:bg-dc-bg-secondary hover:text-dc-text border border-transparent'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
})

export default AnalysisTypeSelector
