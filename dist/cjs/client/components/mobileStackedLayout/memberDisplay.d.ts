import { ChartAxisConfig, ChartDisplayConfig, ChartType, PortletConfig } from '../../types.js';
export interface MobilePortletDisplay {
    query: string;
    chartType: ChartType;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    isTransparent: boolean;
    isAutoHeight: boolean;
    shouldHideHeader: boolean;
    /** Outer height in px; `isAutoHeight` callers ignore it. */
    height: number;
    /** Height available to the chart once header and padding are removed. */
    contentHeight: number;
}
export declare function resolveMobilePortletDisplay(params: {
    portlet: PortletConfig;
    /** False for a portlet inside a group card, which supplies its own frame. */
    framed: boolean;
    /** How many portlets share the group card, so its height can be shared out. */
    memberCount: number;
}): MobilePortletDisplay;
