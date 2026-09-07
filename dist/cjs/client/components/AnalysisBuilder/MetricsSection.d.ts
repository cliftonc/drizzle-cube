import { MetricsSectionProps } from './types.js';
/**
 * MetricsSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected metrics (using MetricItemCard)
 * - Drag/drop reordering support
 */
declare const MetricsSection: import('react').MemoExoticComponent<({ metrics, schema, onAdd, onRemove, order, onOrderChange, onReorder }: MetricsSectionProps) => import("react").JSX.Element>;
export default MetricsSection;
