import { ReactNode } from 'react';
import { ColorPalette } from './utils/colorPalettes.js';
import { FunnelBindingKey } from './types/funnel.js';
import { FlowChartData } from './types/flow.js';
import { RetentionChartData } from './types/retention.js';
export type TimeGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export interface CubeMetaMeasure {
    name: string;
    title: string;
    shortTitle: string;
    type: string;
    /** Dimension names shown when drilling into this measure */
    drillMembers?: string[];
}
export interface CubeMetaDimension {
    name: string;
    title: string;
    shortTitle: string;
    type: string;
    /** Supported granularities for time dimensions (for time-based drill-down) */
    granularities?: TimeGranularity[];
}
export interface CubeMetaField {
    name: string;
    title: string;
    shortTitle: string;
    type: string;
}
export interface CubeMetaRelationship {
    targetCube: string;
    relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany';
    joinFields?: Array<{
        sourceField: string;
        targetField: string;
    }>;
}
/**
 * Hierarchy metadata for structured drill-down paths
 */
export interface CubeMetaHierarchy {
    /** Unique identifier for the hierarchy */
    name: string;
    /** Display title for the hierarchy */
    title: string;
    /** Cube name this hierarchy belongs to */
    cubeName: string;
    /** Full dimension names in order from least to most granular */
    levels: string[];
}
export interface CubeMetaCube {
    name: string;
    title: string;
    description?: string;
    measures: CubeMetaMeasure[];
    dimensions: CubeMetaDimension[];
    segments: CubeMetaField[];
    relationships?: CubeMetaRelationship[];
    /** Hierarchies for structured drill-down paths */
    hierarchies?: CubeMetaHierarchy[];
    /** Additional cube metadata (e.g., eventStream configuration for funnel queries) */
    meta?: {
        eventStream?: {
            bindingKey: string;
            timeDimension: string;
        };
        [key: string]: any;
    };
}
export interface CubeMeta {
    cubes: CubeMetaCube[];
}
export type FieldLabelMap = Record<string, string>;
export type { ColorPalette } from './utils/colorPalettes.js';
export type BuiltInChartType = 'line' | 'bar' | 'pie' | 'table' | 'area' | 'scatter' | 'radar' | 'radialBar' | 'treemap' | 'bubble' | 'activityGrid' | 'kpiNumber' | 'kpiDelta' | 'kpiText' | 'markdown' | 'funnel' | 'sankey' | 'sunburst' | 'heatmap' | 'retentionHeatmap' | 'retentionCombined' | 'boxPlot' | 'dotStrip' | 'waterfall' | 'candlestick' | 'proportionBar' | 'measureProfile' | 'gauge' | 'recordsTable';
export type ChartType = BuiltInChartType | (string & {});
export interface AxisFormatConfig {
    label?: string;
    unit?: 'currency' | 'percent' | 'number' | 'custom';
    abbreviate?: boolean;
    decimals?: number;
    customPrefix?: string;
    customSuffix?: string;
    currencyCode?: string;
}
export interface ChartAxisConfig {
    xAxis?: string[];
    yAxis?: string[];
    series?: string[];
    sizeField?: string;
    colorField?: string;
    dateField?: string[];
    valueField?: string[];
    columns?: string[];
    hiddenColumns?: string[];
    x?: string;
    y?: string[];
    yAxisAssignment?: Record<string, 'left' | 'right'>;
}
/**
 * How a records-table column renders its value. Chosen per column in the chart
 * editor — never inferred from the data, so the same field can be a badge in one
 * dashboard and plain text in another.
 */
export type ColumnFormatKind = 'text' | 'number' | 'date' | 'badge' | 'progress';
export interface ColumnFormatConfig {
    kind: ColumnFormatKind;
    /** Numeric formatting for `kind: 'number'` — reuses the shared axis formatter. */
    numberFormat?: AxisFormatConfig;
    /** Granularity for `kind: 'date'`. */
    dateGranularity?: TimeGranularity;
    /**
     * Value → palette colour index for `kind: 'badge'`. Values with no mapping
     * render neutral rather than being assigned a guessed colour.
     */
    badgeColors?: Array<{
        value: string;
        colorIndex: number;
    }>;
    /** Bounds for `kind: 'progress'` (default 0-100). Values are clamped. */
    progressMin?: number;
    progressMax?: number;
    /** How a `kind: 'progress'` cell draws: a full-width bar, or a compact ring for narrow columns. */
    progressStyle?: 'bar' | 'circle';
    /** Header override; falls back to the field's metadata title. */
    label?: string;
    align?: 'left' | 'right';
}
/**
 * Row-level click-through for the records table. Tokens of the form
 * `{Cube.field}` are substituted from the row, including hidden columns.
 */
export interface RowLinkConfig {
    urlTemplate: string;
    target?: 'self' | 'blank';
}
export interface ThresholdBand {
    value: number;
    color: string;
}
export interface ChartDisplayConfig {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    colors?: string[];
    orientation?: 'horizontal' | 'vertical';
    stacked?: boolean;
    stackType?: 'none' | 'normal' | 'percent';
    connectNulls?: boolean;
    showSummary?: boolean;
    showPoints?: boolean;
    showAllXLabels?: boolean;
    hideHeader?: boolean;
    innerRadius?: string;
    minBubbleSize?: number;
    maxBubbleSize?: number;
    bubbleOpacity?: number;
    showLabels?: boolean;
    showPercentages?: boolean;
    sortSegments?: boolean;
    fitToWidth?: boolean;
    showMedianMarker?: boolean;
    showBandStats?: boolean;
    showExtremeLabels?: boolean;
    dotSize?: 'small' | 'medium' | 'large';
    bandSort?: 'none' | 'valueDesc' | 'valueAsc' | 'count';
    pivotTimeDimension?: boolean;
    columnFormats?: Record<string, ColumnFormatConfig>;
    columnWidths?: Record<string, number>;
    rowLink?: RowLinkConfig;
    pageSize?: number;
    target?: string;
    template?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    formatValue?: (value: number | null | undefined) => string;
    valueColor?: string;
    valueColorIndex?: number;
    layout?: 'auto' | 'compact';
    positiveColorIndex?: number;
    negativeColorIndex?: number;
    showHistogram?: boolean;
    showBaseline?: boolean;
    useLastCompletePeriod?: boolean;
    skipLastPeriod?: boolean;
    content?: string;
    accentColorIndex?: number;
    fontSize?: 'small' | 'medium' | 'large';
    alignment?: 'left' | 'center' | 'right';
    transparentBackground?: boolean;
    autoHeight?: boolean;
    accentBorder?: 'none' | 'left' | 'top' | 'bottom';
    xAxisFormat?: AxisFormatConfig;
    leftYAxisFormat?: AxisFormatConfig;
    rightYAxisFormat?: AxisFormatConfig;
    /**
     * How to display compared periods:
     * - 'separate': Each period as distinct series with different colors (default)
     * - 'overlay': Periods aligned by day-of-period index with ghost styling for prior periods
     */
    comparisonMode?: 'separate' | 'overlay';
    /** Line style for prior periods in overlay mode */
    priorPeriodStyle?: 'solid' | 'dashed' | 'dotted';
    /** Opacity for prior period lines (0-1), default: 0.5 */
    priorPeriodOpacity?: number;
    /** Include period labels in legend */
    showPeriodLabels?: boolean;
    /** Custom labels for funnel steps (array indexed by step, e.g., ["Signup", "Activation", "Purchase"]) */
    funnelStepLabels?: string[];
    /** Hide the summary footer in funnel charts */
    hideSummaryFooter?: boolean;
    /** Funnel orientation: horizontal (bars left to right) or vertical (bars bottom to top) */
    funnelOrientation?: 'horizontal' | 'vertical';
    /** @deprecated Use showFunnelAvgTime, showFunnelMedianTime, showFunnelP90Time instead */
    showFunnelTimeMetrics?: boolean;
    /** Funnel visualization style: 'bars' (horizontal bars) or 'funnel' (trapezoid funnel shape) */
    funnelStyle?: 'bars' | 'funnel';
    /** Show step-to-step conversion rate (default: true) */
    showFunnelConversion?: boolean;
    /** Show average time-to-convert metric in funnel charts */
    showFunnelAvgTime?: boolean;
    /** Show median time-to-convert metric in funnel charts */
    showFunnelMedianTime?: boolean;
    /** Show P90 time-to-convert metric in funnel charts */
    showFunnelP90Time?: boolean;
    /** Retention display mode: line chart, heatmap table, or combined view */
    retentionDisplayMode?: 'line' | 'heatmap' | 'combined';
    showTotal?: boolean;
    showConnectorLine?: boolean;
    showDataLabels?: boolean;
    bullColor?: string;
    bearColor?: string;
    showWicks?: boolean;
    rangeMode?: 'ohlc' | 'range';
    showReferenceLineAtZero?: boolean;
    lineType?: 'monotone' | 'linear' | 'step';
    minValue?: number;
    maxValue?: number;
    thresholds?: string | ThresholdBand[];
    showCenterLabel?: boolean;
    showPercentage?: boolean;
}
export interface PortletConfig {
    id: string;
    title: string;
    /**
     * Canonical format for analysis configuration.
     * This is the single source of truth for all query/chart config.
     * New portlets only save this field. Legacy portlets are migrated on-the-fly.
     */
    analysisConfig?: import('./types/analysisConfig.js').AnalysisConfig;
    /** @deprecated Use analysisConfig.query instead */
    query?: string;
    /** @deprecated Use analysisConfig.charts[mode].chartType instead */
    chartType?: ChartType;
    /** @deprecated Use analysisConfig.charts[mode].chartConfig instead */
    chartConfig?: ChartAxisConfig;
    /** @deprecated Use analysisConfig.charts[mode].displayConfig instead */
    displayConfig?: ChartDisplayConfig;
    dashboardFilterMapping?: DashboardFilterMapping;
    eagerLoad?: boolean;
    /** @deprecated Use analysisConfig.analysisType instead */
    analysisType?: AnalysisType;
    /** @deprecated Use analysisConfig for funnel mode */
    funnelCube?: string | null;
    /** @deprecated Use analysisConfig for funnel mode */
    funnelSteps?: FunnelStepState[];
    /** @deprecated Use analysisConfig for funnel mode */
    funnelTimeDimension?: string | null;
    /** @deprecated Use analysisConfig for funnel mode */
    funnelBindingKey?: FunnelBindingKey | null;
    /** @deprecated Use analysisConfig for funnel mode */
    funnelChartType?: ChartType;
    /** @deprecated Use analysisConfig for funnel mode */
    funnelChartConfig?: ChartAxisConfig;
    /** @deprecated Use analysisConfig for funnel mode */
    funnelDisplayConfig?: ChartDisplayConfig;
    w: number;
    h: number;
    x: number;
    y: number;
}
export type DashboardLayoutMode = 'grid' | 'rows';
export interface DashboardGridSettings {
    cols: number;
    rowHeight: number;
    minW: number;
    minH: number;
}
/**
 * One cell along a group's main axis. `portletIds` are stacked perpendicular to
 * the group's `direction`. Cells share the main axis equally and stacks share
 * the cross axis equally - a group is an evenly divided frame, with no
 * per-cell sizing to set or drag.
 */
export interface PortletGroupCell {
    portletIds: string[];
}
/**
 * A "combination portlet": several portlets snapped together so they render
 * inside one card. Layout-only - the portlets themselves stay flat in
 * `DashboardConfig.portlets` and are referenced by id from here.
 *
 * Depth is deliberately capped at two (cells along one axis, a stack inside
 * each). Snapping perpendicular onto an already-stacked portlet joins that
 * stack rather than creating a third level.
 */
export interface PortletGroup {
    id: string;
    /** When absent or empty, no title bar is rendered. */
    title?: string;
    direction: 'row' | 'column';
    cells: PortletGroupCell[];
}
export interface RowLayoutColumn {
    /** Exactly one of `portletId` / `groupId` is set. */
    portletId?: string;
    /** Set when this column hosts a PortletGroup instead of a single portlet. */
    groupId?: string;
    w: number;
}
export interface RowLayout {
    id: string;
    h: number;
    columns: RowLayoutColumn[];
}
export interface DashboardConfig {
    portlets: PortletConfig[];
    layoutMode?: DashboardLayoutMode;
    grid?: DashboardGridSettings;
    rows?: RowLayout[];
    groups?: PortletGroup[];
    layouts?: {
        [key: string]: any;
    };
    colorPalette?: string;
    filters?: DashboardFilter[];
    eagerLoad?: boolean;
    thumbnailData?: string;
    thumbnailUrl?: string;
}
export type AnalysisType = 'query' | 'funnel' | 'flow' | 'retention';
/**
 * State for a single funnel step (dedicated for Funnel mode)
 * Each step represents a stage in the funnel with its own cube and filters
 */
export interface FunnelStepState {
    /** Unique step identifier */
    id: string;
    /** Display name for the step (e.g., "Signup", "Purchase") */
    name: string;
    /** Which cube this step uses (for multi-cube funnels) */
    cube: string;
    /** Filters that define which events qualify for this step */
    filters: Filter[];
    /** Time window from previous step (ISO 8601 duration, e.g., "P7D" for 7 days) */
    timeToConvert?: string;
}
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'notStartsWith' | 'endsWith' | 'notEndsWith' | 'like' | 'notLike' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween' | 'in' | 'notIn' | 'arrayContains' | 'arrayOverlaps' | 'arrayContained' | 'set' | 'notSet' | 'isEmpty' | 'isNotEmpty' | 'inDateRange' | 'beforeDate' | 'afterDate' | 'regex' | 'notRegex';
export interface SimpleFilter {
    member: string;
    operator: FilterOperator;
    values: any[];
    dateRange?: string | string[];
}
export interface GroupFilter {
    type: 'and' | 'or';
    filters: Filter[];
}
export type Filter = SimpleFilter | GroupFilter;
export interface DashboardFilter {
    id: string;
    label: string;
    filter: Filter;
    isUniversalTime?: boolean;
}
export interface DashboardFilterMappingEntry {
    filterId: string;
    member?: string;
}
export type DashboardFilterMapping = Array<string | DashboardFilterMappingEntry>;
export interface CubeQuery {
    measures?: string[];
    dimensions?: string[];
    timeDimensions?: Array<{
        dimension: string;
        granularity?: string;
        dateRange?: string[] | string;
        fillMissingDates?: boolean;
        /**
         * Array of date ranges for period-over-period comparison.
         * When specified, queries are executed for each period and results are merged.
         */
        compareDateRange?: (string | [string, string])[];
    }>;
    filters?: Filter[];
    order?: {
        [key: string]: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
    segments?: string[];
    /** When true, returns raw row-level data without GROUP BY or aggregation */
    ungrouped?: boolean;
    /**
     * Ask the server for the number of rows the query would return with no
     * limit/offset, read back via `CubeResultSet.totalCount()`. Costs a second
     * round trip, so only paginated views set it.
     */
    total?: boolean;
}
/**
 * Merge strategy for combining multiple query results
 * - 'concat': Append rows with __queryIndex marker (for separate series per query)
 * - 'merge': Align data by common dimension key (for combined visualization)
 *
 * Note: For funnel analysis, use the dedicated funnel mode (analysisType === 'funnel')
 */
export type QueryMergeStrategy = 'concat' | 'merge';
/**
 * Configuration for multi-query portlets
 * Detected by presence of 'queries' array property
 *
 * Note: For funnel analysis, use the dedicated funnel mode (analysisType === 'funnel')
 */
export interface MultiQueryConfig {
    queries: CubeQuery[];
    mergeStrategy: QueryMergeStrategy;
    mergeKeys?: string[];
    queryLabels?: string[];
}
/**
 * Type guard to detect multi-query configuration
 */
export declare function isMultiQueryConfig(obj: unknown): obj is MultiQueryConfig;
export interface CubeQueryOptions {
    skip?: boolean;
    resetResultSetOnChange?: boolean;
    subscribe?: boolean;
}
export interface CubeApiOptions {
    apiUrl?: string;
    token?: string;
    headers?: Record<string, string>;
    credentials?: 'include' | 'omit' | 'same-origin';
}
/**
 * An unknown member the server rejected, mirroring the server's
 * `QueryValidationIssue`. `source` is what decides the response: a projected
 * member can be dropped and the query re-run, whereas dropping a filter would
 * widen the result set and must stay an error.
 */
export interface CubeValidationIssue {
    source: 'measure' | 'dimension' | 'timeDimension' | 'filter';
    member: string;
    message: string;
}
export interface CubeResultSet {
    rawData(): any[];
    tablePivot(): any[];
    series(): any[];
    annotation(): any;
    loadResponse?: any;
    cacheInfo?(): {
        hit: true;
        cachedAt: string;
        ttlMs: number;
        ttlRemainingMs: number;
    } | undefined;
    /** Rows the query would return without limit/offset — only when `total: true` was asked for. */
    totalCount?(): number | undefined;
}
export interface AnalyticsPortletProps {
    query: string;
    chartType: ChartType;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    dashboardFilters?: DashboardFilter[];
    dashboardFilterMapping?: DashboardFilterMapping;
    eagerLoad?: boolean;
    isVisible?: boolean;
    height?: string | number;
    title?: string;
    colorPalette?: ColorPalette;
    loadingComponent?: ReactNode;
    onDebugDataReady?: (debugData: {
        chartConfig: ChartAxisConfig;
        displayConfig: ChartDisplayConfig;
        queryObject: any;
        data: any[] | FlowChartData | RetentionChartData;
        chartType: ChartType;
        cacheInfo?: {
            hit: true;
            cachedAt: string;
            ttlMs: number;
            ttlRemainingMs: number;
        } | null;
        drillState?: {
            isDrilling: boolean;
            drillPath: Array<{
                id: string;
                label: string;
                clickedValue?: unknown;
                dimension?: string;
                granularity?: string;
                hierarchy?: string;
            }>;
            currentDrillDepth: number;
            originalQuery: any;
            activeQuery: any;
        };
    }) => void;
}
export interface AnalyticsDashboardProps {
    config: DashboardConfig;
    editable?: boolean;
    dashboardFilters?: DashboardFilter[];
    loadingComponent?: ReactNode;
    onConfigChange?: (config: DashboardConfig) => void;
    onSave?: (config: DashboardConfig) => Promise<void> | void;
    onSaveThumbnail?: (thumbnailData: string) => Promise<string | void>;
    onDirtyStateChange?: (isDirty: boolean) => void;
}
export interface ChartProps {
    data: any[];
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    queryObject?: CubeQuery;
    height?: string | number;
    colorPalette?: ColorPalette;
    /** Handler for data point clicks - fires ChartDataPointClickEvent */
    onDataPointClick?: (event: import('./types/drill.js').ChartDataPointClickEvent) => void;
    /** Whether drill-down is enabled (shows pointer cursor on clickable elements) */
    drillEnabled?: boolean;
    /**
     * Server-side pagination, supplied by hosts that can re-query (the dashboard
     * portlet). Absent in the AnalysisBuilder preview, the notebook and plugin
     * hosts, where a chart pages and sorts over the rows it already has.
     */
    pagination?: ChartPagination;
}
/**
 * Paging and sorting state a host drives on the chart's behalf.
 *
 * Sort lives here rather than in the chart because with server-side paging a
 * header click has to re-order the whole result set: sorting only the loaded
 * page would put the wrong rows on page 1.
 */
export interface ChartPagination {
    page: number;
    pageSize: number;
    pageSizeOptions: number[];
    /** Total matching rows, once the server has reported one. */
    total?: number;
    sort?: {
        column: string;
        direction: 'asc' | 'desc';
    };
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    /** Cycles the column asc → desc → unsorted, resetting to the first page. */
    toggleSort: (column: string) => void;
}
export interface ThumbnailFeatureConfig {
    enabled: boolean;
    width?: number;
    height?: number;
    format?: 'png' | 'jpeg';
    quality?: number;
}
export interface XlsExportFeatureConfig {
    enabled: boolean;
    /** Optional prefix for exported filenames (default: portlet title) */
    filenamePrefix?: string;
}
export interface FeaturesConfig {
    enableAI?: boolean;
    aiEndpoint?: string;
    showSchemaDiagram?: boolean;
    useAnalysisBuilder?: boolean;
    editToolbar?: 'floating' | 'top' | 'both';
    floatingToolbarPosition?: 'left' | 'right';
    thumbnail?: ThumbnailFeatureConfig;
    manualRefresh?: boolean;
    xlsExport?: XlsExportFeatureConfig;
}
export interface GridLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}
export interface ResponsiveLayout {
    [breakpoint: string]: GridLayout[];
}
export type DashboardDisplayMode = 'desktop' | 'scaled' | 'mobile';
export type { FunnelBindingKey, FunnelBindingKeyMapping, FunnelStep, FunnelConfig, FunnelStepResult, FunnelExecutionResult, FunnelChartData, FunnelValidationError, FunnelValidationResult, UseFunnelQueryOptions, UseFunnelQueryResult, ServerFunnelQuery, } from './types/funnel.js';
/**
 * Type guard to detect server funnel query format
 * Used to distinguish { funnel: {...} } from CubeQuery or MultiQueryConfig
 */
export declare function isServerFunnelQuery(obj: unknown): obj is import('./types/funnel.js').ServerFunnelQuery;
export type { FlowStartingStep, ServerFlowQuery, FlowQueryConfig, SankeyNode, SankeyLink, FlowResultRow, FlowChartData, FlowSliceState, FlowSliceActions, } from './types/flow.js';
export { isServerFlowQuery, isSankeyData } from './types/flow.js';
/**
 * Options for EXPLAIN query execution
 */
export interface ExplainOptions {
    /** Use EXPLAIN ANALYZE to actually execute the query and get real timing (PostgreSQL, MySQL 8.0.18+) */
    analyze?: boolean;
}
/**
 * A single operation/node in the query execution plan
 * Normalized structure across all databases
 */
export interface ExplainOperation {
    /** Operation type (e.g., 'Seq Scan', 'Index Scan', 'Hash Join', 'Sort') */
    type: string;
    /** Table name if applicable */
    table?: string;
    /** Index name if used */
    index?: string;
    /** Estimated row count from planner */
    estimatedRows?: number;
    /** Actual row count (if ANALYZE was used) */
    actualRows?: number;
    /** Estimated cost (database-specific units) */
    estimatedCost?: number;
    /** Filter condition if any */
    filter?: string;
    /** Additional details specific to this operation */
    details?: string;
    /** Nested/child operations */
    children?: ExplainOperation[];
}
/**
 * Summary statistics from the execution plan
 */
export interface ExplainSummary {
    /** Database engine type */
    database: 'postgres' | 'mysql' | 'sqlite';
    /** Planning time in milliseconds (if available) */
    planningTime?: number;
    /** Execution time in milliseconds (if ANALYZE was used) */
    executionTime?: number;
    /** Total estimated cost */
    totalCost?: number;
    /** Quick flag: true if any sequential scans detected */
    hasSequentialScans: boolean;
    /** List of indexes used in the plan */
    usedIndexes: string[];
}
/**
 * Result of an EXPLAIN query
 * Provides both normalized structure and raw output
 */
export interface ExplainResult {
    /** Normalized hierarchical plan as operations */
    operations: ExplainOperation[];
    /** Summary statistics */
    summary: ExplainSummary;
    /** Raw EXPLAIN output as text (for display) */
    raw: string;
    /** Original SQL query */
    sql: {
        sql: string;
        params?: unknown[];
    };
}
/**
 * A recommendation from AI analysis of an execution plan
 */
export interface ExplainRecommendation {
    /** Type of recommendation */
    type: 'index' | 'table' | 'cube' | 'general';
    /** Severity/priority of the recommendation */
    severity: 'critical' | 'warning' | 'suggestion';
    /** Short actionable title */
    title: string;
    /** Detailed explanation of why this helps */
    description: string;
    /** Actionable SQL statement (e.g., CREATE INDEX) - for index/table recommendations */
    sql?: string;
    /** TypeScript code snippet to add to cube definition - for cube recommendations */
    cubeCode?: string;
    /** Which cube to modify - for cube recommendations */
    cubeName?: string;
    /** Affected database table */
    table?: string;
    /** Affected columns */
    columns?: string[];
    /** Expected performance improvement */
    estimatedImpact?: string;
}
/**
 * Issue identified in the execution plan
 */
export interface ExplainIssue {
    /** Type of issue */
    type: 'sequential_scan' | 'missing_index' | 'high_cost' | 'sort_operation' | string;
    /** Description of the issue */
    description: string;
    /** Severity level */
    severity: 'high' | 'medium' | 'low';
}
/**
 * AI-generated analysis of an execution plan
 */
export interface AIExplainAnalysis {
    /** One-sentence description of what the query does */
    summary: string;
    /** Overall performance assessment */
    assessment: 'good' | 'warning' | 'critical';
    /** Reason for the assessment */
    assessmentReason: string;
    /** Detailed explanation of the query's purpose and structure */
    queryUnderstanding: string;
    /** Issues identified in the execution plan */
    issues: ExplainIssue[];
    /** Actionable recommendations for improvement */
    recommendations: ExplainRecommendation[];
    /** Metadata from the AI analysis */
    _meta?: {
        model: string;
        usingUserKey: boolean;
    };
}
export type { ChartDataPointClickEvent, DrillOptionType, DrillScope, DrillOption, DrillPathEntry, DrillResult, UseDrillInteractionOptions, DrillInteraction, DrillMenuProps, DrillBreadcrumbProps, } from './types/drill.js';
