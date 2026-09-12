
/**
 * Configuration for a single axis drop zone in the chart configuration UI
 */
export interface AxisDropZoneConfig {
  /** The key to store this field in chartConfig (e.g., 'xAxis', 'yAxis', 'sizeField') */
  key: string

  /** Display label for the drop zone */
  label: string

  /** Optional description/help text shown below the label */
  description?: string

  /** Whether at least one field is required in this drop zone */
  mandatory?: boolean

  /** Maximum number of items allowed in this drop zone */
  maxItems?: number

  /** Which field types this drop zone accepts */
  acceptTypes?: ('dimension' | 'timeDimension' | 'measure')[]

  /** Placeholder text when drop zone is empty */
  emptyText?: string

  /** Enable L/R axis toggle for items in this drop zone (for dual Y-axis support) */
  enableDualAxis?: boolean

  /**
   * Keep this zone out of automatic chart-config inference (the agent's
   * `inferChartConfig`). For zones whose meaning is subtractive or opt-in — the
   * records table's hidden columns being the case in point — filling them from
   * the query changes what renders rather than completing a partial config.
   */
  excludeFromInference?: boolean
}

/**
 * Configuration for a single display option
 */
export interface DisplayOptionConfig {
  /** The key to store this field in displayConfig */
  key: string
  
  /** Display label for the option */
  label: string
  
  /** Type of input control to render */
  type: 'boolean' | 'string' | 'number' | 'select' | 'color' | 'paletteColor' | 'axisFormat' | 'stringArray' | 'buttonGroup' | 'thresholdBands' | 'columnFormats' | 'rowLink'
  
  /** Default value for the option */
  defaultValue?: any
  
  /** Placeholder text for string/number inputs */
  placeholder?: string
  
  /** Options for select type */
  options?: Array<{ value: any; label: string }>
  
  /**
   * Which tab the option belongs on. Defaults to `display`.
   *
   * The Chart tab exists to answer "what feeds this chart", which for most
   * types is the axis drop zones. A content-first chart has no zones, and its
   * equivalent input is a display option — markdown's `content` being the case
   * in point, which is its whole substance and wants the room. Marking it
   * `chart` moves it there rather than leaving the tab empty and the editor
   * squeezed into a sidebar.
   */
  placement?: 'chart' | 'display'

  /** Help text shown below the input */
  description?: string

  /** Visible rows for a string option's textarea. Defaults to 8. */
  rows?: number

  /**
   * Render a string option with syntax highlighting rather than as a plain
   * textarea. Only `markdownTemplate` exists, colouring `{{ }}` expressions,
   * `{% %}` tags and markdown headings.
   */
  syntax?: 'markdownTemplate'

  /**
   * External reference for options whose full syntax cannot fit in help text.
   * Rendered as a link after the description, so the panel can stay short
   * instead of restating a whole template language badly.
   */
  docsUrl?: string

  /** Label for the `docsUrl` link — a translation key, like `label`. */
  docsLabel?: string

  /** Minimum value for number inputs */
  min?: number
  
  /** Maximum value for number inputs */
  max?: number
  
  /** Step value for number inputs */
  step?: number
}

/**
 * Split display options by which tab renders them.
 *
 * Shared by the Chart and Display panels so the two cannot disagree and leave
 * an option shown twice or not at all.
 */
export function optionsForPlacement(
  options: DisplayOptionConfig[] | undefined,
  placement: 'chart' | 'display'
): DisplayOptionConfig[] {
  return (options ?? []).filter((option) => (option.placement ?? 'display') === placement)
}

/**
 * Whether a chart type can be rendered with the current query shape.
 * Each chart's .config.ts declares its own `isAvailable` to keep requirements
 * co-located with the chart itself (rather than in a central switch).
 */
export interface ChartAvailability {
  /** Whether the chart type can be used with the current selections */
  available: boolean
  /** Translation key explaining why the chart is unavailable (for tooltip) */
  reason?: string
}

/**
 * Snapshot of the current query shape passed to each chart's `isAvailable`.
 */
export interface ChartAvailabilityContext {
  /** Number of measures selected */
  measureCount: number
  /**
   * Number of dimension-like breakdowns (regular dimensions + time dimensions).
   * A time dimension can serve any role a regular dimension does (categories,
   * axes, heatmap rows/columns, pie slices, etc.), so they are counted together.
   */
  dimensionCount: number
  /**
   * Number of time dimensions specifically. Only needed by charts that *require*
   * a time dimension (e.g. activityGrid).
   */
  timeDimensionCount: number
}

/**
 * Configuration for which elements in a chart support clicking (for drill-down)
 */
export interface ClickableElementsConfig {
  /** Bars in bar charts */
  bar?: boolean
  /** Points/dots in line/scatter charts */
  point?: boolean
  /** Slices in pie/donut charts */
  slice?: boolean
  /** Cells in heatmaps */
  cell?: boolean
  /** Nodes in treemaps, sankey diagrams */
  node?: boolean
  /** Areas in area charts */
  area?: boolean
  /** Rows in data tables */
  row?: boolean
}

/**
 * Complete configuration for a chart type
 */
export interface ChartTypeConfig {
  /** Display label for the chart type in the picker (e.g., 'Bar Chart', 'KPI Number') */
  label?: string

  /** Configuration for each drop zone */
  dropZones: AxisDropZoneConfig[]

  /** Simple display options (backward compatibility) - rendered as boolean checkboxes */
  displayOptions?: string[]

  /** Structured display options with metadata for different input types */
  displayOptionsConfig?: DisplayOptionConfig[]

  /** Optional custom validation function */
  validate?: (config: any) => { isValid: boolean; message?: string }

  /** Brief description of the chart */
  description?: string

  /** When to use this chart type */
  useCase?: string

  /** Whether this chart type skips query requirements (for content-based charts like markdown) */
  skipQuery?: boolean

  /** Configuration for which elements support clicking (for drill-down) */
  clickableElements?: ClickableElementsConfig

  /**
   * Whether this chart type can render with the given query shape.
   * Omit to mean "always available".
   */
  isAvailable?: (ctx: ChartAvailabilityContext) => ChartAvailability

  /**
   * This chart lists individual records rather than aggregates, so the query
   * built for it must be `ungrouped`.
   *
   * Declared here rather than switched on a chart type inside the query
   * builders, and read from the eager registry so those stay data-driven — and
   * so a custom chart can opt in through the same flag.
   */
  recordGrain?: boolean
}

/**
 * Registry of all chart type configurations
 */
export interface ChartConfigRegistry {
  [chartType: string]: ChartTypeConfig
}

/**
 * Default configuration for charts without specific requirements
 */
export const defaultChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.dropZone.xAxis.label',
      description: 'chart.dropZone.xAxis.description',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.dropZone.yAxis.description',
      mandatory: false,
      acceptTypes: ['measure', 'dimension'],
      emptyText: 'chart.dropZone.yAxis.empty'
    },
    {
      key: 'series',
      label: 'chart.dropZone.series.label',
      description: 'chart.dropZone.series.description',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip']
}

/**
 * Helper function to get configuration for a chart type
 */
export function getChartConfig(chartType: string, registry: ChartConfigRegistry): ChartTypeConfig {
  return registry[chartType] || defaultChartConfig
}