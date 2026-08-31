/**
 * A "combination portlet": several portlets snapped together and rendered
 * inside one card, so a row of KPIs reads as a single unit instead of four
 * boxes with four headers.
 *
 * Layout only - the child portlets live flat in `DashboardConfig.portlets` and
 * are referenced here by id. Depth is capped at two: `cells` run along the
 * group's `direction`, and each cell stacks its portlets on the other axis.
 */

import {
  useCallback,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode
} from 'react'
import type { PortletConfig, PortletGroup } from '../types.js'
import { getIcon } from '../icons/index.js'
import { useTranslation } from '../hooks/useTranslation.js'

function DragGrip() {
  return (
    <svg
      style={{ width: '14px', height: '14px', color: 'currentColor' }}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

const EditIcon = getIcon('edit')
const DeleteIcon = getIcon('delete')
const UngroupIcon = getIcon('segment')

export interface PortletGroupCardProps {
  group: PortletGroup
  portlets: Map<string, PortletConfig>
  canEdit: boolean
  /** Renders one child portlet with group chrome (no border, no header). */
  renderChild: (portlet: PortletConfig, wrapperProps: HTMLAttributes<HTMLDivElement>) => ReactNode
  onRename: (groupId: string, title: string) => void
  onUngroup: (groupId: string) => void
  onDelete: (groupId: string) => void
  /** Fired when a child starts being dragged out of, or around within, the group. */
  onChildDragStart: (groupId: string, portletId: string, event: DragEvent<HTMLDivElement>) => void
  onChildDragEnd: () => void
  /** Snap bands rendered inside each child; supplied by the row layout. */
  renderSnapBands?: (portletId: string) => ReactNode
  /** Set inside a section card, which draws the only frame for the whole band. */
  frameless?: boolean
}

export default function PortletGroupCard({
  group,
  portlets,
  canEdit,
  renderChild,
  onRename,
  onUngroup,
  onDelete,
  onChildDragStart,
  onChildDragEnd,
  renderSnapBands,
  frameless = false
}: PortletGroupCardProps) {
  const { t } = useTranslation()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(group.title ?? '')

  const horizontal = group.direction === 'row'
  const hasTitle = Boolean(group.title && group.title.trim())

  const commitTitle = useCallback(() => {
    setIsEditingTitle(false)
    if (titleDraft !== (group.title ?? '')) onRename(group.id, titleDraft)
  }, [group.id, group.title, onRename, titleDraft])

  const startTitleEdit = useCallback(() => {
    setTitleDraft(group.title ?? '')
    setIsEditingTitle(true)
  }, [group.title])

  // Pinned top-left so it never collides with the children's own top-right
  // hover strips. Always visible in edit mode rather than hover-revealed: a
  // hover-gated control that sits on top of a child is fiddly to reach.
  const buttons = canEdit ? (
    <div
      className="dc-portlet-group-toolbar dc:flex dc:items-center dc:gap-0.5 dc:shrink-0"
      // Buttons only: stop mousedown so clicking one never starts a drag.
      onMouseDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        draggable={false}
        onClick={startTitleEdit}
        className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
        title={t('dashboard.group.rename')}
      >
        <EditIcon style={{ width: '14px', height: '14px', color: 'currentColor' }} />
      </button>
      <button
        draggable={false}
        onClick={() => onUngroup(group.id)}
        className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
        title={t('dashboard.group.ungroup')}
      >
        <UngroupIcon style={{ width: '14px', height: '14px', color: 'currentColor' }} />
      </button>
      <button
        draggable={false}
        onClick={() => onDelete(group.id)}
        className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-danger dc:cursor-pointer hover:bg-dc-danger-bg dc:transition-colors"
        title={t('dashboard.group.delete')}
      >
        <DeleteIcon style={{ width: '14px', height: '14px', color: 'currentColor' }} />
      </button>
    </div>
  ) : null

  const grip = canEdit ? (
    // Affordance only. The row's column wrapper is the drag source and dragstart
    // bubbles to it from here - traced with a real mouse, it fires on every
    // attempt. The one rule to preserve is no preventDefault on mousedown, which
    // cancels the drag outright; that is why the grip sits outside the button
    // container below rather than inside it.
    <span
      className="dc-portlet-group-drag-grip dc:inline-flex dc:items-center dc:p-1 text-dc-text-muted dc:cursor-move dc:shrink-0"
      title={t('dashboard.group.drag')}
    >
      <DragGrip />
    </span>
  ) : null

  return (
    <div
      className={`dc-portlet-group${frameless ? ' dc-portlet-group-frameless' : ' bg-dc-surface dc:border border-dc-border dc:rounded-lg'} dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:relative`}
      style={{ boxShadow: frameless ? 'none' : 'var(--dc-shadow-sm)' }}
      data-group-id={group.id}
    >
      {(hasTitle || isEditingTitle) && (
        <div className="dc-portlet-group-title portlet-drag-handle dc:flex dc:items-center dc:justify-between dc:gap-2 dc:px-2 dc:py-1 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg">
          <div className="dc:flex dc:items-center dc:gap-1 dc:min-w-0 dc:flex-1">
            {grip}
            {isEditingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitTitle()
                  if (event.key === 'Escape') setIsEditingTitle(false)
                }}
                onMouseDown={(event) => event.stopPropagation()}
                placeholder={t('dashboard.group.titlePlaceholder')}
                className="dc:flex-1 dc:min-w-0 dc:text-sm dc:font-semibold text-dc-text bg-transparent dc:border-none dc:outline-hidden"
              />
            ) : (
              <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">{group.title}</h3>
            )}
          </div>
          {buttons}
        </div>
      )}

      {/* Untitled: the controls float over the card instead of taking a header
          row, so the group's inner height is the same in edit and view mode. */}
      {!hasTitle && !isEditingTitle && canEdit && (
        <div className="dc-portlet-group-floating-toolbar dc:flex dc:items-center dc:px-1 dc:py-0.5 dc:rounded-sm dc:border border-dc-border bg-dc-surface">
          {grip}
          {buttons}
        </div>
      )}

      <div
        className="dc-portlet-group-body dc:flex dc:flex-1 dc:min-h-0 dc:p-1"
        style={{ flexDirection: horizontal ? 'row' : 'column', gap: 'var(--dc-group-gap, 4px)' }}
      >
        {group.cells.map((cell, cellIndex) => (
          <div
            key={`${group.id}-cell-${cellIndex}`}
            className="dc-portlet-group-cell dc:flex dc:min-w-0 dc:min-h-0 dc:relative"
            style={{
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: 0,
              flexDirection: horizontal ? 'column' : 'row',
              gap: 'var(--dc-group-gap, 4px)'
            }}
          >
            {cell.portletIds.map((portletId) => {
              const portlet = portlets.get(portletId)
              if (!portlet) return null
              return (
                <div
                  key={portletId}
                  className="dc:flex-1 dc:min-w-0 dc:min-h-0 dc:relative"
                  draggable={canEdit}
                  // dragstart bubbles, so without this the row's column wrapper
                  // would also fire and drag the whole group instead.
                  onDragStart={(event) => {
                    event.stopPropagation()
                    onChildDragStart(group.id, portletId, event)
                  }}
                  onDragEnd={(event) => {
                    event.stopPropagation()
                    onChildDragEnd()
                  }}
                >
                  {renderChild(portlet, {})}
                  {renderSnapBands?.(portletId)}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
