/**
 * DashboardThumbnailPlaceholder
 *
 * A placeholder component shown when a dashboard thumbnail doesn't exist
 * but the thumbnail feature is enabled. Displays a simple grid icon
 * with "No preview" text.
 */

import { getIcon } from '../icons'

const GridIcon = getIcon('segment')

export interface DashboardThumbnailPlaceholderProps {
  /** Additional CSS classes */
  className?: string
}

export function DashboardThumbnailPlaceholder({
  className = ''
}: DashboardThumbnailPlaceholderProps) {
  return (
    <div
      className={`dc:flex dc:items-center dc:justify-center bg-dc-bg-secondary ${className}`}
    >
      <div className="text-center">
        <GridIcon
          className="dc:w-8 dc:h-8 dc:mx-auto dc:mb-2 text-dc-text-muted dc:opacity-50"
        />
        <span className="dc:text-xs text-dc-text-muted">No preview</span>
      </div>
    </div>
  )
}

export default DashboardThumbnailPlaceholder
