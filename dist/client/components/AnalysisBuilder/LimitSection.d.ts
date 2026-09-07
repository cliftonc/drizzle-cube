/**
 * LimitSection Component
 *
 * Row limit section for the AnalysisBuilder query panel.
 * Provides preset pills (5, 10, 25, ...) plus a custom input option.
 */
interface LimitSectionProps {
    /** Current limit value */
    limit?: number;
    /** Callback when limit changes */
    onLimitChange: (limit: number | undefined) => void;
}
export default function LimitSection({ limit, onLimitChange }: LimitSectionProps): import("react").JSX.Element;
export {};
