/**
 * SunburstChart Component
 *
 * Visualizes flow data using a radial sunburst diagram showing paths from a starting step.
 * Works with the same data as SankeyChart but displays it as hierarchical rings.
 *
 * The chart displays:
 * - Center: Starting step (layer 0)
 * - Outward rings: Steps after the starting step (layers 1, 2, 3...)
 * - Values indicating count of entities following each path
 *
 * Note: Unlike Sankey, Sunburst only shows "after" steps for cleaner visualization.
 */

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { SunburstChart as RechartsSunburst, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS } from '../../utils/chartConstants'
import type { ChartProps } from '../../types'
import type { FlowChartData, SankeyNode, SankeyLink } from '../../types/flow'
import { isSankeyData } from '../../types/flow'

/**
 * Hierarchical data structure for Recharts Sunburst
 */
interface SunburstNode {
  name: string
  value?: number
  fill?: string
  children?: SunburstNode[]
  /** Original event name (before path prefix was added) */
  originalName?: string
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
 * Transform FlowChartData (nodes + links) into hierarchical Sunburst format
 * Only includes layer 0 (starting) and positive layers (after steps)
 *
 * The transformation builds a tree where:
 * - Root = starting event(s) at layer 0
 * - Children = events linked from parent, following the flow
 * - Each path in the tree represents a unique user journey
 */
function transformToSunburstFormat(
  data: FlowChartData,
  colorPalette?: string[]
): SunburstNode | null {
  const { nodes, links } = data

  if (!nodes || nodes.length === 0) return null

  // Filter to only include layer 0 and positive layers (after steps)
  const afterNodes = nodes.filter((n) => n.layer >= 0)
  if (afterNodes.length === 0) return null

  // Use theme colors - either from palette or default CHART_COLORS
  const colors = colorPalette || CHART_COLORS

  // Get unique event names and create a color map
  // This ensures each event type gets a consistent, distinct color
  const uniqueNames = [...new Set(afterNodes.map((n) => n.name))]
  const colorMap = new Map<string, string>()
  uniqueNames.forEach((name, index) => {
    colorMap.set(name, colors[index % colors.length])
  })

  // Create a map of node IDs for quick lookup
  const nodeMap = new Map<string, SankeyNode>()
  afterNodes.forEach((node) => nodeMap.set(node.id, node))

  // Create a map of links from source to targets
  // Key: source node ID, Value: array of links from that source
  const linksBySource = new Map<string, SankeyLink[]>()
  links.forEach((link) => {
    // Only include links where source is in our afterNodes set
    if (!nodeMap.has(link.source)) return
    const sourceLinks = linksBySource.get(link.source) || []
    sourceLinks.push(link)
    linksBySource.set(link.source, sourceLinks)
  })

  // Find max layer for determining depth
  const maxLayer = Math.max(...afterNodes.map((n) => n.layer))

  // Counter for generating unique IDs
  let nodeCounter = 0

  /**
   * Recursively build children for a node by following outgoing links
   * Each link becomes a child node in the tree
   *
   * @param nodeId - The source node ID to build children from
   * @param currentLayer - Current layer depth
   * @param pathPrefix - Path from root to this node (for unique naming)
   */
  function buildChildren(nodeId: string, currentLayer: number, pathPrefix: string): SunburstNode[] {
    if (currentLayer >= maxLayer) return []

    const outgoingLinks = linksBySource.get(nodeId) || []
    if (outgoingLinks.length === 0) return []

    // Filter and map links to children
    const children: SunburstNode[] = []

    for (const link of outgoingLinks) {
      const targetNode = nodeMap.get(link.target)

      // Only include links to nodes in the next layer
      if (!targetNode || targetNode.layer !== currentLayer + 1) continue

      // Generate a unique name by including counter to avoid React key collisions
      nodeCounter++
      const uniqueName = `${targetNode.name}_${nodeCounter}`

      // Recursively build grandchildren with updated path
      const newPath = pathPrefix ? `${pathPrefix}→${targetNode.name}` : targetNode.name
      const grandchildren = buildChildren(link.target, currentLayer + 1, newPath)

      const child: SunburstNode = {
        name: uniqueName,
        originalName: targetNode.name,
        value: link.value,
        fill: colorMap.get(targetNode.name) || colors[0],
      }

      if (grandchildren.length > 0) {
        child.children = grandchildren
      }

      children.push(child)
    }

    return children
  }

  // Get starting nodes (layer 0)
  const startingNodes = afterNodes.filter((n) => n.layer === 0)
  if (startingNodes.length === 0) return null

  // Build the tree starting from layer 0 nodes
  if (startingNodes.length === 1) {
    // Single starting node - use it as root
    const startNode = startingNodes[0]
    const children = buildChildren(startNode.id, 0, startNode.name)

    const result: SunburstNode = {
      name: startNode.name,
      originalName: startNode.name,
      value: startNode.value || children.reduce((sum, c) => sum + (c.value || 0), 0),
      fill: colorMap.get(startNode.name) || colors[0],
    }

    if (children.length > 0) {
      result.children = children
    }

    return result
  }

  // Multiple starting nodes - create a virtual root
  const rootChildren = startingNodes.map((startNode, index) => {
    nodeCounter++
    const children = buildChildren(startNode.id, 0, startNode.name)

    const child: SunburstNode = {
      name: `${startNode.name}_root_${index}`,
      originalName: startNode.name,
      value: startNode.value || children.reduce((sum, c) => sum + (c.value || 0), 0),
      fill: colorMap.get(startNode.name) || colors[0],
    }

    if (children.length > 0) {
      child.children = children
    }

    return child
  })

  return {
    name: 'Start',
    originalName: 'Start',
    children: rootChildren,
  }
}

/**
 * Custom tooltip for Sunburst chart
 * Shows the original event name (not the unique key used internally)
 */
function SunburstTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SunburstNode }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  // Use originalName if available, otherwise fall back to name
  const displayName = data.originalName || data.name

  return (
    <div className="bg-dc-surface border border-dc-border rounded-md px-3 py-2 shadow-lg text-sm">
      <div className="font-medium text-dc-text">{displayName}</div>
      {data.value !== undefined && (
        <div className="text-dc-text-secondary mt-1">
          <span className="font-medium">{data.value.toLocaleString()}</span> entities
        </div>
      )}
    </div>
  )
}

/**
 * SunburstChart Component
 *
 * Renders a sunburst diagram visualization from FlowChartData.
 * Shows hierarchical flow paths radiating from a central starting step.
 */
const SunburstChart = React.memo(function SunburstChart({
  data,
  height = '100%',
  colorPalette,
  displayConfig,
}: ChartProps) {
  // Track chart area dimensions (not the full container which includes footer)
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 400, height: 400 })

  useEffect(() => {
    const updateSize = () => {
      if (chartAreaRef.current) {
        setChartSize({
          width: chartAreaRef.current.offsetWidth,
          height: chartAreaRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // Use ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(updateSize)
    if (chartAreaRef.current) {
      resizeObserver.observe(chartAreaRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateSize)
      resizeObserver.disconnect()
    }
  }, [])

  // Get display config options
  const displayConfigAny = displayConfig as Record<string, unknown> | undefined
  const innerRadius = (displayConfigAny?.innerRadius as number) ?? 40

  // Extract and transform data
  const sunburstData = useMemo(() => {
    const extracted = extractFlowData(data || [])
    if (!extracted) return null

    return transformToSunburstFormat(extracted, colorPalette?.colors || CHART_COLORS)
  }, [data, colorPalette])

  // Calculate summary stats from original flow data
  const summaryStats = useMemo(() => {
    const extracted = extractFlowData(data || [])
    if (!extracted) return null

    // Only count after nodes (layer >= 0)
    const afterNodes = extracted.nodes.filter((n) => n.layer >= 0)
    const afterLinks = extracted.links.filter((link) => {
      const sourceNode = extracted.nodes.find((n) => n.id === link.source)
      return sourceNode && sourceNode.layer >= 0
    })

    const totalEntities = extracted.nodes
      .filter((n) => n.layer === 0)
      .reduce((sum, n) => sum + (n.value || 0), 0)

    return {
      nodeCount: afterNodes.length,
      linkCount: afterLinks.length,
      totalEntities,
    }
  }, [data])

  // Handle no data
  if (!data || data.length === 0 || !sunburstData) {
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

  // Calculate outer radius based on chart area size
  const minDimension = Math.min(chartSize.width, chartSize.height)
  const outerRadius = Math.max(minDimension / 2 - 40, 100)

  // Get root node info for center label
  const rootName = sunburstData.originalName || sunburstData.name
  const rootValue = sunburstData.value

  return (
    <div className="relative w-full h-full flex flex-col" style={{ height }}>
      {/* Sunburst Diagram */}
      <div ref={chartAreaRef} className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsSunburst
            data={sunburstData}
            dataKey="value"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            stroke="var(--dc-bg)"
          >
            <Tooltip content={<SunburstTooltip />} />
          </RechartsSunburst>
        </ResponsiveContainer>

        {/* Center label showing the root node (starting event) */}
        {innerRadius > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-dc-text">{rootName}</div>
              {rootValue !== undefined && (
                <div className="text-xs text-dc-text-secondary">
                  {rootValue.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {!displayConfigAny?.hideSummaryFooter && summaryStats && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-dc-border bg-dc-surface-secondary">
          <div className="flex items-center justify-between text-sm">
            <div className="text-dc-text-muted">
              <span className="font-medium">{summaryStats.nodeCount}</span> events (after)
            </div>
            <div className="text-dc-text">
              <span className="text-dc-text-muted">Paths:</span>{' '}
              <span className="font-medium">{summaryStats.linkCount}</span>
            </div>
            <div className="text-dc-text-muted">
              <span className="font-medium">{summaryStats.totalEntities.toLocaleString()}</span>{' '}
              starting entities
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default SunburstChart
