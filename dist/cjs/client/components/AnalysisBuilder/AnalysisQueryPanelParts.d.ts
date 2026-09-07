import { default as React } from 'react';
import { AnalysisQueryPanelProps, BreakdownItem } from './types.js';
import { MetaField } from '../../shared/types.js';
import { QueryMergeStrategy } from '../../types.js';
type Props = AnalysisQueryPanelProps;
/** True when the funnel mode UI has all the callbacks it needs to render. */
export declare function canRenderFunnelMode(p: Props): boolean;
/** True when the flow mode UI has all the callbacks/state it needs to render. */
export declare function canRenderFlowMode(p: Props): boolean;
/**
 * Whether a dedicated mode (funnel/flow/retention) replaces the standard layout.
 */
export declare function shouldRenderModeContent(p: Props): boolean;
/**
 * Renders the dedicated mode UI (funnel / flow / retention) when one of those
 * analysis types is active and all the required callbacks are present. Returns
 * null when the standard query/chart/display layout should be used instead.
 */
export declare function AnalysisModeContent(props: Props): React.JSX.Element | null;
interface TabBarProps {
    activeTab: Props['activeTab'];
    onActiveTabChange: Props['onActiveTabChange'];
    isMultiQuery: boolean;
    queryCount: number;
    activeQueryIndex: number;
    onAddQuery?: Props['onAddQuery'];
    getQueryTabLabel: (index: number) => string;
    handleQueryTabClick: (index: number) => void;
    handleRemoveQuery: (e: React.MouseEvent, index: number) => void;
}
export declare function QueryPanelTabBar(props: TabBarProps): React.JSX.Element;
export declare function MergeStrategyControls({ mergeStrategy, onMergeStrategyChange, isFunnelMode, funnelBindingKey, onFunnelBindingKeyChange, schema, }: {
    mergeStrategy: QueryMergeStrategy;
    onMergeStrategyChange?: Props['onMergeStrategyChange'];
    isFunnelMode: boolean;
    funnelBindingKey?: Props['funnelBindingKey'];
    onFunnelBindingKeyChange?: Props['onFunnelBindingKeyChange'];
    schema: Props['schema'];
}): React.JSX.Element;
export declare function AdapterValidationBanner({ adapterValidation, }: {
    adapterValidation: NonNullable<Props['adapterValidation']>;
}): React.JSX.Element;
export declare function MultiQueryValidationBanner({ multiQueryValidation, }: {
    multiQueryValidation: NonNullable<Props['multiQueryValidation']>;
}): React.JSX.Element;
interface TabContentProps extends Props {
    isMultiQuery: boolean;
    getFieldMeta: (breakdown: BreakdownItem) => MetaField | null;
    comparisonEnabledBreakdown: BreakdownItem | undefined;
}
/**
 * Renders the active tab's body (query sections / chart config / display config)
 * for the standard (non-mode) layout.
 */
export declare function QueryPanelTabContent(props: TabContentProps): React.JSX.Element | null;
export declare function LockedBreakdownList({ breakdowns, getFieldMeta, comparisonEnabledBreakdown, onBreakdownGranularityChange, onBreakdownComparisonToggle, onMergeStrategyChange, }: {
    breakdowns: BreakdownItem[];
    getFieldMeta: (breakdown: BreakdownItem) => MetaField | null;
    comparisonEnabledBreakdown: BreakdownItem | undefined;
    onBreakdownGranularityChange: Props['onBreakdownGranularityChange'];
    onBreakdownComparisonToggle?: Props['onBreakdownComparisonToggle'];
    onMergeStrategyChange?: Props['onMergeStrategyChange'];
}): React.JSX.Element;
export {};
