import { default as React } from 'react';
import { CubeMeta, FunnelBindingKey } from '../../types.js';
import { DateRange } from '../../types/retention.js';
export interface RetentionConfigPanelProps {
    /** Currently selected cube */
    selectedCube: string | null;
    /** Binding key that identifies entities */
    bindingKey: FunnelBindingKey | null;
    /** Timestamp dimension for the analysis */
    timeDimension: string | null;
    /** Date range for cohort analysis (for collapsed summary display) */
    dateRange: DateRange;
    /** Cube metadata for field selection */
    schema: CubeMeta | null;
    /** Callback when cube changes */
    onCubeChange: (cube: string | null) => void;
    /** Callback when binding key changes */
    onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void;
    /** Callback when timestamp dimension changes */
    onTimeDimensionChange: (dimension: string | null) => void;
}
/**
 * Date range selector component
 * Exported for use in RetentionModeContent
 */
export interface DateRangeSelectorProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
}
export declare const DateRangeSelector: React.MemoExoticComponent<({ dateRange, onDateRangeChange, }: DateRangeSelectorProps) => React.JSX.Element>;
/**
 * RetentionConfigPanel displays selectors for cube, binding key, time dimension,
 * and date range in a collapsible section.
 */
declare const RetentionConfigPanel: React.MemoExoticComponent<({ selectedCube, bindingKey, timeDimension, dateRange, schema, onCubeChange, onBindingKeyChange, onTimeDimensionChange, }: RetentionConfigPanelProps) => React.JSX.Element>;
export default RetentionConfigPanel;
