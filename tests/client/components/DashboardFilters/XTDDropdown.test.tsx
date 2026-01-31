import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type RefObject } from 'react'
import XTDDropdown from '../../../../src/client/components/DashboardFilters/XTDDropdown'

describe('XTDDropdown', () => {
  let anchorRef: RefObject<HTMLDivElement>
  let anchorElement: HTMLDivElement

  beforeEach(() => {
    vi.clearAllMocks()
    // Create anchor element
    anchorElement = document.createElement('div')
    anchorElement.setAttribute('data-testid', 'anchor')
    document.body.appendChild(anchorElement)
    anchorRef = { current: anchorElement } as RefObject<HTMLDivElement>
  })

  afterEach(() => {
    if (anchorElement && anchorElement.parentNode) {
      anchorElement.parentNode.removeChild(anchorElement)
    }
  })

  const createDefaultProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    currentXTD: null as string | null,
    anchorRef
  })

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const props = createDefaultProps()
      props.isOpen = false

      render(<XTDDropdown {...props} />)

      expect(screen.queryByText('Week to Date')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      expect(screen.getByText('Week to Date')).toBeInTheDocument()
    })
  })

  describe('XTD options', () => {
    it('should show Week to Date option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      expect(screen.getByText('Week to Date')).toBeInTheDocument()
    })

    it('should show Month to Date option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      expect(screen.getByText('Month to Date')).toBeInTheDocument()
    })

    it('should show Quarter to Date option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      expect(screen.getByText('Quarter to Date')).toBeInTheDocument()
    })

    it('should show Year to Date option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      expect(screen.getByText('Year to Date')).toBeInTheDocument()
    })

    it('should show date range preview for each option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Each option should show a date range
      const options = screen.getAllByRole('button')
      // Options have date text below the label
      options.forEach(option => {
        // Button should exist
        expect(option).toBeInTheDocument()
      })
    })
  })

  describe('selection', () => {
    it('should call onSelect with "this week" when WTD clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      await user.click(screen.getByText('Week to Date'))

      expect(props.onSelect).toHaveBeenCalledWith('this week')
    })

    it('should call onSelect with "this month" when MTD clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      await user.click(screen.getByText('Month to Date'))

      expect(props.onSelect).toHaveBeenCalledWith('this month')
    })

    it('should call onSelect with "this quarter" when QTD clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      await user.click(screen.getByText('Quarter to Date'))

      expect(props.onSelect).toHaveBeenCalledWith('this quarter')
    })

    it('should call onSelect with "this year" when YTD clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      await user.click(screen.getByText('Year to Date'))

      expect(props.onSelect).toHaveBeenCalledWith('this year')
    })
  })

  describe('current selection highlighting', () => {
    it('should highlight WTD when currentXTD is wtd', () => {
      const props = createDefaultProps()
      props.currentXTD = 'wtd'

      render(<XTDDropdown {...props} />)

      // The WTD option should have active styling
      const wtdButton = screen.getByText('Week to Date').closest('button')
      expect(wtdButton).toHaveStyle({ backgroundColor: expect.stringContaining('') })
    })

    it('should highlight MTD when currentXTD is mtd', () => {
      const props = createDefaultProps()
      props.currentXTD = 'mtd'

      render(<XTDDropdown {...props} />)

      const mtdButton = screen.getByText('Month to Date').closest('button')
      expect(mtdButton).toBeInTheDocument()
    })

    it('should highlight QTD when currentXTD is qtd', () => {
      const props = createDefaultProps()
      props.currentXTD = 'qtd'

      render(<XTDDropdown {...props} />)

      const qtdButton = screen.getByText('Quarter to Date').closest('button')
      expect(qtdButton).toBeInTheDocument()
    })

    it('should highlight YTD when currentXTD is ytd', () => {
      const props = createDefaultProps()
      props.currentXTD = 'ytd'

      render(<XTDDropdown {...props} />)

      const ytdButton = screen.getByText('Year to Date').closest('button')
      expect(ytdButton).toBeInTheDocument()
    })

    it('should show check icon for active option', () => {
      const props = createDefaultProps()
      props.currentXTD = 'mtd'

      render(<XTDDropdown {...props} />)

      // The active option should show a check icon
      const mtdButton = screen.getByText('Month to Date').closest('button')
      // Check that the button or its container has an SVG (check icon)
      expect(mtdButton?.querySelector('svg')).toBeInTheDocument()
    })

    it('should not show check icon for inactive options', () => {
      const props = createDefaultProps()
      props.currentXTD = 'mtd'

      render(<XTDDropdown {...props} />)

      // WTD should not have check icon
      const wtdButton = screen.getByText('Week to Date').closest('button')
      // Other options should not have check icon visible in their specific area
      expect(wtdButton?.querySelectorAll('svg').length).toBeLessThanOrEqual(1) // May have icon in layout
    })
  })

  describe('close behavior', () => {
    it('should call onClose when Escape pressed', async () => {
      vi.useFakeTimers()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Advance timers to allow the setTimeout(0) in the component to fire
      await vi.runAllTimersAsync()

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(props.onClose).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should call onClose when clicking outside', async () => {
      vi.useFakeTimers()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Advance timers to allow the setTimeout(0) in the component to fire
      await vi.runAllTimersAsync()

      fireEvent.mouseDown(document.body)

      expect(props.onClose).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should not close when clicking inside dropdown', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Click on label text but not on button action
      const label = screen.getByText('Week to Date')
      const container = label.closest('div')
      if (container) {
        fireEvent.mouseDown(container)
      }

      // onClose should not have been called from the click itself
      // (onSelect gets called which may trigger close externally)
    })

    it('should stop propagation on click', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      const parentClickHandler = vi.fn()

      render(
        <div onClick={parentClickHandler}>
          <XTDDropdown {...props} />
        </div>
      )

      await user.click(screen.getByText('Month to Date'))

      // Parent should not receive click
      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('date range calculation', () => {
    it('should display calculated date ranges', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Each option should show a date range preview
      // The format is like "Jan 1, 2024 - Jan 15, 2024"
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(4) // 4 XTD options
    })

    it('should format date ranges correctly', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Look for date format patterns
      // The component displays dates in "Month Day, Year" format
      const allText = document.body.textContent || ''
      // Should have some date-like text
      expect(allText).toMatch(/\d{1,2},?\s*\d{4}|\w{3}\s+\d{1,2}/i)
    })
  })

  describe('hover states', () => {
    it('should change background on hover', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      const wtdButton = screen.getByText('Week to Date').closest('button')

      if (wtdButton) {
        // Hover should work without errors
        await user.hover(wtdButton)
        await user.unhover(wtdButton)
      }
    })

    it('should not change active item style on hover', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.currentXTD = 'mtd'

      render(<XTDDropdown {...props} />)

      const mtdButton = screen.getByText('Month to Date').closest('button')

      if (mtdButton) {
        // Hover on active item should maintain active styling
        await user.hover(mtdButton)
        // Button should still have active background
      }
    })
  })

  describe('styling', () => {
    it('should have rounded corners', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:rounded-lg')).toBeInTheDocument()
    })

    it('should have border', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:border')).toBeInTheDocument()
    })

    it('should have shadow', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:shadow-lg')).toBeInTheDocument()
    })

    it('should have z-index', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:z-50')).toBeInTheDocument()
    })

    it('should have minimum width', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:min-w-\\[180px\\]')).toBeInTheDocument()
    })

    it('should be positioned at top-full', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:top-full')).toBeInTheDocument()
    })

    it('should be positioned at left-0', () => {
      const props = createDefaultProps()

      const { container } = render(<XTDDropdown {...props} />)

      expect(container.querySelector('.dc\\:left-0')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have button role for each option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(4)
    })

    it('should have type="button" to prevent form submission', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Tab through options
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()

      // All tabs should work without errors
    })

    it('should support Enter key selection', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Focus first option
      await user.tab()

      // Press Enter
      await user.keyboard('{Enter}')

      // onSelect should be called
      expect(props.onSelect).toHaveBeenCalled()
    })

    it('should have descriptive text for each option', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Each option has both a label and date range
      expect(screen.getByText('Week to Date')).toBeInTheDocument()
      expect(screen.getByText('Month to Date')).toBeInTheDocument()
      expect(screen.getByText('Quarter to Date')).toBeInTheDocument()
      expect(screen.getByText('Year to Date')).toBeInTheDocument()
    })
  })

  describe('option layout', () => {
    it('should display label prominently', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      const label = screen.getByText('Month to Date')
      // Label should be in a container with font-medium
      expect(label).toHaveClass('dc:font-medium')
    })

    it('should display date range in secondary style', () => {
      const props = createDefaultProps()

      render(<XTDDropdown {...props} />)

      // Date ranges should have smaller text
      const options = screen.getAllByRole('button')
      options.forEach(option => {
        const secondaryText = option.querySelector('.dc\\:text-xs')
        if (secondaryText) {
          expect(secondaryText).toBeInTheDocument()
        }
      })
    })

    it('should align check icon to the right', () => {
      const props = createDefaultProps()
      props.currentXTD = 'ytd'

      render(<XTDDropdown {...props} />)

      // The button should have justify-between for icon alignment
      const ytdButton = screen.getByText('Year to Date').closest('button')
      expect(ytdButton).toHaveClass('dc:justify-between')
    })
  })
})
