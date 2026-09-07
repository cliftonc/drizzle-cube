import { default as React } from 'react';
import { AIExplainAnalysis } from '../../types.js';
interface ExplainAIPanelProps {
    /** AI analysis result */
    analysis: AIExplainAnalysis;
    /** Callback to close the modal */
    onClose?: () => void;
    /** Legacy: Callback to clear/close (backward compatible with old API) */
    onClear?: () => void;
}
/**
 * ExplainAIPanel - Modal component for displaying AI analysis results
 * Shows in a near full-screen modal with scrolling
 */
export declare function ExplainAIPanel({ analysis, onClose, onClear }: ExplainAIPanelProps): React.JSX.Element;
export default ExplainAIPanel;
