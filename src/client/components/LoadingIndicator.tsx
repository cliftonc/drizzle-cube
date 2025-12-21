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
  /** Size variant: 'sm' (24px), 'md' (32px), 'lg' (48px) */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export default function LoadingIndicator({
  size = 'md',
  className = ''
}: LoadingIndicatorProps) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${className}`}
      style={{ borderBottomColor: 'var(--dc-primary)' }}
      role="status"
      aria-label="Loading"
    />
  )
}
