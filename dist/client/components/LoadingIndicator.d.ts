/**
 * LoadingIndicator Component
 *
 * A centralized, theme-aware loading spinner that uses CSS variables
 * for consistent styling across all drizzle-cube components.
 *
 * Can be overridden at the Dashboard or Portlet level by passing a
 * custom loadingComponent prop.
 */
export interface LoadingIndicatorProps {
    /** Size variant: 'xs' (12px), 'sm' (24px), 'md' (32px), 'lg' (48px) */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
}
export default function LoadingIndicator({ size, className }: LoadingIndicatorProps): import("react").JSX.Element;
