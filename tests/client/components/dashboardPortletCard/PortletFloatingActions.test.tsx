/**
 * Tests for the action order of the hover strip of a grouped card
 * (features.portletActionOrder).
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import PortletFloatingActions from '../../../../src/client/components/dashboardPortletCard/PortletFloatingActions'
import type { PortletActionId, PortletConfig } from '../../../../src/client/types'

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

const REFRESH = 'Refresh portlet'
const EXPAND = 'Expand'
const COPY = 'Copy chart to clipboard'
const DOWNLOAD = 'Download data as XLSX'

function renderStrip(overrides: Partial<React.ComponentProps<typeof PortletFloatingActions>> = {}) {
  return render(
    <PortletFloatingActions
      portlet={portlet}
      icons={icons}
      showEditActions={false}
      copyAvailable={true}
      copySuccess={false}
      xlsExportAvailable={true}
      exportInProgress={false}
      onRefresh={vi.fn()}
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

describe('PortletFloatingActions action order', () => {
  it('should show the actions in the default order when the host sets no order', () => {
    renderStrip()

    expect(buttonTitles()).toEqual([REFRESH, EXPAND, COPY, DOWNLOAD])
  })

  it('should show the actions in the host order', () => {
    const actionOrder: PortletActionId[] = ['copy', 'download', 'refresh', 'expand']

    renderStrip({ actionOrder })

    expect(buttonTitles()).toEqual([COPY, DOWNLOAD, REFRESH, EXPAND])
  })

  it('should ignore pauseRefresh, which the strip does not show', () => {
    renderStrip({ actionOrder: ['pauseRefresh', 'download'] })

    expect(buttonTitles()).toEqual([DOWNLOAD, REFRESH, EXPAND, COPY])
  })

  it('should keep the edit actions after the ordered actions in edit mode', () => {
    renderStrip({ showEditActions: true, onExpand: undefined, actionOrder: ['copy', 'download', 'refresh'] })

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
