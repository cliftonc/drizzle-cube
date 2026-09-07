import { ChartAxisConfig, ChartDisplayConfig, ColorPalette } from '../../types.js';
import { DisplayOptionConfig } from '../../charts/chartConfigs.js';
interface DisplayOptionControlProps {
    option: DisplayOptionConfig;
    displayConfig: ChartDisplayConfig;
    colorPalette?: ColorPalette;
    chartConfig?: ChartAxisConfig;
    onDisplayConfigChange: (config: ChartDisplayConfig) => void;
}
export default function DisplayOptionControl({ option, displayConfig, colorPalette, chartConfig, onDisplayConfigChange, }: DisplayOptionControlProps): import("react").JSX.Element | null;
export {};
