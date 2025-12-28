/**
 * SectionHeading Component
 *
 * A reusable section heading for the Analysis Builder panels.
 * Provides consistent styling that can be easily adjusted in one place.
 */

import type { ReactNode } from 'react'

interface SectionHeadingProps {
  children: ReactNode
  /** Optional className to add additional styles */
  className?: string
}

/**
 * Consistent section heading style for Analysis Builder panels.
 * Change the styles here to update all section headings at once.
 */
export default function SectionHeading({ children, className = '' }: SectionHeadingProps) {
  return (
    <h3 className={`text-sm font-semibold text-dc-primary uppercase tracking-wide ${className}`}>
      {children}
    </h3>
  )
}
