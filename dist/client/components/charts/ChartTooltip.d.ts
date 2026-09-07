import { default as React } from 'react';
interface ChartTooltipProps {
    formatter?: (value: any, name: any, props: any) => [React.ReactText, React.ReactText];
    labelFormatter?: (label: any, payload?: readonly any[]) => React.ReactText;
}
export default function ChartTooltip({ formatter, labelFormatter }: ChartTooltipProps): React.JSX.Element;
export {};
