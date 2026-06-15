/**
 * Chip shown in filter-selection mode indicating which field a selected filter
 * targets on this portlet. Click opens the filter config modal.
 */

import { type CSSProperties, type ComponentType } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import type { EffectiveFilterField } from './filterField'

interface FilterFieldChipProps {
  field: EffectiveFilterField
  FilterIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  onOpenFilterConfig: () => void
}

export default function FilterFieldChip({ field, FilterIcon, onOpenFilterConfig }: FilterFieldChipProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        onOpenFilterConfig()
      }}
      onTouchEnd={(event) => {
        event.stopPropagation()
        event.preventDefault()
        onOpenFilterConfig()
      }}
      title={t('dashboard.filterFieldChipHint')}
      className="dc:absolute dc:bottom-2 dc:left-1/2 dc:-translate-x-1/2 dc:z-10 dc:flex dc:items-center dc:gap-1 dc:px-2.5 dc:py-1 dc:text-xs dc:font-medium dc:rounded-full dc:border dc:cursor-pointer dc:transition-colors dc:max-w-[90%] dc:truncate"
      style={{
        backgroundColor: field.isOverride ? 'var(--dc-primary)' : 'var(--dc-surface)',
        color: field.isOverride ? 'white' : 'var(--dc-text-secondary)',
        borderColor: 'var(--dc-primary)',
        boxShadow: 'var(--dc-shadow-sm)'
      }}
    >
      <FilterIcon style={{ width: '12px', height: '12px' }} />
      <span className="dc:truncate">{field.field}</span>
    </button>
  )
}
