/**
 * Tests for FunnelBindingKeySelector component
 *
 * Tests the binding key dimension picker including:
 * - Dropdown behavior
 * - Dimension grouping by cube
 * - Search filtering
 * - Selection and deselection
 * - Keyboard navigation and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FunnelBindingKeySelector from '../../../src/client/components/AnalysisBuilder/FunnelBindingKeySelector'
import type { CubeMeta, FunnelBindingKey } from '../../../src/client/types'

// Mock the icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: (name: string) => {
    // Return a simple mock component for icons
    const MockIcon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className}>icon</span>
    )
    MockIcon.displayName = `MockIcon_${name}`
    return MockIcon
  },
}))

// Sample metadata for testing
const mockMeta: CubeMeta = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      measures: [{ name: 'Users.count', type: 'count', title: 'Count' }],
      dimensions: [
        { name: 'Users.userId', type: 'string', title: 'User ID' },
        { name: 'Users.email', type: 'string', title: 'Email' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At' },
      ],
    },
    {
      name: 'Orders',
      title: 'Orders',
      measures: [{ name: 'Orders.count', type: 'count', title: 'Count' }],
      dimensions: [
        { name: 'Orders.orderId', type: 'number', title: 'Order ID' },
        { name: 'Orders.customerId', type: 'string', title: 'Customer ID' },
        { name: 'Orders.orderDate', type: 'time', title: 'Order Date' },
      ],
    },
  ],
}

describe('FunnelBindingKeySelector', () => {
  const defaultProps = {
    bindingKey: null,
    onChange: vi.fn(),
    schema: mockMeta,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial rendering', () => {
    it('should render with placeholder text when no binding key selected', () => {
      render(<FunnelBindingKeySelector {...defaultProps} />)

      expect(screen.getByText('Select binding key...')).toBeInTheDocument()
    })

    it('should render with selected dimension name', () => {
      render(
        <FunnelBindingKeySelector
          {...defaultProps}
          bindingKey={{ dimension: 'Users.userId' }}
        />
      )

      expect(screen.getByText('userId')).toBeInTheDocument()
    })

    it('should show clear button when binding key is selected', () => {
      render(
        <FunnelBindingKeySelector
          {...defaultProps}
          bindingKey={{ dimension: 'Users.userId' }}
        />
      )

      expect(screen.getByTitle('Clear binding key')).toBeInTheDocument()
    })

    it('should not show clear button when no binding key selected', () => {
      render(<FunnelBindingKeySelector {...defaultProps} />)

      expect(screen.queryByTitle('Clear binding key')).not.toBeInTheDocument()
    })
  })

  describe('dropdown behavior', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Dropdown should be visible with search input
      expect(screen.getByPlaceholderText('Search dimensions...')).toBeInTheDocument()
    })

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup()

      render(
        <div>
          <FunnelBindingKeySelector {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      )

      // Open dropdown
      const button = screen.getByRole('button')
      await user.click(button)
      expect(screen.getByPlaceholderText('Search dimensions...')).toBeInTheDocument()

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'))

      // Dropdown should be closed
      expect(screen.queryByPlaceholderText('Search dimensions...')).not.toBeInTheDocument()
    })

    it('should not open dropdown when disabled', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.queryByPlaceholderText('Search dimensions...')).not.toBeInTheDocument()
    })
  })

  describe('dimension list', () => {
    it('should display dimensions grouped by cube', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      // Should show cube headers
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Orders')).toBeInTheDocument()
    })

    it('should display string and number dimensions only (not time)', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      // String dimensions should be visible
      expect(screen.getByText('User ID')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Customer ID')).toBeInTheDocument()

      // Number dimensions should be visible
      expect(screen.getByText('Order ID')).toBeInTheDocument()

      // Time dimensions should NOT be visible
      expect(screen.queryByText('Created At')).not.toBeInTheDocument()
      expect(screen.queryByText('Order Date')).not.toBeInTheDocument()
    })

    it('should show help text in dropdown', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      expect(
        screen.getByText(/Select a dimension that identifies entities/)
      ).toBeInTheDocument()
    })
  })

  describe('search filtering', () => {
    it('should filter dimensions by search query', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText('Search dimensions...')
      await user.type(searchInput, 'user')

      // Should show matching dimensions
      expect(screen.getByText('User ID')).toBeInTheDocument()

      // Should hide non-matching dimensions
      expect(screen.queryByText('Order ID')).not.toBeInTheDocument()
      expect(screen.queryByText('Customer ID')).not.toBeInTheDocument()
    })

    it('should show no results message when no dimensions match', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText('Search dimensions...')
      await user.type(searchInput, 'xyz123')

      expect(screen.getByText('No matching dimensions found')).toBeInTheDocument()
    })

    it('should filter by cube name', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText('Search dimensions...')
      await user.type(searchInput, 'orders')

      // Should show Orders cube dimensions
      expect(screen.getByText('Order ID')).toBeInTheDocument()
      expect(screen.getByText('Customer ID')).toBeInTheDocument()

      // Should hide Users cube dimensions
      expect(screen.queryByText('User ID')).not.toBeInTheDocument()
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText('Search dimensions...')
      await user.type(searchInput, 'EMAIL')

      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should focus search input when dropdown opens', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText('Search dimensions...')
      expect(searchInput).toHaveFocus()
    })
  })

  describe('selection', () => {
    it('should call onChange with selected dimension', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} onChange={onChange} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('User ID'))

      expect(onChange).toHaveBeenCalledWith({ dimension: 'Users.userId' })
    })

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('User ID'))

      expect(screen.queryByPlaceholderText('Search dimensions...')).not.toBeInTheDocument()
    })

    it('should clear search query after selection', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText('Search dimensions...')
      await user.type(searchInput, 'user')
      await user.click(screen.getByText('User ID'))

      // Re-open dropdown
      await user.click(screen.getByRole('button'))

      // Search should be cleared
      expect(screen.getByPlaceholderText('Search dimensions...')).toHaveValue('')
    })

    it('should show check icon for selected dimension', async () => {
      const user = userEvent.setup()

      render(
        <FunnelBindingKeySelector
          {...defaultProps}
          bindingKey={{ dimension: 'Users.userId' }}
        />
      )

      // Click the main button (first one) to open dropdown
      const buttons = screen.getAllByRole('button')
      await user.click(buttons[0])

      // The User ID option should show check icon
      const userIdOption = screen.getByText('User ID').closest('button')
      expect(userIdOption?.querySelector('[data-testid="icon-check"]')).toBeInTheDocument()
    })
  })

  describe('clearing selection', () => {
    it('should call onChange with null when clear button clicked', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <FunnelBindingKeySelector
          {...defaultProps}
          onChange={onChange}
          bindingKey={{ dimension: 'Users.userId' }}
        />
      )

      const clearButton = screen.getByTitle('Clear binding key')
      await user.click(clearButton)

      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('should not open dropdown when clear button clicked', async () => {
      const user = userEvent.setup()

      render(
        <FunnelBindingKeySelector
          {...defaultProps}
          bindingKey={{ dimension: 'Users.userId' }}
        />
      )

      const clearButton = screen.getByTitle('Clear binding key')
      await user.click(clearButton)

      expect(screen.queryByPlaceholderText('Search dimensions...')).not.toBeInTheDocument()
    })
  })

  describe('cross-cube binding key display', () => {
    it('should display cross-cube binding key label', () => {
      const crossCubeKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Users', dimension: 'Users.userId' },
          { cube: 'Orders', dimension: 'Orders.customerId' },
        ],
      }

      render(
        <FunnelBindingKeySelector {...defaultProps} bindingKey={crossCubeKey} />
      )

      expect(screen.getByText('userId (2 cubes)')).toBeInTheDocument()
    })
  })

  describe('empty schema', () => {
    it('should show no dimensions when schema is null', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} schema={null} />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('No matching dimensions found')).toBeInTheDocument()
    })

    it('should show no dimensions when schema has empty cubes', async () => {
      const user = userEvent.setup()

      render(
        <FunnelBindingKeySelector {...defaultProps} schema={{ cubes: [] }} />
      )

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('No matching dimensions found')).toBeInTheDocument()
    })
  })

  describe('keyboard interaction', () => {
    it('should clear binding key when pressing Enter on clear button', async () => {
      const onChange = vi.fn()

      render(
        <FunnelBindingKeySelector
          {...defaultProps}
          onChange={onChange}
          bindingKey={{ dimension: 'Users.userId' }}
        />
      )

      const clearButton = screen.getByTitle('Clear binding key')
      clearButton.focus()
      fireEvent.keyDown(clearButton, { key: 'Enter' })

      expect(onChange).toHaveBeenCalledWith(null)
    })
  })

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <FunnelBindingKeySelector {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should show disabled styling when disabled', () => {
      render(<FunnelBindingKeySelector {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('opacity-50')
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('should show focus ring when dropdown is open', async () => {
      const user = userEvent.setup()

      render(<FunnelBindingKeySelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(button).toHaveClass('ring-1')
    })
  })
})
