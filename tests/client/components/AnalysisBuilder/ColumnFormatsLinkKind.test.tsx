/**
 * The link kind of the column formats editor.
 *
 * A link column takes a URL template whose `{Cube.field}` tokens fill from
 * the row.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DisplayOptionControl from '../../../../src/client/components/AnalysisBuilder/DisplayOptionControl'
import { CubeMetaContext, type CubeMetaContextValue } from '../../../../src/client/providers/CubeMetaContext'
import type { DisplayOptionConfig } from '../../../../src/client/charts/chartConfigs'
import type { ChartAxisConfig, ChartDisplayConfig, ColorPalette, ColumnFormatConfig } from '../../../../src/client/types'

const meta: CubeMetaContextValue = {
  meta: null,
  labelMap: {},
  metaLoading: false,
  metaError: null,
  getFieldLabel: (field: string) => ({
    'Employees.name': 'Name'
  }[field] ?? field),
  refetchMeta: () => {}
}

const option: DisplayOptionConfig = {
  key: 'columnFormats',
  label: 'chart.recordsTable.option.columnFormats.label',
  type: 'columnFormats'
}

const palette: ColorPalette = {
  name: 'test',
  label: 'Test',
  colors: ['#ff0000', '#00ff00', '#0000ff'],
  gradient: []
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
  const onDisplayConfigChange = vi.fn()
  const view = render(
    <CubeMetaContext.Provider value={meta}>
      <DisplayOptionControl
        option={columnFormatsOption}
        chartConfig={chartConfig}
        displayConfig={displayConfig}
        colorPalette={palette}
        onDisplayConfigChange={onDisplayConfigChange}
      />
    </CubeMetaContext.Provider>
  )
  return { onDisplayConfigChange, ...view }
}

/** The last `columnFormats` value the editor committed. */
const committed = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls[spy.mock.calls.length - 1][0].columnFormats

describe('ColumnFormatsOption — link columns', () => {
  const chartConfig = { columns: ['Employees.name'] }

  function renderNameColumn(format: ColumnFormatConfig) {
    const view = renderOption({
      chartConfig,
      displayConfig: { columnFormats: { 'Employees.name': format } }
    })
    fireEvent.click(screen.getByText('Name'))
    return view
  }

  const formatOf = (spy: ReturnType<typeof vi.fn>) => committed(spy)['Employees.name']

  it('offers link among the kinds', () => {
    const { onDisplayConfigChange } = renderNameColumn({ kind: 'text', align: 'right' })

    fireEvent.click(screen.getByRole('button', { name: 'Link' }))

    expect(formatOf(onDisplayConfigChange)).toEqual({ kind: 'link', align: 'right' })
  })

  it('shows the URL template of a link column with a generic example', () => {
    renderNameColumn({ kind: 'link', linkTemplate: '/employees/{Employees.id}' })

    const input = screen.getByPlaceholderText('/employees/{Employees.id}') as HTMLInputElement
    expect(input.value).toBe('/employees/{Employees.id}')
    expect(screen.getByText('URL template')).toBeInTheDocument()
  })

  it('commits the typed URL template', () => {
    const { onDisplayConfigChange } = renderNameColumn({ kind: 'link' })

    fireEvent.change(screen.getByPlaceholderText('/employees/{Employees.id}'), {
      target: { value: '/people/{Employees.id}' }
    })

    expect(formatOf(onDisplayConfigChange)).toEqual({ kind: 'link', linkTemplate: '/people/{Employees.id}' })
  })

  it('drops the URL template when the field is cleared', () => {
    const { onDisplayConfigChange } = renderNameColumn({ kind: 'link', linkTemplate: '/employees/{Employees.id}' })

    fireEvent.change(screen.getByPlaceholderText('/employees/{Employees.id}'), { target: { value: '' } })

    expect(formatOf(onDisplayConfigChange)).toEqual({ kind: 'link', linkTemplate: undefined })
  })
})
