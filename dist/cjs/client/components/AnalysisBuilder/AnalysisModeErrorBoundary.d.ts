import { default as React, Component, ReactNode } from 'react';
import { AnalysisType } from '../../types.js';
interface Props {
    children: ReactNode;
    /** Current analysis type (for error messages) */
    analysisType: AnalysisType;
    /** Callback to switch to a safe mode (query) on error */
    onSwitchToSafeMode?: () => void;
}
interface State {
    hasError: boolean;
    error: Error | null;
}
/**
 * Error boundary for mode switching in AnalysisBuilder.
 * If an adapter throws during load/validate/save, this catches it
 * and offers to switch back to query mode.
 */
export declare class AnalysisModeErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    handleReset: () => void;
    handleSwitchToSafeMode: () => void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
export default AnalysisModeErrorBoundary;
