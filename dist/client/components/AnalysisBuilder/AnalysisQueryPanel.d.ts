import { default as React } from 'react';
import { AnalysisQueryPanelProps } from './types.js';
/**
 * AnalysisQueryPanel displays the right-side query builder with:
 * - Query/Chart tab switcher (with multi-query support)
 * - Metrics section (measures)
 * - Filter section
 * - Breakdown section (dimensions)
 * - Chart configuration (in Chart tab)
 */
declare const AnalysisQueryPanel: React.MemoExoticComponent<(props: AnalysisQueryPanelProps) => React.JSX.Element>;
export default AnalysisQueryPanel;
