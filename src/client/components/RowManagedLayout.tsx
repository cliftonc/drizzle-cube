import { Fragment, useState, useCallback, type HTMLAttributes, type ReactNode, type MouseEvent, type DragEvent } from 'react'
import type { DashboardGridSettings, PortletConfig, PortletGroup, RowLayout } from '../types.js'
import type { SnapEdge } from '../hooks/dashboard/groupUtils.js'
import { ensureAnalysisConfig } from '../utils/configMigration.js'

const SNAP_EDGES: SnapEdge[] = ['top', 'right', 'bottom', 'left']

interface RowManagedLayoutProps {
  rows: RowLayout[]
  portlets: PortletConfig[]
  groups?: PortletGroup[]
  gridSettings: DashboardGridSettings
  gridWidth: number
  canEdit: boolean
  isDragging: boolean
  onRowResize: (rowIndex: number, event: MouseEvent<HTMLDivElement>) => void
  onColumnResize: (rowIndex: number, columnIndex: number, event: MouseEvent<HTMLDivElement>) => void
  onPortletDragStart: (
    rowIndex: number,
    columnIndex: number,
    portletId: string,
    event: DragEvent<HTMLDivElement>,
    /** Set when the whole column is a group being moved, not a single portlet. */
    groupId?: string
  ) => void
  onPortletDragEnd: () => void
  onRowDrop: (rowIndex: number, insertIndex: number | null) => void
  onNewRowDrop: (insertIndex: number) => void
  /** Snap the dragged portlet against `edge` of `targetPortletId`. */
  onSnapDrop?: (targetPortletId: string, edge: SnapEdge) => void
  /** Id of the portlet currently being dragged, so it can ignore its own bands. */
  draggingPortletId?: string | null
  /** Id of the group currently being dragged, so its members ignore their bands. */
  draggingGroupId?: string | null
  renderPortlet: (portlet: PortletConfig, containerProps?: HTMLAttributes<HTMLDivElement>, headerProps?: HTMLAttributes<HTMLDivElement>) => ReactNode
  /** Renders a group column. Omitted in contexts that have no groups. */
  renderGroup?: (
    group: PortletGroup,
    renderSnapBands: (portletId: string) => ReactNode
  ) => ReactNode
}

const COLUMN_GAP = 16

export default function RowManagedLayout({
  rows,
  portlets,
  groups = [],
  gridSettings,
  gridWidth,
  canEdit,
  isDragging,
  onRowResize,
  onColumnResize,
  onPortletDragStart,
  onPortletDragEnd,
  onRowDrop,
  onNewRowDrop,
  onSnapDrop,
  draggingPortletId,
  draggingGroupId,
  renderPortlet,
  renderGroup
}: RowManagedLayoutProps) {
  const portletMap = new Map(portlets.map(portlet => [portlet.id, portlet]))
  const groupMap = new Map(groups.map(group => [group.id, group]))
  const [activeDropKey, setActiveDropKey] = useState<string | null>(null)

  const setDropActive = (key: string | null) => {
    setActiveDropKey(key)
  }

  const isDragActive = isDragging || activeDropKey !== null

  // Stable drag event handlers using data attributes to prevent containerProps recreation
  const handlePortletDragStart = useCallback((event: DragEvent<HTMLDivElement>) => {
    const rowIndex = parseInt(event.currentTarget.dataset.rowIndex || '0', 10)
    const columnIndex = parseInt(event.currentTarget.dataset.columnIndex || '0', 10)
    const portletId = event.currentTarget.dataset.portletId || ''
    const groupId = event.currentTarget.dataset.groupId || undefined
    onPortletDragStart(rowIndex, columnIndex, portletId, event, groupId)
  }, [onPortletDragStart])

  const handlePortletDragEnd = useCallback(() => {
    setDropActive(null)
    onPortletDragEnd()
  }, [onPortletDragEnd])

  // Bands sit inside each card and offer to merge the dragged portlet into it.
  const renderSnapBands = useCallback((portletId: string) => {
    if (!canEdit || !onSnapDrop || !isDragging) return null
    // A group cannot nest inside a portlet, so while one is in flight the cards
    // offer nothing: it targets rows and columns only.
    if (draggingGroupId) return null
    // Dropping a card on its own bands is a no-op - don't even highlight.
    if (draggingPortletId === portletId) return null

    return SNAP_EDGES.map((edge) => {
      const key = `snap-${portletId}-${edge}`
      const isActive = activeDropKey === key
      return (
        <Fragment key={key}>
          <div
            data-snap-edge={edge}
            data-snap-portlet-id={portletId}
            className={`dc-portlet-snap-band dc-portlet-snap-band-${edge}${isActive ? ' dc-snap-zone-active' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setDropActive(key)
            }}
            onDragLeave={() => setDropActive(null)}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setDropActive(null)
              onSnapDrop(portletId, edge)
            }}
          />
          {/* Separate from the hit region so the preview can show the full half
              of the card the portlet will occupy, while the band stays inset
              enough not to fight the row/column gap handles. */}
          {isActive && (
            <div className={`dc-portlet-snap-preview dc-portlet-snap-preview-${edge}`} />
          )}
        </Fragment>
      )
    })
  }, [activeDropKey, canEdit, draggingGroupId, draggingPortletId, isDragging, onSnapDrop])

  const topDropActive = activeDropKey === 'row-insert-0'
  const bottomDropActive = activeDropKey === 'row-bottom'

  return (
    <div
      className={`dc-row-layout${canEdit ? ' dc-row-layout-editable' : ''}${isDragActive ? ' dc-row-layout-dragging' : ''}`}
      style={{
        ['--dc-row-gap' as string]: '24px',
        ['--dc-column-gap' as string]: `${COLUMN_GAP}px`,
        ['--dc-top-drop-space' as string]: topDropActive ? '24px' : '0px',
        ['--dc-bottom-drop-space' as string]: bottomDropActive ? '24px' : '0px'
      }}
    >
      {canEdit && (
        <div
          className={`dc-row-boundary-drop dc-row-boundary-drop-top dc-split-handle${activeDropKey === 'row-insert-0' ? ' dc-drop-zone-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDropActive('row-insert-0')
          }}
          onDragLeave={() => setDropActive(null)}
          onDrop={(event) => {
            event.preventDefault()
            setDropActive(null)
            onNewRowDrop(0)
          }}
        />
      )}
      {rows.map((row, rowIndex) => {
        // Row auto-height only when all columns are markdown and request autoHeight.
        const isAutoHeightRow = row.columns.length > 0 && row.columns.every(col => {
          // A group column has an explicit height, so it never auto-heights.
          if (col.groupId) return false
          const portlet = col.portletId ? portletMap.get(col.portletId) : undefined
          if (!portlet) return false
          const normalized = ensureAnalysisConfig(portlet)
          const chartMode = normalized.analysisConfig.charts[normalized.analysisConfig.analysisType]
          return chartMode?.chartType === 'markdown' && (chartMode.displayConfig?.autoHeight ?? true)
        })
        const rowHeight = isAutoHeightRow ? undefined : row.h * gridSettings.rowHeight
        const safeGridWidth = gridWidth || gridSettings.cols * gridSettings.rowHeight
        const paddingLeft = activeDropKey === `row-${rowIndex}-insert-0` ? COLUMN_GAP : 0
        const paddingRight = activeDropKey === `row-${rowIndex}-insert-${row.columns.length}` ? COLUMN_GAP : 0
        const rowContentWidth = safeGridWidth - (row.columns.length - 1) * COLUMN_GAP - paddingLeft - paddingRight
        const unitWidth = rowContentWidth / gridSettings.cols

        return (
          <div key={row.id} className="dc-row-layout-row-wrapper">
            <div
              className="dc-row-layout-row"
              style={{
                height: rowHeight ?? 'auto',
                paddingLeft,
                paddingRight,
              }}
            >
              {row.columns.map((column, columnIndex) => {
                const group = column.groupId ? groupMap.get(column.groupId) : undefined
                const portlet =
                  !group && column.portletId ? portletMap.get(column.portletId) : undefined
                if (!group && !portlet) return null

                const key = group ? group.id : portlet!.id
                const width = column.w * unitWidth

                // Without this the only sign a drag is live is the native ghost:
                // drop zones stay invisible until one is hovered.
                const isBeingDragged = group
                  ? draggingGroupId === group.id
                  : draggingPortletId === portlet!.id

                return (
                  <div
                    key={key}
                    className={`dc-row-layout-column-wrapper dc-row-layout-column${isBeingDragged ? ' dc-row-layout-column-dragging' : ''}`}
                    draggable={canEdit}
                    data-row-index={rowIndex.toString()}
                    data-column-index={columnIndex.toString()}
                    data-portlet-id={portlet?.id}
                    data-group-id={group?.id}
                    onDragStart={handlePortletDragStart}
                    onDragEnd={handlePortletDragEnd}
                    style={{
                      flex: `0 0 ${width}px`,
                      maxWidth: `${width}px`
                    }}
                  >
                    {group
                      ? renderGroup?.(group, renderSnapBands)
                      : (
                        <>
                          {renderPortlet(portlet!)}
                          {renderSnapBands(portlet!.id)}
                        </>
                      )}
                    {columnIndex < row.columns.length - 1 && (
                      <div
                        className={`dc-column-resize-handle dc-split-handle${activeDropKey === `row-${rowIndex}-insert-${columnIndex + 1}` ? ' dc-drop-zone-active' : ''}`}
                        onMouseDown={(event) => onColumnResize(rowIndex, columnIndex, event)}
                        onDragOver={(event) => {
                          if (!canEdit) return
                          event.preventDefault()
                          setDropActive(`row-${rowIndex}-insert-${columnIndex + 1}`)
                        }}
                        onDragLeave={() => setDropActive(null)}
                        onDrop={(event) => {
                          if (!canEdit) return
                          event.preventDefault()
                          event.stopPropagation()
                          setDropActive(null)
                          onRowDrop(rowIndex, columnIndex + 1)
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {canEdit && (
              <>
                <div
                  className={`dc-row-edge-drop dc-row-edge-drop-left dc-split-handle${activeDropKey === `row-${rowIndex}-insert-0` ? ' dc-drop-zone-active' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDropActive(`row-${rowIndex}-insert-0`)
                  }}
                  onDragLeave={() => {
                    setDropActive(null)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDropActive(null)
                    onRowDrop(rowIndex, 0)
                  }}
                />
                <div
                  className={`dc-row-edge-drop dc-row-edge-drop-right dc-split-handle${activeDropKey === `row-${rowIndex}-insert-${row.columns.length}` ? ' dc-drop-zone-active' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDropActive(`row-${rowIndex}-insert-${row.columns.length}`)
                  }}
                  onDragLeave={() => {
                    setDropActive(null)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDropActive(null)
                    onRowDrop(rowIndex, row.columns.length)
                  }}
                />
              </>
            )}
            {canEdit && (
              <div
                className={`dc-row-resize-handle dc-split-handle${isAutoHeightRow ? ' dc-row-resize-handle-drop-only' : ''}${activeDropKey === `row-insert-${rowIndex + 1}` ? ' dc-drop-zone-active' : ''}`}
                onMouseDown={isAutoHeightRow ? undefined : (event) => onRowResize(rowIndex, event)}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropActive(`row-insert-${rowIndex + 1}`)
                }}
                onDragLeave={() => setDropActive(null)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDropActive(null)
                  onNewRowDrop(rowIndex + 1)
                }}
              />
            )}
          </div>
        )
      })}
      {canEdit && (
        <div
          className={`dc-row-boundary-drop dc-row-boundary-drop-bottom dc-split-handle${activeDropKey === 'row-bottom' ? ' dc-drop-zone-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDropActive('row-bottom')
          }}
          onDragLeave={() => setDropActive(null)}
          onDrop={(event) => {
            event.preventDefault()
            setDropActive(null)
            onNewRowDrop(rows.length)
          }}
        />
      )}
    </div>
  )
}
