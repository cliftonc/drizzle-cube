interface ChartLegendProps {
    onMouseEnter?: (o: any, i: any) => void;
    onMouseLeave?: () => void;
    showLegend?: boolean;
}
export default function ChartLegend({ onMouseEnter, onMouseLeave, showLegend }: ChartLegendProps): import("react").JSX.Element | null;
export {};
