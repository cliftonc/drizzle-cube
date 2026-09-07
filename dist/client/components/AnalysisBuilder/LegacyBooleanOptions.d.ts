import { ChartDisplayConfig } from '../../types.js';
interface LegacyBooleanOptionsProps {
    displayOptions?: string[];
    displayConfig: ChartDisplayConfig;
    onDisplayConfigChange: (config: ChartDisplayConfig) => void;
}
declare const LegacyBooleanOptions: import('react').MemoExoticComponent<({ displayOptions, displayConfig, onDisplayConfigChange }: LegacyBooleanOptionsProps) => import("react").JSX.Element | null>;
export default LegacyBooleanOptions;
