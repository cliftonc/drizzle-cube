/**
 * D3 rendering for BubbleChart, extracted from the component's render effect.
 *
 * The effect orchestrates these pure-ish drawing helpers. Behaviour matches the
 * original inline D3 exactly; only the structure changed (one function per
 * concern) to keep each helper's complexity low.
 */
import {
  select,
  scaleLinear,
  scaleSqrt,
  scaleOrdinal,
  scaleQuantize,
  extent,
  max,
  axisBottom,
  axisLeft,
  type Selection,
  type ScaleLinear,
  type ScalePower,
  type ScaleOrdinal,
  type ScaleQuantize
} from 'd3'
import { CHART_COLORS, CHART_COLORS_GRADIENT, CHART_MARGINS } from '../../utils/chartConstants'
import { formatAxisValue } from '../../utils/chartUtils'
import { resolveThemeColors } from './BubbleChart.helpers'
import type { BubbleData, BubbleDisplayOptions, BubbleFields } from './BubbleChart.helpers'
import type { ColorPalette, CubeQuery } from '../../types'

type ColorScale = ScaleOrdinal<string, string> | ScaleQuantize<string>
type G = Selection<SVGGElement, unknown, null, undefined>

export interface BubbleRenderContext {
  svgEl: SVGSVGElement
  bubbleData: BubbleData[]
  fields: BubbleFields
  options: BubbleDisplayOptions
  dimensions: { width: number; height: number }
  queryObject: CubeQuery | undefined
  colorPalette?: ColorPalette
  isDark: boolean
  getFieldLabel: (field: string) => string
}

interface ColorScaleResult {
  colorScale: ColorScale
  isNumericColorField: boolean
  uniqueColors: string[]
}

/** Build the bubble fill colour scale (numeric → quantize, categorical → ordinal). */
function buildColorScale(
  bubbleData: BubbleData[],
  colorFieldName: string | undefined,
  colorPalette: ColorPalette | undefined
): ColorScaleResult {
  if (colorFieldName && bubbleData.length > 0) {
    const colorValues = bubbleData
      .map((item) => (typeof item.color === 'string' ? parseFloat(item.color) : item.color))
      .filter((val): val is number => !isNaN(val as number))
    const isNumericColorField =
      colorValues.length === bubbleData.length && colorValues.every((val) => typeof val === 'number')

    if (isNumericColorField) {
      const colorScale = scaleQuantize<string>()
        .domain([Math.min(...colorValues), Math.max(...colorValues)])
        .range(colorPalette?.gradient || CHART_COLORS_GRADIENT)
      return { colorScale, isNumericColorField, uniqueColors: [] }
    }

    const uniqueColors = [...new Set(bubbleData.map((d) => String(d.color)))]
    const colorScale = scaleOrdinal<string>().domain(uniqueColors).range(colorPalette?.colors || CHART_COLORS)
    return { colorScale, isNumericColorField, uniqueColors }
  }

  const colorScale = scaleOrdinal<string>().domain(['default']).range([CHART_COLORS[0]])
  return { colorScale, isNumericColorField: false, uniqueColors: [] }
}

/** Format an x-axis tick for a time dimension based on its granularity. */
function formatTimeTick(value: number | { valueOf(): number }, granularity: string | undefined): string {
  const date = new Date(value as number)
  if (isNaN(date.getTime())) return String(value)
  const yr = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dy = String(date.getUTCDate()).padStart(2, '0')
  switch (granularity?.toLowerCase()) {
    case 'year':
      return String(yr)
    case 'quarter':
      return `${yr}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`
    case 'month':
      return `${yr}-${mo}`
    case 'week':
    case 'day':
      return `${yr}-${mo}-${dy}`
    case 'hour':
      return `${mo}-${dy} ${String(date.getUTCHours()).padStart(2, '0')}:00`
    default:
      return `${yr}-${mo}`
  }
}

/** Draw the dashed background grid. */
function drawGrid(
  g: G,
  xScale: ScaleLinear<number, number>,
  yScale: ScaleLinear<number, number>,
  width: number,
  chartHeight: number,
  gridColor: string
) {
  const styleGrid = (grid: G) => {
    grid.selectAll('line').style('stroke', gridColor).style('stroke-dasharray', '3,3').style('opacity', 0.3)
    grid.select('.domain').style('stroke', 'none')
  }
  const xGrid = g
    .append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(axisBottom(xScale).tickSize(-chartHeight).tickFormat(() => '')) as unknown as G
  styleGrid(xGrid)
  const yGrid = g.append('g').call(axisLeft(yScale).tickSize(-width).tickFormat(() => '')) as unknown as G
  styleGrid(yGrid)
}

/** Draw X and Y axes with labels and theme-aware styling. */
function drawAxes(
  ctx: BubbleRenderContext,
  g: G,
  xScale: ScaleLinear<number, number>,
  yScale: ScaleLinear<number, number>,
  width: number,
  chartHeight: number,
  textColor: string,
  gridColor: string
) {
  const { fields, options, queryObject, getFieldLabel } = ctx
  const isTimeDimension =
    queryObject?.timeDimensions?.some((td: { dimension: string }) => td.dimension === fields.xAxisField) || false
  const xGranularity = queryObject?.timeDimensions?.find(
    (td: { dimension: string; granularity?: string }) => td.dimension === fields.xAxisField
  )?.granularity

  const xAxisGenerator = axisBottom(xScale)
  if (isTimeDimension) {
    xAxisGenerator.tickFormat((d) => formatTimeTick(d as number, xGranularity))
  } else if (options.xAxisFormat) {
    xAxisGenerator.tickFormat((d) => formatAxisValue(d as number, options.xAxisFormat))
  }

  const xAxis = g.append('g').attr('transform', `translate(0,${chartHeight})`).call(xAxisGenerator)
  xAxis.selectAll('text').style('fill', textColor)
  xAxis.selectAll('line, path').style('stroke', gridColor)
  xAxis
    .append('text')
    .attr('x', width / 2)
    .attr('y', 35)
    .attr('fill', textColor)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(options.xAxisFormat?.label || getFieldLabel(fields.xAxisField))

  const yAxisGenerator = axisLeft(yScale)
  if (options.leftYAxisFormat) {
    yAxisGenerator.tickFormat((d) => formatAxisValue(d as number, options.leftYAxisFormat))
  }
  const yAxis = g.append('g').call(yAxisGenerator)
  yAxis.selectAll('text').style('fill', textColor)
  yAxis.selectAll('line, path').style('stroke', gridColor)
  yAxis
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -35)
    .attr('x', -chartHeight / 2)
    .attr('fill', textColor)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(options.leftYAxisFormat?.label || getFieldLabel(fields.yAxisField))
}

/** Create the floating HTML tooltip element. */
function createTooltip() {
  return select('body')
    .append('div')
    .attr('class', 'bubble-chart-tooltip')
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
type Bubbles = Selection<SVGCircleElement, BubbleData, SVGGElement, unknown>

/** Compose the multi-line tooltip HTML for a bubble. */
function bubbleTooltipHtml(ctx: BubbleRenderContext, d: BubbleData): string {
  const { fields, options, getFieldLabel } = ctx
  const fmt = (v: number) => (options.leftYAxisFormat ? formatAxisValue(v, options.leftYAxisFormat) : v)
  return [
    `<strong>${d.series || 'Unknown'}</strong>`,
    `${getFieldLabel(fields.xAxisField)}: ${d.xLabel || (options.xAxisFormat ? formatAxisValue(d.x, options.xAxisFormat) : d.x)}`,
    `${getFieldLabel(fields.yAxisField)}: ${fmt(d.y)}`,
    `${getFieldLabel(fields.sizeFieldName)}: ${fmt(d.size)}`,
    fields.colorFieldName && d.color ? `${getFieldLabel(fields.colorFieldName)}: ${d.color}` : ''
  ]
    .filter(Boolean)
    .join('<br>')
}

/** Attach hover handlers showing/hiding the tooltip and growing the bubble. */
function attachBubbleHover(
  ctx: BubbleRenderContext,
  bubbles: Bubbles,
  tooltip: Tooltip,
  sizeScale: ScalePower<number, number>
) {
  bubbles
    .on('mouseover', function (event, d) {
      select(this).transition().duration(200).style('opacity', 1).attr('r', sizeScale(d.size) * 1.1)
      tooltip
        .html(bubbleTooltipHtml(ctx, d))
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 10 + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1)
    })
    .on('mousemove', function (event) {
      tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px')
    })
    .on('mouseout', function (_event, d) {
      select(this).transition().duration(200).style('opacity', ctx.options.bubbleOpacity).attr('r', sizeScale(d.size))
      tooltip.transition().duration(200).style('opacity', 0)
    })
}

/** Draw the gradient legend for a numeric colour field. */
function drawNumericLegend(
  ctx: BubbleRenderContext,
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  g: G,
  width: number,
  chartHeight: number,
  textColor: string
) {
  const { bubbleData, fields, options, colorPalette, getFieldLabel } = ctx
  const legendWidth = 200
  const legendHeight = 20
  const minValue = Math.min(...bubbleData.map((d) => d.color as number))
  const maxValue = Math.max(...bubbleData.map((d) => d.color as number))
  const fmt = (v: number) => (options.leftYAxisFormat ? formatAxisValue(v, options.leftYAxisFormat) : v.toFixed(2))

  const legend = g
    .append('g')
    .attr('class', 'color-legend')
    .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${chartHeight + 60})`)

  const gradient = svg
    .append('defs')
    .append('linearGradient')
    .attr('id', 'color-scale-gradient')
    .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
  const gradientColors = colorPalette?.gradient || CHART_COLORS_GRADIENT
  gradientColors.forEach((color, i) => {
    gradient.append('stop').attr('offset', `${(i / (gradientColors.length - 1)) * 100}%`).attr('stop-color', color)
  })

  legend.append('rect')
    .attr('width', legendWidth).attr('height', legendHeight)
    .style('fill', 'url(#color-scale-gradient)').style('stroke', '#ccc').style('stroke-width', 1)
  legend.append('text')
    .attr('x', 0).attr('y', legendHeight + 15).attr('text-anchor', 'start')
    .style('font-size', '11px').style('fill', textColor).text(fmt(minValue))
  legend.append('text')
    .attr('x', legendWidth).attr('y', legendHeight + 15).attr('text-anchor', 'end')
    .style('font-size', '11px').style('fill', textColor).text(fmt(maxValue))
  legend.append('text')
    .attr('x', legendWidth / 2).attr('y', -5).attr('text-anchor', 'middle')
    .style('font-size', '12px').style('font-weight', 'bold').style('fill', textColor)
    .text(getFieldLabel(fields.colorFieldName!))
}

/** Draw the categorical legend (one swatch per series) with hover highlighting. */
function drawCategoricalLegend(
  ctx: BubbleRenderContext,
  g: G,
  width: number,
  chartHeight: number,
  textColor: string,
  uniqueColors: string[],
  colorScale: ScaleOrdinal<string, string>,
  bubbles: Bubbles
) {
  const { fields, options } = ctx
  if (uniqueColors.length === 0) return

  const legend = g
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width / 2 - (uniqueColors.length * 80) / 2}, ${chartHeight + 60})`)

  const legendItem = legend
    .selectAll('.legend-item')
    .data(uniqueColors)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (_d, i) => `translate(${i * 80}, 0)`)
    .style('cursor', 'pointer')

  legendItem.append('circle')
    .attr('cx', 5).attr('cy', 5).attr('r', 5)
    .style('fill', (d) => colorScale(d as string)).style('opacity', options.bubbleOpacity)
  legendItem.append('text')
    .attr('x', 15).attr('y', 5).attr('dy', '.35em')
    .style('font-size', '11px').style('fill', textColor).text((d) => String(d))

  legendItem
    .on('mouseover', function (_event, legendKey) {
      bubbles.transition().duration(200).style('opacity', (d) =>
        fields.colorFieldName && String(d.color) === legendKey ? 1 : 0.2
      )
    })
    .on('mouseout', function () {
      bubbles.transition().duration(200).style('opacity', options.bubbleOpacity)
    })
}

/**
 * Render the bubble chart into the given SVG element. Returns a cleanup function
 * that removes the floating tooltip. Returns undefined when there is nothing to draw.
 */
export function renderBubbleChart(ctx: BubbleRenderContext): (() => void) | undefined {
  const { svgEl, bubbleData, fields, options, dimensions, colorPalette, isDark } = ctx

  select(svgEl).selectAll('*').remove()
  if (bubbleData.length === 0) return undefined

  const margin = {
    ...CHART_MARGINS,
    left: CHART_MARGINS.left + 30,
    bottom: options.showLegend && fields.colorFieldName ? 100 : 40
  }
  const width = dimensions.width - margin.left - margin.right
  const chartHeight = dimensions.height - margin.top - margin.bottom

  const svg = select(svgEl).attr('width', dimensions.width).attr('height', dimensions.height)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = scaleLinear().domain(extent(bubbleData, (d) => d.x) as [number, number]).range([0, width]).nice()
  const yScale = scaleLinear().domain(extent(bubbleData, (d) => d.y) as [number, number]).range([chartHeight, 0]).nice()
  const sizeScale = scaleSqrt()
    .domain([0, max(bubbleData, (d) => d.size) as number])
    .range([options.minBubbleSize, options.maxBubbleSize])

  const { colorScale, isNumericColorField, uniqueColors } = buildColorScale(
    bubbleData,
    fields.colorFieldName,
    colorPalette
  )
  const { textColor, gridColor } = resolveThemeColors(isDark)

  if (options.showGrid) {
    drawGrid(g, xScale, yScale, width, chartHeight, gridColor)
  }
  drawAxes(ctx, g, xScale, yScale, width, chartHeight, textColor, gridColor)

  const tooltip = createTooltip()

  const bubbles = g
    .selectAll('.bubble')
    .data(bubbleData)
    .enter()
    .append('circle')
    .attr('class', 'bubble')
    .attr('cx', (d) => xScale(d.x))
    .attr('cy', (d) => yScale(d.y))
    .attr('r', (d) => sizeScale(d.size))
    .style('fill', (d) => {
      if (fields.colorFieldName && d.color !== undefined) {
        return isNumericColorField
          ? (colorScale as ScaleQuantize<string>)(d.color as number)
          : (colorScale as ScaleOrdinal<string, string>)(String(d.color))
      }
      return CHART_COLORS[0]
    })
    .style('opacity', options.bubbleOpacity)
    .style('stroke', '#fff')
    .style('stroke-width', 1)
    .style('cursor', 'pointer') as Bubbles

  if (options.showTooltip) {
    attachBubbleHover(ctx, bubbles, tooltip, sizeScale)
  }

  if (options.showLegend && fields.colorFieldName) {
    if (isNumericColorField) {
      drawNumericLegend(ctx, svg, g, width, chartHeight, textColor)
    } else {
      drawCategoricalLegend(ctx, g, width, chartHeight, textColor, uniqueColors, colorScale as ScaleOrdinal<string, string>, bubbles)
    }
  }

  return () => {
    tooltip.remove()
  }
}
