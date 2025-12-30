import { useState, useCallback, type HTMLAttributes, type ReactNode, type MouseEvent, type DragEvent } from 'react'
import type { DashboardGridSettings, PortletConfig, RowLayout } from '../types'

interface RowManagedLayoutProps {
  rows: RowLayout[]
  portlets: PortletConfig[]
  gridSettings: DashboardGridSettings
  gridWidth: number
  canEdit: boolean
  isDragging: boolean
  onRowResize: (rowIndex: number, event: MouseEvent<HTMLDivElement>) => void
  onColumnResize: (rowIndex: number, columnIndex: number, event: MouseEvent<HTMLDivElement>) => void
  onPortletDragStart: (rowIndex: number, columnIndex: number, portletId: string, event: DragEvent<HTMLDivElement>) => void
  onPortletDragEnd: () => void
  onRowDrop: (rowIndex: number, insertIndex: number | null) => void
  onNewRowDrop: (insertIndex: number) => void
  renderPortlet: (portlet: PortletConfig, containerProps?: HTMLAttributes<HTMLDivElement>, headerProps?: HTMLAttributes<HTMLDivElement>) => ReactNode
}

const COLUMN_GAP = 16

export default function RowManagedLayout({
  rows,
  portlets,
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
  renderPortlet
}: RowManagedLayoutProps) {
  const portletMap = new Map(portlets.map(portlet => [portlet.id, portlet]))
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
    onPortletDragStart(rowIndex, columnIndex, portletId, event)
  }, [onPortletDragStart])

  const handlePortletDragEnd = useCallback(() => {
    setDropActive(null)
    onPortletDragEnd()
  }, [onPortletDragEnd])

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
        const rowHeight = row.h * gridSettings.rowHeight
        const safeGridWidth = gridWidth || gridSettings.cols * gridSettings.rowHeight
        const paddingLeft = activeDropKey === `row-${rowIndex}-insert-0` ? COLUMN_GAP : 0
        const paddingRight = activeDropKey === `row-${rowIndex}-insert-${row.columns.length}` ? COLUMN_GAP : 0
        const rowContentWidth = safeGridWidth - (row.columns.length - 1) * COLUMN_GAP - paddingLeft - paddingRight
        const unitWidth = rowContentWidth / gridSettings.cols

        return (
          <div key={row.id} className="dc-row-layout-row-wrapper">
            <div
              className="dc-row-layout-row"
              style={{ height: rowHeight, paddingLeft, paddingRight }}
            >
              {row.columns.map((column, columnIndex) => {
                const portlet = portletMap.get(column.portletId)
                if (!portlet) return null
                const width = column.w * unitWidth

                const containerProps = {
                  draggable: canEdit,
                  'data-row-index': rowIndex.toString(),
                  'data-column-index': columnIndex.toString(),
                  'data-portlet-id': portlet.id,
                  onDragStart: handlePortletDragStart,
                  onDragEnd: handlePortletDragEnd,
                  className: 'dc-row-layout-column'
                } as HTMLAttributes<HTMLDivElement>

                return (
                  <div
                    key={portlet.id}
                    className="dc-row-layout-column-wrapper"
                    style={{
                      flex: `0 0 ${width}px`,
                      maxWidth: `${width}px`
                    }}
                  >
                    {renderPortlet(portlet, containerProps)}
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
                className={`dc-row-resize-handle dc-split-handle${activeDropKey === `row-insert-${rowIndex + 1}` ? ' dc-drop-zone-active' : ''}`}
                onMouseDown={(event) => onRowResize(rowIndex, event)}
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
