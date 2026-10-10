/**
 * Tests for PortletGroupCard - the "combination portlet" card that renders
 * several portlets snapped together inside a single frame.
 *
 * Covers the render contract (title bar vs floating toolbar, cell/stack order,
 * flex direction, even cells) and the edit affordances
 * (rename/ungroup/delete, cell resize, child drag isolation).
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HTMLAttributes } from 'react'
import PortletGroupCard from '../../../../src/client/components/PortletGroupCard'
import type { PortletConfig, PortletGroup } from '../../../../src/client/types'

function createTestPortlet(id: string, overrides: Partial<PortletConfig> = {}): PortletConfig {
  return {
    id,
    title: `Portlet ${id}`,
    query: JSON.stringify({ measures: ['Test.count'] }),
    chartType: 'bar',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    ...overrides
  }
}

function createPortletMap(ids: string[]): Map<string, PortletConfig> {
  return new Map(ids.map(id => [id, createTestPortlet(id)]))
}

function createGroup(overrides: Partial<PortletGroup> = {}): PortletGroup {
  return {
    id: 'group-1',
    direction: 'row',
    cells: [{ portletIds: ['p1'] }],
    ...overrides
  }
}

const renderChildSpy = vi.fn((portlet: PortletConfig, _wrapperProps: HTMLAttributes<HTMLDivElement>) => (
  <div data-testid={`child-${portlet.id}`}>{portlet.title}</div>
))

const defaultProps = {
  group: createGroup(),
  portlets: createPortletMap(['p1']),
  canEdit: true,
  renderChild: renderChildSpy,
  onRename: vi.fn(),
  onUngroup: vi.fn(),
  onDelete: vi.fn(),
  onChildDragStart: vi.fn(),
  onChildDragEnd: vi.fn()
}

/** Ids passed to renderChild, in the order React rendered them. */
function renderedChildIds(spy: typeof renderChildSpy): string[] {
  return spy.mock.calls.map(call => call[0].id)
}

describe('PortletGroupCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render a single dc-portlet-group carrying the group id', () => {
      const { container } = render(<PortletGroupCard {...defaultProps} />)

      const cards = container.querySelectorAll('.dc-portlet-group')
      expect(cards).toHaveLength(1)
      expect(cards[0].getAttribute('data-group-id')).toBe('group-1')
    })

    it('should render the title bar when the group has a title', () => {
      const group = createGroup({ title: 'KPI Row' })

      const { container } = render(<PortletGroupCard {...defaultProps} group={group} />)

      const titleBar = container.querySelector('.dc-portlet-group-title')
      expect(titleBar).toBeInTheDocument()
      expect(titleBar).toHaveTextContent('KPI Row')
    })

    it('should float the toolbar instead of a header when there is no title', () => {
      const { container } = render(<PortletGroupCard {...defaultProps} />)

      // An untitled group takes no header row, so its inner height is the same
      // in edit and view mode; the controls float over the card instead.
      expect(container.querySelector('.dc-portlet-group-title')).not.toBeInTheDocument()
      expect(container.querySelector('.dc-portlet-group-floating-toolbar')).toBeInTheDocument()
      expect(container.querySelector('.dc-portlet-group-drag-grip')).toBeInTheDocument()
    })

    it('should leave the grip non-draggable so dragstart reaches the column wrapper', () => {
      const { container } = render(<PortletGroupCard {...defaultProps} />)

      // The row's column wrapper is the drag source; an own-draggable grip would
      // take over as the source and drag a 22px icon instead of the whole card.
      expect(container.querySelector('.dc-portlet-group-drag-grip'))
        .not.toHaveAttribute('draggable', 'true')
    })

    it('should treat a whitespace-only title as no title', () => {
      const group = createGroup({ title: '   ' })

      const { container } = render(<PortletGroupCard {...defaultProps} group={group} />)

      expect(container.querySelector('.dc-portlet-group-title')).not.toBeInTheDocument()
      expect(container.querySelector('.dc-portlet-group-floating-toolbar')).toBeInTheDocument()
    })

    it('should render no header at all for an untitled group outside edit mode', () => {
      const { container } = render(<PortletGroupCard {...defaultProps} canEdit={false} />)

      expect(container.querySelector('.dc-portlet-group-title')).not.toBeInTheDocument()
      expect(container.querySelector('.dc-portlet-group-toolbar')).not.toBeInTheDocument()
    })

    it('should render a title bar without a toolbar when canEdit is false', () => {
      const group = createGroup({ title: 'Read only' })

      const { container } = render(
        <PortletGroupCard {...defaultProps} group={group} canEdit={false} />
      )

      expect(container.querySelector('.dc-portlet-group-title')).toHaveTextContent('Read only')
      expect(container.querySelector('.dc-portlet-group-toolbar')).not.toBeInTheDocument()
    })
  })

  describe('children', () => {
    it('should call renderChild once per portlet id in visual order', () => {
      const group = createGroup({
        cells: [
          { portletIds: ['p1', 'p2'] },
          { portletIds: ['p3'] }
        ]
      })

      render(
        <PortletGroupCard
          {...defaultProps}
          group={group}
          portlets={createPortletMap(['p1', 'p2', 'p3'])}
        />
      )

      expect(renderChildSpy).toHaveBeenCalledTimes(3)
      expect(renderedChildIds(renderChildSpy)).toEqual(['p1', 'p2', 'p3'])
      expect(screen.getByTestId('child-p1')).toBeInTheDocument()
      expect(screen.getByTestId('child-p3')).toBeInTheDocument()
    })

    it('should skip a child whose portlet is missing from the map without throwing', () => {
      const group = createGroup({
        cells: [{ portletIds: ['p1', 'missing', 'p2'] }]
      })

      expect(() =>
        render(
          <PortletGroupCard
            {...defaultProps}
            group={group}
            portlets={createPortletMap(['p1', 'p2'])}
          />
        )
      ).not.toThrow()

      expect(renderedChildIds(renderChildSpy)).toEqual(['p1', 'p2'])
      expect(screen.queryByTestId('child-missing')).not.toBeInTheDocument()
    })

    it('should invoke renderSnapBands per rendered child', () => {
      const renderSnapBands = vi.fn((portletId: string) => (
        <div data-testid={`bands-${portletId}`} />
      ))
      const group = createGroup({
        cells: [
          { portletIds: ['p1'] },
          { portletIds: ['p2'] }
        ]
      })

      render(
        <PortletGroupCard
          {...defaultProps}
          group={group}
          portlets={createPortletMap(['p1', 'p2'])}
          renderSnapBands={renderSnapBands}
        />
      )

      expect(renderSnapBands).toHaveBeenCalledTimes(2)
      expect(renderSnapBands).toHaveBeenCalledWith('p1')
      expect(renderSnapBands).toHaveBeenCalledWith('p2')
      expect(screen.getByTestId('bands-p1')).toBeInTheDocument()
      expect(screen.getByTestId('bands-p2')).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('should lay the body out as a row for direction row', () => {
      const group = createGroup({ direction: 'row' })

      const { container } = render(<PortletGroupCard {...defaultProps} group={group} />)

      const body = container.querySelector('.dc-portlet-group-body') as HTMLElement
      expect(body.style.flexDirection).toBe('row')
    })

    it('should lay the body out as a column for direction column', () => {
      const group = createGroup({ direction: 'column' })

      const { container } = render(<PortletGroupCard {...defaultProps} group={group} />)

      const body = container.querySelector('.dc-portlet-group-body') as HTMLElement
      expect(body.style.flexDirection).toBe('column')
    })

    it('should give every cell an equal share of the main axis', () => {
      // Cells are evenly distributed; there is no per-cell size to set or drag.
      const group = createGroup({
        cells: [{ portletIds: ['p1'] }, { portletIds: ['p2'] }]
      })

      const { container } = render(
        <PortletGroupCard
          {...defaultProps}
          group={group}
          portlets={createPortletMap(['p1', 'p2'])}
        />
      )

      const cells = [...container.querySelectorAll('.dc-portlet-group-cell')] as HTMLElement[]
      expect(cells).toHaveLength(2)
      for (const cell of cells) expect(cell.style.flexGrow).toBe('1')
    })

    it('should stack cell children on the axis perpendicular to the group direction', () => {
      const group = createGroup({
        direction: 'row',
        cells: [{ portletIds: ['p1'] }]
      })

      const { container } = render(<PortletGroupCard {...defaultProps} group={group} />)

      const cell = container.querySelector('.dc-portlet-group-cell') as HTMLElement
      expect(cell.style.flexDirection).toBe('column')
    })
  })

  describe('cell sizing', () => {
    it('should render no cell resize handles - cells are always even', () => {
      const group = createGroup({
        cells: [
          { portletIds: ['p1'] },
          { portletIds: ['p2'] },
          { portletIds: ['p3'] }
        ]
      })

      const { container } = render(
        <PortletGroupCard
          {...defaultProps}
          group={group}
          portlets={createPortletMap(['p1', 'p2', 'p3'])}
        />
      )

      expect(container.querySelectorAll('.dc-portlet-group-resize')).toHaveLength(0)
      expect(container.querySelectorAll('.dc-portlet-group-cell')).toHaveLength(3)
    })
  })

  describe('toolbar actions', () => {
    it('should call onUngroup with the group id', () => {
      const onUngroup = vi.fn()

      render(<PortletGroupCard {...defaultProps} onUngroup={onUngroup} />)

      fireEvent.click(screen.getByTitle('Ungroup'))

      expect(onUngroup).toHaveBeenCalledWith('group-1')
    })

    it('should call onDelete with the group id', () => {
      const onDelete = vi.fn()

      render(<PortletGroupCard {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByTitle('Delete group'))

      expect(onDelete).toHaveBeenCalledWith('group-1')
    })
  })

  describe('rename', () => {
    it('should show an input when rename is clicked', () => {
      const { container } = render(<PortletGroupCard {...defaultProps} />)

      expect(container.querySelector('.dc-portlet-group-title input')).not.toBeInTheDocument()

      fireEvent.click(screen.getByTitle('Rename group'))

      const input = container.querySelector('.dc-portlet-group-title input')
      expect(input).toBeInTheDocument()
      expect(container.querySelector('.dc-portlet-group-floating-toolbar')).not.toBeInTheDocument()
    })

    it('should seed the input with the current title', () => {
      const group = createGroup({ title: 'Revenue' })

      const { container } = render(<PortletGroupCard {...defaultProps} group={group} />)

      fireEvent.click(screen.getByTitle('Rename group'))

      const input = container.querySelector('.dc-portlet-group-title input') as HTMLInputElement
      expect(input.value).toBe('Revenue')
    })

    it('should call onRename on Enter', () => {
      const onRename = vi.fn()

      const { container } = render(<PortletGroupCard {...defaultProps} onRename={onRename} />)

      fireEvent.click(screen.getByTitle('Rename group'))
      const input = container.querySelector('.dc-portlet-group-title input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'New title' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onRename).toHaveBeenCalledWith('group-1', 'New title')
      expect(container.querySelector('.dc-portlet-group-title input')).not.toBeInTheDocument()
    })

    it('should call onRename on blur', () => {
      const onRename = vi.fn()

      const { container } = render(<PortletGroupCard {...defaultProps} onRename={onRename} />)

      fireEvent.click(screen.getByTitle('Rename group'))
      const input = container.querySelector('.dc-portlet-group-title input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Blurred title' } })
      fireEvent.blur(input)

      expect(onRename).toHaveBeenCalledWith('group-1', 'Blurred title')
    })

    it('should not call onRename when the title is unchanged', () => {
      const onRename = vi.fn()
      const group = createGroup({ title: 'Same' })

      const { container } = render(
        <PortletGroupCard {...defaultProps} group={group} onRename={onRename} />
      )

      fireEvent.click(screen.getByTitle('Rename group'))
      const input = container.querySelector('.dc-portlet-group-title input') as HTMLInputElement
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onRename).not.toHaveBeenCalled()
    })

    it('should cancel on Escape without calling onRename', () => {
      const onRename = vi.fn()

      const { container } = render(<PortletGroupCard {...defaultProps} onRename={onRename} />)

      fireEvent.click(screen.getByTitle('Rename group'))
      const input = container.querySelector('.dc-portlet-group-title input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Discard me' } })
      fireEvent.keyDown(input, { key: 'Escape' })

      expect(onRename).not.toHaveBeenCalled()
      expect(container.querySelector('.dc-portlet-group-title input')).not.toBeInTheDocument()
    })
  })

  describe('child drag', () => {
    it('should call onChildDragStart with the group id, portlet id and event', () => {
      const onChildDragStart = vi.fn()

      render(<PortletGroupCard {...defaultProps} onChildDragStart={onChildDragStart} />)

      const childWrapper = screen.getByTestId('child-p1').parentElement as HTMLDivElement
      fireEvent.dragStart(childWrapper)

      expect(onChildDragStart).toHaveBeenCalledWith('group-1', 'p1', expect.anything())
    })

    it('should not bubble a child dragstart to a parent drag handler', () => {
      const parentSpy = vi.fn()
      const onChildDragStart = vi.fn()

      render(
        <div onDragStart={parentSpy} draggable>
          <PortletGroupCard {...defaultProps} onChildDragStart={onChildDragStart} />
        </div>
      )

      const childWrapper = screen.getByTestId('child-p1').parentElement as HTMLDivElement
      fireEvent.dragStart(childWrapper)

      expect(onChildDragStart).toHaveBeenCalledTimes(1)
      expect(parentSpy).not.toHaveBeenCalled()
    })

    it('should call onChildDragEnd without bubbling to a parent drag handler', () => {
      const parentSpy = vi.fn()
      const onChildDragEnd = vi.fn()

      render(
        <div onDragEnd={parentSpy} draggable>
          <PortletGroupCard {...defaultProps} onChildDragEnd={onChildDragEnd} />
        </div>
      )

      const childWrapper = screen.getByTestId('child-p1').parentElement as HTMLDivElement
      fireEvent.dragEnd(childWrapper)

      expect(onChildDragEnd).toHaveBeenCalledTimes(1)
      expect(parentSpy).not.toHaveBeenCalled()
    })

    it('should only make children draggable when canEdit is true', () => {
      const { rerender } = render(<PortletGroupCard {...defaultProps} />)

      expect(screen.getByTestId('child-p1').parentElement).toHaveAttribute('draggable', 'true')

      rerender(<PortletGroupCard {...defaultProps} canEdit={false} />)

      expect(screen.getByTestId('child-p1').parentElement).toHaveAttribute('draggable', 'false')
    })
  })
})
