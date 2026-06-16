/**
 * D3 rendering for ActivityGridChart, extracted from the component's render effect.
 *
 * Behaviour matches the original inline D3 exactly; structure was split into one
 * function per concern (layout, cells, labels) to keep complexity low.
 */
import type React from 'react'
import { select, scaleQuantize, max, min, type Selection } from 'd3'
import { CHART_COLORS_GRADIENT, CHART_MARGINS } from '../../utils/chartConstants.js'
import { getThemeColor } from './BubbleChart.helpers.js'
import type { GridCell, GridMapping } from './ActivityGridChart.helpers.js'
import type { ColorPalette } from '../../types.js'
import type { ChartDataPointClickEvent } from '../../types/drill.js'

type G = Selection<SVGGElement, unknown, null, undefined>

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface ActivityGridSafeConfig {
  showTooltip: boolean
  showLabels: boolean
  fitToWidth: boolean
}

export interface ActivityGridRenderContext {
  svgEl: SVGSVGElement
  gridData: GridCell[]
  gridMapping: GridMapping
  granularity: string
  dimensions: { width: number; height: number }
  safeDisplayConfig: ActivityGridSafeConfig
  colorPalette?: ColorPalette
  isDark: boolean
  valueField: string
  dateField: string
  getFieldLabel: (field: string) => string
  drillEnabled?: boolean
  onDataPointClick?: (event: ChartDataPointClickEvent) => void
}

interface ThemeColors {
  textColor: string
  lineColor: string
  emptyCellColor: string
  cellStrokeColor: string
}

function resolveGridThemeColors(isDark: boolean): ThemeColors {
  return {
    textColor: isDark
      ? getThemeColor('--dc-text-muted', '#cbd5e1')
      : getThemeColor('--dc-text-secondary', '#374151'),
    lineColor: getThemeColor('--dc-border', '#e5e7eb'),
    emptyCellColor: isDark
      ? getThemeColor('--dc-bg-secondary', '#1e293b')
      : getThemeColor('--dc-bg-secondary', '#f3f4f6'),
    cellStrokeColor: isDark ? getThemeColor('--dc-border', '#334155') : getThemeColor('--dc-bg', '#ffffff')
  }
}

interface Layout {
  margin: { top: number; right: number; bottom: number; left: number }
  finalCellWidth: number
  finalCellHeight: number
  completeXRange: number[]
  minY: number
  maxY: number
  svgWidth: number
}

/** Compute cell sizing + margins + the complete X range from the grid data. */
function computeLayout(ctx: ActivityGridRenderContext): Layout {
  const { gridData, gridMapping, dimensions, safeDisplayConfig } = ctx
  const maxY = max(gridData, (d) => d.y) || 0
  const minY = min(gridData, (d) => d.y) || 0

  // Only show X values that have data to avoid gaps/discontinuities
  const completeXRange = [...new Set(gridData.map((cell) => cell.x))].sort((a, b) => a - b)

  const gridWidth = completeXRange.length * gridMapping.cellWidth + (completeXRange.length - 1) * 4
  const gridHeight = (maxY - minY + 1) * gridMapping.cellHeight + (maxY - minY) * 4

  const margin = {
    ...CHART_MARGINS,
    left: 60,
    bottom: 10,
    top: gridMapping.hasHierarchicalLabels ? 40 : 25,
    right: 10
  }

  const availableWidth = dimensions.width - margin.left - margin.right
  const availableHeight = dimensions.height - margin.top - margin.bottom
  const scale = Math.min(availableWidth / gridWidth, availableHeight / gridHeight)

  let finalCellWidth: number
  let finalCellHeight: number

  if (safeDisplayConfig.fitToWidth) {
    finalCellWidth = gridMapping.cellWidth * scale
    finalCellHeight = gridMapping.cellHeight * scale
  } else {
    const minCellSize = 16
    const maxCellSize = 24
    finalCellWidth = Math.max(minCellSize, Math.min(maxCellSize, gridMapping.cellWidth * scale))
    finalCellHeight = Math.max(minCellSize, Math.min(maxCellSize, gridMapping.cellHeight * scale))
    if (ctx.granularity === 'week' && finalCellWidth < minCellSize) {
      finalCellWidth = minCellSize
    }
  }

  const actualGridWidth = completeXRange.length * finalCellWidth + (completeXRange.length - 1) * 4
  const needsHorizontalScroll = actualGridWidth > availableWidth
  const svgWidth = needsHorizontalScroll ? actualGridWidth + margin.left + margin.right : dimensions.width

  return { margin, finalCellWidth, finalCellHeight, completeXRange, minY, maxY, svgWidth }
}

function createTooltip() {
  return select('body')
    .append('div')
    .attr('class', 'activity-grid-tooltip')
    .style('position', 'absolute')
    .style('padding', '8px')
    .style('background', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000)
}
type Tooltip = ReturnType<typeof createTooltip>

/** Attach hover tooltip handlers to a cell rect. */
function attachCellHover(
  rect: Selection<SVGRectElement, unknown, null, undefined>,
  ctx: ActivityGridRenderContext,
  cell: GridCell | undefined,
  tooltip: Tooltip,
  cellStrokeColor: string
) {
  rect
    .style('cursor', ctx.drillEnabled ? 'pointer' : 'default')
    .on('mouseover', function (event) {
      select(this).style('stroke', '#000').style('stroke-width', 2)
      if (cell) {
        const content = [`<strong>${cell.label}</strong>`, `${ctx.getFieldLabel(ctx.valueField)}: ${cell.value}`].join('<br>')
        tooltip
          .html(content)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .transition()
          .duration(200)
          .style('opacity', 1)
      }
    })
    .on('mousemove', function (event) {
      tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px')
    })
    .on('mouseout', function () {
      select(this).style('stroke', cellStrokeColor).style('stroke-width', 1)
      tooltip.transition().duration(200).style('opacity', 0)
    })
}

/** Render every grid cell rect, wiring tooltips + drill clicks. */
function drawCells(
  ctx: ActivityGridRenderContext,
  g: G,
  layout: Layout,
  colorScale: (v: number) => string,
  tooltip: Tooltip,
  theme: ThemeColors
) {
  const { gridData, valueField, dateField, drillEnabled, onDataPointClick, safeDisplayConfig } = ctx
  const { completeXRange, minY, maxY, finalCellWidth, finalCellHeight } = layout

  const gridMap = new Map<string, GridCell>()
  gridData.forEach((cell) => gridMap.set(`${cell.x}-${cell.y}`, cell))

  const xValueToIndex = new Map<number, number>()
  completeXRange.forEach((x, index) => xValueToIndex.set(x, index))

  for (const x of completeXRange) {
    for (let y = minY; y <= maxY; y++) {
      const cell = gridMap.get(`${x}-${y}`)
      const xIndex = xValueToIndex.get(x) || 0

      const rect = g
        .append('rect')
        .attr('x', xIndex * (finalCellWidth + 4))
        .attr('y', (y - minY) * (finalCellHeight + 4))
        .attr('width', finalCellWidth)
        .attr('height', finalCellHeight)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('fill', cell ? colorScale(cell.value) : theme.emptyCellColor)
        .style('stroke', theme.cellStrokeColor)
        .style('stroke-width', 1)

      if (safeDisplayConfig.showTooltip) {
        attachCellHover(rect, ctx, cell, tooltip, theme.cellStrokeColor)
      } else if (drillEnabled) {
        rect.style('cursor', 'pointer')
      }

      if (drillEnabled && onDataPointClick && cell) {
        rect.on('click', function (event) {
          onDataPointClick({
            dataPoint: { [valueField]: cell.value, [dateField]: cell.date },
            clickedField: valueField,
            xValue: cell.label,
            position: { x: event.pageX, y: event.pageY },
            nativeEvent: event as unknown as React.MouseEvent
          })
        })
      }
    }
  }
}

/** Hierarchical year/month grouping label for an encoded year value. */
function hierarchicalYearLabel(year: number): string {
  if (year > 9999) {
    const actualYear = Math.floor(year / 100)
    const month = year % 100
    return `${MONTH_NAMES[month - 1]} '${actualYear.toString().slice(-2)}`
  }
  return `'${year.toString().slice(-2)}`
}

/** Draw hierarchical (year-grouped) column + group labels. */
function drawHierarchicalLabels(ctx: ActivityGridRenderContext, g: G, layout: Layout, theme: ThemeColors) {
  const { gridMapping } = ctx
  const { completeXRange, finalCellWidth } = layout
  const xValueToIndex = new Map<number, number>()
  completeXRange.forEach((x, index) => xValueToIndex.set(x, index))

  const yearGroups = new Map<number, number[]>()
  for (const x of completeXRange) {
    const year = gridMapping.getYearFromX!(x)
    if (!yearGroups.has(year)) yearGroups.set(year, [])
    yearGroups.get(year)!.push(x)
  }

  for (const x of completeXRange) {
    const xIndex = xValueToIndex.get(x) || 0
    g.append('text')
      .attr('x', xIndex * (finalCellWidth + 4) + finalCellWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', theme.textColor)
      .text(gridMapping.xFormat(x))
  }

  for (const [year, xValues] of yearGroups) {
    if (xValues.length === 0) continue
    const startIndex = Math.min(...xValues.map((x) => xValueToIndex.get(x) || 0))
    const endIndex = Math.max(...xValues.map((x) => xValueToIndex.get(x) || 0))
    const centerIndex = (startIndex + endIndex) / 2

    g.append('text')
      .attr('x', centerIndex * (finalCellWidth + 4) + finalCellWidth / 2)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', theme.textColor)
      .text(hierarchicalYearLabel(year))

    if (xValues.length > 1) {
      g.append('line')
        .attr('x1', startIndex * (finalCellWidth + 4))
        .attr('x2', endIndex * (finalCellWidth + 4) + finalCellWidth)
        .attr('y1', -20)
        .attr('y2', -20)
        .style('stroke', theme.lineColor)
        .style('stroke-width', 1)
        .style('opacity', 0.3)
    }
  }
}

/** Draw simple (non-hierarchical) X-axis labels at a sampled interval. */
function drawSimpleXLabels(ctx: ActivityGridRenderContext, g: G, layout: Layout, theme: ThemeColors) {
  const { gridMapping } = ctx
  const { completeXRange, finalCellWidth } = layout
  const xLabelStep = Math.max(1, Math.floor(completeXRange.length / 10))
  for (let i = 0; i < completeXRange.length; i += xLabelStep) {
    g.append('text')
      .attr('x', i * (finalCellWidth + 4) + finalCellWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', theme.textColor)
      .text(gridMapping.xFormat(completeXRange[i]))
  }
}

/** Draw all axis labels (X column/group labels + Y row labels). */
function drawLabels(ctx: ActivityGridRenderContext, g: G, layout: Layout, theme: ThemeColors) {
  const { gridMapping } = ctx
  const { minY, maxY, finalCellHeight } = layout

  if (gridMapping.hasHierarchicalLabels && gridMapping.getYearFromX) {
    drawHierarchicalLabels(ctx, g, layout, theme)
  } else {
    drawSimpleXLabels(ctx, g, layout, theme)
  }

  for (let y = minY; y <= maxY; y++) {
    g.append('text')
      .attr('x', -8)
      .attr('y', (y - minY) * (finalCellHeight + 4) + finalCellHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '.35em')
      .style('font-size', '10px')
      .style('fill', theme.textColor)
      .text(gridMapping.yFormat(y))
  }
}

/**
 * Render the activity grid into the given SVG element. Returns a cleanup
 * function removing the tooltip, or undefined when there is nothing to draw.
 */
export function renderActivityGrid(ctx: ActivityGridRenderContext): (() => void) | undefined {
  const { svgEl, gridData, dimensions, colorPalette, isDark, safeDisplayConfig } = ctx

  select(svgEl).selectAll('*').remove()
  if (gridData.length === 0) return undefined

  const layout = computeLayout(ctx)

  const svg = select(svgEl).attr('width', layout.svgWidth).attr('height', dimensions.height)
  const g = svg.append('g').attr('transform', `translate(${layout.margin.left},${layout.margin.top})`)

  const values = gridData.map((d) => d.value)
  const colorScale = scaleQuantize<string>()
    .domain([min(values) || 0, max(values) || 1])
    .range(colorPalette?.gradient || CHART_COLORS_GRADIENT)

  const theme = resolveGridThemeColors(isDark)
  const tooltip = createTooltip()

  drawCells(ctx, g, layout, colorScale, tooltip, theme)

  if (safeDisplayConfig.showLabels) {
    drawLabels(ctx, g, layout, theme)
  }

  return () => {
    tooltip.remove()
  }
}
