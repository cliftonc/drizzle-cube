import { CSSProperties } from 'react';
import { ChartType, ChartDisplayConfig } from '../../types.js';
/**
 * How much chrome a card draws. Group children are frameless and headerless;
 * section children are frameless but otherwise behave like standalone cards,
 * because the section card around them supplies the only frame.
 */
export type PortletCardVariant = 'standalone' | 'groupChild' | 'sectionChild';
export interface PortletDisplayModes {
    isMarkdownAutoHeight: boolean;
    isTransparentContent: boolean;
    isTransparent: boolean;
    shouldHideHeader: boolean;
}
/**
 * Resolve the markdown / transparency / header-visibility display modes for a
 * portlet from its chart type and display config. Extracted to keep the card
 * component flat.
 */
export declare function resolveDisplayModes(params: {
    renderChartType: ChartType;
    renderDisplayConfig?: ChartDisplayConfig;
    layoutMode: string;
    isEditMode: boolean;
    portletTitle?: string;
    variant?: PortletCardVariant;
}): PortletDisplayModes;
export declare function buildContainerClassName(params: {
    isTransparent: boolean;
    isMarkdownAutoHeight: boolean;
    isInSelectionMode: boolean;
    extraClassName?: string;
    variant?: PortletCardVariant;
}): string;
export declare function buildHeaderClassName(isEditMode: boolean, extraClassName?: string, variant?: PortletCardVariant): string;
export declare function buildContainerStyle(params: {
    isTransparent: boolean;
    isInSelectionMode: boolean;
    hasSelectedFilter: boolean;
    containerStyle?: CSSProperties;
    variant?: PortletCardVariant;
}): CSSProperties;
