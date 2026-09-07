import { ChartAxisConfig, ColorPalette, ColumnFormatConfig } from '../../types.js';
interface ColumnFormatsEditorProps {
    value: Record<string, ColumnFormatConfig>;
    chartConfig?: ChartAxisConfig;
    colorPalette?: ColorPalette;
    onChange: (value: Record<string, ColumnFormatConfig> | undefined) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}
export default function ColumnFormatsEditor({ value, chartConfig, colorPalette, onChange, t }: ColumnFormatsEditorProps): import("react").JSX.Element;
export {};
