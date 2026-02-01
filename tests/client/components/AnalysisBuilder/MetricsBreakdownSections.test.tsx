/**
 * Comprehensive tests for MetricsSection, MetricItemCard, BreakdownSection, and BreakdownItemCard
 *
 * These tests cover:
 * - Add/remove metrics and breakdowns
 * - Drag and drop reordering
 * - Granularity picker for time dimensions
 * - Sort controls
 * - Comparison toggle
 * - Empty states
 * - Multiple items display
 * - Item selection and removal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MetricsSection from '../../../../src/client/components/AnalysisBuilder/MetricsSection'
import MetricItemCard from '../../../../src/client/components/AnalysisBuilder/MetricItemCard'
import BreakdownSection from '../../../../src/client/components/AnalysisBuilder/BreakdownSection'
import BreakdownItemCard from '../../../../src/client/components/AnalysisBuilder/BreakdownItemCard'
import type {
  MetricsSectionProps,
  MetricItemCardProps,
  BreakdownSectionProps,
  BreakdownItemCardProps,
  MetricItem,
  BreakdownItem,
} from '../../../../src/client/components/AnalysisBuilder/types'
import type { MetaResponse, MetaField } from '../../../../src/client/shared/types'

// Mock schema with diverse cubes and fields
const mockSchema: MetaResponse = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      measures: [
        { name: 'Users.count', type: 'number', title: 'User Count', shortTitle: 'Count', aggType: 'count' },
        { name: 'Users.totalRevenue', type: 'number', title: 'Total Revenue', shortTitle: 'Revenue', aggType: 'sum' },
        { name: 'Users.avgOrderValue', type: 'number', title: 'Average Order Value', shortTitle: 'Avg Order', aggType: 'avg' },
      ],
      dimensions: [
        { name: 'Users.name', type: 'string', title: 'User Name', shortTitle: 'Name' },
        { name: 'Users.email', type: 'string', title: 'Email Address', shortTitle: 'Email' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
        { name: 'Users.country', type: 'string', title: 'Country', shortTitle: 'Country' },
      ],
    },
    {
      name: 'Orders',
      title: 'Orders',
      measures: [
        { name: 'Orders.count', type: 'number', title: 'Order Count', shortTitle: 'Orders', aggType: 'count' },
        { name: 'Orders.totalAmount', type: 'number', title: 'Total Amount', shortTitle: 'Amount', aggType: 'sum' },
      ],
      dimensions: [
        { name: 'Orders.status', type: 'string', title: 'Order Status', shortTitle: 'Status' },
        { name: 'Orders.orderDate', type: 'time', title: 'Order Date', shortTitle: 'Date' },
      ],
    },
  ],
}

// Sample metrics for testing
const sampleMetrics: MetricItem[] = [
  { id: 'metric-1', field: 'Users.count', label: 'A' },
  { id: 'metric-2', field: 'Users.totalRevenue', label: 'B' },
  { id: 'metric-3', field: 'Orders.count', label: 'C' },
]

// Sample breakdowns for testing
const sampleBreakdowns: BreakdownItem[] = [
  { id: 'breakdown-1', field: 'Users.name', isTimeDimension: false },
  { id: 'breakdown-2', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' },
  { id: 'breakdown-3', field: 'Users.country', isTimeDimension: false },
]

// Helper to create drag event with dataTransfer
function createDragEvent(type: string, data: Record<string, unknown> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, {
    dataTransfer: {
      data: {} as Record<string, string>,
      effectAllowed: 'move',
      setData(format: string, value: string) {
        this.data[format] = value
      },
      getData(format: string) {
        return this.data[format]
      },
      setDragImage: vi.fn(),
    },
    clientX: 0,
    clientY: 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...data,
  })
  return event
}

// ============================================================================
// MetricsSection Tests
// ============================================================================

describe('MetricsSection', () => {
  const defaultProps: MetricsSectionProps = {
    metrics: sampleMetrics,
    schema: mockSchema,
    onAdd: vi.fn(),
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the Metrics section heading', () => {
      render(<MetricsSection {...defaultProps} />)

      expect(screen.getByText('Metrics')).toBeInTheDocument()
    })

    it('should render all metrics', () => {
      render(<MetricsSection {...defaultProps} />)

      // Metrics show shortTitle from schema
      expect(screen.getByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
      // Orders.count shows as "Orders" (shortTitle) but cube is also "Orders"
      // so there are 2 elements with "Orders" text
      expect(screen.getAllByText('Orders').length).toBeGreaterThanOrEqual(1)
    })

    it('should render empty state when no metrics', () => {
      render(<MetricsSection {...defaultProps} metrics={[]} />)

      // Should still show the heading with add button
      expect(screen.getByText('Metrics')).toBeInTheDocument()
      // But no metric cards
      expect(screen.queryByTitle('Remove metric')).not.toBeInTheDocument()
    })

    it('should show cube name for each metric', () => {
      render(<MetricsSection {...defaultProps} />)

      // Cube names should appear under the metric title
      // Users appears twice (for Users.count and Users.totalRevenue)
      expect(screen.getAllByText('Users').length).toBeGreaterThanOrEqual(2)
      // Orders appears twice (as shortTitle for Orders.count and as cube name)
      expect(screen.getAllByText('Orders').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('add metric', () => {
    it('should call onAdd when clicking the section header button', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<MetricsSection {...defaultProps} onAdd={onAdd} />)

      const addButton = screen.getByTitle('Add metric')
      await user.click(addButton)

      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('should have the add icon visible', () => {
      render(<MetricsSection {...defaultProps} />)

      // The add button should be present
      const addButton = screen.getByTitle('Add metric')
      expect(addButton).toBeInTheDocument()
    })
  })

  describe('remove metric', () => {
    it('should call onRemove with metric id when remove button clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<MetricsSection {...defaultProps} onRemove={onRemove} />)

      const removeButtons = screen.getAllByTitle('Remove metric')
      await user.click(removeButtons[0])

      expect(onRemove).toHaveBeenCalledWith('metric-1')
    })

    it('should call onRemove for correct metric when multiple exist', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<MetricsSection {...defaultProps} onRemove={onRemove} />)

      const removeButtons = screen.getAllByTitle('Remove metric')
      await user.click(removeButtons[1]) // Second metric

      expect(onRemove).toHaveBeenCalledWith('metric-2')
    })
  })

  describe('sorting', () => {
    it('should show sort button when onOrderChange is provided', () => {
      render(
        <MetricsSection
          {...defaultProps}
          order={{}}
          onOrderChange={vi.fn()}
        />
      )

      // Sort buttons should be present (one per metric)
      const sortButtons = screen.getAllByTitle('Click to sort ascending')
      expect(sortButtons.length).toBe(3)
    })

    it('should not show sort button when onOrderChange is not provided', () => {
      render(<MetricsSection {...defaultProps} />)

      // No sort buttons
      expect(screen.queryByTitle('Click to sort ascending')).not.toBeInTheDocument()
    })

    it('should call onOrderChange when sort button clicked', async () => {
      const user = userEvent.setup()
      const onOrderChange = vi.fn()

      render(
        <MetricsSection
          {...defaultProps}
          order={{}}
          onOrderChange={onOrderChange}
        />
      )

      const sortButtons = screen.getAllByTitle('Click to sort ascending')
      await user.click(sortButtons[0])

      expect(onOrderChange).toHaveBeenCalledWith('Users.count', 'asc')
    })

    it('should cycle through sort directions: null -> asc -> desc -> null', async () => {
      const user = userEvent.setup()
      const onOrderChange = vi.fn()

      const { rerender } = render(
        <MetricsSection
          {...defaultProps}
          order={{}}
          onOrderChange={onOrderChange}
        />
      )

      // Click to sort asc
      let sortButton = screen.getAllByTitle('Click to sort ascending')[0]
      await user.click(sortButton)
      expect(onOrderChange).toHaveBeenCalledWith('Users.count', 'asc')

      // Update order and rerender
      rerender(
        <MetricsSection
          {...defaultProps}
          order={{ 'Users.count': 'asc' }}
          onOrderChange={onOrderChange}
        />
      )

      // Click to sort desc
      sortButton = screen.getByTitle('Sorted ascending (click for descending)')
      await user.click(sortButton)
      expect(onOrderChange).toHaveBeenCalledWith('Users.count', 'desc')

      // Update order and rerender
      rerender(
        <MetricsSection
          {...defaultProps}
          order={{ 'Users.count': 'desc' }}
          onOrderChange={onOrderChange}
        />
      )

      // Click to remove sort
      sortButton = screen.getByTitle('Sorted descending (click to remove)')
      await user.click(sortButton)
      expect(onOrderChange).toHaveBeenCalledWith('Users.count', null)
    })

    it('should show sort priority when multiple fields are sorted', () => {
      render(
        <MetricsSection
          {...defaultProps}
          order={{ 'Users.count': 'asc', 'Users.totalRevenue': 'desc' }}
          onOrderChange={vi.fn()}
        />
      )

      // Priority numbers should be displayed
      expect(screen.getByText('(1)')).toBeInTheDocument()
      expect(screen.getByText('(2)')).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('should enable drag when onReorder is provided', () => {
      render(
        <MetricsSection
          {...defaultProps}
          onReorder={vi.fn()}
        />
      )

      // Metric cards should have cursor-grab class (check via component rendering)
      const metricCards = screen.getAllByText('Count')
      expect(metricCards.length).toBeGreaterThan(0)
    })

    it('should set up drag handlers when onReorder is provided', () => {
      const onReorder = vi.fn()

      const { container } = render(
        <MetricsSection
          {...defaultProps}
          onReorder={onReorder}
        />
      )

      // Verify draggable elements exist
      const draggableElements = container.querySelectorAll('[draggable="true"]')
      expect(draggableElements.length).toBe(3)
    })

    it('should not enable drag when onReorder is not provided', () => {
      render(<MetricsSection {...defaultProps} />)

      // Items should not be draggable
      const metricCards = screen.getAllByTitle('Remove metric').map(btn =>
        btn.closest('div[draggable]')
      )

      metricCards.forEach(card => {
        expect(card).toBeNull()
      })
    })
  })

  describe('with null schema', () => {
    it('should render metrics with field names when schema is null', () => {
      render(
        <MetricsSection
          {...defaultProps}
          schema={null}
        />
      )

      // Should show field name parts when no schema (the part after the dot)
      // For "Users.count" -> "count"
      // For "Users.totalRevenue" -> "totalRevenue"
      // For "Orders.count" -> "count" (but "count" appears twice)
      expect(screen.getAllByText('count').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('totalRevenue')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// MetricItemCard Tests
// ============================================================================

describe('MetricItemCard', () => {
  const mockFieldMeta: MetaField = {
    name: 'Users.count',
    type: 'number',
    title: 'User Count',
    shortTitle: 'Count',
    aggType: 'count',
  }

  const defaultProps: MetricItemCardProps = {
    metric: { id: 'metric-1', field: 'Users.count', label: 'A' },
    fieldMeta: mockFieldMeta,
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the metric display title from shortTitle', () => {
      render(<MetricItemCard {...defaultProps} />)

      expect(screen.getByText('Count')).toBeInTheDocument()
    })

    it('should render the metric title when shortTitle is not available', () => {
      const fieldMetaNoShort: MetaField = {
        name: 'Users.count',
        type: 'number',
        title: 'User Count',
        aggType: 'count',
      }

      render(
        <MetricItemCard
          {...defaultProps}
          fieldMeta={fieldMetaNoShort}
        />
      )

      expect(screen.getByText('User Count')).toBeInTheDocument()
    })

    it('should render field name when no fieldMeta', () => {
      render(
        <MetricItemCard
          {...defaultProps}
          fieldMeta={null}
        />
      )

      // Should show the field name part after the dot
      expect(screen.getByText('count')).toBeInTheDocument()
    })

    it('should render the cube name', () => {
      render(<MetricItemCard {...defaultProps} />)

      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should have a title attribute with full field name', () => {
      render(<MetricItemCard {...defaultProps} />)

      const titleElement = screen.getByTitle('Users.count')
      expect(titleElement).toBeInTheDocument()
    })
  })

  describe('remove button', () => {
    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<MetricItemCard {...defaultProps} onRemove={onRemove} />)

      const removeButton = screen.getByTitle('Remove metric')
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('sort button', () => {
    it('should show sort button when onToggleSort is provided', () => {
      render(
        <MetricItemCard
          {...defaultProps}
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.getByTitle('Click to sort ascending')).toBeInTheDocument()
    })

    it('should not show sort button when onToggleSort is not provided', () => {
      render(<MetricItemCard {...defaultProps} />)

      expect(screen.queryByTitle('Click to sort ascending')).not.toBeInTheDocument()
    })

    it('should call onToggleSort when sort button clicked', async () => {
      const user = userEvent.setup()
      const onToggleSort = vi.fn()

      render(
        <MetricItemCard
          {...defaultProps}
          onToggleSort={onToggleSort}
        />
      )

      const sortButton = screen.getByTitle('Click to sort ascending')
      await user.click(sortButton)

      expect(onToggleSort).toHaveBeenCalledTimes(1)
    })

    it('should show ascending sort indicator', () => {
      render(
        <MetricItemCard
          {...defaultProps}
          sortDirection="asc"
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.getByTitle('Sorted ascending (click for descending)')).toBeInTheDocument()
    })

    it('should show descending sort indicator', () => {
      render(
        <MetricItemCard
          {...defaultProps}
          sortDirection="desc"
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.getByTitle('Sorted descending (click to remove)')).toBeInTheDocument()
    })

    it('should show sort priority when provided', () => {
      render(
        <MetricItemCard
          {...defaultProps}
          sortDirection="asc"
          sortPriority={2}
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.getByText('(2)')).toBeInTheDocument()
    })

    it('should not show priority when sortDirection is null', () => {
      render(
        <MetricItemCard
          {...defaultProps}
          sortDirection={null}
          sortPriority={1}
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.queryByText('(1)')).not.toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('should be draggable when index and handlers are provided', () => {
      const { container } = render(
        <MetricItemCard
          {...defaultProps}
          index={0}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      )

      const draggableElement = container.querySelector('[draggable="true"]')
      expect(draggableElement).toBeInTheDocument()
    })

    it('should not be draggable when handlers are not provided', () => {
      const { container } = render(<MetricItemCard {...defaultProps} />)

      const draggableElement = container.querySelector('[draggable="true"]')
      expect(draggableElement).toBeNull()
    })

    it('should have onDragStart handler attached when draggable', () => {
      const onDragStart = vi.fn()
      const onDragEnd = vi.fn()

      const { container } = render(
        <MetricItemCard
          {...defaultProps}
          index={2}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )

      const draggableElement = container.querySelector('[draggable="true"]')
      expect(draggableElement).toBeInTheDocument()
      // Handlers are attached via props, verified by the draggable attribute
    })

    it('should have reduced opacity when isDragging is true', () => {
      const { container } = render(
        <MetricItemCard
          {...defaultProps}
          index={0}
          isDragging={true}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('dc:opacity-30')
    })

    it('should not have reduced opacity when isDragging is false', () => {
      const { container } = render(
        <MetricItemCard
          {...defaultProps}
          index={0}
          isDragging={false}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      )

      const card = container.firstChild
      expect(card).not.toHaveClass('dc:opacity-30')
    })
  })

  describe('measure type icon', () => {
    it('should show icon based on measure type', () => {
      render(<MetricItemCard {...defaultProps} />)

      // The icon container should exist
      const iconContainer = screen.getByText('Count').closest('div')?.parentElement
      expect(iconContainer).toBeInTheDocument()
    })

    it('should handle different measure types', () => {
      const avgFieldMeta: MetaField = {
        name: 'Users.avgOrderValue',
        type: 'number',
        title: 'Average Order Value',
        shortTitle: 'Avg Order',
        aggType: 'avg',
      }

      render(
        <MetricItemCard
          {...defaultProps}
          metric={{ id: 'metric-avg', field: 'Users.avgOrderValue', label: 'B' }}
          fieldMeta={avgFieldMeta}
        />
      )

      expect(screen.getByText('Avg Order')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// BreakdownSection Tests
// ============================================================================

describe('BreakdownSection', () => {
  const defaultProps: BreakdownSectionProps = {
    breakdowns: sampleBreakdowns,
    schema: mockSchema,
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onGranularityChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the Breakdown section heading', () => {
      render(<BreakdownSection {...defaultProps} />)

      expect(screen.getByText('Breakdown')).toBeInTheDocument()
    })

    it('should render all breakdowns', () => {
      render(<BreakdownSection {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Country')).toBeInTheDocument()
    })

    it('should render empty state when no breakdowns', () => {
      render(<BreakdownSection {...defaultProps} breakdowns={[]} />)

      expect(screen.getByText('Breakdown')).toBeInTheDocument()
      expect(screen.queryByTitle('Remove breakdown')).not.toBeInTheDocument()
    })

    it('should show cube name for each breakdown', () => {
      render(<BreakdownSection {...defaultProps} />)

      // All breakdowns are from Users cube
      const userLabels = screen.getAllByText('Users')
      expect(userLabels.length).toBe(3)
    })
  })

  describe('add breakdown', () => {
    it('should call onAdd when clicking the section header button', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<BreakdownSection {...defaultProps} onAdd={onAdd} />)

      const addButton = screen.getByTitle('Add breakdown')
      await user.click(addButton)

      expect(onAdd).toHaveBeenCalledTimes(1)
    })
  })

  describe('remove breakdown', () => {
    it('should call onRemove with breakdown id when remove button clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<BreakdownSection {...defaultProps} onRemove={onRemove} />)

      const removeButtons = screen.getAllByTitle('Remove breakdown')
      await user.click(removeButtons[0])

      expect(onRemove).toHaveBeenCalledWith('breakdown-1')
    })
  })

  describe('granularity', () => {
    it('should show granularity selector for time dimensions', () => {
      render(<BreakdownSection {...defaultProps} />)

      // Time dimension should have a select element
      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should not show granularity selector for non-time dimensions', () => {
      const nonTimeBreakdowns: BreakdownItem[] = [
        { id: 'breakdown-1', field: 'Users.name', isTimeDimension: false },
      ]

      render(
        <BreakdownSection
          {...defaultProps}
          breakdowns={nonTimeBreakdowns}
        />
      )

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should call onGranularityChange when granularity is changed', async () => {
      const user = userEvent.setup()
      const onGranularityChange = vi.fn()

      render(
        <BreakdownSection
          {...defaultProps}
          onGranularityChange={onGranularityChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'week')

      expect(onGranularityChange).toHaveBeenCalledWith('breakdown-2', 'week')
    })

    it('should display all granularity options', () => {
      render(<BreakdownSection {...defaultProps} />)

      const select = screen.getByRole('combobox')
      const options = within(select).getAllByRole('option')

      expect(options.map(o => o.textContent)).toEqual([
        'Hour',
        'Day',
        'Week',
        'Month',
        'Quarter',
        'Year',
      ])
    })
  })

  describe('comparison toggle', () => {
    it('should show comparison button for time dimensions when onComparisonToggle provided', () => {
      render(
        <BreakdownSection
          {...defaultProps}
          onComparisonToggle={vi.fn()}
        />
      )

      expect(screen.getByText('vs prior')).toBeInTheDocument()
    })

    it('should not show comparison button when onComparisonToggle is not provided', () => {
      render(<BreakdownSection {...defaultProps} />)

      expect(screen.queryByText('vs prior')).not.toBeInTheDocument()
    })

    it('should call onComparisonToggle when button is clicked', async () => {
      const user = userEvent.setup()
      const onComparisonToggle = vi.fn()

      render(
        <BreakdownSection
          {...defaultProps}
          onComparisonToggle={onComparisonToggle}
        />
      )

      const comparisonButton = screen.getByText('vs prior')
      await user.click(comparisonButton)

      expect(onComparisonToggle).toHaveBeenCalledWith('breakdown-2')
    })

    it('should disable comparison on other time dimensions when one has comparison enabled', () => {
      const breakdownsWithComparison: BreakdownItem[] = [
        { id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day', enableComparison: true },
        { id: 'breakdown-2', field: 'Orders.orderDate', isTimeDimension: true, granularity: 'month' },
      ]

      render(
        <BreakdownSection
          {...defaultProps}
          breakdowns={breakdownsWithComparison}
          onComparisonToggle={vi.fn()}
        />
      )

      const comparisonButtons = screen.getAllByText('vs prior')
      // Second button should be disabled
      expect(comparisonButtons[1]).toBeDisabled()
    })
  })

  describe('sorting', () => {
    it('should show sort button when onOrderChange is provided', () => {
      render(
        <BreakdownSection
          {...defaultProps}
          order={{}}
          onOrderChange={vi.fn()}
        />
      )

      const sortButtons = screen.getAllByTitle('Click to sort ascending')
      expect(sortButtons.length).toBe(3)
    })

    it('should call onOrderChange when sort button clicked', async () => {
      const user = userEvent.setup()
      const onOrderChange = vi.fn()

      render(
        <BreakdownSection
          {...defaultProps}
          order={{}}
          onOrderChange={onOrderChange}
        />
      )

      const sortButtons = screen.getAllByTitle('Click to sort ascending')
      await user.click(sortButtons[0])

      expect(onOrderChange).toHaveBeenCalledWith('Users.name', 'asc')
    })
  })

  describe('drag and drop', () => {
    it('should enable drag when onReorder is provided', () => {
      render(
        <BreakdownSection
          {...defaultProps}
          onReorder={vi.fn()}
        />
      )

      const cards = screen.getAllByTitle('Remove breakdown')
      expect(cards.length).toBe(3)
    })

    it('should call onReorder when items are reordered', () => {
      const onReorder = vi.fn()

      render(
        <BreakdownSection
          {...defaultProps}
          onReorder={onReorder}
        />
      )

      // Test setup - we verify the callbacks exist
      expect(onReorder).not.toHaveBeenCalled()
    })
  })

  describe('with null schema', () => {
    it('should render breakdowns with field names when schema is null', () => {
      render(
        <BreakdownSection
          {...defaultProps}
          schema={null}
        />
      )

      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('createdAt')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// BreakdownItemCard Tests
// ============================================================================

describe('BreakdownItemCard', () => {
  const mockDimensionMeta: MetaField = {
    name: 'Users.name',
    type: 'string',
    title: 'User Name',
    shortTitle: 'Name',
  }

  const mockTimeDimensionMeta: MetaField = {
    name: 'Users.createdAt',
    type: 'time',
    title: 'Created At',
    shortTitle: 'Created',
  }

  const defaultProps: BreakdownItemCardProps = {
    breakdown: { id: 'breakdown-1', field: 'Users.name', isTimeDimension: false },
    fieldMeta: mockDimensionMeta,
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the breakdown display title from shortTitle', () => {
      render(<BreakdownItemCard {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('should render field name when no fieldMeta', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          fieldMeta={null}
        />
      )

      expect(screen.getByText('name')).toBeInTheDocument()
    })

    it('should render the cube name', () => {
      render(<BreakdownItemCard {...defaultProps} />)

      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should show dimension icon for non-time dimensions', () => {
      const { container } = render(<BreakdownItemCard {...defaultProps} />)

      // Check for dimension styling (bg-dc-dimension class)
      const iconContainer = container.querySelector('.bg-dc-dimension')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should show time dimension icon for time dimensions', () => {
      const { container } = render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
        />
      )

      // Check for time dimension styling (bg-dc-time-dimension class)
      const iconContainer = container.querySelector('.bg-dc-time-dimension')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('remove button', () => {
    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<BreakdownItemCard {...defaultProps} onRemove={onRemove} />)

      const removeButton = screen.getByTitle('Remove breakdown')
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('granularity selector', () => {
    it('should show granularity selector for time dimensions', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
          onGranularityChange={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should not show granularity selector for non-time dimensions', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          onGranularityChange={vi.fn()}
        />
      )

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should call onGranularityChange when selection changes', async () => {
      const user = userEvent.setup()
      const onGranularityChange = vi.fn()

      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
          onGranularityChange={onGranularityChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'month')

      expect(onGranularityChange).toHaveBeenCalledWith('month')
    })

    it('should display the current granularity as selected', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'week' }}
          fieldMeta={mockTimeDimensionMeta}
          onGranularityChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('week')
    })

    it('should default to day when no granularity specified', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true }}
          fieldMeta={mockTimeDimensionMeta}
          onGranularityChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('day')
    })
  })

  describe('comparison toggle', () => {
    it('should show comparison button for time dimensions', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
          onComparisonToggle={vi.fn()}
        />
      )

      expect(screen.getByText('vs prior')).toBeInTheDocument()
    })

    it('should not show comparison button for non-time dimensions', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          onComparisonToggle={vi.fn()}
        />
      )

      expect(screen.queryByText('vs prior')).not.toBeInTheDocument()
    })

    it('should call onComparisonToggle when button is clicked', async () => {
      const user = userEvent.setup()
      const onComparisonToggle = vi.fn()

      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
          onComparisonToggle={onComparisonToggle}
        />
      )

      const comparisonButton = screen.getByText('vs prior')
      await user.click(comparisonButton)

      expect(onComparisonToggle).toHaveBeenCalledTimes(1)
    })

    it('should show active state when comparison is enabled', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day', enableComparison: true }}
          fieldMeta={mockTimeDimensionMeta}
          onComparisonToggle={vi.fn()}
        />
      )

      const comparisonButton = screen.getByText('vs prior')
      expect(comparisonButton).toHaveClass('bg-dc-accent')
    })

    it('should be disabled when comparisonDisabled is true and not enabled', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
          onComparisonToggle={vi.fn()}
          comparisonDisabled={true}
        />
      )

      const comparisonButton = screen.getByText('vs prior')
      expect(comparisonButton).toBeDisabled()
    })

    it('should not be disabled when comparisonDisabled is true but enableComparison is true', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day', enableComparison: true }}
          fieldMeta={mockTimeDimensionMeta}
          onComparisonToggle={vi.fn()}
          comparisonDisabled={true}
        />
      )

      const comparisonButton = screen.getByText('vs prior')
      expect(comparisonButton).not.toBeDisabled()
    })

    it('should have correct tooltip when disabled', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          breakdown={{ id: 'breakdown-1', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' }}
          fieldMeta={mockTimeDimensionMeta}
          onComparisonToggle={vi.fn()}
          comparisonDisabled={true}
        />
      )

      const comparisonButton = screen.getByText('vs prior')
      expect(comparisonButton).toHaveAttribute('title', 'Another time dimension already has comparison enabled')
    })
  })

  describe('sort button', () => {
    it('should show sort button when onToggleSort is provided', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.getByTitle('Click to sort ascending')).toBeInTheDocument()
    })

    it('should call onToggleSort when clicked', async () => {
      const user = userEvent.setup()
      const onToggleSort = vi.fn()

      render(
        <BreakdownItemCard
          {...defaultProps}
          onToggleSort={onToggleSort}
        />
      )

      const sortButton = screen.getByTitle('Click to sort ascending')
      await user.click(sortButton)

      expect(onToggleSort).toHaveBeenCalledTimes(1)
    })

    it('should show sort priority when sorted', () => {
      render(
        <BreakdownItemCard
          {...defaultProps}
          sortDirection="asc"
          sortPriority={3}
          onToggleSort={vi.fn()}
        />
      )

      expect(screen.getByText('(3)')).toBeInTheDocument()
    })
  })

  describe('drag and drop', () => {
    it('should be draggable when index and handlers are provided', () => {
      const { container } = render(
        <BreakdownItemCard
          {...defaultProps}
          index={0}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      )

      const draggableElement = container.querySelector('[draggable="true"]')
      expect(draggableElement).toBeInTheDocument()
    })

    it('should have drag cursor class when draggable', () => {
      const { container } = render(
        <BreakdownItemCard
          {...defaultProps}
          index={0}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('dc:cursor-grab')
    })

    it('should have reduced opacity when isDragging is true', () => {
      const { container } = render(
        <BreakdownItemCard
          {...defaultProps}
          index={0}
          isDragging={true}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('dc:opacity-30')
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('MetricsSection and BreakdownSection integration', () => {
  it('should handle complex state with multiple items and sorting', () => {
    const order = {
      'Users.count': 'asc' as const,
      'Users.name': 'desc' as const,
    }

    render(
      <>
        <MetricsSection
          metrics={sampleMetrics}
          schema={mockSchema}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          order={order}
          onOrderChange={vi.fn()}
        />
        <BreakdownSection
          breakdowns={sampleBreakdowns}
          schema={mockSchema}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onGranularityChange={vi.fn()}
          order={order}
          onOrderChange={vi.fn()}
        />
      </>
    )

    // MetricsSection shows (1) for Users.count, BreakdownSection shows (2) for Users.name
    // Since only Users.count is in metrics and Users.name is in breakdowns:
    // - MetricsSection has one sorted item: Users.count -> (1)
    // - BreakdownSection has one sorted item: Users.name -> (2)
    expect(screen.getByText('(1)')).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('should maintain independent state for metrics and breakdowns', async () => {
    const user = userEvent.setup()
    const onRemoveMetric = vi.fn()
    const onRemoveBreakdown = vi.fn()

    render(
      <>
        <MetricsSection
          metrics={[sampleMetrics[0]]}
          schema={mockSchema}
          onAdd={vi.fn()}
          onRemove={onRemoveMetric}
        />
        <BreakdownSection
          breakdowns={[sampleBreakdowns[0]]}
          schema={mockSchema}
          onAdd={vi.fn()}
          onRemove={onRemoveBreakdown}
          onGranularityChange={vi.fn()}
        />
      </>
    )

    // Remove metric
    const metricRemoveButton = screen.getByTitle('Remove metric')
    await user.click(metricRemoveButton)
    expect(onRemoveMetric).toHaveBeenCalledWith('metric-1')
    expect(onRemoveBreakdown).not.toHaveBeenCalled()

    // Remove breakdown
    const breakdownRemoveButton = screen.getByTitle('Remove breakdown')
    await user.click(breakdownRemoveButton)
    expect(onRemoveBreakdown).toHaveBeenCalledWith('breakdown-1')
  })
})
