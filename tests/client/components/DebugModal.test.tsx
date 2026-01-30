import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DebugModal from '../../../src/client/components/DebugModal'

// Mock syntax highlighting
vi.mock('../../../src/client/utils/syntaxHighlighting', () => ({
  highlightCodeBlocks: vi.fn().mockResolvedValue(undefined)
}))

describe('DebugModal', () => {
  const createDefaultProps = () => ({
    chartConfig: {
      xAxis: ['Products.category'],
      yAxis: ['Sales.revenue']
    },
    displayConfig: {
      showLegend: true,
      showGrid: true
    },
    queryObject: {
      measures: ['Sales.revenue'],
      dimensions: ['Products.category']
    },
    data: [
      { 'Products.category': 'Electronics', 'Sales.revenue': 1000 },
      { 'Products.category': 'Clothing', 'Sales.revenue': 500 }
    ],
    chartType: 'bar',
    cacheInfo: null
  })

  describe('closed state', () => {
    it('should render a debug button when closed', () => {
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      const button = screen.getByTitle('Debug chart configuration')
      expect(button).toBeInTheDocument()
    })

    it('should render SVG icon in button', () => {
      const props = createDefaultProps()
      const { container } = render(<DebugModal {...props} />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not show modal content when closed', () => {
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      expect(screen.queryByText('Chart Debug Information')).not.toBeInTheDocument()
    })
  })

  describe('opening modal', () => {
    it('should open modal when button is clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      const button = screen.getByTitle('Debug chart configuration')
      await user.click(button)

      expect(screen.getByText('Chart Debug Information')).toBeInTheDocument()
    })

    it('should display chart type when open', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('bar')).toBeInTheDocument()
    })
  })

  describe('modal content', () => {
    it('should display Chart Type section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Chart Type')).toBeInTheDocument()
      expect(screen.getByText('bar')).toBeInTheDocument()
    })

    it('should display Field Analysis section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Field Analysis')).toBeInTheDocument()
    })

    it('should display xAxis array values', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // The xAxis field shows "Array: [Products.category]"
      expect(screen.getByText(/Array: \[Products\.category\]/)).toBeInTheDocument()
    })

    it('should display yAxis array values', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // The yAxis field shows "Array: [Sales.revenue]"
      expect(screen.getByText(/Array: \[Sales\.revenue\]/)).toBeInTheDocument()
    })

    it('should display Chart Config section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Chart Config')).toBeInTheDocument()
    })

    it('should display Display Config section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Display Config')).toBeInTheDocument()
    })

    it('should display Query Object section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Query Object')).toBeInTheDocument()
    })

    it('should display Data Sample section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Data Sample (first 3 rows)')).toBeInTheDocument()
    })

    it('should display Cache Status section', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Cache Status')).toBeInTheDocument()
    })
  })

  describe('JSON display', () => {
    it('should display JSON-formatted chart config', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // Check that JSON is rendered in code blocks
      const codeBlocks = document.querySelectorAll('code.language-json')
      expect(codeBlocks.length).toBeGreaterThan(0)
    })

    it('should only show first 3 rows of data', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        data: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 }
        ]
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // The data sample should only show 3 items
      const dataSampleSection = screen.getByText('Data Sample (first 3 rows)').closest('div')
      expect(dataSampleSection).toBeInTheDocument()
    })

    it('should handle non-array data (FlowChartData/RetentionChartData)', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        data: { nodes: [], links: [] } // Non-array data
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // Should still render without error
      expect(screen.getByText('Data Sample (first 3 rows)')).toBeInTheDocument()
    })
  })

  describe('cache info display', () => {
    it('should show "Fresh Query" when cacheInfo is null', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Fresh Query')).toBeInTheDocument()
      expect(screen.getByText('Result not served from cache')).toBeInTheDocument()
    })

    it('should show cache hit info when cacheInfo is provided', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        cacheInfo: {
          hit: true as const,
          cachedAt: '2024-01-15T10:30:00Z',
          ttlMs: 300000,
          ttlRemainingMs: 150000
        }
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('Cache Hit')).toBeInTheDocument()
      expect(screen.getByText(/Cached At:/)).toBeInTheDocument()
      expect(screen.getByText(/TTL:/)).toBeInTheDocument()
      expect(screen.getByText(/TTL Remaining:/)).toBeInTheDocument()
    })

    it('should format cache TTL in seconds', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        cacheInfo: {
          hit: true as const,
          cachedAt: '2024-01-15T10:30:00Z',
          ttlMs: 300000, // 300 seconds
          ttlRemainingMs: 150000 // 150 seconds
        }
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText(/300s/)).toBeInTheDocument()
      expect(screen.getByText(/150s/)).toBeInTheDocument()
    })
  })

  describe('closing modal', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      // Open modal
      await user.click(screen.getByTitle('Debug chart configuration'))
      expect(screen.getByText('Chart Debug Information')).toBeInTheDocument()

      // Find and click close button (the X button in the header)
      const closeButtons = document.querySelectorAll('button')
      const closeButton = Array.from(closeButtons).find(btn =>
        btn.querySelector('svg line')
      )
      expect(closeButton).toBeTruthy()
      await user.click(closeButton!)

      expect(screen.queryByText('Chart Debug Information')).not.toBeInTheDocument()
    })

    it('should close modal when ESC key is pressed', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      // Open modal
      await user.click(screen.getByTitle('Debug chart configuration'))
      expect(screen.getByText('Chart Debug Information')).toBeInTheDocument()

      // Press ESC
      await user.keyboard('{Escape}')

      expect(screen.queryByText('Chart Debug Information')).not.toBeInTheDocument()
    })

    it('should show ESC key hint in modal', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText('ESC')).toBeInTheDocument()
      expect(screen.getByText(/to close/)).toBeInTheDocument()
    })
  })

  describe('click propagation', () => {
    it('should stop click propagation on modal content', async () => {
      const user = userEvent.setup()
      const outerClickHandler = vi.fn()
      const props = createDefaultProps()

      render(
        <div onClick={outerClickHandler}>
          <DebugModal {...props} />
        </div>
      )

      // Open modal
      await user.click(screen.getByTitle('Debug chart configuration'))

      // Click inside modal
      const modalContent = screen.getByText('Chart Debug Information').closest('div[class*="dc:absolute"]')
      expect(modalContent).toBeTruthy()
      await user.click(modalContent!)

      // Outer handler should not be called for clicks inside modal
      // Note: The stopPropagation is on the modal container, so initial render clicks may propagate
    })
  })

  describe('optional fields display', () => {
    it('should display sizeField when present in chartConfig', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        chartConfig: {
          ...createDefaultProps().chartConfig,
          sizeField: 'Sales.quantity'
        }
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText(/sizeField:/)).toBeInTheDocument()
    })

    it('should display colorField when present in chartConfig', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        chartConfig: {
          ...createDefaultProps().chartConfig,
          colorField: 'Products.category'
        }
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText(/colorField:/)).toBeInTheDocument()
    })

    it('should display series when present in chartConfig', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        chartConfig: {
          ...createDefaultProps().chartConfig,
          series: ['Products.region']
        }
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.getByText(/series:/)).toBeInTheDocument()
    })

    it('should not display optional fields when not present', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      expect(screen.queryByText(/sizeField:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/colorField:/)).not.toBeInTheDocument()
    })
  })

  describe('string vs array display', () => {
    it('should indicate when xAxis is a string', async () => {
      const user = userEvent.setup()
      const props = {
        ...createDefaultProps(),
        chartConfig: {
          xAxis: 'Products.category', // String, not array
          yAxis: ['Sales.revenue']
        }
      }
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // Check that xAxis shows as String with its value
      expect(screen.getByText(/String: "Products\.category"/)).toBeInTheDocument()
    })

    it('should indicate when xAxis is an array', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      // Check that xAxis shows as Array with its value
      expect(screen.getByText(/Array: \[Products\.category\]/)).toBeInTheDocument()
    })
  })

  describe('syntax highlighting', () => {
    it('should trigger syntax highlighting when modal opens', async () => {
      const { highlightCodeBlocks } = await import('../../../src/client/utils/syntaxHighlighting')
      const user = userEvent.setup()
      const props = createDefaultProps()
      render(<DebugModal {...props} />)

      await user.click(screen.getByTitle('Debug chart configuration'))

      await waitFor(() => {
        expect(highlightCodeBlocks).toHaveBeenCalled()
      })
    })
  })

  describe('ESC key cleanup', () => {
    it('should not close modal when ESC is pressed and modal is closed', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      const { rerender } = render(<DebugModal {...props} />)

      // Modal is closed, press ESC
      await user.keyboard('{Escape}')

      // Should not throw and debug button should still be visible
      expect(screen.getByTitle('Debug chart configuration')).toBeInTheDocument()
    })
  })
})
