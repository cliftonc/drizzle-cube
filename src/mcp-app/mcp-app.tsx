import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useApp } from '@modelcontextprotocol/ext-apps/react'
import type { App } from '@modelcontextprotocol/ext-apps'
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { autoSelectChart, type McpChartType, type ChartSelection } from './chartAutoSelect'
import ChartSwitcher from './ChartSwitcher'
import { applyHostContext, applyFallbackTheme } from './theme-bridge'
import './global.css'

// Chart color palette (matches drizzle-cube defaults)
const COLORS = [
  '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
]

interface LoadResult {
  data: any[]
  annotation?: any
  query?: any
}

interface ChartHint {
  type?: McpChartType
  xAxis?: string
  yAxis?: string[]
  title?: string
}

function formatLabel(field: string): string {
  // "Cube.fieldName" → "Field Name"
  const parts = field.split('.')
  const name = parts.length > 1 ? parts[1] : parts[0]
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

function formatValue(val: unknown): string {
  if (val == null) return '-'
  if (typeof val === 'number') {
    return val >= 1000 ? val.toLocaleString() : String(val)
  }
  return String(val)
}

// ────────────────────────────────────────────────────────────
// Chart renderers (lightweight, no CubeProvider dependency)
// ────────────────────────────────────────────────────────────

function renderKpi(data: any[], sel: ChartSelection) {
  if (!data.length || !sel.yAxis.length) return <div>No data</div>
  const row = data[data.length - 1] // latest value
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
      {sel.yAxis.map((field, i) => {
        const val = row[field]
        const num = typeof val === 'number' ? val : parseFloat(val)
        return (
          <div key={field} style={{ textAlign: 'center', marginBottom: i < sel.yAxis.length - 1 ? 16 : 0 }}>
            <div style={{ fontSize: 11, color: 'var(--dc-text-secondary, #64748b)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {formatLabel(field)}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--dc-text, #1e293b)' }}>
              {isNaN(num) ? formatValue(val) : num.toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderTable(data: any[]) {
  if (!data.length) return <div>No data</div>
  const columns = Object.keys(data[0])
  return (
    <div style={{ overflowX: 'auto', maxHeight: 400 }}>
      <table className="dc-mcp-table">
        <thead>
          <tr>{columns.map(col => <th key={col}>{formatLabel(col)}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => {
                const val = row[col]
                const isNum = typeof val === 'number'
                return <td key={col} className={isNum ? 'numeric' : ''}>{formatValue(val)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RechartsViz({ data, sel, chartType }: { data: any[], sel: ChartSelection, chartType: McpChartType }) {
  const { xAxis, yAxis } = sel

  if (chartType === 'kpiNumber') return renderKpi(data, sel)
  if (chartType === 'table') return renderTable(data)
  if (!xAxis || !yAxis.length) return renderTable(data)

  // Prepare data: ensure numeric values
  const chartData = useMemo(() =>
    data.map(row => {
      const out: Record<string, any> = { ...row }
      for (const field of yAxis) {
        const val = out[field]
        if (typeof val === 'string') {
          const num = parseFloat(val)
          if (!isNaN(num)) out[field] = num
        }
      }
      return out
    }),
    [data, yAxis]
  )

  const height = 320

  const commonAxisProps = {
    tick: { fontSize: 11, fill: 'var(--dc-text-secondary, #64748b)' },
    axisLine: { stroke: 'var(--dc-border, #e2e8f0)' },
    tickLine: false as const,
  }

  const xAxisEl = (
    <XAxis
      dataKey={xAxis}
      {...commonAxisProps}
      tickFormatter={(v: string) => {
        const s = String(v)
        return s.length > 16 ? s.slice(0, 14) + '...' : s
      }}
    />
  )

  const yAxisEl = <YAxis {...commonAxisProps} width={60} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
  const gridEl = <CartesianGrid strokeDasharray="3 3" stroke="var(--dc-border, #e2e8f0)" opacity={0.5} />
  const tooltipEl = <Tooltip contentStyle={{ background: 'var(--dc-surface, #fff)', border: '1px solid var(--dc-border, #e2e8f0)', borderRadius: 8, fontSize: 12 }} />
  const legendEl = yAxis.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null

  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            {gridEl}{xAxisEl}{yAxisEl}{tooltipEl}{legendEl}
            {yAxis.map((field, i) => (
              <Bar key={field} dataKey={field} name={formatLabel(field)} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            {gridEl}{xAxisEl}{yAxisEl}{tooltipEl}{legendEl}
            {yAxis.map((field, i) => (
              <Line key={field} type="monotone" dataKey={field} name={formatLabel(field)} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={chartData.length <= 30} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            {gridEl}{xAxisEl}{yAxisEl}{tooltipEl}{legendEl}
            {yAxis.map((field, i) => (
              <Area key={field} type="monotone" dataKey={field} name={formatLabel(field)} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )

    case 'pie': {
      const valueField = yAxis[0]
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            {tooltipEl}
            <Pie
              data={chartData}
              dataKey={valueField}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius="75%"
              label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={true}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    case 'scatter': {
      // With 2+ measures, use first as X and second as Y for a true scatter
      // With 1 measure + dimension, use dimension as X (categorical scatter)
      const scatterXField = yAxis.length >= 2 ? yAxis[0] : xAxis
      const scatterYField = yAxis.length >= 2 ? yAxis[1] : yAxis[0]
      const scatterXType = yAxis.length >= 2 ? 'number' as const : 'category' as const
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            {gridEl}
            <XAxis
              dataKey={scatterXField}
              type={scatterXType}
              name={formatLabel(scatterXField || '')}
              {...commonAxisProps}
              tickFormatter={(v: any) => {
                if (typeof v === 'number') return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                const s = String(v)
                return s.length > 16 ? s.slice(0, 14) + '...' : s
              }}
            />
            <YAxis
              dataKey={scatterYField}
              type="number"
              name={formatLabel(scatterYField || '')}
              {...commonAxisProps}
              width={60}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
            {tooltipEl}
            <Scatter data={chartData} fill={COLORS[0]} name={xAxis ? formatLabel(xAxis) : 'Data'}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    case 'treemap': {
      const valueField = yAxis[0]
      const treemapData = chartData.map((row, i) => ({
        name: String(row[xAxis] || `Item ${i + 1}`),
        size: typeof row[valueField] === 'number' ? row[valueField] : 0,
        fill: COLORS[i % COLORS.length],
      }))
      return (
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            data={treemapData}
            dataKey="size"
            nameKey="name"
            stroke="var(--dc-surface, #fff)"
          />
        </ResponsiveContainer>
      )
    }

    default:
      return renderTable(data)
  }
}

// ────────────────────────────────────────────────────────────
// Main App
// ────────────────────────────────────────────────────────────

function McpApp() {
  const [result, setResult] = useState<LoadResult | null>(null)
  const [chartType, setChartType] = useState<McpChartType>('table')
  const [selection, setSelection] = useState<ChartSelection | null>(null)
  const [chartHint, setChartHint] = useState<ChartHint | null>(null)
  const chartHintRef = useRef<ChartHint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [appRef, setAppRef] = useState<App | null>(null)

  const processResult = useCallback((res: unknown, hint?: ChartHint | null) => {
    try {
      let parsed: LoadResult
      if (res && typeof res === 'object' && 'content' in res) {
        const content = (res as { content: Array<{ type: string; text?: string }> }).content
        const textContent = content.find((c) => c.type === 'text')
        if (textContent?.text) {
          parsed = JSON.parse(textContent.text)
        } else {
          setError('No text content in result')
          return
        }
      } else if (res && typeof res === 'object' && 'data' in res) {
        parsed = res as LoadResult
      } else if (typeof res === 'string') {
        parsed = JSON.parse(res)
      } else {
        parsed = res as LoadResult
      }

      // Handle Cube.js response format: { results: [{ data, query, annotation }] }
      if (parsed && 'results' in parsed && Array.isArray((parsed as any).results)) {
        const firstResult = (parsed as any).results[0]
        if (firstResult) {
          parsed = {
            data: firstResult.data || [],
            query: firstResult.query || (parsed as any).query,
            annotation: firstResult.annotation,
          }
        }
      }

      if (!parsed?.data || !Array.isArray(parsed.data)) {
        setError('Invalid result format: missing data array')
        return
      }

      setResult(parsed)
      setError(null)

      const query = parsed.query || {}
      const sel = autoSelectChart(query, parsed.data)

      // AI chart hint overrides auto-selection
      if (hint) {
        setChartHint(hint)
        if (hint.type) setChartType(hint.type)
        else setChartType(sel.chartType)
        setSelection({
          chartType: hint.type || sel.chartType,
          xAxis: hint.xAxis || sel.xAxis,
          yAxis: hint.yAxis || sel.yAxis,
          series: sel.series,
        })
      } else {
        setSelection(sel)
        setChartType(sel.chartType)
      }
    } catch (err) {
      setError(`Failed to parse result: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  const { app, isConnected, error: connectError } = useApp({
    appInfo: { name: 'Drizzle Cube Visualization', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (appInstance) => {
      setAppRef(appInstance)
      appInstance.ontoolinput = (params) => {
        setLoading(true)
        // Extract AI chart hint from tool input arguments
        const args = params?.arguments as Record<string, unknown> | undefined
        const hint = (args?.chart as ChartHint | undefined) ?? null
        chartHintRef.current = hint
        if (hint) setChartHint(hint)

        const sc = (params as any)?.structuredContent
        if (sc) {
          setLoading(false)
          processResult(sc, hint)
        }
      }
      appInstance.ontoolresult = (res) => {
        setLoading(false)
        processResult(res, chartHintRef.current)
      }
      appInstance.onhostcontextchanged = (ctx) => {
        applyHostContext(ctx)
      }
    },
  })

  // Apply fallback theme on mount
  useEffect(() => {
    applyFallbackTheme()
  }, [])

  const handleChartTypeChange = useCallback((ct: McpChartType) => {
    setChartType(ct)
  }, [])

  void function handleRequery(query: Record<string, unknown>) {
    const currentApp = appRef || app
    if (!currentApp) return
    setLoading(true)
    currentApp.callServerTool({ name: 'load', arguments: { query } })
      .then(res => processResult(res))
      .catch(err => setError(`Query failed: ${err instanceof Error ? err.message : String(err)}`))
      .finally(() => setLoading(false))
  }

  if (connectError) {
    return (
      <div style={{ padding: 16, color: 'var(--dc-error, #ef4444)' }}>
        <strong>Connection error:</strong> {connectError.message}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: 'var(--dc-error, #ef4444)' }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (loading || !isConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--dc-text-secondary, #64748b)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', marginRight: 8 }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
        </svg>
        {!isConnected ? 'Connecting...' : 'Loading...'}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!result) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--dc-text-muted, #94a3b8)' }}>
        Waiting for query results...
      </div>
    )
  }

  const query = result.query || {}

  return (
    <div>
      {chartHint?.title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dc-text, #1e293b)', marginBottom: 8 }}>
          {chartHint.title}
        </div>
      )}
      <ChartSwitcher
        selected={chartType}
        query={query}
        rowCount={result.data.length}
        onSelect={handleChartTypeChange}
      />
      {selection && (
        <RechartsViz data={result.data} sel={selection} chartType={chartType} />
      )}
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--dc-text-muted, #94a3b8)' }}>
        {result.data.length} row{result.data.length !== 1 ? 's' : ''}
        {query.measures?.length ? ` | ${query.measures.length} measure${query.measures.length !== 1 ? 's' : ''}` : ''}
        {query.dimensions?.length ? ` | ${query.dimensions.length} dimension${query.dimensions.length !== 1 ? 's' : ''}` : ''}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Mount
// ────────────────────────────────────────────────────────────

const root = createRoot(document.getElementById('root')!)
root.render(<McpApp />)
