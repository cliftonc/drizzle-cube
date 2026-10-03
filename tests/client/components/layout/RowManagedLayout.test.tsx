/**
 * Tests for RowManagedLayout component
 * Covers row-based dashboard layout with drag and drop, resize functionality
 */

import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import RowManagedLayout from '../../../../src/client/components/RowManagedLayout'
import type { PortletConfig, PortletGroup, RowLayout, DashboardGridSettings } from '../../../../src/client/types'

// Helper to create test portlet
function createTestPortlet(overrides: Partial<PortletConfig> = {}): PortletConfig {
  return {
    id: `portlet-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Portlet',
    query: JSON.stringify({ measures: ['Test.count'] }),
    chartType: 'bar',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    ...overrides
  }
}

function createMarkdownPortlet(overrides: Partial<PortletConfig> = {}): PortletConfig {
  return createTestPortlet({
    chartType: 'markdown',
    displayConfig: { autoHeight: true },
    ...overrides
  })
}

// Helper to create test row
function createTestRow(overrides: Partial<RowLayout> = {}): RowLayout {
  return {
    id: `row-${Math.random().toString(36).substr(2, 9)}`,
    h: 4,
    columns: [],
    ...overrides
  }
}

// Default grid settings
const defaultGridSettings: DashboardGridSettings = {
  cols: 12,
  rowHeight: 80,
  minW: 2,
  minH: 2
}

// Default props
const defaultProps = {
  rows: [] as RowLayout[],
  portlets: [] as PortletConfig[],
  gridSettings: defaultGridSettings,
  gridWidth: 1200,
  canEdit: false,
  isDragging: false,
  onRowResize: vi.fn(),
  onColumnResize: vi.fn(),
  onPortletDragStart: vi.fn(),
  onPortletDragEnd: vi.fn(),
  onRowDrop: vi.fn(),
  onNewRowDrop: vi.fn(),
  renderPortlet: vi.fn((portlet: PortletConfig) => (
    <div data-testid={`portlet-${portlet.id}`} data-portlet-title={portlet.title}>
      {portlet.title}
    </div>
  ))
}

describe('RowManagedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render with dc-row-layout class', () => {
      const { container } = render(<RowManagedLayout {...defaultProps} />)

      expect(container.querySelector('.dc-row-layout')).toBeInTheDocument()
    })

    it('should render empty when no rows', () => {
      const { container } = render(<RowManagedLayout {...defaultProps} rows={[]} />)

      const rowElements = container.querySelectorAll('.dc-row-layout-row')
      expect(rowElements).toHaveLength(0)
    })

    it('should render row wrappers', () => {
      const rows: RowLayout[] = [
        createTestRow({ id: 'row-1' }),
        createTestRow({ id: 'row-2' })
      ]

      const { container } = render(<RowManagedLayout {...defaultProps} rows={rows} />)

      const rowWrappers = container.querySelectorAll('.dc-row-layout-row-wrapper')
      expect(rowWrappers).toHaveLength(2)
    })

    it('should render row with correct height', () => {
      const rows: RowLayout[] = [
        createTestRow({ id: 'row-1', h: 4 }) // 4 * 80 = 320
      ]

      const { container } = render(<RowManagedLayout {...defaultProps} rows={rows} />)

      const row = container.querySelector('.dc-row-layout-row') as HTMLElement
      expect(row.style.height).toBe('320px')
    })

    it('should render auto-height row for markdown when autoHeight is enabled', () => {
      const portlet = createMarkdownPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          h: 4,
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
        />
      )

      const row = container.querySelector('.dc-row-layout-row') as HTMLElement
      expect(row.style.height).toBe('auto')
    })

    it('should keep fixed row height when markdown autoHeight is disabled', () => {
      const portlet = createMarkdownPortlet({
        id: 'p1',
        displayConfig: { autoHeight: false }
      })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          h: 4,
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
        />
      )

      const row = container.querySelector('.dc-row-layout-row') as HTMLElement
      expect(row.style.height).toBe('320px')
    })

    it('should set CSS custom properties', () => {
      const { container } = render(<RowManagedLayout {...defaultProps} />)

      const layout = container.querySelector('.dc-row-layout') as HTMLElement
      expect(layout.style.getPropertyValue('--dc-row-gap')).toBe('24px')
      expect(layout.style.getPropertyValue('--dc-column-gap')).toBe('16px')
    })
  })

  describe('portlet rendering', () => {
    it('should call renderPortlet for each column', () => {
      const portlet1 = createTestPortlet({ id: 'p1', title: 'Portlet 1' })
      const portlet2 = createTestPortlet({ id: 'p2', title: 'Portlet 2' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1, portlet2]}
        />
      )

      expect(screen.getByTestId('portlet-p1')).toBeInTheDocument()
      expect(screen.getByTestId('portlet-p2')).toBeInTheDocument()
    })

    it('should skip missing portlets', () => {
      const portlet1 = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'missing', w: 6 }
          ]
        })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1]}
        />
      )

      expect(screen.getByTestId('portlet-p1')).toBeInTheDocument()
      expect(screen.queryByTestId('portlet-missing')).not.toBeInTheDocument()
    })

    it('should render draggable column wrapper when canEdit is true', () => {
      const renderPortlet = vi.fn((portlet: PortletConfig) => (
        <div
          data-testid={`portlet-${portlet.id}`}
        >
          {portlet.title}
        </div>
      ))
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
          renderPortlet={renderPortlet}
        />
      )

      const columnWrapper = document.querySelector('.dc-row-layout-column-wrapper') as HTMLDivElement
      expect(columnWrapper).toHaveAttribute('draggable', 'true')
      expect(columnWrapper.className).toContain('dc-row-layout-column')
    })
  })

  describe('column width calculation', () => {
    it('should calculate column width based on w value and grid cols', () => {
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [{ portletId: 'p1', w: 6 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          gridWidth={1200}
        />
      )

      const columnWrapper = container.querySelector('.dc-row-layout-column-wrapper') as HTMLElement
      // With gridWidth=1200, cols=12, one column, no gaps
      // unitWidth = 1200 / 12 = 100
      // width = 6 * 100 = 600
      expect(columnWrapper.style.maxWidth).toBe('600px')
    })

    it('should account for column gaps between columns', () => {
      const portlet1 = createTestPortlet({ id: 'p1' })
      const portlet2 = createTestPortlet({ id: 'p2' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1, portlet2]}
          gridWidth={1200}
        />
      )

      // With 2 columns, 1 gap of 16px
      // rowContentWidth = 1200 - (2-1) * 16 - 0 - 0 = 1184
      // unitWidth = 1184 / 12 = 98.67
      // Each column width = 6 * 98.67 = ~592
      const columnWrappers = container.querySelectorAll('.dc-row-layout-column-wrapper')
      expect(columnWrappers).toHaveLength(2)
    })

    it('should use gridSettings cols in calculation', () => {
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [{ portletId: 'p1', w: 6 }]
        })
      ]

      const customGridSettings = { ...defaultGridSettings, cols: 24 }

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          gridSettings={customGridSettings}
          gridWidth={1200}
        />
      )

      const columnWrapper = container.querySelector('.dc-row-layout-column-wrapper') as HTMLElement
      // unitWidth = 1200 / 24 = 50
      // width = 6 * 50 = 300
      expect(columnWrapper.style.maxWidth).toBe('300px')
    })

    it('should use fallback width when gridWidth is 0', () => {
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [{ portletId: 'p1', w: 6 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          gridWidth={0}
        />
      )

      // Should fallback to cols * rowHeight = 12 * 80 = 960
      const columnWrapper = container.querySelector('.dc-row-layout-column-wrapper') as HTMLElement
      expect(columnWrapper).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('should add editable class when canEdit is true', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const layout = container.querySelector('.dc-row-layout')
      expect(layout?.classList.contains('dc-row-layout-editable')).toBe(true)
    })

    it('should not add editable class when canEdit is false', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={false} />
      )

      const layout = container.querySelector('.dc-row-layout')
      expect(layout?.classList.contains('dc-row-layout-editable')).toBe(false)
    })

    it('should render top drop zone when canEdit', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const topDropZone = container.querySelector('.dc-row-boundary-drop-top')
      expect(topDropZone).toBeInTheDocument()
    })

    it('should render bottom drop zone when canEdit', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const bottomDropZone = container.querySelector('.dc-row-boundary-drop-bottom')
      expect(bottomDropZone).toBeInTheDocument()
    })

    it('should not render drop zones when canEdit is false', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={false} />
      )

      expect(container.querySelector('.dc-row-boundary-drop-top')).not.toBeInTheDocument()
      expect(container.querySelector('.dc-row-boundary-drop-bottom')).not.toBeInTheDocument()
    })

    it('should render row resize handle when canEdit', () => {
      const rows: RowLayout[] = [createTestRow()]

      const { container } = render(
        <RowManagedLayout {...defaultProps} rows={rows} canEdit={true} />
      )

      const resizeHandle = container.querySelector('.dc-row-resize-handle')
      expect(resizeHandle).toBeInTheDocument()
    })

    it('should render drop-only row handle for auto-height markdown rows', () => {
      const portlet = createMarkdownPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          h: 4,
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
        />
      )

      const resizeHandle = container.querySelector('.dc-row-resize-handle')
      expect(resizeHandle).toBeInTheDocument()
      expect(resizeHandle).toHaveClass('dc-row-resize-handle-drop-only')
    })

    it('should render edge drop zones for each row when canEdit', () => {
      const rows: RowLayout[] = [createTestRow()]

      const { container } = render(
        <RowManagedLayout {...defaultProps} rows={rows} canEdit={true} />
      )

      expect(container.querySelector('.dc-row-edge-drop-left')).toBeInTheDocument()
      expect(container.querySelector('.dc-row-edge-drop-right')).toBeInTheDocument()
    })
  })

  describe('dragging state', () => {
    it('should add dragging class when isDragging is true', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} isDragging={true} />
      )

      const layout = container.querySelector('.dc-row-layout')
      expect(layout?.classList.contains('dc-row-layout-dragging')).toBe(true)
    })

    it('should add dragging class when activeDropKey is set', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} isDragging={false} />
      )

      // Trigger dragOver on top drop zone to set activeDropKey
      const topDropZone = container.querySelector('.dc-row-boundary-drop-top')
      act(() => {
        fireEvent.dragOver(topDropZone!)
      })

      const layout = container.querySelector('.dc-row-layout')
      expect(layout?.classList.contains('dc-row-layout-dragging')).toBe(true)
    })
  })

  describe('drag and drop - row boundaries', () => {
    it('should call onNewRowDrop(0) when dropping on top boundary', () => {
      const onNewRowDrop = vi.fn()

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          canEdit={true}
          onNewRowDrop={onNewRowDrop}
        />
      )

      const topDropZone = container.querySelector('.dc-row-boundary-drop-top')
      fireEvent.drop(topDropZone!)

      expect(onNewRowDrop).toHaveBeenCalledWith(0)
    })

    it('should call onNewRowDrop(rows.length) when dropping on bottom boundary', () => {
      const onNewRowDrop = vi.fn()
      const rows: RowLayout[] = [
        createTestRow(),
        createTestRow()
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          canEdit={true}
          onNewRowDrop={onNewRowDrop}
        />
      )

      const bottomDropZone = container.querySelector('.dc-row-boundary-drop-bottom')
      fireEvent.drop(bottomDropZone!)

      expect(onNewRowDrop).toHaveBeenCalledWith(2)
    })

    it('should call onNewRowDrop(rowIndex + 1) when dropping on row resize handle', () => {
      const onNewRowDrop = vi.fn()
      const rows: RowLayout[] = [createTestRow()]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          canEdit={true}
          onNewRowDrop={onNewRowDrop}
        />
      )

      const resizeHandle = container.querySelector('.dc-row-resize-handle')
      fireEvent.drop(resizeHandle!)

      expect(onNewRowDrop).toHaveBeenCalledWith(1)
    })

    it('should call onNewRowDrop(rowIndex + 1) when dropping on auto-height markdown row handle', () => {
      const onNewRowDrop = vi.fn()
      const portlet = createMarkdownPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          h: 4,
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
          onNewRowDrop={onNewRowDrop}
        />
      )

      const resizeHandle = container.querySelector('.dc-row-resize-handle')
      fireEvent.drop(resizeHandle!)

      expect(onNewRowDrop).toHaveBeenCalledWith(1)
    })
  })

  describe('drag and drop - row edges', () => {
    it('should call onRowDrop with rowIndex and 0 when dropping on left edge', () => {
      const onRowDrop = vi.fn()
      const rows: RowLayout[] = [createTestRow()]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          canEdit={true}
          onRowDrop={onRowDrop}
        />
      )

      const leftEdge = container.querySelector('.dc-row-edge-drop-left')
      fireEvent.drop(leftEdge!)

      expect(onRowDrop).toHaveBeenCalledWith(0, 0)
    })

    it('should call onRowDrop with rowIndex and columns.length when dropping on right edge', () => {
      const onRowDrop = vi.fn()
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 6 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
          onRowDrop={onRowDrop}
        />
      )

      const rightEdge = container.querySelector('.dc-row-edge-drop-right')
      fireEvent.drop(rightEdge!)

      expect(onRowDrop).toHaveBeenCalledWith(0, 1)
    })
  })

  describe('drag and drop - column resize handles', () => {
    it('should call onRowDrop when dropping on column resize handle', () => {
      const onRowDrop = vi.fn()
      const portlet1 = createTestPortlet({ id: 'p1' })
      const portlet2 = createTestPortlet({ id: 'p2' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1, portlet2]}
          canEdit={true}
          onRowDrop={onRowDrop}
        />
      )

      const resizeHandle = container.querySelector('.dc-column-resize-handle')
      fireEvent.drop(resizeHandle!)

      expect(onRowDrop).toHaveBeenCalledWith(0, 1)
    })

    it('should render column resize handles between columns', () => {
      const portlet1 = createTestPortlet({ id: 'p1' })
      const portlet2 = createTestPortlet({ id: 'p2' })
      const portlet3 = createTestPortlet({ id: 'p3' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 4 },
            { portletId: 'p2', w: 4 },
            { portletId: 'p3', w: 4 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1, portlet2, portlet3]}
          canEdit={true}
        />
      )

      // Should have 2 resize handles between 3 columns
      const resizeHandles = container.querySelectorAll('.dc-column-resize-handle')
      expect(resizeHandles).toHaveLength(2)
    })
  })

  describe('resize event handlers', () => {
    it('should call onRowResize on mousedown', () => {
      const onRowResize = vi.fn()
      const rows: RowLayout[] = [createTestRow()]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          canEdit={true}
          onRowResize={onRowResize}
        />
      )

      const resizeHandle = container.querySelector('.dc-row-resize-handle')
      fireEvent.mouseDown(resizeHandle!)

      expect(onRowResize).toHaveBeenCalledWith(0, expect.any(Object))
    })

    it('should not call onRowResize on mousedown for auto-height markdown rows', () => {
      const onRowResize = vi.fn()
      const portlet = createMarkdownPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          h: 4,
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
          onRowResize={onRowResize}
        />
      )

      const resizeHandle = container.querySelector('.dc-row-resize-handle')
      fireEvent.mouseDown(resizeHandle!)

      expect(onRowResize).not.toHaveBeenCalled()
    })

    it('should call onColumnResize on mousedown', () => {
      const onColumnResize = vi.fn()
      const portlet1 = createTestPortlet({ id: 'p1' })
      const portlet2 = createTestPortlet({ id: 'p2' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1, portlet2]}
          canEdit={true}
          onColumnResize={onColumnResize}
        />
      )

      const columnResizeHandle = container.querySelector('.dc-column-resize-handle')
      fireEvent.mouseDown(columnResizeHandle!)

      expect(onColumnResize).toHaveBeenCalledWith(0, 0, expect.any(Object))
    })
  })

  describe('portlet drag events', () => {
    it('should call onPortletDragStart when portlet drag starts', () => {
      const onPortletDragStart = vi.fn()
      const renderPortlet = vi.fn((portlet: PortletConfig) => (
        <div
          data-testid={`portlet-${portlet.id}`}
        >
          {portlet.title}
        </div>
      ))
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
          onPortletDragStart={onPortletDragStart}
          renderPortlet={renderPortlet}
        />
      )

      const columnWrapper = document.querySelector('.dc-row-layout-column-wrapper') as HTMLDivElement
      fireEvent.dragStart(columnWrapper)

      // 5th arg is the groupId, undefined for a plain portlet column
      expect(onPortletDragStart).toHaveBeenCalledWith(0, 0, 'p1', expect.any(Object), undefined)
    })

    it('should call onPortletDragEnd when portlet drag ends', () => {
      const onPortletDragEnd = vi.fn()
      const renderPortlet = vi.fn((portlet: PortletConfig) => (
        <div
          data-testid={`portlet-${portlet.id}`}
        >
          {portlet.title}
        </div>
      ))
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
          onPortletDragEnd={onPortletDragEnd}
          renderPortlet={renderPortlet}
        />
      )

      const columnWrapper = document.querySelector('.dc-row-layout-column-wrapper') as HTMLDivElement
      fireEvent.dragEnd(columnWrapper)

      expect(onPortletDragEnd).toHaveBeenCalled()
    })
  })

  describe('drop zone activation', () => {
    it('should activate drop zone on dragOver', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const topDropZone = container.querySelector('.dc-row-boundary-drop-top')
      act(() => {
        fireEvent.dragOver(topDropZone!)
      })

      // Layout should show dragging state
      const layout = container.querySelector('.dc-row-layout')
      expect(layout?.classList.contains('dc-row-layout-dragging')).toBe(true)
    })

    it('should deactivate drop zone on dragLeave', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const topDropZone = container.querySelector('.dc-row-boundary-drop-top')

      // Activate
      act(() => {
        fireEvent.dragOver(topDropZone!)
      })

      // Deactivate
      act(() => {
        fireEvent.dragLeave(topDropZone!)
      })

      // Check CSS property for top drop space
      const layout = container.querySelector('.dc-row-layout') as HTMLElement
      // Without activeDropKey, top drop space should be 0px
      expect(layout.style.getPropertyValue('--dc-top-drop-space')).toBe('0px')
    })

    it('should set top drop space CSS when row-insert-0 is active', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const topDropZone = container.querySelector('.dc-row-boundary-drop-top')
      act(() => {
        fireEvent.dragOver(topDropZone!)
      })

      const layout = container.querySelector('.dc-row-layout') as HTMLElement
      expect(layout.style.getPropertyValue('--dc-top-drop-space')).toBe('24px')
    })

    it('should set bottom drop space CSS when row-bottom is active', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const bottomDropZone = container.querySelector('.dc-row-boundary-drop-bottom')
      act(() => {
        fireEvent.dragOver(bottomDropZone!)
      })

      const layout = container.querySelector('.dc-row-layout') as HTMLElement
      expect(layout.style.getPropertyValue('--dc-bottom-drop-space')).toBe('24px')
    })
  })

  describe('padding for edge drops', () => {
    it('should add left padding when left edge drop is active', () => {
      const rows: RowLayout[] = [createTestRow({ id: 'row-0' })]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          canEdit={true}
        />
      )

      const leftEdge = container.querySelector('.dc-row-edge-drop-left')
      act(() => {
        fireEvent.dragOver(leftEdge!)
      })

      const row = container.querySelector('.dc-row-layout-row') as HTMLElement
      expect(row.style.paddingLeft).toBe('16px')
    })

    it('should add right padding when right edge drop is active', () => {
      const portlet = createTestPortlet({ id: 'p1' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-0',
          columns: [{ portletId: 'p1', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          canEdit={true}
        />
      )

      const rightEdge = container.querySelector('.dc-row-edge-drop-right')
      act(() => {
        fireEvent.dragOver(rightEdge!)
      })

      const row = container.querySelector('.dc-row-layout-row') as HTMLElement
      expect(row.style.paddingRight).toBe('16px')
    })
  })

  describe('multiple rows', () => {
    it('should render multiple rows with portlets', () => {
      const portlet1 = createTestPortlet({ id: 'p1', title: 'Row 1 Portlet' })
      const portlet2 = createTestPortlet({ id: 'p2', title: 'Row 2 Portlet' })
      const rows: RowLayout[] = [
        createTestRow({
          id: 'row-1',
          h: 3,
          columns: [{ portletId: 'p1', w: 12 }]
        }),
        createTestRow({
          id: 'row-2',
          h: 5,
          columns: [{ portletId: 'p2', w: 12 }]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet1, portlet2]}
        />
      )

      const rowElements = container.querySelectorAll('.dc-row-layout-row')
      expect(rowElements).toHaveLength(2)

      // Check heights
      expect((rowElements[0] as HTMLElement).style.height).toBe('240px') // 3 * 80
      expect((rowElements[1] as HTMLElement).style.height).toBe('400px') // 5 * 80
    })

    it('should have separate resize handles for each row', () => {
      const rows: RowLayout[] = [
        createTestRow(),
        createTestRow(),
        createTestRow()
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          canEdit={true}
        />
      )

      const resizeHandles = container.querySelectorAll('.dc-row-resize-handle')
      expect(resizeHandles).toHaveLength(3)
    })
  })
})

/**
 * Portlet groups ("combination portlets") and the snap bands that create them.
 * A group occupies a whole row column and is rendered by `renderGroup`; the
 * snap bands are the drop targets that fold one portlet into another.
 */
describe('RowManagedLayout - groups and snap bands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createTestGroup(overrides: Partial<PortletGroup> = {}): PortletGroup {
    return {
      id: 'g1',
      direction: 'row',
      cells: [{ portletIds: ['p1'] }],
      ...overrides
    }
  }

  function renderGroupSpy() {
    return vi.fn((group: PortletGroup) => (
      <div data-testid={`group-${group.id}`}>{group.id}</div>
    ))
  }

  function renderPortletSpy() {
    return vi.fn((portlet: PortletConfig) => (
      <div data-testid={`portlet-${portlet.id}`}>{portlet.title}</div>
    ))
  }

  describe('group columns', () => {
    it('should call renderGroup for a group column and not renderPortlet', () => {
      const group = createTestGroup()
      const renderGroup = renderGroupSpy()
      const renderPortlet = renderPortletSpy()
      const rows: RowLayout[] = [
        createTestRow({ columns: [{ groupId: 'g1', w: 12 }] })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[createTestPortlet({ id: 'p1' })]}
          groups={[group]}
          renderGroup={renderGroup}
          renderPortlet={renderPortlet}
        />
      )

      expect(renderGroup).toHaveBeenCalledTimes(1)
      expect(renderGroup.mock.calls[0][0]).toBe(group)
      expect(renderPortlet).not.toHaveBeenCalled()
      expect(screen.getByTestId('group-g1')).toBeInTheDocument()
    })

    it('should render both a group column and a portlet column in the same row', () => {
      const group = createTestGroup()
      const renderGroup = renderGroupSpy()
      const renderPortlet = renderPortletSpy()
      const portlet = createTestPortlet({ id: 'p2' })
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { groupId: 'g1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[portlet]}
          groups={[group]}
          renderGroup={renderGroup}
          renderPortlet={renderPortlet}
        />
      )

      expect(screen.getByTestId('group-g1')).toBeInTheDocument()
      expect(screen.getByTestId('portlet-p2')).toBeInTheDocument()
      expect(renderPortlet).toHaveBeenCalledTimes(1)
    })

    it('should render nothing for a group column whose group is missing', () => {
      const renderGroup = renderGroupSpy()
      const rows: RowLayout[] = [
        createTestRow({ columns: [{ groupId: 'missing-group', w: 12 }] })
      ]

      let container: HTMLElement | undefined
      expect(() => {
        container = render(
          <RowManagedLayout
            {...defaultProps}
            rows={rows}
            groups={[createTestGroup()]}
            renderGroup={renderGroup}
          />
        ).container
      }).not.toThrow()

      expect(renderGroup).not.toHaveBeenCalled()
      expect(container?.querySelectorAll('.dc-row-layout-column-wrapper')).toHaveLength(0)
    })

    it('should pass the group id as the 5th arg of onPortletDragStart', () => {
      const onPortletDragStart = vi.fn()
      const rows: RowLayout[] = [
        createTestRow({ columns: [{ groupId: 'g1', w: 12 }] })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          groups={[createTestGroup()]}
          renderGroup={renderGroupSpy()}
          canEdit={true}
          onPortletDragStart={onPortletDragStart}
        />
      )

      const columnWrapper = container.querySelector('.dc-row-layout-column-wrapper') as HTMLDivElement
      fireEvent.dragStart(columnWrapper)

      // Group columns carry no portlet id, so the 3rd arg is the empty string.
      expect(onPortletDragStart).toHaveBeenCalledWith(0, 0, '', expect.anything(), 'g1')
    })

    it('should hand renderGroup a renderSnapBands callback that draws bands', () => {
      const renderGroup = vi.fn((group: PortletGroup, renderSnapBands: (portletId: string) => ReactNode) => (
        <div data-testid={`group-${group.id}`}>{renderSnapBands('p1')}</div>
      ))
      const rows: RowLayout[] = [
        createTestRow({ columns: [{ groupId: 'g1', w: 12 }] })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          groups={[createTestGroup()]}
          renderGroup={renderGroup}
          canEdit={true}
          isDragging={true}
          onSnapDrop={vi.fn()}
        />
      )

      expect(container.querySelectorAll('[data-snap-portlet-id="p1"]')).toHaveLength(4)
    })
  })

  describe('snap bands', () => {
    const snapRows: RowLayout[] = [
      createTestRow({
        id: 'row-snap',
        columns: [
          { portletId: 'p1', w: 6 },
          { portletId: 'p2', w: 6 }
        ]
      })
    ]
    const snapPortlets = [createTestPortlet({ id: 'p1' }), createTestPortlet({ id: 'p2' })]

    function renderWithBands(overrides: Record<string, unknown> = {}) {
      return render(
        <RowManagedLayout
          {...defaultProps}
          rows={snapRows}
          portlets={snapPortlets}
          canEdit={true}
          isDragging={true}
          onSnapDrop={vi.fn()}
          {...overrides}
        />
      )
    }

    it('should render four bands inside each portlet when dragging in edit mode', () => {
      const { container } = renderWithBands()

      expect(container.querySelectorAll('.dc-portlet-snap-band')).toHaveLength(8)
      for (const edge of ['top', 'right', 'bottom', 'left']) {
        expect(container.querySelectorAll(`.dc-portlet-snap-band-${edge}`)).toHaveLength(2)
      }
    })

    it('should call onSnapDrop with the portlet id and edge on drop', () => {
      const onSnapDrop = vi.fn()
      const { container } = renderWithBands({ onSnapDrop })

      const rightBand = container.querySelector('[data-snap-portlet-id="p1"].dc-portlet-snap-band-right')
      fireEvent.drop(rightBand!)

      expect(onSnapDrop).toHaveBeenCalledWith('p1', 'right')
    })

    it('should call onSnapDrop for each edge', () => {
      const onSnapDrop = vi.fn()
      const { container } = renderWithBands({ onSnapDrop })

      for (const edge of ['top', 'right', 'bottom', 'left']) {
        const band = container.querySelector(`[data-snap-portlet-id="p2"].dc-portlet-snap-band-${edge}`)
        fireEvent.drop(band!)
        expect(onSnapDrop).toHaveBeenCalledWith('p2', edge)
      }

      expect(onSnapDrop).toHaveBeenCalledTimes(4)
    })

    it('should mark the hovered band active on dragOver', () => {
      const { container } = renderWithBands()

      const rightBand = container.querySelector('[data-snap-portlet-id="p1"].dc-portlet-snap-band-right') as HTMLElement
      expect(rightBand.classList.contains('dc-snap-zone-active')).toBe(false)

      act(() => {
        fireEvent.dragOver(rightBand)
      })

      const active = container.querySelector('[data-snap-portlet-id="p1"].dc-portlet-snap-band-right') as HTMLElement
      expect(active.classList.contains('dc-snap-zone-active')).toBe(true)
      // Only the hovered band lights up.
      expect(container.querySelectorAll('.dc-snap-zone-active')).toHaveLength(1)
    })

    it('should clear the active band on dragLeave', () => {
      const { container } = renderWithBands()

      const rightBand = container.querySelector('[data-snap-portlet-id="p1"].dc-portlet-snap-band-right') as HTMLElement
      act(() => {
        fireEvent.dragOver(rightBand)
      })
      act(() => {
        fireEvent.dragLeave(rightBand)
      })

      expect(container.querySelectorAll('.dc-snap-zone-active')).toHaveLength(0)
    })

    it('should render no bands when isDragging is false', () => {
      const { container } = renderWithBands({ isDragging: false })

      expect(container.querySelectorAll('.dc-portlet-snap-band')).toHaveLength(0)
    })

    it('should render no bands when canEdit is false', () => {
      const { container } = renderWithBands({ canEdit: false })

      expect(container.querySelectorAll('.dc-portlet-snap-band')).toHaveLength(0)
    })

    it('should render no bands when onSnapDrop is omitted', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={snapRows}
          portlets={snapPortlets}
          canEdit={true}
          isDragging={true}
        />
      )

      expect(container.querySelectorAll('.dc-portlet-snap-band')).toHaveLength(0)
    })

    it('should not render bands on the portlet being dragged', () => {
      const { container } = renderWithBands({ draggingPortletId: 'p1' })

      expect(container.querySelectorAll('[data-snap-portlet-id="p1"]')).toHaveLength(0)
      expect(container.querySelectorAll('[data-snap-portlet-id="p2"]')).toHaveLength(4)
    })

    it('should render bands on every portlet when draggingPortletId is null', () => {
      const { container } = renderWithBands({ draggingPortletId: null })

      expect(container.querySelectorAll('[data-snap-portlet-id="p1"]')).toHaveLength(4)
      expect(container.querySelectorAll('[data-snap-portlet-id="p2"]')).toHaveLength(4)
    })

    it('should render no bands at all while a group is being dragged', () => {
      // A group cannot nest inside a portlet, so no card offers a merge target
      // while one is in flight - it goes to a row or a column or nowhere.
      const { container } = renderWithBands({ draggingPortletId: null, draggingGroupId: 'g1' })

      expect(container.querySelectorAll('.dc-portlet-snap-band')).toHaveLength(0)
    })
  })

  describe('in-flight drag feedback', () => {
    it('should mark the group column being dragged', () => {
      const rows: RowLayout[] = [
        createTestRow({ columns: [{ groupId: 'g1', w: 6 }, { portletId: 'p2', w: 6 }] })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          groups={[createTestGroup()]}
          renderGroup={renderGroupSpy()}
          isDragging={true}
          draggingGroupId="g1"
        />
      )

      const dragging = container.querySelectorAll('.dc-row-layout-column-dragging')
      expect(dragging).toHaveLength(1)
      expect(dragging[0]).toHaveAttribute('data-group-id', 'g1')
    })

    it('should mark the portlet column being dragged', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={[createTestRow({ columns: [{ portletId: 'p1', w: 6 }, { portletId: 'p2', w: 6 }] })]}
          portlets={[createTestPortlet({ id: 'p1' }), createTestPortlet({ id: 'p2' })]}
          isDragging={true}
          draggingPortletId="p1"
        />
      )

      const dragging = container.querySelectorAll('.dc-row-layout-column-dragging')
      expect(dragging).toHaveLength(1)
      expect(dragging[0]).toHaveAttribute('data-portlet-id', 'p1')
    })

    it('should mark nothing when no drag is in flight', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={[createTestRow({ columns: [{ portletId: 'p1', w: 12 }] })]}
          portlets={[createTestPortlet({ id: 'p1' })]}
        />
      )

      expect(container.querySelectorAll('.dc-row-layout-column-dragging')).toHaveLength(0)
    })
  })

  describe('hit-test separation between bands and gap handles', () => {
    it('should still route a column resize handle drop to onRowDrop, not onSnapDrop', () => {
      const onRowDrop = vi.fn()
      const onSnapDrop = vi.fn()
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[createTestPortlet({ id: 'p1' }), createTestPortlet({ id: 'p2' })]}
          canEdit={true}
          isDragging={true}
          onSnapDrop={onSnapDrop}
          onRowDrop={onRowDrop}
        />
      )

      // Bands are present, so this proves the two drop families don't collide.
      expect(container.querySelectorAll('.dc-portlet-snap-band').length).toBeGreaterThan(0)

      const resizeHandle = container.querySelector('.dc-column-resize-handle')
      fireEvent.drop(resizeHandle!)

      expect(onRowDrop).toHaveBeenCalledWith(0, 1)
      expect(onSnapDrop).not.toHaveBeenCalled()
    })

    it('should not fire onRowDrop when a snap band is dropped on', () => {
      const onRowDrop = vi.fn()
      const onSnapDrop = vi.fn()
      const rows: RowLayout[] = [
        createTestRow({
          columns: [
            { portletId: 'p1', w: 6 },
            { portletId: 'p2', w: 6 }
          ]
        })
      ]

      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          rows={rows}
          portlets={[createTestPortlet({ id: 'p1' }), createTestPortlet({ id: 'p2' })]}
          canEdit={true}
          isDragging={true}
          onSnapDrop={onSnapDrop}
          onRowDrop={onRowDrop}
        />
      )

      const band = container.querySelector('[data-snap-portlet-id="p1"].dc-portlet-snap-band-left')
      fireEvent.drop(band!)

      expect(onSnapDrop).toHaveBeenCalledWith('p1', 'left')
      expect(onRowDrop).not.toHaveBeenCalled()
    })
  })

  describe('row boundary drop zones', () => {
    it('should add dc-drop-zone-active to the top boundary on dragOver', () => {
      // Regression: a key-prefix mismatch meant the top boundary never lit up.
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const topDropZone = container.querySelector('.dc-row-boundary-drop-top') as HTMLElement
      expect(topDropZone.classList.contains('dc-drop-zone-active')).toBe(false)

      act(() => {
        fireEvent.dragOver(topDropZone)
      })

      const active = container.querySelector('.dc-row-boundary-drop-top') as HTMLElement
      expect(active.classList.contains('dc-drop-zone-active')).toBe(true)
    })

    it('should add dc-drop-zone-active to the bottom boundary on dragOver', () => {
      const { container } = render(
        <RowManagedLayout {...defaultProps} canEdit={true} />
      )

      const bottomDropZone = container.querySelector('.dc-row-boundary-drop-bottom') as HTMLElement
      act(() => {
        fireEvent.dragOver(bottomDropZone)
      })

      const active = container.querySelector('.dc-row-boundary-drop-bottom') as HTMLElement
      expect(active.classList.contains('dc-drop-zone-active')).toBe(true)
    })
  })

  describe('section banding', () => {
    const headerPortlet = (overrides = {}) =>
      createMarkdownPortlet({ id: 'header-1', ...overrides })

    const sectionRows = (): RowLayout[] => [
      createTestRow({ id: 'row-header', h: 3, columns: [{ portletId: 'header-1', w: 12 }] }),
      createTestRow({ id: 'row-body', h: 4, columns: [{ portletId: 'p1', w: 12 }] })
    ]

    const bodyPortlet = createTestPortlet({ id: 'p1' })

    it('wraps a header and the rows beneath it in one section in view mode', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          canEdit={false}
          rows={sectionRows()}
          portlets={[headerPortlet(), bodyPortlet]}
        />
      )

      const sections = container.querySelectorAll('.dc-dashboard-section')
      expect(sections).toHaveLength(1)
      expect(sections[0].querySelectorAll('.dc-row-layout-row-wrapper')).toHaveLength(2)
    })

    it('renders no section in edit mode, so the drop and resize handles keep their gap', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          canEdit
          rows={sectionRows()}
          portlets={[headerPortlet(), bodyPortlet]}
        />
      )

      expect(container.querySelector('.dc-dashboard-section')).toBeNull()
      expect(container.querySelectorAll('.dc-row-layout-row-wrapper')).toHaveLength(2)
    })

    it('renders the portlets inside a section with the sectionChild variant', () => {
      const renderPortlet = vi.fn((portlet: PortletConfig) => (
        <div data-testid={`portlet-${portlet.id}`}>{portlet.title}</div>
      ))

      render(
        <RowManagedLayout
          {...defaultProps}
          canEdit={false}
          rows={sectionRows()}
          portlets={[headerPortlet(), bodyPortlet]}
          renderPortlet={renderPortlet}
        />
      )

      expect(renderPortlet).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1' }), undefined, undefined, 'sectionChild'
      )
    })

    it('marks the section as ruled when the header draws its own bottom border', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          canEdit={false}
          rows={sectionRows()}
          portlets={[
            headerPortlet({ displayConfig: { autoHeight: true, accentBorder: 'bottom' } }),
            bodyPortlet
          ]}
        />
      )

      expect(container.querySelector('.dc-dashboard-section-ruled')).not.toBeNull()
    })

    it('leaves a header with no rows beneath it loose', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          canEdit={false}
          rows={[createTestRow({ id: 'row-header', h: 3, columns: [{ portletId: 'header-1', w: 12 }] })]}
          portlets={[headerPortlet()]}
        />
      )

      expect(container.querySelector('.dc-dashboard-section')).toBeNull()
    })

    it('does not band a half-width markdown row', () => {
      const { container } = render(
        <RowManagedLayout
          {...defaultProps}
          canEdit={false}
          rows={[
            createTestRow({ id: 'r1', h: 3, columns: [{ portletId: 'header-1', w: 6 }, { portletId: 'p2', w: 6 }] }),
            createTestRow({ id: 'r2', h: 4, columns: [{ portletId: 'p1', w: 12 }] })
          ]}
          portlets={[headerPortlet(), createMarkdownPortlet({ id: 'p2' }), bodyPortlet]}
        />
      )

      expect(container.querySelector('.dc-dashboard-section')).toBeNull()
    })
  })
})
