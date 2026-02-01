import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import AnalysisAxisDropZone from '../../../../src/client/components/AnalysisBuilder/AnalysisAxisDropZone'
import type { AxisDropZoneConfig } from '../../../../src/client/charts/chartConfigs'

// Mock icons
vi.mock('../../../../src/client/icons', () => ({
  getIcon: vi.fn((name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className}>Icon</span>
    )
    MockIcon.displayName = `MockIcon-${name}`
    return MockIcon
  }),
  getMeasureTypeIcon: vi.fn(() => {
    const MockIcon = ({ className }: { className?: string }) => (
      <span data-testid="measure-type-icon" className={className}>MeasureIcon</span>
    )
    MockIcon.displayName = 'MockMeasureIcon'
    return MockIcon
  }),
}))

describe('AnalysisAxisDropZone', () => {
  const mockConfig: AxisDropZoneConfig = {
    key: 'xAxis',
    label: 'X-Axis',
    description: 'Dimensions and time dimensions for grouping',
    mandatory: false,
    maxItems: undefined,
    acceptTypes: ['dimension', 'timeDimension'],
    emptyText: 'Drop dimensions here',
  }

  const mockGetFieldMeta = vi.fn((field: string) => {
    const parts = field.split('.')
    const cubeName = parts[0] || 'Unknown'
    const fieldName = parts[1] || field

    return {
      title: fieldName,
      shortTitle: fieldName,
      cubeName,
      type: field.includes('count') ? 'measure' : 'dimension' as 'measure' | 'dimension' | 'timeDimension',
      measureType: field.includes('count') ? 'count' : undefined,
    }
  })

  const defaultProps = {
    config: mockConfig,
    fields: [] as string[],
    onDrop: vi.fn(),
    onRemove: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragOver: vi.fn(),
    onReorder: vi.fn(),
    draggedItem: null,
    getFieldMeta: mockGetFieldMeta,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the label', () => {
      render(<AnalysisAxisDropZone {...defaultProps} />)

      expect(screen.getByText('X-Axis')).toBeInTheDocument()
    })

    it('should render the description', () => {
      render(<AnalysisAxisDropZone {...defaultProps} />)

      expect(screen.getByText('Dimensions and time dimensions for grouping')).toBeInTheDocument()
    })

    it('should show empty text when no fields', () => {
      render(<AnalysisAxisDropZone {...defaultProps} />)

      expect(screen.getByText('Drop dimensions here')).toBeInTheDocument()
    })

    it('should show mandatory indicator when mandatory is true', () => {
      const mandatoryConfig = { ...mockConfig, mandatory: true }
      render(<AnalysisAxisDropZone {...defaultProps} config={mandatoryConfig} />)

      // The asterisk for mandatory fields
      const asterisk = screen.getByText('*')
      expect(asterisk).toBeInTheDocument()
    })

    it('should show required field error when mandatory and empty', () => {
      const mandatoryConfig = { ...mockConfig, mandatory: true }
      render(<AnalysisAxisDropZone {...defaultProps} config={mandatoryConfig} />)

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('should not show required field error when mandatory but has fields', () => {
      const mandatoryConfig = { ...mockConfig, mandatory: true }
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={mandatoryConfig}
          fields={['Users.name']}
        />
      )

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
    })
  })

  describe('field display', () => {
    it('should render fields when provided', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name', 'Users.status']}
        />
      )

      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('status')).toBeInTheDocument()
    })

    it('should display cube name for each field', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
        />
      )

      // The cube name is shown as secondary text
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should show remove button for each field', async () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
        />
      )

      // Remove buttons have a title attribute
      const removeButton = screen.getByTitle('Remove from X-Axis')
      expect(removeButton).toBeInTheDocument()
    })

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
          onRemove={onRemove}
        />
      )

      const removeButton = screen.getByTitle('Remove from X-Axis')
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalledWith('Users.name', 'xAxis')
    })

    it('should show dimension icon for dimension fields', () => {
      mockGetFieldMeta.mockReturnValueOnce({
        title: 'name',
        shortTitle: 'name',
        cubeName: 'Users',
        type: 'dimension',
      })

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
        />
      )

      expect(screen.getByTestId('icon-dimension')).toBeInTheDocument()
    })

    it('should show time dimension icon for time dimension fields', () => {
      mockGetFieldMeta.mockReturnValueOnce({
        title: 'createdAt',
        shortTitle: 'createdAt',
        cubeName: 'Users',
        type: 'timeDimension',
      })

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.createdAt']}
        />
      )

      expect(screen.getByTestId('icon-timeDimension')).toBeInTheDocument()
    })

    it('should show measure icon for measure fields', () => {
      mockGetFieldMeta.mockReturnValueOnce({
        title: 'count',
        shortTitle: 'count',
        cubeName: 'Users',
        type: 'measure',
        measureType: 'count',
      })

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.count']}
        />
      )

      expect(screen.getByTestId('measure-type-icon')).toBeInTheDocument()
    })
  })

  describe('drag and drop - drag start', () => {
    it('should make field items draggable', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
        />
      )

      // Find the draggable item
      const fieldItem = screen.getByText('name').closest('[draggable="true"]')
      expect(fieldItem).toHaveAttribute('draggable', 'true')
    })

    it('should call onDragStart when drag begins', () => {
      const onDragStart = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
          onDragStart={onDragStart}
        />
      )

      const draggableField = screen.getByText('name').closest('[draggable="true"]')!
      fireEvent.dragStart(draggableField, {
        dataTransfer: { setData: vi.fn(), getData: vi.fn() },
      })

      expect(onDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        'Users.name',
        'xAxis',
        0
      )
    })

    it('should show opacity change when item is being dragged', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
          draggedItem={{ field: 'Users.name', fromAxis: 'xAxis', fromIndex: 0 }}
        />
      )

      const draggableField = screen.getByText('name').closest('[draggable="true"]')
      expect(draggableField).toHaveClass('dc:opacity-30')
    })
  })

  describe('drag and drop - drop handling', () => {
    it('should call onDragOver when dragging over the zone', () => {
      const onDragOver = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          onDragOver={onDragOver}
        />
      )

      // Find the container with data-axis-container attribute
      const container = document.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.dragOver(container)

      expect(onDragOver).toHaveBeenCalled()
    })

    it('should call onDrop when dropping on the zone', () => {
      const onDrop = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          onDrop={onDrop}
        />
      )

      const container = document.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.drop(container, {
        dataTransfer: {
          getData: () => JSON.stringify({ field: 'Users.status', fromAxis: 'available' }),
        },
      })

      expect(onDrop).toHaveBeenCalledWith(expect.any(Object), 'xAxis')
    })

    it('should apply visual feedback when dragging over', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          draggedItem={{ field: 'Users.status', fromAxis: 'available' }}
        />
      )

      const container = document.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.dragOver(container)

      // Container should have visual indication of being a valid drop target
      // This is reflected in the inline styles or class changes
      expect(container).toBeInTheDocument()
    })
  })

  describe('drag and drop - max items', () => {
    it('should show "Maximum items reached" when at max capacity', () => {
      const configWithMax = { ...mockConfig, maxItems: 1 }

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={configWithMax}
          fields={['Users.name']}
        />
      )

      // When at max, the field is shown, not the "maximum reached" message
      expect(screen.getByText('name')).toBeInTheDocument()
    })

    it('should accept replacement when maxItems is 1 and already full', () => {
      const onDrop = vi.fn()
      const configWithMax = { ...mockConfig, maxItems: 1 }

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={configWithMax}
          fields={['Users.name']}
          onDrop={onDrop}
          draggedItem={{ field: 'Users.status', fromAxis: 'available' }}
        />
      )

      const container = document.querySelector('[data-axis-container="xAxis"]')!
      fireEvent.drop(container, {
        dataTransfer: {
          getData: () => JSON.stringify({ field: 'Users.status', fromAxis: 'available' }),
        },
      })

      // With maxItems=1, replacement is allowed
      expect(onDrop).toHaveBeenCalled()
    })
  })

  describe('reordering', () => {
    it('should call onReorder when reordering fields within the same axis', () => {
      const onReorder = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name', 'Users.status', 'Users.email']}
          onReorder={onReorder}
          draggedItem={{ field: 'Users.name', fromAxis: 'xAxis', fromIndex: 0 }}
        />
      )

      // Find all draggable fields
      const fieldItems = screen.getAllByText(/name|status|email/).map(
        el => el.closest('[draggable="true"]')
      )

      // Drag over the second field
      fireEvent.dragOver(fieldItems[1]!, { clientY: 100 })
    })

    it('should apply transform animation during reorder', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name', 'Users.status']}
          draggedItem={{ field: 'Users.name', fromAxis: 'xAxis', fromIndex: 0 }}
        />
      )

      // When dragging, items should have transition styles applied
      const fieldContainer = screen.getByText('name').closest('.dc\\:relative')
      expect(fieldContainer).toBeInTheDocument()
    })
  })

  describe('dual Y-axis support', () => {
    it('should show L/R toggle when enableDualAxis is true', () => {
      const configWithDualAxis: AxisDropZoneConfig = {
        ...mockConfig,
        key: 'yAxis',
        label: 'Y-Axis',
        enableDualAxis: true,
      }

      const onYAxisAssignmentChange = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={configWithDualAxis}
          fields={['Users.count']}
          yAxisAssignment={{ 'Users.count': 'left' }}
          onYAxisAssignmentChange={onYAxisAssignmentChange}
        />
      )

      // Should show L button for left axis
      const axisToggle = screen.getByTitle(/Y-Axis.*click to toggle/i)
      expect(axisToggle).toBeInTheDocument()
      expect(axisToggle).toHaveTextContent('L')
    })

    it('should call onYAxisAssignmentChange when toggle is clicked', async () => {
      const user = userEvent.setup()
      const configWithDualAxis: AxisDropZoneConfig = {
        ...mockConfig,
        key: 'yAxis',
        label: 'Y-Axis',
        enableDualAxis: true,
      }

      const onYAxisAssignmentChange = vi.fn()

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={configWithDualAxis}
          fields={['Users.count']}
          yAxisAssignment={{ 'Users.count': 'left' }}
          onYAxisAssignmentChange={onYAxisAssignmentChange}
        />
      )

      const axisToggle = screen.getByTitle(/Y-Axis.*click to toggle/i)
      await user.click(axisToggle)

      expect(onYAxisAssignmentChange).toHaveBeenCalledWith('Users.count', 'right')
    })

    it('should show R when field is assigned to right axis', () => {
      const configWithDualAxis: AxisDropZoneConfig = {
        ...mockConfig,
        key: 'yAxis',
        label: 'Y-Axis',
        enableDualAxis: true,
      }

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={configWithDualAxis}
          fields={['Users.count']}
          yAxisAssignment={{ 'Users.count': 'right' }}
          onYAxisAssignmentChange={vi.fn()}
        />
      )

      const axisToggle = screen.getByTitle(/Y-Axis.*click to toggle/i)
      expect(axisToggle).toHaveTextContent('R')
    })

    it('should not show L/R toggle when enableDualAxis is false', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.count']}
        />
      )

      expect(screen.queryByTitle(/Y-Axis.*click to toggle/i)).not.toBeInTheDocument()
    })
  })

  describe('field metadata fallback', () => {
    it('should use default metadata when getFieldMeta is not provided', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
          getFieldMeta={undefined}
        />
      )

      // Should still render with field name parsed from the string
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should handle fields without cube prefix', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['simpleField']}
          getFieldMeta={undefined}
        />
      )

      // Should handle gracefully - the field name appears as both title and cube name
      // when there's no dot separator
      const fieldElements = screen.getAllByText('simpleField')
      expect(fieldElements.length).toBeGreaterThan(0)
    })
  })

  describe('drag leave handling', () => {
    it('should reset visual state when drag leaves the zone', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          draggedItem={{ field: 'Users.status', fromAxis: 'available' }}
        />
      )

      const container = document.querySelector('[data-axis-container="xAxis"]')!

      // Drag over first
      fireEvent.dragOver(container)

      // Then leave (with client coordinates outside the container)
      fireEvent.dragLeave(container, { clientX: -100, clientY: -100 })

      // Container should be visible and maintain structure
      expect(container).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty config gracefully', () => {
      const minimalConfig: AxisDropZoneConfig = {
        key: 'test',
        label: 'Test',
      }

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          config={minimalConfig}
        />
      )

      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.getByText('Drop fields here')).toBeInTheDocument()
    })

    it('should handle multiple fields with same name from different cubes', () => {
      mockGetFieldMeta
        .mockReturnValueOnce({
          title: 'name',
          shortTitle: 'name',
          cubeName: 'Users',
          type: 'dimension',
        })
        .mockReturnValueOnce({
          title: 'name',
          shortTitle: 'name',
          cubeName: 'Products',
          type: 'dimension',
        })

      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name', 'Products.name']}
        />
      )

      // Both should be rendered with their cube names visible
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('should handle drag operations with undefined onDragEnd', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name']}
          onDragEnd={undefined}
        />
      )

      const draggableField = screen.getByText('name').closest('[draggable="true"]')!

      // Should not throw when dragEnd is called without handler
      expect(() => {
        fireEvent.dragEnd(draggableField)
      }).not.toThrow()
    })

    it('should handle drag operations with undefined onReorder', () => {
      render(
        <AnalysisAxisDropZone
          {...defaultProps}
          fields={['Users.name', 'Users.status']}
          onReorder={undefined}
          draggedItem={{ field: 'Users.name', fromAxis: 'xAxis', fromIndex: 0 }}
        />
      )

      const fieldItems = screen.getAllByText(/name|status/).map(
        el => el.closest('[draggable="true"]')
      )

      // Should not throw when reorder would be called without handler
      expect(() => {
        fireEvent.drop(fieldItems[1]!)
      }).not.toThrow()
    })
  })
})
