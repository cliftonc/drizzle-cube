import { CubeMeta, FunnelBindingKey, ChartType, ChartDisplayConfig, Filter } from '../../types.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
import { DateRange, RetentionGranularity, RetentionType, RetentionBreakdownItem } from '../../types/retention.js';
export interface RetentionModeContentProps {
    /** Currently selected cube for retention analysis */
    retentionCube: string | null;
    /** Binding key that links events to entities */
    retentionBindingKey: FunnelBindingKey | null;
    /** Time dimension for event ordering */
    retentionTimeDimension: string | null;
    /** Date range for cohort analysis */
    retentionDateRange: DateRange;
    /** Cohort filters - define who enters the cohort */
    retentionCohortFilters: Filter[];
    /** Activity filters - define what counts as a return */
    retentionActivityFilters: Filter[];
    /** Breakdown dimensions for segmentation */
    retentionBreakdowns: RetentionBreakdownItem[];
    /** Granularity for viewing retention periods */
    retentionViewGranularity: RetentionGranularity;
    /** Number of periods to analyze */
    retentionPeriods: number;
    /** Retention calculation type */
    retentionType: RetentionType;
    /** Cube metadata for field selection */
    schema: CubeMeta | null;
    /** Callback when cube changes */
    onCubeChange: (cube: string | null) => void;
    /** Callback when binding key changes */
    onBindingKeyChange: (key: FunnelBindingKey | null) => void;
    /** Callback when time dimension changes */
    onTimeDimensionChange: (dim: string | null) => void;
    /** Callback when date range changes */
    onDateRangeChange: (range: DateRange) => void;
    /** Callback when cohort filters change */
    onCohortFiltersChange: (filters: Filter[]) => void;
    /** Callback when activity filters change */
    onActivityFiltersChange: (filters: Filter[]) => void;
    /** Callback when breakdowns change (set all) */
    onBreakdownsChange: (breakdowns: RetentionBreakdownItem[]) => void;
    /** Callback to add a breakdown */
    onAddBreakdown: (breakdown: RetentionBreakdownItem) => void;
    /** Callback to remove a breakdown */
    onRemoveBreakdown: (field: string) => void;
    /** Callback when granularity changes */
    onGranularityChange: (granularity: RetentionGranularity) => void;
    /** Callback when periods changes */
    onPeriodsChange: (periods: number) => void;
    /** Callback when retention type changes */
    onRetentionTypeChange: (type: RetentionType) => void;
    /** Callback to open field modal for adding breakdowns */
    onOpenFieldModal?: () => void;
    /** Chart type for retention display */
    chartType?: ChartType;
    /** Callback when chart type changes */
    onChartTypeChange?: (type: ChartType) => void;
    /** Display configuration */
    displayConfig?: ChartDisplayConfig;
    /** Color palette */
    colorPalette?: ColorPalette;
    /** Callback when display config changes */
    onDisplayConfigChange?: (config: ChartDisplayConfig) => void;
}
/**
 * RetentionModeContent displays the complete retention configuration interface:
 * - Tabs: Retention | Display
 * - Retention tab: Config panel + cohort filter + activity filter + breakdown + settings
 * - Display tab: Heatmap/chart display options
 */
declare const RetentionModeContent: import('react').MemoExoticComponent<({ retentionCube, retentionBindingKey, retentionTimeDimension, retentionDateRange, retentionCohortFilters, retentionActivityFilters, retentionBreakdowns, retentionViewGranularity, retentionPeriods, retentionType, schema, onCubeChange, onBindingKeyChange, onTimeDimensionChange, onDateRangeChange, onCohortFiltersChange, onActivityFiltersChange, onBreakdownsChange: _onBreakdownsChange, onAddBreakdown: _onAddBreakdown, onRemoveBreakdown, onGranularityChange, onPeriodsChange, onRetentionTypeChange, onOpenFieldModal, chartType, onChartTypeChange: _onChartTypeChange, displayConfig, colorPalette, onDisplayConfigChange, }: RetentionModeContentProps) => import("react").JSX.Element>;
export default RetentionModeContent;
