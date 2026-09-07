import { IconifyIcon } from '@iconify/types';
import { ComponentType, CSSProperties } from 'react';
/**
 * Icon categories for organization and filtering
 */
export type IconCategory = 'action' | 'field' | 'chart' | 'measure' | 'state' | 'navigation';
/**
 * Standard icon component props
 */
export interface IconProps {
    className?: string;
    'aria-hidden'?: boolean;
    style?: CSSProperties;
}
/**
 * Icon component type that can be used in JSX
 */
export type IconComponent = ComponentType<IconProps>;
/**
 * Icon definition with Iconify data and metadata
 */
export interface IconDefinition {
    /** The Iconify icon data */
    icon: IconifyIcon;
    /** Category for filtering/organization */
    category: IconCategory;
    /** Optional description */
    description?: string;
}
/**
 * Complete icon registry with all available icons
 */
export interface IconRegistry {
    close: IconDefinition;
    add: IconDefinition;
    edit: IconDefinition;
    delete: IconDefinition;
    refresh: IconDefinition;
    copy: IconDefinition;
    duplicate: IconDefinition;
    settings: IconDefinition;
    filter: IconDefinition;
    share: IconDefinition;
    expand: IconDefinition;
    collapse: IconDefinition;
    search: IconDefinition;
    menu: IconDefinition;
    run: IconDefinition;
    check: IconDefinition;
    link: IconDefinition;
    eye: IconDefinition;
    eyeOff: IconDefinition;
    adjustments: IconDefinition;
    desktop: IconDefinition;
    table: IconDefinition;
    sun: IconDefinition;
    moon: IconDefinition;
    ellipsisHorizontal: IconDefinition;
    documentText: IconDefinition;
    bookOpen: IconDefinition;
    codeBracket: IconDefinition;
    swatch: IconDefinition;
    camera: IconDefinition;
    thumbUp: IconDefinition;
    thumbDown: IconDefinition;
    schemaGraph: IconDefinition;
    cube: IconDefinition;
    download: IconDefinition;
    measure: IconDefinition;
    dimension: IconDefinition;
    timeDimension: IconDefinition;
    segment: IconDefinition;
    chartBar: IconDefinition;
    chartLine: IconDefinition;
    chartArea: IconDefinition;
    chartPie: IconDefinition;
    chartScatter: IconDefinition;
    chartBubble: IconDefinition;
    chartRadar: IconDefinition;
    chartRadialBar: IconDefinition;
    chartTreemap: IconDefinition;
    chartTable: IconDefinition;
    chartRecordsTable: IconDefinition;
    chartActivityGrid: IconDefinition;
    chartKpiNumber: IconDefinition;
    chartKpiDelta: IconDefinition;
    chartKpiText: IconDefinition;
    chartMarkdown: IconDefinition;
    chartFunnel: IconDefinition;
    chartSankey: IconDefinition;
    chartSunburst: IconDefinition;
    chartHeatmap: IconDefinition;
    chartRetention: IconDefinition;
    chartBoxPlot: IconDefinition;
    chartDotStrip: IconDefinition;
    chartWaterfall: IconDefinition;
    chartCandlestick: IconDefinition;
    chartMeasureProfile: IconDefinition;
    chartProportionBar: IconDefinition;
    chartGauge: IconDefinition;
    measureCount: IconDefinition;
    measureCountDistinct: IconDefinition;
    measureCountDistinctApprox: IconDefinition;
    measureSum: IconDefinition;
    measureAvg: IconDefinition;
    measureMin: IconDefinition;
    measureMax: IconDefinition;
    measureRunningTotal: IconDefinition;
    measureCalculated: IconDefinition;
    measureNumber: IconDefinition;
    success: IconDefinition;
    warning: IconDefinition;
    error: IconDefinition;
    info: IconDefinition;
    loading: IconDefinition;
    sparkles: IconDefinition;
    chevronUp: IconDefinition;
    chevronDown: IconDefinition;
    chevronLeft: IconDefinition;
    chevronRight: IconDefinition;
    chevronUpDown: IconDefinition;
    arrowUp: IconDefinition;
    arrowDown: IconDefinition;
    arrowRight: IconDefinition;
    arrowPath: IconDefinition;
}
/**
 * Type for icon registry keys
 */
export type IconName = keyof IconRegistry;
/**
 * Partial icon registry for user overrides
 * Users can provide just the IconifyIcon or a full IconDefinition
 */
export type PartialIconRegistry = Partial<{
    [K in keyof IconRegistry]: IconifyIcon | Partial<IconDefinition>;
}>;
