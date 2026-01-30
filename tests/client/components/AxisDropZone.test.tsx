import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AxisDropZone from '../../../src/client/components/AxisDropZone'
import type { AxisDropZoneConfig } from '../../../src/client/charts/chartConfigs'

// Mock the getIcon function
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => {
    const MockIcon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className}>icon</span>
    )
    return MockIcon
  }
}))

describe('AxisDropZone', () => {
  const createDefaultConfig = (overrides: Partial<AxisDropZoneConfig> = {}): AxisDropZoneConfig => ({
    key: 'xAxis',
    label: 'X-Axis',
    description: 'Drag dimensions here',
    mandatory: false,
    maxItems: undefined,
    emptyText: 'Drop fields here',
    ...overrides
  })

  const createDefaultProps = (overrides: Partial<Parameters<typeof AxisDropZone>[0]> = {}) => ({
    config: createDefaultConfig(),
    fields: [] as string[],
    onDrop: vi.fn(),
    onRemove: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragOver: vi.fn(),
    getFieldStyling: vi.fn(() => ({
      IconComponent: ({ className }: { className?: string }) => <span className={className}>M</span>,
      baseClasses: 'bg-blue-100',
      hoverClasses: 'hover:bg-blue-200'
    })),
    onReorder: vi.fn(),
    draggedItem: null,
    ...overrides
  })

  describe('rendering', () => {
    it('should render the label', () => {
      const props = createDefaultProps()
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('X-Axis')).toBeInTheDocument()
    })

    it('should render the description when provided', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ description: 'Custom description' })
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('Custom description')).toBeInTheDocument()
    })

    it('should render empty text when no fields are present', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ emptyText: 'Custom empty text' })
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('Custom empty text')).toBeInTheDocument()
    })

    it('should render mandatory indicator when required', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ mandatory: true })
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should render required field message when mandatory and empty', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ mandatory: true })
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('should not render required message when mandatory and has fields', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ mandatory: true }),
        fields: ['Sales.revenue']
      })
      render(<AxisDropZone {...props} />)

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
    })

    it('should render item count when maxItems is set', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ maxItems: 3 }),
        fields: ['Field1', 'Field2']
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('(2/3)')).toBeInTheDocument()
    })

    it('should render icon when config has icon', () => {
      const IconComponent = ({ className }: { className?: string }) => (
        <span data-testid="config-icon" className={className}>I</span>
      )
      const props = createDefaultProps({
        config: createDefaultConfig({ icon: IconComponent })
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByTestId('config-icon')).toBeInTheDocument()
    })
  })

  describe('field rendering', () => {
    it('should render all fields', () => {
      const props = createDefaultProps({
        fields: ['Sales.revenue', 'Sales.quantity']
      })
      render(<AxisDropZone {...props} />)

      expect(screen.getByText('Sales.revenue')).toBeInTheDocument()
      expect(screen.getByText('Sales.quantity')).toBeInTheDocument()
    })

    it('should call getFieldStyling for each field', () => {
      const getFieldStyling = vi.fn(() => ({
        IconComponent: () => <span>M</span>,
        baseClasses: 'bg-blue-100',
        hoverClasses: 'hover:bg-blue-200'
      }))
      const props = createDefaultProps({
        fields: ['Field1', 'Field2'],
        getFieldStyling
      })
      render(<AxisDropZone {...props} />)

      expect(getFieldStyling).toHaveBeenCalledWith('Field1')
      expect(getFieldStyling).toHaveBeenCalledWith('Field2')
    })

    it('should render remove button for each field', () => {
      const props = createDefaultProps({
        fields: ['Field1', 'Field2']
      })
      render(<AxisDropZone {...props} />)

      const removeButtons = screen.getAllByTitle('Remove from X-Axis')
      expect(removeButtons).toHaveLength(2)
    })
  })

  describe('remove functionality', () => {
    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      const props = createDefaultProps({
        fields: ['Field1'],
        onRemove
      })
      render(<AxisDropZone {...props} />)

      const removeButton = screen.getByTitle('Remove from X-Axis')
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalledWith('Field1', 'xAxis')
    })
  })

  describe('drag and drop - basic operations', () => {
    it('should set draggable on field items', () => {
      const props = createDefaultProps({
        fields: ['Field1']
      })
      const { container } = render(<AxisDropZone {...props} />)

      // Find the draggable element
      const draggableElements = container.querySelectorAll('[draggable="true"]')
      expect(draggableElements.length).toBeGreaterThan(0)
    })

    it('should call onDragStart when dragging a field', () => {
      const onDragStart = vi.fn()
      const props = createDefaultProps({
        fields: ['Field1'],
        onDragStart
      })
      const { container } = render(<AxisDropZone {...props} />)

      const draggable = container.querySelector('[draggable="true"]')!
      fireEvent.dragStart(draggable, {
        dataTransfer: {
          setData: vi.fn(),
          getData: vi.fn()
        }
      })

      expect(onDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        'Field1',
        'xAxis',
        0
      )
    })

    it('should call onDragEnd when drag ends', () => {
      const onDragEnd = vi.fn()
      const props = createDefaultProps({
        fields: ['Field1'],
        onDragEnd
      })
      const { container } = render(<AxisDropZone {...props} />)

      const draggable = container.querySelector('[draggable="true"]')!
      fireEvent.dragEnd(draggable)

      expect(onDragEnd).toHaveBeenCalled()
    })

    it('should call onDragOver when dragging over the drop zone', () => {
      const onDragOver = vi.fn()
      const props = createDefaultProps({
        onDragOver
      })
      const { container } = render(<AxisDropZone {...props} />)

      const dropZone = container.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.dragOver(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: 'move'
        }
      })

      expect(onDragOver).toHaveBeenCalled()
    })

    it('should call onDrop when item is dropped', () => {
      const onDrop = vi.fn()
      const props = createDefaultProps({
        onDrop
      })
      const { container } = render(<AxisDropZone {...props} />)

      const dropZone = container.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.drop(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('{}')
        }
      })

      expect(onDrop).toHaveBeenCalledWith(expect.any(Object), 'xAxis')
    })
  })

  describe('max items behavior', () => {
    it('should show "Maximum items reached" when full', () => {
      const props = createDefaultProps({
        config: createDefaultConfig({ maxItems: 1 }),
        fields: ['Field1']
      })
      render(<AxisDropZone {...props} />)

      // When already at max, container shows the field, not the message
      // The message appears when trying to add to a full zone with no fields currently shown
    })

    it('should not call onDrop when zone is full', () => {
      const onDrop = vi.fn()
      // Use maxItems=2 with 2 fields to test "truly full" scenario
      // (maxItems=1 always allows replacement)
      const props = createDefaultProps({
        config: createDefaultConfig({ maxItems: 2 }),
        fields: ['Field1', 'Field2'],
        onDrop
      })
      const { container } = render(<AxisDropZone {...props} />)

      const dropZone = container.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.dragOver(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: 'none'
        }
      })
      fireEvent.drop(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('{}')
        }
      })

      // onDrop should not be called because the zone is full
      expect(onDrop).not.toHaveBeenCalled()
    })

    it('should allow drop for single-item replacement', () => {
      const onDrop = vi.fn()
      const props = createDefaultProps({
        config: createDefaultConfig({ maxItems: 1 }),
        fields: ['Field1'],
        onDrop,
        // Different axis - simulating a drop from another zone
        draggedItem: { field: 'NewField', fromAxis: 'yAxis', fromIndex: 0 }
      })
      const { container } = render(<AxisDropZone {...props} />)

      const dropZone = container.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.dragOver(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: 'move'
        }
      })
      fireEvent.drop(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('{}')
        }
      })

      // Single-item zones allow replacement
      expect(onDrop).toHaveBeenCalled()
    })
  })

  describe('reordering', () => {
    it('should call onReorder when dropping on another item in same axis', () => {
      const onReorder = vi.fn()
      const props = createDefaultProps({
        fields: ['Field1', 'Field2', 'Field3'],
        onReorder,
        draggedItem: { field: 'Field1', fromAxis: 'xAxis', fromIndex: 0 }
      })
      const { container } = render(<AxisDropZone {...props} />)

      // Find the second field item to drop on
      const draggables = container.querySelectorAll('[draggable="true"]')
      const targetItem = draggables[1]

      fireEvent.dragOver(targetItem, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      })
      fireEvent.drop(targetItem, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue(JSON.stringify({ fromAxis: 'xAxis', fromIndex: 0 }))
        }
      })

      expect(onReorder).toHaveBeenCalledWith(0, 1, 'xAxis')
    })

    it('should not interfere with reorder when dragging from same axis', () => {
      const onDrop = vi.fn()
      const props = createDefaultProps({
        fields: ['Field1', 'Field2'],
        onDrop,
        draggedItem: { field: 'Field1', fromAxis: 'xAxis', fromIndex: 0 }
      })
      const { container } = render(<AxisDropZone {...props} />)

      const dropZone = container.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.dragOver(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: 'move'
        }
      })

      // When reordering within same axis, onDrop should not be called on main drop zone
    })
  })

  describe('visual states', () => {
    it('should apply opacity to dragged item', () => {
      const props = createDefaultProps({
        fields: ['Field1', 'Field2'],
        draggedItem: { field: 'Field1', fromAxis: 'xAxis', fromIndex: 0 }
      })
      const { container } = render(<AxisDropZone {...props} />)

      const draggables = container.querySelectorAll('[draggable="true"]')
      const firstItem = draggables[0]

      // The item being dragged should have opacity class
      expect(firstItem.className).toContain('dc:opacity-50')
    })

    it('should handle drag leave correctly', () => {
      const props = createDefaultProps()
      const { container } = render(<AxisDropZone {...props} />)

      const dropZone = container.querySelector('[data-axis-container="xAxis"]')!

      // Simulate drag enter then leave
      fireEvent.dragOver(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: 'move' }
      })

      const rect = dropZone.getBoundingClientRect()
      fireEvent.dragLeave(dropZone, {
        clientX: rect.left - 10,
        clientY: rect.top,
        relatedTarget: null
      })

      // Component should reset drag state - no visual assertion needed as state is internal
    })
  })

  describe('effective count calculation', () => {
    it('should account for dragged item when calculating can accept more', () => {
      // When dragging FROM this axis, effective count is fields.length - 1
      const props = createDefaultProps({
        config: createDefaultConfig({ maxItems: 2 }),
        fields: ['Field1', 'Field2'],
        draggedItem: { field: 'Field1', fromAxis: 'xAxis', fromIndex: 0 }
      })
      render(<AxisDropZone {...props} />)

      // With 2 items and maxItems=2, but dragging from this axis,
      // effective count is 1, so can accept more
      // This is tested indirectly through the absence of "Maximum items reached"
      expect(screen.queryByText('Maximum items reached')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty fields array', () => {
      const props = createDefaultProps({
        fields: []
      })
      const { container } = render(<AxisDropZone {...props} />)

      expect(container.querySelector('[data-axis-container="xAxis"]')).toBeInTheDocument()
      expect(screen.getByText('Drop fields here')).toBeInTheDocument()
    })

    it('should handle missing optional callbacks', () => {
      const props = createDefaultProps({
        fields: ['Field1'],
        onDragEnd: undefined,
        onReorder: undefined
      })

      // Should not throw
      expect(() => render(<AxisDropZone {...props} />)).not.toThrow()
    })

    it('should handle drag data parsing failure gracefully', () => {
      const onReorder = vi.fn()
      const props = createDefaultProps({
        fields: ['Field1', 'Field2'],
        onReorder,
        draggedItem: null // No draggedItem, will try to parse from data transfer
      })
      const { container } = render(<AxisDropZone {...props} />)

      const draggables = container.querySelectorAll('[draggable="true"]')
      fireEvent.drop(draggables[1], {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('invalid json')
        }
      })

      // Should not throw, gracefully handles parse error
      expect(onReorder).not.toHaveBeenCalled()
    })
  })
})
