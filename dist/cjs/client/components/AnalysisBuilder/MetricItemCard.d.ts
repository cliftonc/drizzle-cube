import { MetricItemCardProps } from './types.js';
/**
 * MetricItemCard displays a selected metric with:
 * - Field icon based on measure type
 * - Field title or full name
 * - Sort toggle button (visible on hover, or always visible when sorted)
 * - Remove button (visible on hover)
 * - Drag handle for reordering
 */
declare const MetricItemCard: import('react').MemoExoticComponent<({ metric, fieldMeta, onRemove, sortDirection, sortPriority, onToggleSort, index, isDragging, onDragStart, onDragEnd }: MetricItemCardProps) => import("react").JSX.Element>;
export default MetricItemCard;
