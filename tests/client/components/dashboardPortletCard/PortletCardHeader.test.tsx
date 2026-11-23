/**
 * Tests for the action order of the dashboard card header
 * (features.portletActionOrder).
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

vi.mock('../../../../src/client/components/DebugModal', () => ({
  default: function MockDebugModal() {
    return null
  }
}))

import PortletCardHeader from '../../../../src/client/components/dashboardPortletCard/PortletCardHeader'
import type { PortletActionId, PortletConfig } from '../../../../src/client/types'
import type { PortletDebugDataEntry } from '../../../../src/client/stores/dashboardStore'

const MockIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} />
)

const icons = {
  RefreshIcon: MockIcon,
  EditIcon: MockIcon,
  DeleteIcon: MockIcon,
  CopyIcon: MockIcon,
  FilterIcon: MockIcon
}

const portlet: PortletConfig = { id: 'portlet-1', title: 'Sales Overview', w: 6, h: 4, x: 0, y: 0 }

const debugData: PortletDebugDataEntry = {
  chartConfig: {},
  displayConfig: {},
  queryObject: { measures: ['Sales.total'] },
  data: [{ 'Sales.total': 10 }],
  chartType: 'bar'
}

const PAUSE = 'Pause auto-refresh for this portlet'
const REFRESH = 'Refresh portlet data (Shift+click to bypass cache)'
const EXPAND = 'Expand'
const COPY = 'Copy chart to clipboard'
const DOWNLOAD = 'Download data as XLSX'

function renderHeader(overrides: Partial<React.ComponentProps<typeof PortletCardHeader>> = {}) {
  return render(
    <PortletCardHeader
      portlet={portlet}
      className=""
      restHeaderProps={{}}
      editable={true}
      isEditMode={false}
      isInSelectionMode={false}
      debugData={debugData}
      copyAvailable={true}
      copySuccess={false}
      xlsExportAvailable={true}
      exportInProgress={false}
      showCacheBustIndicator={false}
      icons={icons}
      refreshPause={{ isPaused: false, isDashboardPaused: false, onToggle: vi.fn() }}
      onRefresh={vi.fn()}
      onHoverRefreshChange={vi.fn()}
      onCopyToClipboard={vi.fn()}
      onExportXlsx={vi.fn()}
      onOpenFilterConfig={vi.fn()}
      onDuplicate={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onExpand={vi.fn()}
      {...overrides}
    />
  )
}

const buttonTitles = () => screen.getAllByRole('button').map((button) => button.getAttribute('title'))

describe('PortletCardHeader action order', () => {
  it('should show the actions in the default order when the host sets no order', () => {
    renderHeader()

    expect(buttonTitles()).toEqual([PAUSE, REFRESH, EXPAND, COPY, DOWNLOAD])
  })

  it('should show the actions in the host order', () => {
    const actionOrder: PortletActionId[] = ['copy', 'download', 'pauseRefresh', 'refresh', 'expand']

    renderHeader({ actionOrder })

    expect(buttonTitles()).toEqual([COPY, DOWNLOAD, PAUSE, REFRESH, EXPAND])
  })

  it('should show the actions that the host does not list after the listed ones, in the default order', () => {
    renderHeader({ actionOrder: ['expand'] })

    expect(buttonTitles()).toEqual([EXPAND, PAUSE, REFRESH, COPY, DOWNLOAD])
  })

  it('should not show an action that is off, even when the host lists it', () => {
    renderHeader({ actionOrder: ['copy', 'download', 'refresh', 'expand'], copyAvailable: false, refreshPause: undefined })

    expect(buttonTitles()).toEqual([DOWNLOAD, REFRESH, EXPAND])
  })

  it('should keep the edit actions after the ordered actions in edit mode', () => {
    renderHeader({ isEditMode: true, onExpand: undefined, refreshPause: undefined, actionOrder: ['copy', 'download', 'refresh'] })

    expect(buttonTitles()).toEqual([
      COPY,
      DOWNLOAD,
      REFRESH,
      'Configure dashboard filters',
      'Duplicate portlet',
      'Edit portlet',
      'Delete portlet'
    ])
  })
})

describe('PortletCardHeader Download', () => {
  it('should show Download without debug data when the card has an export', () => {
    renderHeader({ debugData: undefined, xlsExportAvailable: true })

    expect(screen.getByTitle(DOWNLOAD)).toBeInTheDocument()
  })

  it('should not show Download when the card has no export', () => {
    renderHeader({ xlsExportAvailable: false })

    expect(screen.queryByTitle(DOWNLOAD)).not.toBeInTheDocument()
  })
})
