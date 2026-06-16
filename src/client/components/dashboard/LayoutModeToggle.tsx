/**
 * Grid / Rows layout-mode toggle used inside the dashboard edit bar.
 */

import type { ReactNode } from 'react'
import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const GridIcon = getIcon('segment')
const RowsIcon = getIcon('table')

interface LayoutModeToggleProps {
  layoutMode: string
  canChangeLayoutMode: boolean
  onLayoutModeChange: (mode: 'grid' | 'rows') => void
}

interface ModeButtonProps {
  active: boolean
  disabled: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}

function ModeButton({ active, disabled, onClick, icon, label }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`dc:inline-flex dc:items-center dc:gap-2 dc:whitespace-nowrap dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors dc:border-b-2 ${
        active
          ? 'bg-dc-accent-bg text-dc-accent border-b-dc-accent'
          : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover border-b-transparent'
      } ${disabled ? 'dc:cursor-not-allowed dc:opacity-50' : ''}`}
    >
      {icon}
      {label}
    </button>
  )
}

export default function LayoutModeToggle({
  layoutMode,
  canChangeLayoutMode,
  onLayoutModeChange
}: LayoutModeToggleProps) {
  const { t } = useTranslation()

  return (
    <div className="dc:inline-flex dc:rounded-md dc:border border-dc-border dc:overflow-hidden dc:whitespace-nowrap">
      <ModeButton
        active={layoutMode === 'grid'}
        disabled={!canChangeLayoutMode}
        onClick={() => onLayoutModeChange('grid')}
        icon={<GridIcon className="dc:w-4 dc:h-4 dc:shrink-0" />}
        label={t('dashboard.grid')}
      />
      <ModeButton
        active={layoutMode === 'rows'}
        disabled={!canChangeLayoutMode}
        onClick={() => onLayoutModeChange('rows')}
        icon={<RowsIcon className="dc:w-4 dc:h-4 dc:shrink-0" />}
        label={t('dashboard.rows')}
      />
    </div>
  )
}
