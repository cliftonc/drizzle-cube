/**
 * CompactFilterBar with its real date dropdowns (no child mocks).
 *
 * The bar used to mount the desktop and the mobile layout at once and hide one
 * with CSS. Both layouts share the dropdown open state, so opening Custom or
 * XTD mounted two dropdowns, and each one's document mousedown handler took a
 * click inside the other as an outside click and closed the dropdown.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import CompactFilterBar from '../../../../src/client/components/DashboardFilters/CompactFilterBar'
import type { DashboardFilter } from '../../../../src/client/types'

const dateFilter: DashboardFilter = {
  id: 'universal-time',
  label: 'Date Range',
  isUniversalTime: true,
  filter: { member: '__universal_time__', operator: 'inDateRange', values: ['last 7 days'] }
}

function renderBar() {
  render(
    <CompactFilterBar
      dashboardFilters={[dateFilter]}
      schema={null}
      isEditMode={false}
      onDashboardFiltersChange={vi.fn()}
    />
  )
}

// The dropdowns register their outside-click handler on the next tick.
const nextTick = () => new Promise(resolve => setTimeout(resolve, 0))

describe('CompactFilterBar date dropdowns', () => {
  it('keeps the Custom dropdown open while the user switches its tabs', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    await nextTick()
    await user.click(screen.getByRole('button', { name: 'Since' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Since' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Last' })).toBeInTheDocument()
  })

  it('keeps the XTD dropdown open on a mousedown inside it', async () => {
    const user = userEvent.setup()
    renderBar()

    await user.click(screen.getByRole('button', { name: 'XTD' }))
    await nextTick()
    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByText('Month to Date') })

    expect(screen.getByText('Month to Date')).toBeInTheDocument()
  })
})
