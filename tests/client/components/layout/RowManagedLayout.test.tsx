/**
 * Tests for RowManagedLayout component
 * Covers row-based dashboard layout with drag and drop, resize functionality
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RowManagedLayout from '../../../../src/client/components/RowManagedLayout'
import type { PortletConfig, RowLayout, DashboardGridSettings } from '../../../../src/client/types'

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

    it('should pass containerProps to renderPortlet', () => {
      const renderPortlet = vi.fn((portlet: PortletConfig, containerProps: any) => (
        <div
          data-testid={`portlet-${portlet.id}`}
          data-draggable={containerProps?.draggable}
          className={containerProps?.className}
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

      const portletElement = screen.getByTestId('portlet-p1')
      expect(portletElement).toHaveAttribute('data-draggable', 'true')
      expect(portletElement.className).toContain('dc-row-layout-column')
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
      const { container, rerender } = render(
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
      const renderPortlet = vi.fn((portlet: PortletConfig, containerProps: any) => (
        <div
          data-testid={`portlet-${portlet.id}`}
          {...containerProps}
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

      const portletElement = screen.getByTestId('portlet-p1')
      fireEvent.dragStart(portletElement)

      expect(onPortletDragStart).toHaveBeenCalledWith(0, 0, 'p1', expect.any(Object))
    })

    it('should call onPortletDragEnd when portlet drag ends', () => {
      const onPortletDragEnd = vi.fn()
      const renderPortlet = vi.fn((portlet: PortletConfig, containerProps: any) => (
        <div
          data-testid={`portlet-${portlet.id}`}
          {...containerProps}
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

      const portletElement = screen.getByTestId('portlet-p1')
      fireEvent.dragEnd(portletElement)

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
