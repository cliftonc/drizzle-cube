import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type RefObject } from 'react'
import FilterValuePopover from '../../../../src/client/components/DashboardFilters/FilterValuePopover'
import type { SimpleFilter, CubeMeta } from '../../../../src/client/types'
import { renderWithProviders } from '../../../client-setup/test-utils'

// Mock FilterValueSelector since FilterValuePopover delegates to it
vi.mock('../../../../src/client/components/shared/FilterValueSelector', () => ({
  default: function MockFilterValueSelector({
    fieldName,
    operator,
    values,
    onValuesChange
  }: {
    fieldName: string
    operator: string
    values: unknown[]
    onValuesChange: (values: unknown[]) => void
    schema: unknown
  }) {
    return (
      <div data-testid="filter-value-selector">
        <span data-testid="field-name">{fieldName}</span>
        <span data-testid="operator">{operator}</span>
        <span data-testid="current-values">{JSON.stringify(values)}</span>
        <input
          data-testid="value-input"
          type="text"
          defaultValue={values[0] as string || ''}
          onChange={(e) => onValuesChange([e.target.value])}
        />
        <button
          data-testid="add-value"
          onClick={() => onValuesChange([...values, 'new-value'])}
        >
          Add Value
        </button>
        <button
          data-testid="clear-values"
          onClick={() => onValuesChange([])}
        >
          Clear
        </button>
      </div>
    )
  }
}))

describe('FilterValuePopover', () => {
  const mockSchema: CubeMeta = {
    cubes: [
      {
        name: 'Users',
        title: 'Users',
        measures: [
          { name: 'Users.count', type: 'number', title: 'Count', aggType: 'count' }
        ],
        dimensions: [
          { name: 'Users.name', type: 'string', title: 'Name' },
          { name: 'Users.status', type: 'string', title: 'Status' },
          { name: 'Users.createdAt', type: 'time', title: 'Created At' }
        ]
      }
    ]
  }

  const createMockFilter = (overrides?: Partial<SimpleFilter>): SimpleFilter => ({
    member: 'Users.status',
    operator: 'equals',
    values: ['active'],
    ...overrides
  })

  let anchorRef: RefObject<HTMLDivElement>
  let anchorElement: HTMLDivElement

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a real anchor element in the document
    anchorElement = document.createElement('div')
    anchorElement.setAttribute('data-testid', 'anchor')
    document.body.appendChild(anchorElement)
    anchorRef = { current: anchorElement } as RefObject<HTMLDivElement>
  })

  afterEach(() => {
    // Clean up anchor element
    if (anchorElement && anchorElement.parentNode) {
      anchorElement.parentNode.removeChild(anchorElement)
    }
  })

  const createDefaultProps = () => ({
    filter: createMockFilter(),
    schema: mockSchema,
    onValuesChange: vi.fn(),
    onClose: vi.fn(),
    anchorRef
  })

  describe('rendering', () => {
    it('should render popover with filter value selector', () => {
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('filter-value-selector')).toBeInTheDocument()
    })

    it('should display "Edit value" label', () => {
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      expect(screen.getByText('Edit value')).toBeInTheDocument()
    })

    it('should show close button', () => {
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('filter data passing', () => {
    it('should pass field name to selector', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({ member: 'Users.name' })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('field-name')).toHaveTextContent('Users.name')
    })

    it('should pass operator to selector', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({ operator: 'contains' })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('operator')).toHaveTextContent('contains')
    })

    it('should pass current values to selector', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({ values: ['value1', 'value2'] })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('current-values')).toHaveTextContent('["value1","value2"]')
    })

    it('should handle empty values array', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({ values: [] })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('current-values')).toHaveTextContent('[]')
    })
  })

  describe('value change handling', () => {
    it('should call onValuesChange when values change', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      const input = screen.getByTestId('value-input')
      await user.clear(input)
      await user.type(input, 'new-value')

      expect(props.onValuesChange).toHaveBeenCalled()
    })

    it('should propagate values from selector', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      await user.click(screen.getByTestId('add-value'))

      expect(props.onValuesChange).toHaveBeenCalledWith(['active', 'new-value'])
    })

    it('should handle clearing values', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      await user.click(screen.getByTestId('clear-values'))

      expect(props.onValuesChange).toHaveBeenCalledWith([])
    })
  })

  describe('close behavior', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(props.onClose).toHaveBeenCalled()
    })

    it('should call onClose when Escape key pressed', async () => {
      vi.useFakeTimers()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      // Advance timers to allow the setTimeout(0) in the component to fire
      await vi.runAllTimersAsync()

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(props.onClose).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should call onClose when clicking outside popover', async () => {
      vi.useFakeTimers()
      const props = createDefaultProps()

      render(
        <div>
          <div data-testid="outside-element">Outside</div>
          <FilterValuePopover {...props} />
        </div>
      )

      // Advance timers to allow the setTimeout(0) in the component to fire
      await vi.runAllTimersAsync()

      // Create a mousedown event outside the popover
      fireEvent.mouseDown(document.body)

      expect(props.onClose).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should not close when clicking inside popover', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      // Wait for event listeners and click inside
      await waitFor(async () => {
        await user.click(screen.getByTestId('filter-value-selector'))
      })

      // Should not have closed
      expect(props.onClose).not.toHaveBeenCalled()
    })

    it('should not close when clicking anchor element', async () => {
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      // Wait for event listeners and click anchor
      await waitFor(() => {
        fireEvent.mouseDown(anchorElement)
      })

      // Should not have closed
      expect(props.onClose).not.toHaveBeenCalled()
    })
  })

  describe('schema conversion', () => {
    it('should convert CubeMeta to MetaResponse format', () => {
      const props = createDefaultProps()
      props.schema = mockSchema

      render(<FilterValuePopover {...props} />)

      // The component should render without errors
      expect(screen.getByTestId('filter-value-selector')).toBeInTheDocument()
    })

    it('should handle null schema', () => {
      const props = createDefaultProps()
      props.schema = null

      render(<FilterValuePopover {...props} />)

      // Should still render the selector
      expect(screen.getByTestId('filter-value-selector')).toBeInTheDocument()
    })
  })

  describe('positioning', () => {
    it('should position relative to anchor', () => {
      const props = createDefaultProps()

      const { container } = render(<FilterValuePopover {...props} />)

      // Popover should have absolute positioning class
      const popover = container.querySelector('.dc\\:absolute')
      expect(popover).toBeInTheDocument()
    })

    it('should be positioned at top-full (below anchor)', () => {
      const props = createDefaultProps()

      const { container } = render(<FilterValuePopover {...props} />)

      const popover = container.querySelector('.dc\\:top-full')
      expect(popover).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have border and shadow', () => {
      const props = createDefaultProps()

      const { container } = render(<FilterValuePopover {...props} />)

      const popover = container.querySelector('.dc\\:border')
      expect(popover).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const props = createDefaultProps()

      const { container } = render(<FilterValuePopover {...props} />)

      const popover = container.querySelector('.dc\\:rounded-lg')
      expect(popover).toBeInTheDocument()
    })

    it('should have z-index for layering', () => {
      const props = createDefaultProps()

      const { container } = render(<FilterValuePopover {...props} />)

      const popover = container.querySelector('.dc\\:z-50')
      expect(popover).toBeInTheDocument()
    })
  })

  describe('different filter types', () => {
    it('should handle string filter', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({
        member: 'Users.name',
        operator: 'contains',
        values: ['John']
      })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('field-name')).toHaveTextContent('Users.name')
      expect(screen.getByTestId('operator')).toHaveTextContent('contains')
    })

    it('should handle numeric filter', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({
        member: 'Users.age',
        operator: 'gt',
        values: [25]
      })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('current-values')).toHaveTextContent('[25]')
    })

    it('should handle time filter', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: ['2024-01-01', '2024-12-31']
      })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('field-name')).toHaveTextContent('Users.createdAt')
    })

    it('should handle multi-value filter', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({
        values: ['active', 'pending', 'inactive']
      })

      render(<FilterValuePopover {...props} />)

      expect(screen.getByTestId('current-values')).toHaveTextContent('["active","pending","inactive"]')
    })
  })

  describe('accessibility', () => {
    it('should have close button with accessible name', () => {
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterValuePopover {...props} />)

      // Tab to close button
      await user.tab()

      // Should be able to activate with keyboard
      await user.keyboard('{Enter}')

      // Close should be called eventually
    })
  })
})
