import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import React from 'react'

// Mock AnalyticsPortlet - complex child component
// Must be before the component import
vi.mock('../../../src/client/components/AnalyticsPortlet', () => {
  const ReactMock = require('react')
  return {
    default: ReactMock.forwardRef(function MockAnalyticsPortlet(
      props: { title?: string; onDebugDataReady?: (data: unknown) => void },
      ref: React.Ref<unknown>
    ) {
      ReactMock.useImperativeHandle(ref, () => ({
        refresh: vi.fn()
      }))
      return ReactMock.createElement('div', { 'data-testid': 'analytics-portlet' }, props.title || 'Portlet Content')
    })
  }
})

// Mock DebugModal
vi.mock('../../../src/client/components/DebugModal', () => {
  const ReactMock = require('react')
  return {
    default: function MockDebugModal() {
      return ReactMock.createElement('div', { 'data-testid': 'debug-modal' }, 'Debug')
    }
  }
})

// Mock thumbnail utilities - must include all exports used by CubeFeaturesProvider
vi.mock('../../../src/client/utils/thumbnail', () => ({
  isPortletCopyAvailable: vi.fn().mockResolvedValue(false),
  copyPortletToClipboard: vi.fn().mockResolvedValue(false),
  captureThumbnail: vi.fn().mockResolvedValue(null),
  isThumbnailCaptureAvailable: vi.fn().mockResolvedValue(false),
  warnIfScreenshotLibMissing: vi.fn()
}))

import DashboardPortletCard from '../../../src/client/components/DashboardPortletCard'
import type { PortletConfig } from '../../../src/client/types'
import type { AnalysisConfig } from '../../../src/client/types/analysisConfig'
import { DashboardStoreProvider } from '../../../src/client/stores/dashboardStore'
import { CubeFeaturesProvider } from '../../../src/client/providers/CubeFeaturesProvider'

// Mock icon components
const MockIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} data-testid="mock-icon" />
)

const mockIcons = {
  RefreshIcon: MockIcon,
  EditIcon: MockIcon,
  DeleteIcon: MockIcon,
  CopyIcon: MockIcon,
  FilterIcon: MockIcon
}

// Create a valid analysis config
const createMockAnalysisConfig = (): AnalysisConfig => ({
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
    measures: ['Sales.total']
  }
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

// Default props
const createDefaultProps = () => ({
  portlet: createMockPortlet(),
  editable: true,
  setPortletRef: vi.fn(),
  setPortletComponentRef: vi.fn(),
  callbacks: {
    onToggleFilter: vi.fn(),
    onRefresh: vi.fn(),
    onDuplicate: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onOpenFilterConfig: vi.fn()
  },
  icons: mockIcons
})

// Wrapper component that provides required context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CubeFeaturesProvider features={{}}>
      <DashboardStoreProvider>
        {children}
      </DashboardStoreProvider>
    </CubeFeaturesProvider>
  )
}

// Wrapper with edit mode enabled
function TestWrapperEditMode({ children }: { children: React.ReactNode }) {
  return (
    <CubeFeaturesProvider features={{}}>
      <DashboardStoreProvider initialEditMode={true}>
        {children}
      </DashboardStoreProvider>
    </CubeFeaturesProvider>
  )
}

describe('DashboardPortletCard', () => {
  describe('view mode (isEditMode=false)', () => {
    it('should render title in header', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Use heading role to find the title specifically
      expect(screen.getByRole('heading', { name: 'Sales Overview' })).toBeInTheDocument()
    })

    it('should render children (chart content)', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.getByTestId('analytics-portlet')).toBeInTheDocument()
    })

    it('should NOT show edit button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Edit button has "Edit portlet" title
      expect(screen.queryByTitle('Edit portlet')).not.toBeInTheDocument()
    })

    it('should NOT show delete button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.queryByTitle('Delete portlet')).not.toBeInTheDocument()
    })

    it('should NOT show duplicate button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.queryByTitle('Duplicate portlet')).not.toBeInTheDocument()
    })

    it('should show refresh button in view mode', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Refresh button should be visible in all modes
      expect(screen.getByTitle(/refresh portlet data/i)).toBeInTheDocument()
    })
  })

  describe('edit mode (isEditMode=true)', () => {
    it('should show edit button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Edit portlet')).toBeInTheDocument()
    })

    it('should show delete button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Delete portlet')).toBeInTheDocument()
    })

    it('should show duplicate button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Duplicate portlet')).toBeInTheDocument()
    })

    it('should show filter config button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle(/configure dashboard filters/i)).toBeInTheDocument()
    })

    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle('Edit portlet'))

      expect(props.callbacks.onEdit).toHaveBeenCalledWith(props.portlet)
    })

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle('Delete portlet'))

      expect(props.callbacks.onDelete).toHaveBeenCalledWith('portlet-1')
    })

    it('should call onDuplicate when duplicate button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle('Duplicate portlet'))

      expect(props.callbacks.onDuplicate).toHaveBeenCalledWith('portlet-1')
    })

    it('should call onOpenFilterConfig when filter button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle(/configure dashboard filters/i))

      expect(props.callbacks.onOpenFilterConfig).toHaveBeenCalledWith(props.portlet)
    })
  })

  describe('refresh functionality', () => {
    it('should call onRefresh when refresh button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      await user.click(screen.getByTitle(/refresh portlet data/i))

      expect(props.callbacks.onRefresh).toHaveBeenCalledWith('portlet-1', { bustCache: false })
    })

    it('should show tooltip about shift+click for cache bust', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const refreshButton = screen.getByTitle(/refresh portlet data/i)
      expect(refreshButton.title).toContain('Shift+click')
    })
  })

  describe('ref callbacks', () => {
    it('should call setPortletRef on mount', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(props.setPortletRef).toHaveBeenCalledWith('portlet-1', expect.any(HTMLDivElement))
    })

    it('should call setPortletComponentRef with refresh method', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(props.setPortletComponentRef).toHaveBeenCalledWith('portlet-1', expect.objectContaining({
        refresh: expect.any(Function)
      }))
    })
  })

  describe('editable prop', () => {
    it('should not show edit controls when editable is false even in edit mode', () => {
      const props = createDefaultProps()
      props.editable = false

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.queryByTitle('Edit portlet')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Delete portlet')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Duplicate portlet')).not.toBeInTheDocument()
    })
  })

  describe('header visibility', () => {
    it('should show header by default', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Use heading role to be specific about the header title
      expect(screen.getByRole('heading', { name: 'Sales Overview' })).toBeInTheDocument()
    })

    it('should hide header when displayConfig.hideHeader is true in view mode', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.displayConfig = { hideHeader: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // The h3 heading should not be rendered when header is hidden
      expect(screen.queryByRole('heading', { name: 'Sales Overview' })).not.toBeInTheDocument()
    })

    it('should show header in edit mode even when hideHeader is true', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.displayConfig = { hideHeader: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      // In edit mode, header should be visible for editing controls
      expect(screen.getByRole('heading', { name: 'Sales Overview' })).toBeInTheDocument()
    })
  })

  describe('dashboard filter mapping indicator', () => {
    it('should show filter count in title when portlet has dashboard filter mapping', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({
        dashboardFilterMapping: ['filter-1', 'filter-2']
      })

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      const filterButton = screen.getByTitle(/configure dashboard filters.*2 active/i)
      expect(filterButton).toBeInTheDocument()
    })
  })

  describe('data-portlet-id attribute', () => {
    it('should set data-portlet-id attribute on container', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('container props passthrough', () => {
    it('should merge className from containerProps', () => {
      const props = createDefaultProps()
      props.containerProps = { className: 'custom-class' }

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container?.className).toContain('custom-class')
    })
  })
})
