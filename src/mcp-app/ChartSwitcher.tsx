import { SUPPORTED_CHARTS, isChartAvailable, type McpChartType } from './chartAutoSelect'

const CHART_LABELS: Record<McpChartType, string> = {
  bar: 'Bar',
  line: 'Line',
  area: 'Area',
  pie: 'Pie',
  scatter: 'Scatter',
  kpiNumber: 'KPI',
  table: 'Table',
  treemap: 'Treemap',
}

interface ChartSwitcherProps {
  selected: McpChartType
  query: any
  rowCount: number
  onSelect: (chartType: McpChartType) => void
}

export default function ChartSwitcher({ selected, query, rowCount, onSelect }: ChartSwitcherProps) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
      {SUPPORTED_CHARTS.map(ct => {
        const available = isChartAvailable(ct, query, rowCount)
        const isSelected = ct === selected
        return (
          <button
            key={ct}
            onClick={() => available && onSelect(ct)}
            disabled={!available}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid',
              borderColor: isSelected
                ? 'var(--dc-accent, #6366f1)'
                : 'var(--dc-border, #e2e8f0)',
              background: isSelected
                ? 'var(--dc-accent, #6366f1)'
                : 'var(--dc-surface, #fff)',
              color: isSelected
                ? '#fff'
                : available
                  ? 'var(--dc-text, #1e293b)'
                  : 'var(--dc-text-muted, #94a3b8)',
              cursor: available ? 'pointer' : 'not-allowed',
              opacity: available ? 1 : 0.5,
              fontWeight: isSelected ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {CHART_LABELS[ct]}
          </button>
        )
      })}
    </div>
  )
}
