/**
 * Per-chart-type axis configuration builders.
 *
 * Each builder maps the current metrics/breakdowns selection onto the
 * `ChartAxisConfig` shape for one family of chart types. Splitting these out
 * of the single large `buildChartConfig` switch keeps each unit small and
 * keeps the per-type logic next to the chart it configures.
 */

import type { ChartType, ChartAxisConfig } from '../types.js'
import type { MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types.js'

/**
 * Resolved breakdown selections passed to every axis builder.
 */
export interface AxisBuilderContext {
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  timeDimension: BreakdownItem | undefined
  dimension: BreakdownItem | undefined
  dimensions: BreakdownItem[]
}

type AxisBuilder = (ctx: AxisBuilderContext) => ChartAxisConfig

const measureFields = (metrics: MetricItem[]): string[] => metrics.map((m) => m.field)

const firstMeasure = (metrics: MetricItem[]): string[] =>
  metrics.length > 0 ? [metrics[0].field] : []

/**
 * Line / Area: xAxis = first time dimension (prefer) or dimension,
 * yAxis = all measures, series = optional second dimension.
 */
function buildLineConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, timeDimension, dimension, dimensions } = ctx
  return {
    xAxis: timeDimension
      ? [timeDimension.field]
      : dimension
        ? [dimension.field]
        : [],
    yAxis: measureFields(metrics),
    series:
      dimensions.length > 1
        ? [dimensions[1].field]
        : dimension && timeDimension
          ? [dimension.field]
          : []
  }
}

/**
 * Bar: xAxis = first dimension (prefer non-time), yAxis = all measures.
 */
function buildBarConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, timeDimension, dimension, dimensions } = ctx
  return {
    xAxis: dimension
      ? [dimension.field]
      : timeDimension
        ? [timeDimension.field]
        : [],
    yAxis: measureFields(metrics),
    series:
      dimensions.length > 1
        ? [dimensions[1].field]
        : timeDimension && dimension
          ? [timeDimension.field]
          : []
  }
}

/**
 * Pie: xAxis = first dimension (exactly 1), yAxis = first measure (exactly 1).
 */
function buildPieConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, dimension } = ctx
  return {
    xAxis: dimension ? [dimension.field] : [],
    yAxis: firstMeasure(metrics)
  }
}

/**
 * Scatter: xAxis = first dimension or measure, yAxis = first/second measure.
 */
function buildScatterConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, breakdowns, dimension, dimensions } = ctx
  if (metrics.length >= 2) {
    return {
      xAxis: [metrics[0].field],
      yAxis: [metrics[1].field],
      series: dimension ? [dimension.field] : []
    }
  }
  return {
    xAxis: breakdowns.length > 0 ? [breakdowns[0].field] : [],
    yAxis: firstMeasure(metrics),
    series: dimensions.length > 1 ? [dimensions[1].field] : []
  }
}

/**
 * Bubble: xAxis = first measure, yAxis = second measure,
 * sizeField = third measure (or second if only 2),
 * series = first breakdown (dimension or time dimension) for grouping/coloring.
 */
function buildBubbleConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, timeDimension, dimension } = ctx
  return {
    xAxis: metrics.length > 0 ? [metrics[0].field] : [],
    yAxis: metrics.length > 1 ? [metrics[1].field] : [],
    sizeField: metrics.length > 2 ? metrics[2].field : metrics.length > 1 ? metrics[1].field : undefined,
    series: dimension ? [dimension.field] : timeDimension ? [timeDimension.field] : []
  }
}

/**
 * Radar / RadialBar / Treemap: dimension for categories, measure for values.
 */
function buildCategoryValueConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, dimension } = ctx
  return {
    xAxis: dimension ? [dimension.field] : [],
    yAxis: firstMeasure(metrics)
  }
}

/**
 * Activity Grid: dateField = time dimension, valueField = measure.
 */
function buildActivityGridConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, timeDimension } = ctx
  return {
    dateField: timeDimension ? [timeDimension.field] : [],
    valueField: firstMeasure(metrics)
  }
}

/**
 * KPI charts: just need the measure.
 */
function buildKpiConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  return {
    yAxis: firstMeasure(ctx.metrics)
  }
}

/**
 * Table: include all fields.
 */
function buildTableConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, breakdowns } = ctx
  return {
    xAxis: [
      ...breakdowns.map((b) => b.field),
      ...metrics.map((m) => m.field)
    ]
  }
}

/**
 * Markdown doesn't need chart config.
 */
function buildMarkdownConfig(): ChartAxisConfig {
  return {}
}

/**
 * Default fallback: x = first breakdown, y = all measures.
 */
function buildDefaultConfig(ctx: AxisBuilderContext): ChartAxisConfig {
  const { metrics, breakdowns } = ctx
  return {
    xAxis: breakdowns.length > 0 ? [breakdowns[0].field] : [],
    yAxis: measureFields(metrics)
  }
}

/**
 * Lookup of chart type → axis builder. Types not present fall back to
 * `buildDefaultConfig`.
 */
const axisBuilders: Partial<Record<ChartType, AxisBuilder>> = {
  line: buildLineConfig,
  area: buildLineConfig,
  bar: buildBarConfig,
  pie: buildPieConfig,
  scatter: buildScatterConfig,
  bubble: buildBubbleConfig,
  radar: buildCategoryValueConfig,
  radialBar: buildCategoryValueConfig,
  treemap: buildCategoryValueConfig,
  activityGrid: buildActivityGridConfig,
  kpiNumber: buildKpiConfig,
  kpiDelta: buildKpiConfig,
  kpiText: buildKpiConfig,
  table: buildTableConfig,
  markdown: buildMarkdownConfig,
}

/**
 * Resolve the axis builder for a chart type, falling back to the default.
 */
export function getAxisBuilder(chartType: ChartType): AxisBuilder {
  return axisBuilders[chartType] || buildDefaultConfig
}
