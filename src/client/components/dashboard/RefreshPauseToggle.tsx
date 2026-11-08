/**
 * Toolbar toggle that pauses and resumes interval refresh for the whole
 * dashboard. Rendered only when some portlet refreshes on an interval.
 */

import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const PauseIcon = getIcon('pause')
const PlayIcon = getIcon('play')

export default function RefreshPauseToggle({
  isPaused,
  onToggle
}: {
  isPaused: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const label = isPaused ? t('dashboard.refresh.resume') : t('dashboard.refresh.pause')

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isPaused}
      title={label}
      data-testid="dashboard-refresh-pause"
      className="dc:inline-flex dc:items-center dc:px-3 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text-secondary"
    >
      {isPaused ? <PlayIcon className="dc:w-4 dc:h-4 dc:mr-1.5" /> : <PauseIcon className="dc:w-4 dc:h-4 dc:mr-1.5" />}
      {label}
    </button>
  )
}
