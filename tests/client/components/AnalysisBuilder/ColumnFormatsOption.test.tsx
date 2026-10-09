/**
 * The column formats editor.
 *
 * It lists the columns the chart config assigns, unless the option brings a
 * `columns` resolver — which is how a chart that builds its own columns
 * (computed or pivoted ones) gets each of them formatted.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DisplayOptionControl from '../../../../src/client/components/AnalysisBuilder/DisplayOptionControl'
import { CubeMetaContext, type CubeMetaContextValue } from '../../../../src/client/providers/CubeMetaContext'
import type { DisplayOptionConfig } from '../../../../src/client/charts/chartConfigs'
import type { ChartAxisConfig, ChartDisplayConfig } from '../../../../src/client/types'

const meta: CubeMetaContextValue = {
  meta: null,
  labelMap: {},
  metaLoading: false,
  metaError: null,
  getFieldLabel: (field: string) => ({
    'Employees.name': 'Name',
    'Employees.salary': 'Salary'
  }[field] ?? field),
  refetchMeta: () => {}
}

const option: DisplayOptionConfig = {
  key: 'columnFormats',
  label: 'chart.recordsTable.option.columnFormats.label',
  type: 'columnFormats'
}

function renderOption({
  columnFormatsOption = option,
  chartConfig,
  displayConfig = {}
}: {
  columnFormatsOption?: DisplayOptionConfig
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
}) {
  return render(
    <CubeMetaContext.Provider value={meta}>
      <DisplayOptionControl
        option={columnFormatsOption}
        chartConfig={chartConfig}
        displayConfig={displayConfig}
        onDisplayConfigChange={vi.fn()}
      />
    </CubeMetaContext.Provider>
  )
}

describe('ColumnFormatsOption — columns', () => {
  it('lists the columns the chart config assigns', () => {
    renderOption({ chartConfig: { columns: ['Employees.name', 'Employees.salary'] } })

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
  })

  it('lists the columns from the option resolver instead of the chart config', () => {
    const columns = vi.fn(() => ['Employees.salary', 'Computed.margin'])
    const chartConfig = { columns: ['Employees.name'] }
    const displayConfig = { pageSize: 50 }

    renderOption({ columnFormatsOption: { ...option, columns }, chartConfig, displayConfig })

    expect(screen.getByText('Salary')).toBeInTheDocument()
    // A column the chart builds itself has no metadata title; its name stands in.
    expect(screen.getByText('Computed.margin')).toBeInTheDocument()
    expect(screen.queryByText('Name')).not.toBeInTheDocument()
    expect(columns).toHaveBeenCalledWith({ chartConfig, displayConfig })
  })

  it('lists a column the resolver repeats only once', () => {
    renderOption({
      columnFormatsOption: { ...option, columns: () => ['Employees.salary', 'Employees.salary'] }
    })

    expect(screen.getAllByText('Salary')).toHaveLength(1)
  })

  it('shows the assign-columns hint when the resolver returns no columns', () => {
    renderOption({
      columnFormatsOption: { ...option, columns: () => [] },
      chartConfig: { columns: ['Employees.name'] }
    })

    expect(screen.getByText('Assign columns first — each one can then be formatted here')).toBeInTheDocument()
    expect(screen.queryByText('Name')).not.toBeInTheDocument()
  })
})
