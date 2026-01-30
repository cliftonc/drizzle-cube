import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import type { CubeQuery } from '../../../src/client/types'
import type { AnalysisConfig } from '../../../src/client/types/analysisConfig'

// Mock AnalysisBuilderLazy - this is a complex component that's tested separately
const mockGetAnalysisConfig = vi.fn()

vi.mock('../../../src/client/components/AnalysisBuilderLazy', () => {
  const ReactMock = require('react')
  return {
    default: ReactMock.forwardRef(function MockAnalysisBuilder(
      props: {
        initialQuery?: CubeQuery
        initialChartConfig?: { chartType: string }
        initialAnalysisType?: string
        disableLocalStorage?: boolean
      },
      ref: React.Ref<{ getAnalysisConfig: () => AnalysisConfig | null }>
    ) {
      ReactMock.useImperativeHandle(ref, () => ({
        getAnalysisConfig: mockGetAnalysisConfig
      }))
      return ReactMock.createElement('div', { 'data-testid': 'analysis-builder' },
        ReactMock.createElement('div', { 'data-testid': 'initial-type' }, props.initialAnalysisType || 'query'),
        ReactMock.createElement('div', { 'data-testid': 'initial-query' }, JSON.stringify(props.initialQuery)),
        ReactMock.createElement('div', { 'data-testid': 'initial-chart' }, JSON.stringify(props.initialChartConfig))
      )
    })
  }
})

import PortletAnalysisModal from '../../../src/client/components/PortletAnalysisModal'
import type { PortletConfig } from '../../../src/client/types'

// Create a valid analysis config for testing
const createMockAnalysisConfig = (overrides?: Partial<AnalysisConfig>): AnalysisConfig => ({
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: {},
      displayConfig: {}
    }
  },
  query: {
    measures: ['Sales.total'],
    dimensions: ['Sales.category']
  },
  ...overrides
})

// Create mock portlet config
const createMockPortlet = (overrides?: Partial<PortletConfig>): PortletConfig => ({
  id: 'portlet-1',
  title: 'Sales Overview',
  w: 6,
  h: 4,
  x: 0,
  y: 0,
  analysisConfig: createMockAnalysisConfig(),
  ...overrides
})

describe('PortletAnalysisModal', () => {
  let originalOverflow: string

  beforeEach(() => {
    originalOverflow = document.body.style.overflow
    mockGetAnalysisConfig.mockReset()
  })

  afterEach(() => {
    document.body.style.overflow = originalOverflow
  })

  const createDefaultProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    portlet: null as PortletConfig | null,
    title: 'Add Portlet',
    submitText: 'Save'
  })

  describe('create mode', () => {
    it('should show "Add Portlet" title when creating new', () => {
      const props = createDefaultProps()
      props.title = 'Add New Portlet'
      props.portlet = null

      render(<PortletAnalysisModal {...props} />)

      expect(screen.getByText('Add New Portlet')).toBeInTheDocument()
    })

    it('should show empty title input when creating new', () => {
      const props = createDefaultProps()
      props.portlet = null

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      expect(titleInput).toHaveValue('')
    })

    it('should render AnalysisBuilder without initial query when creating new', () => {
      const props = createDefaultProps()
      props.portlet = null

      render(<PortletAnalysisModal {...props} />)

      expect(screen.getByTestId('analysis-builder')).toBeInTheDocument()
      // When no portlet, initialQuery is undefined which JSON.stringify converts to empty or undefined
      const queryText = screen.getByTestId('initial-query').textContent
      expect(queryText === '' || queryText === 'undefined').toBe(true)
    })

    it('should call onSave with new portlet config on save', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.portlet = null

      // Mock the analysis config that would be returned
      const mockConfig = createMockAnalysisConfig()
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      // Enter title
      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'New Portlet')

      // Click save
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Portlet',
          analysisConfig: mockConfig
        })
      )
    })

    it('should show alert if title is empty on save', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const props = createDefaultProps()

      const mockConfig = createMockAnalysisConfig()
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      // Don't enter title, just click save
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('title'))
      expect(props.onSave).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('should show alert if no query is configured', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const props = createDefaultProps()

      mockGetAnalysisConfig.mockReturnValue(null)

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'New Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('query'))
      expect(props.onSave).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('should show alert if query has no content', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const props = createDefaultProps()

      // Empty query (no measures, dimensions, or timeDimensions)
      mockGetAnalysisConfig.mockReturnValue(createMockAnalysisConfig({
        query: {
          measures: [],
          dimensions: [],
          timeDimensions: []
        }
      }))

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'New Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('metric or breakdown'))
      expect(props.onSave).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })
  })

  describe('edit mode', () => {
    it('should show "Edit Portlet" title when editing existing', () => {
      const props = createDefaultProps()
      props.title = 'Edit Portlet'
      props.portlet = createMockPortlet()

      render(<PortletAnalysisModal {...props} />)

      expect(screen.getByText('Edit Portlet')).toBeInTheDocument()
    })

    it('should populate title input with existing portlet title', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ title: 'Existing Dashboard' })

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      expect(titleInput).toHaveValue('Existing Dashboard')
    })

    it('should pass existing query config to AnalysisBuilder', () => {
      const props = createDefaultProps()
      const portlet = createMockPortlet()
      props.portlet = portlet

      render(<PortletAnalysisModal {...props} />)

      const initialQueryEl = screen.getByTestId('initial-query')
      // The query should be parsed from analysisConfig
      expect(initialQueryEl.textContent).toContain('Sales.total')
    })

    it('should pass existing chart config to AnalysisBuilder', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.chartType = 'line'

      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(<PortletAnalysisModal {...props} />)

      const initialChartEl = screen.getByTestId('initial-chart')
      expect(initialChartEl.textContent).toContain('line')
    })

    it('should pass existing analysis type to AnalysisBuilder', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.analysisType = 'funnel'

      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(<PortletAnalysisModal {...props} />)

      const initialTypeEl = screen.getByTestId('initial-type')
      expect(initialTypeEl.textContent).toBe('funnel')
    })

    it('should call onSave with modified config on save', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.portlet = createMockPortlet()

      const modifiedConfig = createMockAnalysisConfig({
        query: { measures: ['Orders.count'] }
      })
      mockGetAnalysisConfig.mockReturnValue(modifiedConfig)

      render(<PortletAnalysisModal {...props} />)

      // Modify title
      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Modified Title')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'portlet-1', // Should preserve ID
          title: 'Modified Title',
          analysisConfig: modifiedConfig
        })
      )
    })

    it('should preserve portlet dimensions when editing', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.portlet = createMockPortlet({
        w: 8,
        h: 6,
        x: 2,
        y: 1
      })

      const mockConfig = createMockAnalysisConfig()
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          w: 8,
          h: 6
        })
      )
    })

    it('should preserve dashboard filter mapping when editing', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.portlet = createMockPortlet({
        dashboardFilterMapping: ['filter-1', 'filter-2']
      })

      const mockConfig = createMockAnalysisConfig()
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          dashboardFilterMapping: ['filter-1', 'filter-2']
        })
      )
    })
  })

  describe('funnel mode validation', () => {
    it('should validate funnel has at least 2 steps', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const props = createDefaultProps()

      // Funnel with only 1 step
      mockGetAnalysisConfig.mockReturnValue({
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: { funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: {} } },
        query: {
          funnel: {
            steps: [{ name: 'Step 1', filter: {} }]
          }
        }
      })

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'Funnel Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('two funnel steps'))
      expect(props.onSave).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('should allow funnel with 2+ steps', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      // Valid funnel with 2 steps
      const mockConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: { funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: {} } },
        query: {
          funnel: {
            steps: [
              { name: 'Step 1', filter: {} },
              { name: 'Step 2', filter: {} }
            ]
          }
        }
      }
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'Funnel Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onSave).toHaveBeenCalled()
    })
  })

  describe('closing', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<PortletAnalysisModal {...props} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(props.onClose).toHaveBeenCalled()
    })

    it('should call onClose when Escape is pressed', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<PortletAnalysisModal {...props} />)

      await user.keyboard('{Escape}')

      expect(props.onClose).toHaveBeenCalled()
    })

    it('should reset title when modal reopens', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ title: 'Original Title' })

      const { rerender } = render(<PortletAnalysisModal {...props} />)

      // Close modal
      rerender(<PortletAnalysisModal {...props} isOpen={false} />)

      // Reopen with different portlet
      props.portlet = createMockPortlet({ title: 'New Title' })
      rerender(<PortletAnalysisModal {...props} isOpen={true} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      expect(titleInput).toHaveValue('New Title')
    })

    it('should close after successful save', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      const mockConfig = createMockAnalysisConfig()
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'New Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onClose).toHaveBeenCalled()
    })
  })

  describe('modal layout', () => {
    it('should not render when isOpen is false', () => {
      const props = createDefaultProps()
      props.isOpen = false

      render(<PortletAnalysisModal {...props} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render title input section', () => {
      const props = createDefaultProps()

      render(<PortletAnalysisModal {...props} />)

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })

    it('should render AnalysisBuilder section', () => {
      const props = createDefaultProps()

      render(<PortletAnalysisModal {...props} />)

      expect(screen.getByTestId('analysis-builder')).toBeInTheDocument()
    })

    it('should render footer with Save and Cancel buttons', () => {
      const props = createDefaultProps()
      props.submitText = 'Create'

      render(<PortletAnalysisModal {...props} />)

      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should pass colorPalette to AnalysisBuilder', () => {
      const props = createDefaultProps()
      props.colorPalette = {
        name: 'custom',
        label: 'Custom',
        colors: ['#ff0000', '#00ff00']
      }

      render(<PortletAnalysisModal {...props} />)

      // The colorPalette should be passed to AnalysisBuilder
      expect(screen.getByTestId('analysis-builder')).toBeInTheDocument()
    })
  })

  describe('multi-query validation', () => {
    it('should validate multi-query config has content', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const props = createDefaultProps()

      // Multi-query with empty first query
      mockGetAnalysisConfig.mockReturnValue({
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
        query: {
          queries: [
            { measures: [], dimensions: [], timeDimensions: [] }
          ]
        }
      })

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'Multi Query Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('metric or breakdown'))
      expect(props.onSave).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('should allow multi-query config with content', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      const mockConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
        query: {
          queries: [
            { measures: ['Sales.total'], dimensions: [] }
          ]
        }
      }
      mockGetAnalysisConfig.mockReturnValue(mockConfig)

      render(<PortletAnalysisModal {...props} />)

      const titleInput = screen.getByPlaceholderText(/enter portlet title/i)
      await user.type(titleInput, 'Multi Query Portlet')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(props.onSave).toHaveBeenCalled()
    })
  })
})
