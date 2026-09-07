import { default as React } from 'react';
import { CubeMeta, FunnelBindingKey } from '../../types.js';
export interface FunnelBindingKeySelectorProps {
    /** Current binding key value */
    bindingKey: FunnelBindingKey | null;
    /** Callback when binding key changes */
    onChange: (bindingKey: FunnelBindingKey | null) => void;
    /** Cube metadata for available dimensions */
    schema: CubeMeta | null;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Optional class name */
    className?: string;
}
/**
 * FunnelBindingKeySelector allows users to select a dimension that links
 * funnel steps together. It shows available dimensions from all cubes
 * and supports search filtering.
 */
declare const FunnelBindingKeySelector: React.MemoExoticComponent<({ bindingKey, onChange, schema, disabled, className, }: FunnelBindingKeySelectorProps) => React.JSX.Element>;
export default FunnelBindingKeySelector;
