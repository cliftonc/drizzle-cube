import { FunnelChartData } from '../../types/funnel.js';
import { FunnelDisplayOptions } from './FunnelChart.helpers.js';
interface FunnelViewProps {
    funnelData: FunnelChartData[];
    firstStepValue: number;
    paletteColors: string[];
    options: FunnelDisplayOptions;
    height: string | number;
}
/** Recharts trapezoid funnel style. */
export declare function FunnelShapeView({ funnelData, firstStepValue, paletteColors, options, height }: FunnelViewProps): import("react").JSX.Element;
/** Vertical bars (steps laid out horizontally, bars grow bottom-to-top). */
export declare function FunnelVerticalView({ funnelData, firstStepValue, paletteColors, options, height }: FunnelViewProps): import("react").JSX.Element;
/** Horizontal bars (default - steps stacked vertically, bars grow left-to-right). */
export declare function FunnelHorizontalView({ funnelData, firstStepValue, paletteColors, options, height }: FunnelViewProps): import("react").JSX.Element;
export {};
