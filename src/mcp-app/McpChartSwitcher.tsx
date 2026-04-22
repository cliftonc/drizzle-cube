import { useState } from 'react'
import { getChartTypeIcon } from '../client/icons'
import { chartConfigRegistry } from '../client/charts/chartConfigRegistry'
import { useTranslation } from '../client/hooks/useTranslation'
import { isChartAvailable, type McpChartType } from './chartAutoSelect'

/** Chart types that have real components in the MCP app */
const MCP_CHART_TYPES: McpChartType[] = [
  'bar', 'line', 'area', 'pie', 'scatter', 'treemap',
  'kpiNumber', 'kpiDelta', 'kpiText', 'table',
  'radar', 'radialBar', 'bubble', 'funnel',
  'waterfall', 'gauge', 'boxPlot', 'candlestick',
  'activityGrid', 'measureProfile',
]

interface McpChartSwitcherProps {
  selected: McpChartType
  query: any
  rowCount: number
  onSelect: (chartType: McpChartType) => void
}

export default function McpChartSwitcher({ selected, query, rowCount, onSelect }: McpChartSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  // Chart configs store translation keys (e.g., 'chart.bar.label') —
  // resolve them via t() at render time. Falls back to the type id
  // if no config/label is registered for the chart type.
  const getLabel = (type: string): string => {
    const key = chartConfigRegistry[type]?.label
    return key ? t(key) : type
  }

  const SelectedIcon = getChartTypeIcon(selected)
  const selectedLabel = getLabel(selected)

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 6,
          border: '1px solid var(--dc-border, #e2e8f0)',
          background: 'var(--dc-surface, #fff)',
          color: 'var(--dc-text, #1e293b)',
          cursor: 'pointer',
        }}
      >
        <SelectedIcon style={{ width: 14, height: 14, color: 'var(--dc-text-secondary, #64748b)' }} />
        <span>{selectedLabel}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          style={{ marginLeft: 2, color: 'var(--dc-text-muted, #94a3b8)', transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          zIndex: 10,
          marginTop: 4,
          minWidth: 260,
          maxHeight: 320,
          overflowY: 'auto',
          background: 'var(--dc-surface, #fff)',
          border: '1px solid var(--dc-border, #e2e8f0)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: 6,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {MCP_CHART_TYPES.map(ct => {
              const available = isChartAvailable(ct, query, rowCount)
              const isSelected = ct === selected
              const Icon = getChartTypeIcon(ct)
              const label = getLabel(ct)

              return (
                <button
                  key={ct}
                  type="button"
                  onClick={() => {
                    if (!available) return
                    onSelect(ct)
                    setIsOpen(false)
                  }}
                  disabled={!available}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 400,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--dc-primary, #3b82f6)' : 'var(--dc-border, #e2e8f0)',
                    background: isSelected ? 'var(--dc-surface-secondary, #f9fafb)' : 'var(--dc-surface, #fff)',
                    color: !available
                      ? 'var(--dc-text-muted, #94a3b8)'
                      : isSelected
                        ? 'var(--dc-primary, #3b82f6)'
                        : 'var(--dc-text, #1e293b)',
                    cursor: available ? 'pointer' : 'not-allowed',
                    opacity: available ? 1 : 0.5,
                    textAlign: 'left',
                  }}
                >
                  <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
