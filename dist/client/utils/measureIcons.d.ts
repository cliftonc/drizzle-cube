import { default as React } from 'react';
/**
 * Get the appropriate icon component for a given measure type
 * All icons use amber coloring for consistency
 */
export declare function getMeasureIcon(measureType: string | undefined, className?: string): React.ReactElement;
/**
 * Get all available measure type icons
 * Useful for documentation or UI that shows all measure types
 */
export declare function getAllMeasureIcons(): Record<string, React.ReactElement>;
