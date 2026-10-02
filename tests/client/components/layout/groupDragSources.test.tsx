/**
 * Drag-source isolation inside a group.
 *
 * Two draggable things nest here - the row's column wrapper and each child's
 * wrapper - and `dragstart` bubbles through both. Without stopPropagation on the
 * child, the outer handler also fires and a child drag silently moves the whole
 * group. The group's grip is deliberately not a third source: it is an
 * affordance whose dragstart bubbles up to the column wrapper, which is what
 * makes the drag carry the whole card rather than a 22px icon.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import RowManagedLayout from '../../../../src/client/components/RowManagedLayout'
import PortletGroupCard from '../../../../src/client/components/PortletGroupCard'
import type { PortletConfig, PortletGroup, RowLayout } from '../../../../src/client/types'

const GRID = { cols: 12, rowHeight: 80, minW: 2, minH: 2 }

const portlets: PortletConfig[] = [
  { id: 'a', title: 'A', w: 3, h: 3, x: 0, y: 0 },
  { id: 'b', title: 'B', w: 3, h: 3, x: 3, y: 0 }
]
const group: PortletGroup = {
  id: 'g1',
  direction: 'row',
  cells: [
    { portletIds: ['a'] },
    { portletIds: ['b'] }
  ]
}
const rows: RowLayout[] = [{ id: 'r1', h: 3, columns: [{ groupId: 'g1', w: 12 }] }]

describe('group drag source resolution', () => {
  it('child drag fires the child handler and never the column handler', () => {
    const onPortletDragStart = vi.fn()
    const onChildDragStart = vi.fn()

    const { container } = render(
      <RowManagedLayout
        rows={rows}
        portlets={portlets}
        groups={[group]}
        gridSettings={GRID}
        gridWidth={1200}
        canEdit
        isDragging={false}
        onRowResize={vi.fn()}
        onColumnResize={vi.fn()}
        onPortletDragStart={onPortletDragStart}
        onPortletDragEnd={vi.fn()}
        onRowDrop={vi.fn()}
        onNewRowDrop={vi.fn()}
        renderPortlet={() => null}
        renderGroup={(g, renderSnapBands) => (
          <PortletGroupCard
            group={g}
            portlets={new Map(portlets.map(p => [p.id, p]))}
            canEdit
            renderChild={(portlet) => (
              <div data-testid={`child-${portlet.id}`}>{portlet.title}</div>
            )}
            onRename={vi.fn()}
            onUngroup={vi.fn()}
            onDelete={vi.fn()}
            onChildDragStart={onChildDragStart}
            onChildDragEnd={vi.fn()}
            renderSnapBands={renderSnapBands}
          />
        )}
      />
    )

    const child = container.querySelector('[data-testid="child-a"]')!.parentElement!
    fireEvent.dragStart(child)

    expect(onChildDragStart).toHaveBeenCalledWith('g1', 'a', expect.anything())
    expect(onPortletDragStart).not.toHaveBeenCalled()
  })

  it('a drag started deep inside a child still resolves to that child', () => {
    const onPortletDragStart = vi.fn()
    const onChildDragStart = vi.fn()

    const { container } = render(
      <RowManagedLayout
        rows={rows}
        portlets={portlets}
        groups={[group]}
        gridSettings={GRID}
        gridWidth={1200}
        canEdit
        isDragging={false}
        onRowResize={vi.fn()}
        onColumnResize={vi.fn()}
        onPortletDragStart={onPortletDragStart}
        onPortletDragEnd={vi.fn()}
        onRowDrop={vi.fn()}
        onNewRowDrop={vi.fn()}
        renderPortlet={() => null}
        renderGroup={(g, renderSnapBands) => (
          <PortletGroupCard
            group={g}
            portlets={new Map(portlets.map(p => [p.id, p]))}
            canEdit
            renderChild={(portlet) => (
              <div>
                <span data-testid={`grip-${portlet.id}`}>grip</span>
              </div>
            )}
            onRename={vi.fn()}
            onUngroup={vi.fn()}
            onDelete={vi.fn()}
            onChildDragStart={onChildDragStart}
            onChildDragEnd={vi.fn()}
            renderSnapBands={renderSnapBands}
          />
        )}
      />
    )

    fireEvent.dragStart(container.querySelector('[data-testid="grip-b"]')!)

    expect(onChildDragStart).toHaveBeenCalledWith('g1', 'b', expect.anything())
    expect(onPortletDragStart).not.toHaveBeenCalled()
  })

  it('the group grip resolves to a whole-group drag on the column wrapper', () => {
    const onPortletDragStart = vi.fn()
    const onChildDragStart = vi.fn()

    const { container } = render(
      <RowManagedLayout
        rows={rows}
        portlets={portlets}
        groups={[group]}
        gridSettings={GRID}
        gridWidth={1200}
        canEdit
        isDragging={false}
        onRowResize={vi.fn()}
        onColumnResize={vi.fn()}
        onPortletDragStart={onPortletDragStart}
        onPortletDragEnd={vi.fn()}
        onRowDrop={vi.fn()}
        onNewRowDrop={vi.fn()}
        renderPortlet={() => null}
        renderGroup={(g, renderSnapBands) => (
          <PortletGroupCard
            group={g}
            portlets={new Map(portlets.map(p => [p.id, p]))}
            canEdit
            renderChild={(portlet) => <div>{portlet.title}</div>}
            onRename={vi.fn()}
            onUngroup={vi.fn()}
            onDelete={vi.fn()}
            onChildDragStart={onChildDragStart}
            onChildDragEnd={vi.fn()}
            renderSnapBands={renderSnapBands}
          />
        )}
      />
    )

    const grip = container.querySelector('.dc-portlet-group-drag-grip')!
    expect(grip).toBeTruthy()
    fireEvent.dragStart(grip)

    // The grip has no handler of its own, so the wrapper sees it. That column
    // hosts a group, so the portlet id is empty and the group id is set.
    expect(onPortletDragStart).toHaveBeenCalledWith(0, 0, '', expect.anything(), 'g1')
    expect(onChildDragStart).not.toHaveBeenCalled()
  })
})
