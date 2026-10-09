/**
 * The progress band picker of the column formats editor.
 *
 * A chart whose renderer reads `progressBands` opts in to the picker. The
 * picker edits value thresholds, each with a palette colour.
 */
import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DisplayOptionControl from '../../../../src/client/components/AnalysisBuilder/DisplayOptionControl'
import { CubeMetaContext, type CubeMetaContextValue } from '../../../../src/client/providers/CubeMetaContext'
import type { DisplayOptionConfig } from '../../../../src/client/charts/chartConfigs'
import type { ChartAxisConfig, ChartDisplayConfig, ColorPalette } from '../../../../src/client/types'

const meta: CubeMetaContextValue = {
  meta: null,
  labelMap: {},
  metaLoading: false,
  metaError: null,
  getFieldLabel: (field: string) => ({
    'Employees.completion': 'Completion'
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

describe('ColumnFormatsOption — progress bands', () => {
  const bandsOption: DisplayOptionConfig = { ...option, progressBands: true }
  const chartConfig = { columns: ['Employees.completion'] }

  function renderProgressColumn(
    progressBands?: Array<{ value: number; colorIndex: number }>,
    columnFormatsOption = bandsOption
  ) {
    const view = renderOption({
      columnFormatsOption,
      chartConfig,
      displayConfig: { columnFormats: { 'Employees.completion': { kind: 'progress', progressBands } } }
    })
    fireEvent.click(screen.getByText('Completion'))
    return view
  }

  const bandsOf = (spy: ReturnType<typeof vi.fn>) => committed(spy)['Employees.completion'].progressBands

  it('shows the band picker only when the option opts in', () => {
    renderProgressColumn(undefined, option)
    expect(screen.queryByText('Colour bands')).not.toBeInTheDocument()
  })

  it('shows each band with its value', () => {
    renderProgressColumn([{ value: 0, colorIndex: 0 }, { value: 50, colorIndex: 1 }])

    expect(screen.getByText('Colour bands')).toBeInTheDocument()
    const inputs = screen.getAllByLabelText('From value') as HTMLInputElement[]
    expect(inputs.map(input => input.value)).toEqual(['0', '50'])
  })

  it('starts a new band a step above the last one', () => {
    const { onDisplayConfigChange } = renderProgressColumn([{ value: 40, colorIndex: 0 }])

    fireEvent.click(screen.getByText('Add band'))

    expect(bandsOf(onDisplayConfigChange)).toEqual([
      { value: 40, colorIndex: 0 },
      { value: 65, colorIndex: 1 }
    ])
  })

  it('starts the first band at zero', () => {
    const { onDisplayConfigChange } = renderProgressColumn()

    fireEvent.click(screen.getByText('Add band'))

    expect(bandsOf(onDisplayConfigChange)).toEqual([{ value: 0, colorIndex: 0 }])
  })

  it('commits a typed value as a number', () => {
    const { onDisplayConfigChange } = renderProgressColumn([{ value: 0, colorIndex: 0 }])

    fireEvent.change(screen.getByLabelText('From value'), { target: { value: '75' } })

    expect(bandsOf(onDisplayConfigChange)).toEqual([{ value: 75, colorIndex: 0 }])
  })

  it('does not commit a value that does not parse yet', () => {
    const { onDisplayConfigChange } = renderProgressColumn([{ value: 10, colorIndex: 0 }])

    // A number input reports '' while the text is a partial number such as '-'.
    fireEvent.change(screen.getByLabelText('From value'), { target: { value: '' } })

    expect(onDisplayConfigChange).not.toHaveBeenCalled()
  })

  it('sets the colour of a band', () => {
    const { onDisplayConfigChange } = renderProgressColumn([{ value: 0, colorIndex: 0 }])

    fireEvent.click(screen.getByLabelText('Colour 3'))

    expect(bandsOf(onDisplayConfigChange)).toEqual([{ value: 0, colorIndex: 2 }])
  })

  it('opens bands that hold a malformed entry and drops the entry on the next edit', () => {
    const { onDisplayConfigChange } = renderProgressColumn(
      [null, { value: 50, colorIndex: 1 }] as unknown as Array<{ value: number; colorIndex: number }>
    )

    const inputs = screen.getAllByLabelText('From value') as HTMLInputElement[]
    expect(inputs.map(input => input.value)).toEqual(['50'])

    fireEvent.click(screen.getByText('Add band'))

    expect(bandsOf(onDisplayConfigChange)).toEqual([
      { value: 50, colorIndex: 1 },
      { value: 75, colorIndex: 1 }
    ])
  })

  it('leaves out a band whose value is not a finite number, as the table does', () => {
    renderProgressColumn([
      { value: '50', colorIndex: 1 },
      { value: Number.POSITIVE_INFINITY, colorIndex: 2 },
      { value: 10, colorIndex: 0 }
    ] as unknown as Array<{ value: number; colorIndex: number }>)

    const inputs = screen.getAllByLabelText('From value') as HTMLInputElement[]
    expect(inputs.map(input => input.value)).toEqual(['10'])
  })

  it('starts a new band a step above the last finite band', () => {
    // A stored 1e309 reads back as Infinity, which would otherwise make every
    // new band Infinity too.
    const { onDisplayConfigChange } = renderProgressColumn(
      JSON.parse('[{ "value": 40, "colorIndex": 0 }, { "value": 1e309, "colorIndex": 1 }]')
    )

    fireEvent.click(screen.getByText('Add band'))

    expect(bandsOf(onDisplayConfigChange)).toEqual([
      { value: 40, colorIndex: 0 },
      { value: 65, colorIndex: 1 }
    ])
  })

  it('removes the bands entirely when the last one is removed', () => {
    const { onDisplayConfigChange } = renderProgressColumn([{ value: 0, colorIndex: 0 }])

    fireEvent.click(screen.getByLabelText('Remove band'))

    expect(bandsOf(onDisplayConfigChange)).toBeUndefined()
  })
})

describe('ColumnFormatsOption — progress bands while editing', () => {
  // Feeds every commit back in, as a real display panel does, so the draft
  // text and the committed bands can be seen together.
  function StatefulOption({ bands }: { bands: Array<{ value: number; colorIndex: number }> }) {
    const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>({
      columnFormats: { 'Employees.completion': { kind: 'progress', progressBands: bands } }
    })
    return (
      <CubeMetaContext.Provider value={meta}>
        <DisplayOptionControl
          option={{ ...option, progressBands: true }}
          chartConfig={{ columns: ['Employees.completion'] }}
          displayConfig={displayConfig}
          colorPalette={palette}
          onDisplayConfigChange={setDisplayConfig}
        />
      </CubeMetaContext.Provider>
    )
  }

  function renderBands(bands: Array<{ value: number; colorIndex: number }>) {
    render(<StatefulOption bands={bands} />)
    fireEvent.click(screen.getByText('Completion'))
  }

  const values = () => (screen.getAllByLabelText('From value') as HTMLInputElement[]).map(input => input.value)

  it('keeps a partial number in the field and shows the committed value again on blur', () => {
    renderBands([{ value: 10, colorIndex: 0 }])
    const input = screen.getByLabelText('From value')

    // A number input reports '' while the text is a partial number such as '-'.
    fireEvent.change(input, { target: { value: '' } })
    expect(values()).toEqual([''])

    fireEvent.blur(input)
    expect(values()).toEqual(['10'])
  })

  it('removes a middle band and keeps the others with their values', () => {
    renderBands([{ value: 0, colorIndex: 0 }, { value: 50, colorIndex: 1 }, { value: 80, colorIndex: 2 }])

    fireEvent.click(screen.getAllByLabelText('Remove band')[1])

    expect(values()).toEqual(['0', '80'])
  })

  it('does not carry the text being typed over to another band when a band is removed', () => {
    renderBands([{ value: 0, colorIndex: 0 }, { value: 50, colorIndex: 1 }, { value: 80, colorIndex: 2 }])

    fireEvent.change(screen.getAllByLabelText('From value')[1], { target: { value: '' } })
    fireEvent.click(screen.getAllByLabelText('Remove band')[0])

    expect(values()).toEqual(['50', '80'])
  })
})
