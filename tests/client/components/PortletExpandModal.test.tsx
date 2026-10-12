/**
 * Tests for PortletExpandModal, the built-in Expand view of a dashboard card
 *
 * - Renders nothing while no portlet is expanded
 * - Renders the chart from the payload properties, at the view state of the card
 */

import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PortletExpandModal from '../../../src/client/components/dashboard/PortletExpandModal'
import { DashboardStoreProvider, useDashboardStore } from '../../../src/client/stores/dashboardStore'
import type { AnalyticsPortletProps, PortletExpandPayload } from '../../../src/client/types'

let capturedPortletProps: AnalyticsPortletProps | null = null

vi.mock('../../../src/client/components/AnalyticsPortlet', () => ({
  default: (props: AnalyticsPortletProps) => {
    capturedPortletProps = props
    return <div data-testid="analytics-portlet" />
  }
}))

const payload: PortletExpandPayload = {
  portletId: 'portlet-headcount',
  title: 'Headcount',
  chartProps: {
    query: JSON.stringify({ measures: ['Employees.count'] }),
    chartType: 'bar',
    title: 'Headcount'
  },
  viewState: { chart: { page: 3 } }
}

function OpenExpandedPortlet({ expanded }: { expanded: PortletExpandPayload }) {
  const openExpandedPortlet = useDashboardStore(state => state.openExpandedPortlet)
  useEffect(() => {
    openExpandedPortlet(expanded)
  }, [openExpandedPortlet, expanded])
  return null
}

describe('PortletExpandModal', () => {
  beforeEach(() => {
    capturedPortletProps = null
  })

  it('should render nothing while no portlet is expanded', () => {
    render(
      <DashboardStoreProvider>
        <PortletExpandModal />
      </DashboardStoreProvider>
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(capturedPortletProps).toBeNull()
  })

  it('should render the chart from the payload properties at the view state of the card', () => {
    render(
      <DashboardStoreProvider>
        <OpenExpandedPortlet expanded={payload} />
        <PortletExpandModal />
      </DashboardStoreProvider>
    )

    expect(screen.getByRole('dialog', { name: 'Headcount' })).toBeTruthy()
    expect(capturedPortletProps).toMatchObject({
      ...payload.chartProps,
      initialViewState: payload.viewState,
      height: '100%'
    })
  })

  it('should load the chart at once, because the dashboard scroll container does not hold the modal', () => {
    render(
      <DashboardStoreProvider>
        <OpenExpandedPortlet expanded={{ ...payload, chartProps: { ...payload.chartProps, eagerLoad: false } }} />
        <PortletExpandModal />
      </DashboardStoreProvider>
    )

    expect(capturedPortletProps?.eagerLoad).toBe(true)
  })
})
