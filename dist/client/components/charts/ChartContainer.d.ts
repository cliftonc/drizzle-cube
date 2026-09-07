import { ReactElement } from 'react';
interface ChartContainerProps {
    children: ReactElement;
    height?: string | number;
    /**
     * Override the default minimum height. Charts that share their portlet with
     * another element - a wrapped summary header, say - need the plot to shrink
     * rather than push past the card.
     */
    minHeight?: string | number;
}
export default function ChartContainer({ children, height, minHeight }: ChartContainerProps): import("react").JSX.Element;
export {};
