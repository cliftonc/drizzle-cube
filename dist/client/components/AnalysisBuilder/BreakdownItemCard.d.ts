import { BreakdownItemCardProps } from './types.js';
/**
 * BreakdownItemCard displays a selected breakdown with:
 * - Field icon (dimension or time dimension)
 * - Field title or full name
 * - Granularity dropdown (for time dimensions)
 * - Sort toggle button (visible on hover, or always visible when sorted)
 * - Remove button (visible on hover)
 * - Drag handle for reordering
 */
declare const BreakdownItemCard: import('react').MemoExoticComponent<({ breakdown, fieldMeta, onRemove, onGranularityChange, onComparisonToggle, comparisonDisabled, sortDirection, sortPriority, onToggleSort, index, isDragging, onDragStart, onDragEnd }: BreakdownItemCardProps) => import("react").JSX.Element>;
export default BreakdownItemCard;
