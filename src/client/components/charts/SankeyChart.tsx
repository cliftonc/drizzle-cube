/**
 * SankeyChart Component
 *
 * Visualizes flow data using Sankey diagrams showing paths between states.
 * Works with data from flow queries which provide nodes and links.
 *
 * The chart displays:
 * - Nodes representing events at different layers (before, start, after)
 * - Links showing the flow of entities between adjacent nodes
 * - Values indicating count of entities following each path
 */

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from '../../utils/chartConstants'
import type { ChartProps } from '../../types'
import type { FlowChartData } from '../../types/flow'
import { isSankeyData } from '../../types/flow'

/**
 * Color palette for Sankey nodes based on layer
 */
const SANKEY_COLORS = {
  before: '#F97316', // orange-500 - for steps before
  start: '#3B82F6', // blue-500 - for starting step
  after: '#10B981', // emerald-500 - for steps after
}

/**
 * Get color for a node based on its layer
 */
function getNodeColor(layer: number, colorPalette?: string[]): string {
  if (colorPalette && colorPalette.length > 0) {
    // Use palette colors cycling through
    const absLayer = Math.abs(layer)
    return colorPalette[absLayer % colorPalette.length]
  }

  if (layer < 0) return SANKEY_COLORS.before
  if (layer === 0) return SANKEY_COLORS.start
  return SANKEY_COLORS.after
}

/**
 * Transform FlowChartData to Recharts Sankey format
 */
function transformToRechartsFormat(
  data: FlowChartData,
  colorPalette?: string[]
): {
  nodes: Array<{ name: string; fill: string; layer: number; value?: number }>
  links: Array<{ source: number; target: number; value: number }>
} | null {
  if (!data.nodes || data.nodes.length === 0) return null

  // Create node index map for link resolution
  const nodeIndexMap = new Map<string, number>()
  data.nodes.forEach((node, index) => {
    nodeIndexMap.set(node.id, index)
  })

  // Transform nodes
  const nodes = data.nodes.map((node) => ({
    name: node.name,
    fill: getNodeColor(node.layer, colorPalette),
    layer: node.layer,
    value: node.value,
  }))

  // Transform links - resolve string IDs to numeric indices
  const links = data.links
    .map((link) => {
      const sourceIndex = nodeIndexMap.get(link.source)
      const targetIndex = nodeIndexMap.get(link.target)

      if (sourceIndex === undefined || targetIndex === undefined) {
        console.warn(`Sankey: Could not resolve link ${link.source} -> ${link.target}`)
        return null
      }

      return {
        source: sourceIndex,
        target: targetIndex,
        value: link.value,
      }
    })
    .filter((link): link is { source: number; target: number; value: number } => link !== null)

  return { nodes, links }
}

/**
 * Extract FlowChartData from various data formats
 */
function extractFlowData(data: unknown[]): FlowChartData | null {
  if (!data || data.length === 0) return null

  // If first element is already FlowChartData (server returns as single-row array)
  if (isSankeyData(data[0])) {
    return data[0] as FlowChartData
  }

  // If data itself is FlowChartData shape
  if (isSankeyData(data)) {
    return data as unknown as FlowChartData
  }

  // Check if data is an array with nodes and links at top level
  const asAny = data as unknown as Record<string, unknown>
  if (asAny.nodes && asAny.links) {
    return asAny as unknown as FlowChartData
  }

  return null
}

/**
 * Custom node renderer for Sankey chart
 * Displays the node rectangle with label and value
 */
function SankeyNode({
  x,
  y,
  width,
  height,
  payload,
  containerWidth,
  showLabels = true,
}: {
  x: number
  y: number
  width: number
  height: number
  payload: { name: string; value?: number; fill: string }
  containerWidth: number
  showLabels?: boolean
}) {
  // Determine if label should be on the left or right based on position
  const isRightSide = x > containerWidth / 2
  const labelX = isRightSide ? x - 6 : x + width + 6
  const textAnchor = isRightSide ? 'end' : 'start'

  return (
    <g>
      {/* Node rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload.fill}
        rx={2}
        ry={2}
      />
      {/* Node label - only shown if showLabels is true */}
      {showLabels && (
        <text
          x={labelX}
          y={y + height / 2}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          className="text-xs fill-dc-text"
          style={{ fontSize: 11 }}
        >
          {payload.name}
          {payload.value !== undefined && (
            <tspan className="fill-dc-text-secondary" dx={4}>
              ({payload.value.toLocaleString()})
            </tspan>
          )}
        </text>
      )}
    </g>
  )
}

/**
 * Custom tooltip for Sankey chart
 */
function SankeyTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; source?: { name: string }; target?: { name: string } } }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  // Check if this is a link (has source/target) or a node
  if (data.source && data.target) {
    return (
      <div className="bg-dc-surface border border-dc-border rounded-md px-3 py-2 shadow-lg text-sm">
        <div className="font-medium text-dc-text">
          {data.source.name} → {data.target.name}
        </div>
        <div className="text-dc-text-secondary mt-1">
          <span className="font-medium">{data.value.toLocaleString()}</span> entities
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dc-surface border border-dc-border rounded-md px-3 py-2 shadow-lg text-sm">
      <div className="font-medium text-dc-text">{data.name}</div>
      {data.value !== undefined && (
        <div className="text-dc-text-secondary mt-1">
          <span className="font-medium">{data.value.toLocaleString()}</span> entities
        </div>
      )}
    </div>
  )
}

/**
 * SankeyChart Component
 *
 * Renders a Sankey diagram visualization from FlowChartData.
 * Shows flow paths with nodes at each layer and links between them.
 */
const SankeyChart = React.memo(function SankeyChart({
  data,
  height = '100%',
  colorPalette,
  displayConfig,
}: ChartProps) {
  // Track container width for label positioning
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Get display config options
  // Use custom properties from displayConfig if available, otherwise use defaults
  const displayConfigAny = displayConfig as Record<string, unknown> | undefined
  const linkOpacity = parseFloat(String(displayConfigAny?.linkOpacity || '0.5'))
  const nodeWidth = (displayConfigAny?.nodeWidth as number) ?? 10
  const nodePadding = (displayConfigAny?.nodePadding as number) ?? 50
  const showNodeLabels = displayConfigAny?.showNodeLabels !== false // Default true

  // Extract and transform data
  const flowData = useMemo(() => {
    const extracted = extractFlowData(data || [])
    if (!extracted) return null

    return transformToRechartsFormat(extracted, colorPalette?.colors || CHART_COLORS)
  }, [data, colorPalette])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const extracted = extractFlowData(data || [])
    if (!extracted) return null

    const totalEntities = extracted.nodes
      .filter((n) => n.layer === 0)
      .reduce((sum, n) => sum + (n.value || 0), 0)

    const totalPaths = extracted.links.reduce((sum, l) => sum + l.value, 0)

    return {
      nodeCount: extracted.nodes.length,
      linkCount: extracted.links.length,
      totalEntities,
      totalPaths,
    }
  }, [data])

  // Handle no data
  if (!data || data.length === 0 || !flowData || flowData.nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No flow data</div>
          <div className="text-xs text-dc-text-secondary">
            Configure a flow analysis with a starting step and event dimension
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col" style={{ height }}>
      {/* Sankey Diagram */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={flowData}
            nodeWidth={nodeWidth}
            nodePadding={nodePadding}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            link={{
              stroke: 'var(--dc-border)',
              strokeOpacity: linkOpacity,
            }}
            node={(props: any) => (
              <SankeyNode {...props} containerWidth={containerWidth} showLabels={showNodeLabels} />
            )}
          >
            <Tooltip content={<SankeyTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      {!(displayConfigAny?.hideSummaryFooter) && summaryStats && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-dc-border bg-dc-surface-secondary">
          <div className="flex items-center justify-between text-sm">
            <div className="text-dc-text-muted">
              <span className="font-medium">{summaryStats.nodeCount}</span> events
            </div>
            <div className="text-dc-text">
              <span className="text-dc-text-muted">Paths:</span>{' '}
              <span className="font-medium">{summaryStats.linkCount}</span>
            </div>
            <div className="text-dc-text-muted">
              <span className="font-medium">{summaryStats.totalEntities.toLocaleString()}</span> starting entities
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default SankeyChart
