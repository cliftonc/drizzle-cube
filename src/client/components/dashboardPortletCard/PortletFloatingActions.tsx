/**
 * Hover-revealed action strip for a portlet inside a group.
 *
 * Grouped children render without a header bar so a KPI row reads as one unit,
 * so their edit affordances live here instead: a drag grip plus the same
 * buttons the header shows, revealed on hover of the child.
 *
 * Positioned inside the child's bounds on purpose - `.dc-row-layout-row` is
 * `overflow: hidden`, so anything escaping the child would be clipped.
 */

import React, { type CSSProperties } from 'react'
import type { PortletConfig } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import EditActionButtons, { ICON_STYLE, type CardIcons } from './EditActionButtons.js'
import { getIcon } from '../../icons/registry.js'

interface PortletFloatingActionsProps {
  portlet: PortletConfig
  icons: CardIcons
  /** Show the edit-only actions (drag, filter config, duplicate, edit, delete). */
  showEditActions: boolean
  copyAvailable: boolean
  copySuccess: boolean
  xlsExportAvailable: boolean
  exportInProgress: boolean
  onRefresh: (options?: { bustCache?: boolean }) => void
  onCopyToClipboard: (event: React.MouseEvent | React.TouchEvent) => void
  onExportXlsx: (event: React.MouseEvent | React.TouchEvent) => void
  onOpenFilterConfig: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
}

const GRIP_STYLE: CSSProperties = { width: '14px', height: '14px', color: 'currentColor' }

function DragGrip() {
  return (
    <svg style={GRIP_STYLE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

export default function PortletFloatingActions({
  portlet,
  icons,
  showEditActions,
  copyAvailable,
  copySuccess,
  xlsExportAvailable,
  exportInProgress,
  onRefresh,
  onCopyToClipboard,
  onExportXlsx,
  onOpenFilterConfig,
  onDuplicate,
  onEdit,
  onDelete
}: PortletFloatingActionsProps) {
  const { t } = useTranslation()
  const CameraIcon = getIcon('camera')
  const CheckIcon = getIcon('check')
  const DownloadIcon = getIcon('download')

  const stopRefresh = (event: React.MouseEvent) => {
    event.stopPropagation()
    onRefresh({ bustCache: event.shiftKey })
  }

  return (
    <div
      className="dc-portlet-floating-actions dc:flex dc:items-center dc:gap-0.5 dc:px-1 dc:py-0.5 dc:rounded-sm dc:border border-dc-border bg-dc-surface dc:opacity-0 dc:transition-opacity"
      style={{ boxShadow: 'var(--dc-shadow-sm)' }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* The grip deliberately has no mousedown handler: the child wrapper is
          the draggable element, and suppressing mousedown here would cancel the
          native dragstart and leave a grip that looks draggable but does nothing. */}
      {showEditActions && (
        <span
          className="dc-portlet-drag-grip dc:p-1 text-dc-text-muted dc:cursor-move"
          title={t('dashboard.portlet.action.drag')}
        >
          <DragGrip />
        </span>
      )}
      <div
        className="dc:flex dc:items-center dc:gap-0.5"
        // Buttons only: stop mousedown so clicking one never starts a drag.
        onMouseDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <button
          draggable={false}
          onClick={stopRefresh}
          className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
          title={t('dashboard.portlet.action.refresh')}
        >
          <icons.RefreshIcon style={ICON_STYLE} />
        </button>
        {/* Grouped children have no header, so the view-mode actions a
            standalone portlet shows there live here too. */}
        {copyAvailable && (
          <button
            draggable={false}
            onClick={onCopyToClipboard}
            className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
            title={copySuccess ? t('portlet.copied') : t('portlet.copyToClipboard')}
          >
            {copySuccess ? <CheckIcon style={ICON_STYLE} /> : <CameraIcon style={ICON_STYLE} />}
          </button>
        )}
        {xlsExportAvailable && (
          <button
            draggable={false}
            onClick={onExportXlsx}
            disabled={exportInProgress}
            className={`dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${
              exportInProgress
                ? 'dc:opacity-50 dc:cursor-wait text-dc-text-secondary'
                : 'text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover'
            }`}
            title={exportInProgress ? t('portlet.exporting') : t('portlet.downloadXlsx')}
          >
            <DownloadIcon style={ICON_STYLE} />
          </button>
        )}
        {showEditActions && (
          <EditActionButtons
            portlet={portlet}
            icons={icons}
            onOpenFilterConfig={onOpenFilterConfig}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  )
}
