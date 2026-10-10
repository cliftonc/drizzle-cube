/**
 * Edit-mode action buttons for a portlet: filter config, duplicate, edit, delete.
 *
 * Shared by the standard card header and by the floating overlay that grouped
 * children use instead of a header, so both stay in step.
 */

import React, { type CSSProperties, type ComponentType } from 'react'
import type { PortletConfig } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

export const ICON_STYLE: CSSProperties = { width: '16px', height: '16px', color: 'currentColor' }

export interface CardIcons {
  RefreshIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  EditIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  DeleteIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  CopyIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  FilterIcon: ComponentType<{ className?: string; style?: CSSProperties }>
}

export interface EditActionButtonsProps {
  portlet: PortletConfig
  icons: CardIcons
  onOpenFilterConfig: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
}

const BUTTON_CLASS =
  'dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors'

export default function EditActionButtons({
  portlet,
  icons,
  onOpenFilterConfig,
  onDuplicate,
  onEdit,
  onDelete
}: EditActionButtonsProps) {
  const { t } = useTranslation()
  const mappingCount = portlet.dashboardFilterMapping?.length ?? 0

  const stop = (handler: () => void) => (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    if ('preventDefault' in event && event.type === 'touchend') event.preventDefault()
    handler()
  }

  return (
    <>
      <button
        draggable={false}
        onClick={stop(onOpenFilterConfig)}
        onTouchEnd={stop(onOpenFilterConfig)}
        className={`${BUTTON_CLASS} dc:relative`}
        title={
          mappingCount > 0
            ? t('dashboard.portlet.action.filterConfigActive', { count: String(mappingCount) })
            : t('dashboard.portlet.action.filterConfig')
        }
        style={{ color: mappingCount > 0 ? 'var(--dc-primary)' : 'var(--dc-text-secondary)' }}
      >
        <icons.FilterIcon style={ICON_STYLE} />
      </button>

      <button
        draggable={false}
        onClick={stop(onDuplicate)}
        onTouchEnd={stop(onDuplicate)}
        className={`${BUTTON_CLASS} text-dc-text-secondary`}
        title={t('dashboard.portlet.action.duplicate')}
      >
        <icons.CopyIcon style={ICON_STYLE} />
      </button>
      <button
        draggable={false}
        onClick={stop(onEdit)}
        onTouchEnd={stop(onEdit)}
        className={`${BUTTON_CLASS} text-dc-text-secondary`}
        title={t('dashboard.portlet.action.edit')}
      >
        <icons.EditIcon style={ICON_STYLE} />
      </button>
      <button
        draggable={false}
        onClick={stop(onDelete)}
        onTouchEnd={stop(onDelete)}
        className="dc:p-1 dc:mr-0.5 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-danger-bg text-dc-danger dc:transition-colors"
        title={t('dashboard.portlet.action.delete')}
      >
        <icons.DeleteIcon style={ICON_STYLE} />
      </button>
    </>
  )
}
