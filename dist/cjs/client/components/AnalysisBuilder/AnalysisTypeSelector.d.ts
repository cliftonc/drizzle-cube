import { default as React } from 'react';
import { AnalysisType, CubeMeta } from '../../types.js';
interface AnalysisTypeSelectorProps {
    /** Currently selected analysis type */
    value: AnalysisType;
    /** Called when analysis type changes */
    onChange: (type: AnalysisType) => void;
    /** Disable the selector */
    disabled?: boolean;
    /** Cube metadata for eventStream detection */
    schema?: CubeMeta | null;
}
/**
 * AnalysisTypeSelector - Horizontal tabs for analysis type selection
 */
declare const AnalysisTypeSelector: React.MemoExoticComponent<({ value, onChange, disabled, schema, }: AnalysisTypeSelectorProps) => React.JSX.Element>;
export default AnalysisTypeSelector;
