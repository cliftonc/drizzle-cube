import { default as React } from 'react';
import { AnalysisResultsPanelProps } from './types.js';
/**
 * AnalysisResultsPanel displays query results with chart/table toggle.
 *
 * Features:
 * - Chart visualization with LazyChart
 * - Table view with DataTable
 * - Loading, error, and empty states
 * - Stale results indicator
 * - Display limit control for tables
 */
declare const AnalysisResultsPanel: React.MemoExoticComponent<({ executionStatus, executionResults, executionError, totalRowCount, resultsStale, chartType, chartConfig, displayConfig, colorPalette, currentPaletteName, onColorPaletteChange, allQueries, funnelExecutedQueries, activeView, onActiveViewChange, displayLimit, onDisplayLimitChange, chartAvailability, debugDataPerQuery, onShareClick, canShare, shareButtonState, onRefreshClick, canRefresh, isRefreshing, needsRefresh, onClearClick, canClear, enableAI, isAIOpen, onAIToggle, queryCount, perQueryResults, activeTableIndex, onActiveTableChange, analysisType, isFunnelMode: isFunnelModeProp, funnelServerQuery, funnelDebugData, flowServerQuery, flowDebugData, retentionServerQuery, retentionDebugData, retentionChartData, retentionValidation, warnings, highlightedFields, onSchemaFieldClick }: AnalysisResultsPanelProps) => React.JSX.Element>;
export default AnalysisResultsPanel;
