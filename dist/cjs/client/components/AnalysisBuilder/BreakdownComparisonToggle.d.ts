/**
 * BreakdownComparisonToggle Component
 *
 * "vs prior" period-comparison toggle for time-dimension breakdowns.
 * Extracted from BreakdownItemCard to keep its render body flat.
 */
interface BreakdownComparisonToggleProps {
    enableComparison?: boolean;
    comparisonDisabled?: boolean;
    onComparisonToggle: () => void;
}
declare const BreakdownComparisonToggle: import('react').MemoExoticComponent<({ enableComparison, comparisonDisabled, onComparisonToggle }: BreakdownComparisonToggleProps) => import("react").JSX.Element>;
export default BreakdownComparisonToggle;
