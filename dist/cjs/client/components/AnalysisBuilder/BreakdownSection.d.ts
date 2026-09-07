import { BreakdownSectionProps } from './types.js';
/**
 * BreakdownSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected breakdowns (using BreakdownItemCard)
 * - Drag/drop reordering support
 */
declare const BreakdownSection: import('react').MemoExoticComponent<({ breakdowns, schema, onAdd, onRemove, onGranularityChange, onComparisonToggle, order, onOrderChange, onReorder }: BreakdownSectionProps) => import("react").JSX.Element>;
export default BreakdownSection;
