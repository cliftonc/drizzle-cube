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
  sm: 'dc:h-6 dc:w-6',
  md: 'dc:h-8 dc:w-8',
  lg: 'dc:h-12 dc:w-12'
}

export default function LoadingIndicator({
  size = 'md',
  className = ''
}: LoadingIndicatorProps) {
  return (
    <div
      className={`dc:animate-spin dc:rounded-full dc:border-b-2 ${sizeClasses[size]} ${className}`}
      style={{ borderBottomColor: 'var(--dc-primary)' }}
      role="status"
      aria-label="Loading"
    />
  )
}
