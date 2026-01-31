import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterEditModal from '../../../../src/client/components/DashboardFilters/FilterEditModal'
import type { DashboardFilter, CubeMeta, DashboardConfig, SimpleFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'

// Mock DashboardFilterConfigModal since FilterEditModal is a wrapper
vi.mock('../../../../src/client/components/DashboardFilters/DashboardFilterConfigModal', () => ({
  default: function MockDashboardFilterConfigModal({
    filter,
    isOpen,
    onSave,
    onDelete,
    onClose,
    fullSchema,
    filteredSchema
  }: {
    filter: DashboardFilter
    fullSchema: MetaResponse | null
    filteredSchema: MetaResponse | null
    isOpen: boolean
    onSave: (filter: DashboardFilter) => void
    onDelete: () => void
    onClose: () => void
  }) {
    if (!isOpen) return null
    return (
      <div data-testid="dashboard-filter-config-modal">
        <span data-testid="filter-label">{filter.label}</span>
        <span data-testid="filter-member">{(filter.filter as SimpleFilter).member}</span>
        <span data-testid="has-full-schema">{fullSchema ? 'true' : 'false'}</span>
        <span data-testid="has-filtered-schema">{filteredSchema ? 'true' : 'false'}</span>
        <button
          data-testid="save-button"
          onClick={() => onSave({ ...filter, label: 'Updated Label' })}
        >
          Done
        </button>
        <button data-testid="delete-button" onClick={onDelete}>
          Delete
        </button>
        <button data-testid="close-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    )
  }
}))

describe('FilterEditModal', () => {
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
      },
      {
        name: 'Orders',
        title: 'Orders',
        measures: [
          { name: 'Orders.count', type: 'number', title: 'Count', aggType: 'count' },
          { name: 'Orders.total', type: 'number', title: 'Total', aggType: 'sum' }
        ],
        dimensions: [
          { name: 'Orders.status', type: 'string', title: 'Status' },
          { name: 'Orders.createdAt', type: 'time', title: 'Created At' }
        ]
      }
    ]
  }

  const mockDashboardConfig: DashboardConfig = {
    id: 'test-dashboard',
    title: 'Test Dashboard',
    portlets: [
      {
        id: 'portlet-1',
        title: 'User Count',
        query: JSON.stringify({
          measures: ['Users.count'],
          dimensions: ['Users.status']
        }),
        chartType: 'bar',
        x: 0,
        y: 0,
        w: 6,
        h: 4
      }
    ]
  }

  const createMockFilter = (overrides?: Partial<DashboardFilter>): DashboardFilter => ({
    id: 'filter-1',
    label: 'Status Filter',
    filter: {
      member: 'Users.status',
      operator: 'equals',
      values: ['active']
    },
    ...overrides
  })

  const convertToMetaResponse = (cubeMeta: CubeMeta | null): MetaResponse | null => {
    if (!cubeMeta) return null
    return {
      cubes: cubeMeta.cubes.map(cube => ({
        name: cube.name,
        title: cube.title || cube.name,
        measures: cube.measures.map(m => ({
          name: m.name,
          title: m.title || m.name,
          type: m.type,
          shortTitle: m.title || m.name,
          aggType: m.aggType
        })),
        dimensions: cube.dimensions.map(d => ({
          name: d.name,
          title: d.title || d.name,
          type: d.type,
          shortTitle: d.title || d.name
        }))
      }))
    }
  }

  const createDefaultProps = () => ({
    filter: createMockFilter(),
    schema: mockSchema,
    dashboardConfig: mockDashboardConfig,
    isOpen: true,
    onSave: vi.fn(),
    onClose: vi.fn(),
    onDelete: vi.fn(),
    convertToMetaResponse
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const props = createDefaultProps()
      props.isOpen = false

      render(<FilterEditModal {...props} />)

      expect(screen.queryByTestId('dashboard-filter-config-modal')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('dashboard-filter-config-modal')).toBeInTheDocument()
    })
  })

  describe('filter data passing', () => {
    it('should pass filter to child modal', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({ label: 'Custom Label' })

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('filter-label')).toHaveTextContent('Custom Label')
    })

    it('should pass filter member to child modal', () => {
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('filter-member')).toHaveTextContent('Users.status')
    })
  })

  describe('schema filtering', () => {
    it('should provide full schema to child modal', () => {
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('has-full-schema')).toHaveTextContent('true')
    })

    it('should provide filtered schema with dashboard fields', () => {
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('has-filtered-schema')).toHaveTextContent('true')
    })

    it('should handle null schema gracefully', () => {
      const props = createDefaultProps()
      props.schema = null

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('has-full-schema')).toHaveTextContent('false')
      expect(screen.getByTestId('has-filtered-schema')).toHaveTextContent('false')
    })
  })

  describe('save action', () => {
    it('should call onSave and onClose when child modal saves', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      await user.click(screen.getByTestId('save-button'))

      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Updated Label' })
      )
      expect(props.onClose).toHaveBeenCalled()
    })

    it('should handle async onSave', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.onSave = vi.fn().mockResolvedValue(undefined)

      render(<FilterEditModal {...props} />)

      await user.click(screen.getByTestId('save-button'))

      await waitFor(() => {
        expect(props.onClose).toHaveBeenCalled()
      })
    })

    it('should show error alert when save fails', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
      props.onSave = vi.fn().mockRejectedValue(new Error('Save failed'))

      render(<FilterEditModal {...props} />)

      await user.click(screen.getByTestId('save-button'))

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Failed to save filter. Please try again.')
      })

      alertMock.mockRestore()
    })
  })

  describe('delete action', () => {
    it('should call onDelete when child modal deletes', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      await user.click(screen.getByTestId('delete-button'))

      expect(props.onDelete).toHaveBeenCalled()
    })
  })

  describe('close action', () => {
    it('should call onClose when child modal closes', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FilterEditModal {...props} />)

      await user.click(screen.getByTestId('close-button'))

      expect(props.onClose).toHaveBeenCalled()
    })
  })

  describe('dashboard field extraction', () => {
    it('should filter schema to include only dashboard fields', () => {
      const props = createDefaultProps()
      // Dashboard config uses Users.count and Users.status
      // The filtered schema should include these fields

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('has-filtered-schema')).toHaveTextContent('true')
    })

    it('should handle empty portlets array', () => {
      const props = createDefaultProps()
      props.dashboardConfig = {
        ...mockDashboardConfig,
        portlets: []
      }

      render(<FilterEditModal {...props} />)

      // Should still render without errors
      expect(screen.getByTestId('dashboard-filter-config-modal')).toBeInTheDocument()
    })
  })

  describe('universal time filter', () => {
    it('should handle universal time filter', () => {
      const props = createDefaultProps()
      props.filter = createMockFilter({
        id: 'universal-time',
        label: 'Date Range',
        isUniversalTime: true,
        filter: {
          member: '__universal_time__',
          operator: 'inDateRange',
          values: [],
          dateRange: 'last 7 days'
        } as SimpleFilter & { dateRange: string }
      })

      render(<FilterEditModal {...props} />)

      expect(screen.getByTestId('filter-member')).toHaveTextContent('__universal_time__')
    })
  })
})
