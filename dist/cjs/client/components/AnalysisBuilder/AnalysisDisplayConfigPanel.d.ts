import { ChartAxisConfig, ChartType, ChartDisplayConfig, ColorPalette } from '../../types.js';
interface AnalysisDisplayConfigPanelProps {
    chartType: ChartType;
    displayConfig: ChartDisplayConfig;
    colorPalette?: ColorPalette;
    /** Passed to options that are keyed by field, such as the records table's column formats. */
    chartConfig?: ChartAxisConfig;
    onDisplayConfigChange: (config: ChartDisplayConfig) => void;
    /** Keys to exclude from displayOptionsConfig rendering (e.g., ['content'] when content is managed elsewhere) */
    excludeKeys?: string[];
}
export default function AnalysisDisplayConfigPanel({ chartType, displayConfig, colorPalette, chartConfig, onDisplayConfigChange, excludeKeys, }: AnalysisDisplayConfigPanelProps): import("react").JSX.Element;
export {};
