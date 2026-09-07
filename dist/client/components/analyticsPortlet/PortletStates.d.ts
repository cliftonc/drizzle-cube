import { ReactNode, Ref } from 'react';
import { ChartType } from '../../types.js';
import { DrillPathEntry } from '../../types/drill.js';
type Height = string | number;
export declare function PortletConfigRequired({ inViewRef, height }: {
    inViewRef: Ref<HTMLDivElement>;
    height: Height;
}): import("react").JSX.Element;
export declare function PortletLazyPlaceholder({ inViewRef, height }: {
    inViewRef: Ref<HTMLDivElement>;
    height: Height;
}): import("react").JSX.Element;
export declare function PortletLoading({ inViewRef, height, loadingComponent }: {
    inViewRef: Ref<HTMLDivElement>;
    height: Height;
    loadingComponent?: ReactNode;
}): import("react").JSX.Element;
interface PortletErrorProps {
    inViewRef: Ref<HTMLDivElement>;
    height: Height;
    error: {
        message?: string;
        toString: () => string;
    };
    onRetry: () => void;
    activeQuery: unknown;
    query: string;
    chartType: ChartType;
    chartConfig: unknown;
    displayConfig: unknown;
}
export declare function PortletError({ inViewRef, height, error, onRetry, activeQuery, query, chartType, chartConfig, displayConfig }: PortletErrorProps): import("react").JSX.Element;
interface PortletNoDataProps {
    inViewRef: Ref<HTMLDivElement>;
    height: Height;
    drillPath: DrillPathEntry[];
    onNavigateBack: () => void;
    onNavigateToLevel: (index: number) => void;
}
export declare function PortletNoData({ inViewRef, height, drillPath, onNavigateBack, onNavigateToLevel }: PortletNoDataProps): import("react").JSX.Element;
export type PortletStateKind = 'config-required' | 'lazy-placeholder' | 'loading' | 'error';
interface PortletStateViewProps {
    kind: PortletStateKind | 'no-data';
    inViewRef: Ref<HTMLDivElement>;
    height: Height;
    loadingComponent?: ReactNode;
    error: {
        message?: string;
        toString: () => string;
    } | null;
    onRetry: () => void;
    activeQuery: unknown;
    query: string;
    chartType: ChartType;
    chartConfig: unknown;
    displayConfig: unknown;
    drillPath: DrillPathEntry[];
    onNavigateBack: () => void;
    onNavigateToLevel: (index: number) => void;
}
/**
 * Renders the appropriate non-chart state view for the given render kind.
 */
export declare function PortletStateView(props: PortletStateViewProps): import("react").JSX.Element;
export {};
