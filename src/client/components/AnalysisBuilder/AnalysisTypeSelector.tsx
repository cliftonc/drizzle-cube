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
import { useTranslation } from '../../hooks/useTranslation'

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
  labelKey: string
  descriptionKey: string
  icon: React.ComponentType<{ className?: string }>
}

const typeOptionDefs: TypeOption[] = [
  {
    type: 'query',
    labelKey: 'analysis.modes.query.label',
    descriptionKey: 'analysis.modes.query.description',
    icon: ChartBarIcon,
  },
  {
    type: 'funnel',
    labelKey: 'analysis.modes.funnel.label',
    descriptionKey: 'analysis.modes.funnel.description',
    icon: ChartFunnelIcon,
  },
  {
    type: 'flow',
    labelKey: 'analysis.modes.flow.label',
    descriptionKey: 'analysis.modes.flow.description',
    icon: ChartSankeyIcon,
  },
  {
    type: 'retention',
    labelKey: 'analysis.modes.retention.label',
    descriptionKey: 'analysis.modes.retention.description',
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
  const { t } = useTranslation()

  const typeOptions = useMemo(() => typeOptionDefs.map(opt => ({
    ...opt,
    label: t(opt.labelKey),
    description: t(opt.descriptionKey),
  })), [t])
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
  }, [hasEventStreamCubes, typeOptions])

  return (
    <div className="dc:border-b border-dc-border bg-dc-surface">
      <div className="dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin">
        <div className="dc:flex dc:items-center dc:gap-0.5 dc:p-1.5 dc:min-w-max">
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
                  dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:rounded-md dc:text-sm dc:font-medium
                  dc:transition-colors dc:duration-150 dc:flex-shrink-0 dc:whitespace-nowrap
                  ${
                    isSelected
                      ? 'bg-dc-primary/10 text-dc-primary dc:border border-dc-primary/30'
                      : 'text-dc-text-secondary hover:bg-dc-bg-secondary hover:text-dc-text dc:border border-transparent'
                  }
                  ${disabled ? 'dc:opacity-50 dc:cursor-not-allowed' : 'dc:cursor-pointer'}
                `}
              >
                <Icon className="dc:h-4 dc:w-4 dc:flex-shrink-0" />
                <span className="dc:whitespace-nowrap">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default AnalysisTypeSelector
