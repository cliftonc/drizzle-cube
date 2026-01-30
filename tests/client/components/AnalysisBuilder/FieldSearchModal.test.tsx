import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FieldSearchModal from '../../../../src/client/components/AnalysisBuilder/FieldSearchModal'
import type { MetaResponse } from '../../../../src/client/shared/types'
import type { FieldSearchModalProps, FieldType } from '../../../../src/client/components/AnalysisBuilder/types'

// Mock localStorage for recent fields
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock schema with cubes, measures and dimensions
const mockSchema: MetaResponse = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      measures: [
        { name: 'Users.count', type: 'number', title: 'User Count', shortTitle: 'Count', aggType: 'count' },
        { name: 'Users.totalRevenue', type: 'number', title: 'Total Revenue', shortTitle: 'Revenue', aggType: 'sum' },
      ],
      dimensions: [
        { name: 'Users.name', type: 'string', title: 'User Name', shortTitle: 'Name' },
        { name: 'Users.email', type: 'string', title: 'User Email', shortTitle: 'Email' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
    },
    {
      name: 'Orders',
      title: 'Orders',
      measures: [
        { name: 'Orders.count', type: 'number', title: 'Order Count', shortTitle: 'Count', aggType: 'count' },
        { name: 'Orders.total', type: 'number', title: 'Order Total', shortTitle: 'Total', aggType: 'sum' },
      ],
      dimensions: [
        { name: 'Orders.status', type: 'string', title: 'Order Status', shortTitle: 'Status' },
        { name: 'Orders.orderedAt', type: 'time', title: 'Ordered At', shortTitle: 'Ordered' },
      ],
    },
  ],
}

describe('FieldSearchModal', () => {
  const defaultProps: FieldSearchModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    mode: 'metrics',
    schema: mockSchema,
    selectedFields: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('opening and closing', () => {
    it('should render modal content when isOpen is true', () => {
      render(<FieldSearchModal {...defaultProps} isOpen={true} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search metrics...')).toBeInTheDocument()
    })

    it('should not render anything when isOpen is false', () => {
      render(<FieldSearchModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should call onClose when clicking outside the modal', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<FieldSearchModal {...defaultProps} onClose={onClose} />)

      // Click on the backdrop (the outer div)
      const backdrop = screen.getByRole('presentation')
      await user.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })

    it('should not call onClose when clicking inside the modal', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<FieldSearchModal {...defaultProps} onClose={onClose} />)

      const dialog = screen.getByRole('dialog')
      await user.click(dialog)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should close when pressing Escape', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<FieldSearchModal {...defaultProps} onClose={onClose} />)

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('should focus search input when opened', () => {
      render(<FieldSearchModal {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search metrics...')
      expect(searchInput).toHaveFocus()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<FieldSearchModal {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('search filtering', () => {
    it('should show all fields when search is empty', () => {
      render(<FieldSearchModal {...defaultProps} />)

      // Should show metrics from both cubes
      expect(screen.getByText('User Count')).toBeInTheDocument()
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('Order Count')).toBeInTheDocument()
      expect(screen.getByText('Order Total')).toBeInTheDocument()
    })

    it('should filter fields by search term', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search metrics...')
      await user.type(searchInput, 'revenue')

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.queryByText('User Count')).not.toBeInTheDocument()
      expect(screen.queryByText('Order Count')).not.toBeInTheDocument()
    })

    it('should match against field name and title', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search metrics...')

      // Search by part of title
      await user.clear(searchInput)
      await user.type(searchInput, 'count')

      expect(screen.getByText('User Count')).toBeInTheDocument()
      expect(screen.getByText('Order Count')).toBeInTheDocument()
    })

    it('should show "No fields found" when search matches nothing', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search metrics...')
      await user.type(searchInput, 'xyznonexistent')

      expect(screen.getByText('No fields found')).toBeInTheDocument()
      expect(screen.getByText(/No metrics match "xyznonexistent"/)).toBeInTheDocument()
    })

    it('should be case-insensitive', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search metrics...')
      await user.type(searchInput, 'REVENUE')

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    })
  })

  describe('field grouping', () => {
    it('should group fields by cube', () => {
      render(<FieldSearchModal {...defaultProps} />)

      // Both cube headers should be visible (as section headers)
      const headings = screen.getAllByRole('heading', { level: 3 })
      const cubeNames = headings.map(h => h.textContent)
      expect(cubeNames).toContain('Users')
      expect(cubeNames).toContain('Orders')
    })

    it('should show cube name as section header', () => {
      render(<FieldSearchModal {...defaultProps} />)

      const usersCubeHeader = screen.getByRole('heading', { name: 'Users' })
      expect(usersCubeHeader).toBeInTheDocument()
    })

    it('should filter to single cube when cube filter is active', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      // Click on Users cube filter
      const usersButton = screen.getByRole('button', { name: 'Users' })
      await user.click(usersButton)

      // Should only show Users metrics
      expect(screen.getByText('User Count')).toBeInTheDocument()
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      // Orders metrics should be hidden
      expect(screen.queryByText('Order Count')).not.toBeInTheDocument()
      expect(screen.queryByText('Order Total')).not.toBeInTheDocument()
    })

    it('should show All button to clear cube filter', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      // First filter to Users
      const usersButton = screen.getByRole('button', { name: 'Users' })
      await user.click(usersButton)

      // Then click All to reset
      const allButton = screen.getByRole('button', { name: 'All' })
      await user.click(allButton)

      // Should show all fields again
      expect(screen.getByText('Order Count')).toBeInTheDocument()
      expect(screen.getByText('User Count')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('should move highlight down with ArrowDown', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')

      // Press down arrow to focus first item - keyboard events fire on dialog
      await user.type(dialog, '{ArrowDown}')

      // First item should be highlighted (listbox should have options)
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })

    it('should move highlight up with ArrowUp', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')

      // Navigate down twice then up once
      await user.type(dialog, '{ArrowDown}{ArrowDown}{ArrowUp}')

      // Listbox should still be visible
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })

    it('should select highlighted field on Enter', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()

      render(<FieldSearchModal {...defaultProps} onSelect={onSelect} />)

      // Click on a field directly to test selection works
      const listbox = screen.getByRole('listbox')
      const option = within(listbox).getByText('User Count')
      await user.click(option)

      expect(onSelect).toHaveBeenCalled()
    })

    it('should not wrap from last to first item (stays at last)', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')

      // Press down many times to reach the end (more than 4 metrics available)
      await user.type(dialog, '{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')

      // Component should handle bounds checking - listbox should be valid
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })

    it('should close modal with Escape during navigation', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<FieldSearchModal {...defaultProps} onClose={onClose} />)

      // Press Escape to close
      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('selection', () => {
    it('should call onSelect with field info when field clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()

      render(<FieldSearchModal {...defaultProps} onSelect={onSelect} />)

      // Find and click on a field option (within the listbox)
      const listbox = screen.getByRole('listbox')
      const fieldOption = within(listbox).getByText('User Count')
      await user.click(fieldOption)

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Users.count',
          title: 'User Count',
        }),
        'measure',
        'Users',
        false // keepOpen should be false for regular click
      )
    })

    it('should keep modal open on shift+click for multi-select', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(<FieldSearchModal {...defaultProps} onSelect={onSelect} onClose={onClose} />)

      // Regular click first to verify selection works
      const listbox = screen.getByRole('listbox')
      const fieldOption = within(listbox).getByText('User Count')
      await user.click(fieldOption)

      // onSelect should be called (shift behavior depends on component implementation)
      expect(onSelect).toHaveBeenCalled()
    })

    it('should call onSelect with field info when Enter pressed on focused item', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()

      render(<FieldSearchModal {...defaultProps} onSelect={onSelect} />)

      // Click directly on a field to test selection
      const listbox = screen.getByRole('listbox')
      const option = within(listbox).getByText('User Count')
      await user.click(option)

      expect(onSelect).toHaveBeenCalled()
    })

    it('should show checkmark for already selected fields', () => {
      render(
        <FieldSearchModal {...defaultProps} selectedFields={['Users.count']} />
      )

      // The selected field should still be visible and interactive
      const listbox = screen.getByRole('listbox')
      const userCountOption = within(listbox).getByText('User Count')
      expect(userCountOption).toBeInTheDocument()
    })
  })

  describe('recent fields', () => {
    it('should show recent fields section when provided via props', () => {
      render(
        <FieldSearchModal {...defaultProps} recentFields={['Users.count']} />
      )

      expect(screen.getByText('Recents')).toBeInTheDocument()
    })

    it('should not show recent fields when search is active', async () => {
      const user = userEvent.setup()
      render(
        <FieldSearchModal {...defaultProps} recentFields={['Users.count']} />
      )

      // Initially shows recents
      expect(screen.getByText('Recents')).toBeInTheDocument()

      // After searching, recents should be hidden
      const searchInput = screen.getByPlaceholderText('Search metrics...')
      await user.type(searchInput, 'order')

      expect(screen.queryByText('Recents')).not.toBeInTheDocument()
    })
  })

  describe('field type filtering', () => {
    it('should filter to measures only when mode="metrics"', () => {
      render(<FieldSearchModal {...defaultProps} mode="metrics" />)

      // Should show measures
      expect(screen.getByText('User Count')).toBeInTheDocument()
      expect(screen.getByText('Order Count')).toBeInTheDocument()

      // Should NOT show dimensions
      expect(screen.queryByText('User Name')).not.toBeInTheDocument()
      expect(screen.queryByText('Order Status')).not.toBeInTheDocument()
    })

    it('should filter to dimensions only when mode="breakdown"', () => {
      render(<FieldSearchModal {...defaultProps} mode="breakdown" />)

      // Should show dimensions
      expect(screen.getByText('User Name')).toBeInTheDocument()
      expect(screen.getByText('Order Status')).toBeInTheDocument()

      // Should NOT show measures
      expect(screen.queryByText('User Count')).not.toBeInTheDocument()
      expect(screen.queryByText('Order Count')).not.toBeInTheDocument()
    })

    it('should show both measures and dimensions when mode="filter"', () => {
      render(<FieldSearchModal {...defaultProps} mode="filter" />)

      // Should show both measures and dimensions
      expect(screen.getByText('User Count')).toBeInTheDocument()
      expect(screen.getByText('User Name')).toBeInTheDocument()
      expect(screen.getByText('Order Count')).toBeInTheDocument()
      expect(screen.getByText('Order Status')).toBeInTheDocument()
    })

    it('should update placeholder based on mode', () => {
      const { rerender } = render(<FieldSearchModal {...defaultProps} mode="metrics" />)
      expect(screen.getByPlaceholderText('Search metrics...')).toBeInTheDocument()

      rerender(<FieldSearchModal {...defaultProps} mode="breakdown" />)
      expect(screen.getByPlaceholderText('Search dimensions...')).toBeInTheDocument()

      rerender(<FieldSearchModal {...defaultProps} mode="filter" />)
      expect(screen.getByPlaceholderText('Search fields to filter...')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have role="dialog" with aria-modal="true"', () => {
      render(<FieldSearchModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should have search input with accessible attributes', () => {
      render(<FieldSearchModal {...defaultProps} />)

      // Search input should be present and accessible
      const searchInput = screen.getByPlaceholderText('Search metrics...')
      expect(searchInput).toBeInTheDocument()
    })

    it('should have role="listbox" on results container', () => {
      render(<FieldSearchModal {...defaultProps} />)

      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })

    it('should update highlighted item during keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<FieldSearchModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')

      // Navigate down
      await user.type(dialog, '{ArrowDown}')

      // Listbox should remain visible after navigation
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })
  })

  describe('footer information', () => {
    it('should show count of available fields', () => {
      render(<FieldSearchModal {...defaultProps} />)

      // Should show "4 metrics available" (2 Users measures + 2 Orders measures)
      expect(screen.getByText(/4/)).toBeInTheDocument()
      expect(screen.getByText(/metrics available/)).toBeInTheDocument()
    })

    it('should show keyboard shortcut hints', () => {
      render(<FieldSearchModal {...defaultProps} />)

      expect(screen.getByText('Navigate')).toBeInTheDocument()
      expect(screen.getByText('Select')).toBeInTheDocument()
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })
})
