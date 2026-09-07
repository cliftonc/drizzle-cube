import { IconifyIcon } from '@iconify/types';
import { ComponentType } from 'react';
import { IconRegistry, IconName, IconCategory, IconProps, PartialIconRegistry } from './types.js';
/**
 * Get the full icon registry
 */
export declare function getIconRegistry(): IconRegistry;
/**
 * Get a specific icon as a React component
 * @param name The icon name from the registry
 * @returns A React component that renders the icon (cached for stable references)
 */
export declare function getIcon(name: IconName): ComponentType<IconProps>;
/**
 * Get icon data directly (for use with Iconify's Icon component)
 * @param name The icon name from the registry
 * @returns The IconifyIcon data
 */
export declare function getIconData(name: IconName): IconifyIcon;
/**
 * Override a single icon in the registry
 * @param name The icon name to override
 * @param icon The new IconifyIcon data
 */
export declare function setIcon(name: IconName, icon: IconifyIcon): void;
/**
 * Register multiple icon overrides at once
 * @param overrides Partial registry with icons to override
 */
export declare function registerIcons(overrides: PartialIconRegistry): void;
/**
 * Reset the registry to default icons
 */
export declare function resetIcons(): void;
/**
 * Get all icons in a specific category
 * @param category The icon category to filter by
 * @returns Record of icon names to their components
 */
export declare function getIconsByCategory(category: IconCategory): Record<string, ComponentType<IconProps>>;
/**
 * Helper to get measure type icon component
 * @param measureType The measure type (count, avg, sum, etc.)
 * @returns React component for the icon
 */
export declare function getMeasureTypeIcon(measureType: string | undefined): ComponentType<IconProps>;
/**
 * Helper to get chart type icon component
 * @param chartType The chart type (bar, line, pie, etc.)
 * @returns React component for the icon
 */
export declare function getChartTypeIcon(chartType: string): ComponentType<IconProps>;
/**
 * Helper to get field type icon component
 * @param fieldType The field type (measure, dimension, timeDimension)
 * @returns React component for the icon
 */
export declare function getFieldTypeIcon(fieldType: string): ComponentType<IconProps>;
