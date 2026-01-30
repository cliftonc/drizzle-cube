/**
 * DateRangeSelector Component Tests
 *
 * Tests for the date range picker component which handles:
 * - Preset date ranges (Today, Last 7 days, This month, etc.)
 * - Custom date range selection
 * - Flexible N-period ranges (Last N days/weeks/months)
 * - Time dimension field selection
 */

import { screen, fireEvent } from '@testing-library/react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DateRangeSelector from '../../../../src/client/components/shared/DateRangeSelector'

describe('DateRangeSelector', () => {
  const defaultProps = {
    timeDimension: 'Orders.createdAt',
    availableTimeDimensions: ['Orders.createdAt', 'Orders.updatedAt', 'Users.createdAt'],
    currentDateRange: 'this month' as string | string[],
    onDateRangeChange: vi.fn(),
    onTimeDimensionChange: vi.fn(),
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('should render with time dimension field', () => {
      render(<DateRangeSelector {...defaultProps} />)
      expect(screen.getByText('Orders.createdAt')).toBeInTheDocument()
    })

    it('should show preset name when preset is selected', () => {
      render(<DateRangeSelector {...defaultProps} currentDateRange="this month" />)
      expect(screen.getByText('This month')).toBeInTheDocument()
    })

    it('should show "Custom" when custom range is selected', () => {
      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange={['2024-01-01', '2024-06-30']}
        />
      )
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('should display custom date range values', () => {
      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange={['2024-03-01', '2024-03-31']}
        />
      )

      expect(screen.getByDisplayValue('2024-03-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-03-31')).toBeInTheDocument()
    })

    it('should handle flexible N-period ranges', () => {
      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange="last 9 weeks"
        />
      )

      // Should detect this as a "Last N weeks" type and show the number input
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveValue(9)
    })

    it('should display unit label for flexible ranges', () => {
      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange="last 3 months"
        />
      )

      // Should show the unit (months)
      expect(screen.getByText('months')).toBeInTheDocument()
    })
  })

  describe('presets', () => {
    it('should show preset options when dropdown is opened', () => {
      render(<DateRangeSelector {...defaultProps} />)

      // Click to open range dropdown
      const rangeButton = screen.getByText('This month')
      fireEvent.click(rangeButton)

      // Should show all preset options
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Yesterday')).toBeInTheDocument()
      expect(screen.getByText('Last 7 days')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('This week')).toBeInTheDocument()
      expect(screen.getByText('This quarter')).toBeInTheDocument()
      expect(screen.getByText('This year')).toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('should select preset and update value', () => {
      const onDateRangeChange = vi.fn()
      render(<DateRangeSelector {...defaultProps} onDateRangeChange={onDateRangeChange} />)

      // Open dropdown
      fireEvent.click(screen.getByText('This month'))

      // Select "Last 7 days"
      fireEvent.click(screen.getByText('Last 7 days'))

      expect(onDateRangeChange).toHaveBeenCalledWith('Orders.createdAt', 'last 7 days')
    })

    it('should highlight currently selected preset', () => {
      render(<DateRangeSelector {...defaultProps} currentDateRange="this month" />)

      // Open dropdown
      fireEvent.click(screen.getByText('This month'))

      // The "This month" option in the dropdown should have the selected styling
      const options = screen.getAllByRole('button').filter(btn =>
        btn.textContent === 'This month'
      )
      // At least one should have the accent background class
      const hasSelectedStyle = options.some(opt =>
        opt.className.includes('bg-dc-accent-bg') || opt.className.includes('text-dc-accent')
      )
      expect(hasSelectedStyle).toBe(true)
    })
  })

  describe('custom range', () => {
    it('should show "Custom" option', () => {
      render(<DateRangeSelector {...defaultProps} />)

      fireEvent.click(screen.getByText('This month'))

      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('should show date inputs when custom is selected', () => {
      render(<DateRangeSelector {...defaultProps} currentDateRange={['2024-01-01', '2024-01-31']} />)

      // When custom date range (array) is provided, should show date inputs (type="date")
      expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-31')).toBeInTheDocument()
    })

    it('should update start date when changed', () => {
      const onDateRangeChange = vi.fn()

      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange={['2024-01-01', '2024-01-31']}
          onDateRangeChange={onDateRangeChange}
        />
      )

      const startDateInput = screen.getByDisplayValue('2024-01-01')
      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } })

      expect(onDateRangeChange).toHaveBeenCalled()
    })

    it('should update end date when changed', () => {
      const onDateRangeChange = vi.fn()

      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange={['2024-01-01', '2024-01-31']}
          onDateRangeChange={onDateRangeChange}
        />
      )

      const endDateInput = screen.getByDisplayValue('2024-01-31')
      fireEvent.change(endDateInput, { target: { value: '2024-02-28' } })

      expect(onDateRangeChange).toHaveBeenCalled()
    })
  })

  describe('time dimension selection', () => {
    it('should show time dimension field', () => {
      render(<DateRangeSelector {...defaultProps} />)

      expect(screen.getByText('Orders.createdAt')).toBeInTheDocument()
    })

    it('should allow changing time dimension', () => {
      const onTimeDimensionChange = vi.fn()

      render(
        <DateRangeSelector
          {...defaultProps}
          onTimeDimensionChange={onTimeDimensionChange}
        />
      )

      // Click on time dimension dropdown
      fireEvent.click(screen.getByText('Orders.createdAt'))

      // Select a different time dimension
      fireEvent.click(screen.getByText('Users.createdAt'))

      expect(onTimeDimensionChange).toHaveBeenCalledWith('Orders.createdAt', 'Users.createdAt')
    })

    it('should show all available time dimensions in dropdown', () => {
      render(<DateRangeSelector {...defaultProps} />)

      // Click on time dimension dropdown
      fireEvent.click(screen.getByText('Orders.createdAt'))

      expect(screen.getByText('Orders.updatedAt')).toBeInTheDocument()
      expect(screen.getByText('Users.createdAt')).toBeInTheDocument()
    })

    it('should hide time dimension selector when hideFieldSelector is true', () => {
      render(<DateRangeSelector {...defaultProps} hideFieldSelector={true} />)

      // The time dimension dropdown button should not be rendered
      const buttons = screen.getAllByRole('button')
      const fieldButton = buttons.find(btn => btn.textContent === 'Orders.createdAt')
      expect(fieldButton).toBeUndefined()
    })
  })

  describe('removal', () => {
    it('should show remove button', () => {
      render(<DateRangeSelector {...defaultProps} />)

      expect(screen.getByTitle('Remove date range')).toBeInTheDocument()
    })

    it('should call onRemove when remove button clicked', () => {
      const onRemove = vi.fn()

      render(<DateRangeSelector {...defaultProps} onRemove={onRemove} />)

      fireEvent.click(screen.getByTitle('Remove date range'))

      expect(onRemove).toHaveBeenCalledWith('Orders.createdAt')
    })

    it('should hide remove button when hideRemoveButton is true', () => {
      render(<DateRangeSelector {...defaultProps} hideRemoveButton={true} />)

      expect(screen.queryByTitle('Remove date range')).not.toBeInTheDocument()
    })
  })

  describe('flexible N-period inputs', () => {
    it('should show number input for "Last N days" option', () => {
      render(<DateRangeSelector {...defaultProps} />)

      // Open dropdown
      fireEvent.click(screen.getByText('This month'))

      // Select "Last N days"
      fireEvent.click(screen.getByText('Last N days'))

      // Should show number input
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toBeInTheDocument()
    })

    it('should update dateRange when number is changed for Last N periods', () => {
      const onDateRangeChange = vi.fn()

      render(
        <DateRangeSelector
          {...defaultProps}
          currentDateRange="last 5 days"
          onDateRangeChange={onDateRangeChange}
        />
      )

      // Should show number input with value 5
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveValue(5)

      // Change the value
      fireEvent.change(numberInput, { target: { value: '10' } })

      expect(onDateRangeChange).toHaveBeenCalledWith('Orders.createdAt', 'last 10 days')
    })
  })
})
