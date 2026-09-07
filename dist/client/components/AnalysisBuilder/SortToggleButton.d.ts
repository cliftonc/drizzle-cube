/**
 * SortToggleButton Component
 *
 * Shared sort-direction toggle used by MetricItemCard and BreakdownItemCard.
 * Renders the direction icon, optional sort-priority badge, and tooltip.
 */
interface SortToggleButtonProps {
    sortDirection?: 'asc' | 'desc' | null;
    sortPriority?: number;
    onToggleSort: () => void;
}
declare const SortToggleButton: import('react').MemoExoticComponent<({ sortDirection, sortPriority, onToggleSort }: SortToggleButtonProps) => import("react").JSX.Element>;
export default SortToggleButton;
