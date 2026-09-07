import { default as React } from 'react';
interface AngledXAxisTickProps {
    x?: number;
    y?: number;
    payload?: {
        value: string | number;
    };
    tickFormatter?: (value: string | number, index: number) => string;
    index?: number;
    visibleTicksCount?: number;
    [key: string]: unknown;
}
/**
 * Longest label the angled axis reserves room for; see
 * MAX_ANGLED_AXIS_HEIGHT in chartScaffolding.
 */
export declare const MAX_TICK_LABEL_CHARS = 16;
/**
 * Custom XAxis tick component for properly aligned angled labels.
 * Fixes alignment issues in recharts 3.7+ where angled labels don't
 * center properly under data points.
 */
declare const AngledXAxisTick: React.FC<AngledXAxisTickProps>;
export default AngledXAxisTick;
