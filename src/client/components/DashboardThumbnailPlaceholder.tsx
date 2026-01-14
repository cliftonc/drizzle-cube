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
      className={`flex items-center justify-center bg-dc-bg-secondary ${className}`}
    >
      <div className="text-center">
        <GridIcon
          className="w-8 h-8 mx-auto mb-2 text-dc-text-muted opacity-50"
        />
        <span className="text-xs text-dc-text-muted">No preview</span>
      </div>
    </div>
  )
}

export default DashboardThumbnailPlaceholder
