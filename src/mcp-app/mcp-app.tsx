import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useApp } from '@modelcontextprotocol/ext-apps/react'
import type { App } from '@modelcontextprotocol/ext-apps'

// Real chart components
import BarChart from '../client/components/charts/BarChart'
import LineChart from '../client/components/charts/LineChart'
import AreaChart from '../client/components/charts/AreaChart'
import PieChart from '../client/components/charts/PieChart'
import ScatterChart from '../client/components/charts/ScatterChart'
import TreeMapChart from '../client/components/charts/TreeMapChart'
import KpiNumber from '../client/components/charts/KpiNumber'
import KpiDelta from '../client/components/charts/KpiDelta'
import KpiText from '../client/components/charts/KpiText'
import DataTable from '../client/components/charts/DataTable'
import RadarChart from '../client/components/charts/RadarChart'
import RadialBarChart from '../client/components/charts/RadialBarChart'
import BubbleChart from '../client/components/charts/BubbleChart'
import FunnelChart from '../client/components/charts/FunnelChart'
import WaterfallChart from '../client/components/charts/WaterfallChart'
import GaugeChart from '../client/components/charts/GaugeChart'
import BoxPlotChart from '../client/components/charts/BoxPlotChart'
import CandlestickChart from '../client/components/charts/CandlestickChart'
import ActivityGridChart from '../client/components/charts/ActivityGridChart'
import MeasureProfileChart from '../client/components/charts/MeasureProfileChart'

// Context & types
import { CubeMetaContext, type CubeMetaContextValue } from '../client/providers/CubeMetaContext'
import type { ChartAxisConfig, ChartDisplayConfig, FieldLabelMap, ChartProps } from '../client/types'

// Chart type selector (MCP-specific: only shows types with real components)
import McpChartSwitcher from './McpChartSwitcher'

// Auto-selection
import { autoSelectChart, type McpChartType, type ChartSelection } from './chartAutoSelect'
import { applyHostContext, applyFallbackTheme } from './theme-bridge'
import './global.css'

// ────────────────────────────────────────────────────────────
// Chart component map
// ────────────────────────────────────────────────────────────

const chartComponentMap: Record<string, React.ComponentType<ChartProps>> = {
  bar: BarChart,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
  scatter: ScatterChart,
  treemap: TreeMapChart,
  kpiNumber: KpiNumber,
  kpiDelta: KpiDelta,
  kpiText: KpiText,
  table: DataTable,
  radar: RadarChart,
  radialBar: RadialBarChart,
  bubble: BubbleChart,
  funnel: FunnelChart,
  waterfall: WaterfallChart,
  gauge: GaugeChart,
  boxPlot: BoxPlotChart,
  candlestick: CandlestickChart,
  activityGrid: ActivityGridChart,
  measureProfile: MeasureProfileChart,
}

// ────────────────────────────────────────────────────────────
// Annotation → FieldLabelMap
// ────────────────────────────────────────────────────────────

function buildLabelMapFromAnnotation(annotation: any): FieldLabelMap {
  const map: FieldLabelMap = {}
  for (const [key, val] of Object.entries(annotation?.measures || {}))
    map[key] = (val as any).title || key.split('.')[1] || key
  for (const [key, val] of Object.entries(annotation?.dimensions || {}))
    map[key] = (val as any).title || key.split('.')[1] || key
  for (const [key, val] of Object.entries(annotation?.timeDimensions || {}))
    map[key] = (val as any).title || key.split('.')[1] || key
  return map
}

function fallbackLabel(field: string): string {
  const parts = field.split('.')
  const name = parts.length > 1 ? parts[1] : parts[0]
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

// ────────────────────────────────────────────────────────────
// Chart hint types (supports old flat + new structured format)
// ────────────────────────────────────────────────────────────

interface ChartHint {
  type?: McpChartType
  title?: string
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  // Backward-compat flat aliases
  xAxis?: string
  yAxis?: string[]
}

/** Normalize a chart hint into chartConfig + displayConfig */
function normalizeHint(hint: ChartHint, sel: ChartSelection): {
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
} {
  // Start with auto-selected values
  let chartConfig: ChartAxisConfig = {
    xAxis: sel.xAxis,
    yAxis: sel.yAxis,
    series: sel.series,
  }
  let displayConfig: ChartDisplayConfig = {}

  // Structured config from hint takes priority
  if (hint.chartConfig) {
    chartConfig = { ...chartConfig, ...hint.chartConfig }
  }
  if (hint.displayConfig) {
    displayConfig = { ...displayConfig, ...hint.displayConfig }
  }

  // Flat aliases override (backward compat)
  if (hint.xAxis) {
    chartConfig.xAxis = [hint.xAxis]
  }
  if (hint.yAxis) {
    chartConfig.yAxis = hint.yAxis
  }

  return { chartConfig, displayConfig }
}

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface LoadResult {
  data: any[]
  annotation?: any
  query?: any
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

  // Build label map from annotation
  const labelMap = useMemo<FieldLabelMap>(() => {
    if (!result?.annotation) return {}
    return buildLabelMapFromAnnotation(result.annotation)
  }, [result?.annotation])

  // Build CubeMetaContext value
  const metaContextValue = useMemo<CubeMetaContextValue>(() => ({
    meta: null,
    labelMap,
    metaLoading: false,
    metaError: null,
    getFieldLabel: (fieldName: string) => labelMap[fieldName] || fallbackLabel(fieldName),
    refetchMeta: () => {},
  }), [labelMap])

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
        const resolvedType = hint.type || sel.chartType
        setChartType(resolvedType)
        setSelection({
          chartType: resolvedType,
          xAxis: hint.xAxis ? [hint.xAxis] : (hint.chartConfig?.xAxis || sel.xAxis),
          yAxis: hint.yAxis || (hint.chartConfig?.yAxis || sel.yAxis),
          series: hint.chartConfig?.series || sel.series,
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

  // Build chart props from selection + hint
  const { chartConfig, displayConfig } = selection && chartHint
    ? normalizeHint(chartHint, selection)
    : {
        chartConfig: selection ? { xAxis: selection.xAxis, yAxis: selection.yAxis, series: selection.series } as ChartAxisConfig : undefined,
        displayConfig: {} as ChartDisplayConfig,
      }

  const ChartComponent = chartComponentMap[chartType] || DataTable

  return (
    <CubeMetaContext.Provider value={metaContextValue}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {chartHint?.title ? (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dc-text, #1e293b)' }}>
              {chartHint.title}
            </div>
          ) : <div />}
          <McpChartSwitcher
            selected={chartType}
            query={query}
            rowCount={result.data.length}
            onSelect={handleChartTypeChange}
          />
        </div>
        <div style={{ height: 360, marginTop: 8 }}>
          <ChartComponent
            data={result.data}
            chartConfig={chartConfig}
            displayConfig={displayConfig}
            queryObject={query}
            height={360}
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--dc-text-muted, #94a3b8)' }}>
          {result.data.length} row{result.data.length !== 1 ? 's' : ''}
          {query.measures?.length ? ` | ${query.measures.length} measure${query.measures.length !== 1 ? 's' : ''}` : ''}
          {query.dimensions?.length ? ` | ${query.dimensions.length} dimension${query.dimensions.length !== 1 ? 's' : ''}` : ''}
        </div>
      </div>
    </CubeMetaContext.Provider>
  )
}

// ────────────────────────────────────────────────────────────
// Mount
// ────────────────────────────────────────────────────────────

const root = createRoot(document.getElementById('root')!)
root.render(<McpApp />)
