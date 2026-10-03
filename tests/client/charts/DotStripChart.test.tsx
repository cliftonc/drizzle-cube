/**
 * Tests for DotStripChart component.
 *
 * The chart uses `useCubeFieldLabel`, which throws outside CubeProvider, so
 * these render through `renderWithProviders` rather than bare `render`.
 */

import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '../../client-setup/test-utils'
import DotStripChart from '../../../src/client/components/charts/DotStripChart'

vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

// One row per person; the band dimension groups them into rows.
const data = [
  { 'People.band': 'Team leads', 'People.name': 'Ada', 'People.prsPerDay': 5.1 },
  { 'People.band': 'Team leads', 'People.name': 'Bo', 'People.prsPerDay': 5.4 },
  { 'People.band': 'Team leads', 'People.name': 'Cy', 'People.prsPerDay': 1.2 },
  { 'People.band': 'QA', 'People.name': 'Dee', 'People.prsPerDay': 7.4 },
  { 'People.band': 'QA', 'People.name': 'Eli', 'People.prsPerDay': 7.9 },
]

const chartConfig = {
  xAxis: ['People.band'],
  yAxis: ['People.prsPerDay'],
  series: ['People.name'],
}

describe('DotStripChart', () => {
  it('renders one row per band and one dot per data row', () => {
    renderWithProviders(<DotStripChart data={data} chartConfig={chartConfig} height={400} />)

    expect(screen.getByTestId('dot-strip-band-Team leads')).toBeInTheDocument()
    expect(screen.getByTestId('dot-strip-band-QA')).toBeInTheDocument()
    expect(screen.getAllByTestId('dot-strip-dot')).toHaveLength(5)
  })

  it('shows the band name and the n= badge', () => {
    renderWithProviders(<DotStripChart data={data} chartConfig={chartConfig} height={400} />)

    expect(screen.getByText('Team leads')).toBeInTheDocument()
    expect(screen.getByText('n=3')).toBeInTheDocument()
    expect(screen.getByText('n=2')).toBeInTheDocument()
  })

  it('hides the band badges when showBandStats is off', () => {
    renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ showBandStats: false }} />
    )

    expect(screen.queryByText('n=3')).not.toBeInTheDocument()
    expect(screen.getByText('Team leads')).toBeInTheDocument()
  })

  it('shows a spread badge for a positive band', () => {
    renderWithProviders(<DotStripChart data={data} chartConfig={chartConfig} height={400} />)

    // Team leads: 5.4 / 1.2 = 4.50
    expect(screen.getByText('spread 4.50×')).toBeInTheDocument()
  })

  it('hides the spread badge when the band minimum is not positive', () => {
    const withZero = [
      { 'People.band': 'Untracked', 'People.name': 'Fay', 'People.prsPerDay': 0 },
      { 'People.band': 'Untracked', 'People.name': 'Gus', 'People.prsPerDay': 0.6 },
    ]
    renderWithProviders(<DotStripChart data={withZero} chartConfig={chartConfig} height={400} />)

    expect(screen.getByText('n=2')).toBeInTheDocument()
    expect(screen.queryByText(/spread/)).not.toBeInTheDocument()
  })

  it('marks a band with no numeric values as having no data recorded', () => {
    const noValues = [
      { 'People.band': 'Untracked', 'People.name': 'Fay', 'People.prsPerDay': null },
      { 'People.band': 'Untracked', 'People.name': 'Gus', 'People.prsPerDay': null },
    ]
    renderWithProviders(<DotStripChart data={noValues} chartConfig={chartConfig} height={400} />)

    expect(screen.getByText('no data recorded')).toBeInTheDocument()
    expect(screen.queryAllByTestId('dot-strip-dot')).toHaveLength(0)
  })

  it('renders the median marker by default and drops it when disabled', () => {
    const { unmount } = renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} />
    )
    expect(screen.getByTestId('dot-strip-median-Team leads')).toBeInTheDocument()
    unmount()

    renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ showMedianMarker: false }} />
    )
    expect(screen.queryByTestId('dot-strip-median-Team leads')).not.toBeInTheDocument()
  })

  it('labels the extreme dots only when showExtremeLabels is on', () => {
    const { unmount } = renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} />
    )
    expect(screen.queryByTestId('dot-strip-extreme-Cy')).not.toBeInTheDocument()
    unmount()

    renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ showExtremeLabels: true }} />
    )
    // Cy is the lowest and Bo the highest of the Team leads band.
    expect(screen.getByTestId('dot-strip-extreme-Cy')).toBeInTheDocument()
    expect(screen.getByTestId('dot-strip-extreme-Bo')).toBeInTheDocument()
  })

  it('orders bands by median when bandSort is set', () => {
    renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ bandSort: 'valueDesc' }} />
    )

    const bands = screen.getAllByTestId(/^dot-strip-band-/)
    expect(bands[0]).toHaveAttribute('data-testid', 'dot-strip-band-QA')
  })

  it('shows a tooltip on hover and suppresses it when showTooltip is off', () => {
    const { unmount } = renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} />
    )
    fireEvent.mouseEnter(screen.getAllByTestId('dot-strip-dot')[0])
    expect(screen.getByTestId('dot-strip-tooltip')).toBeInTheDocument()
    unmount()

    renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ showTooltip: false }} />
    )
    fireEvent.mouseEnter(screen.getAllByTestId('dot-strip-dot')[0])
    expect(screen.queryByTestId('dot-strip-tooltip')).not.toBeInTheDocument()
  })

  it('fires the drill handler with the clicked band when drill is enabled', () => {
    const onDataPointClick = vi.fn()
    renderWithProviders(
      <DotStripChart
        data={data}
        chartConfig={chartConfig}
        height={400}
        drillEnabled
        onDataPointClick={onDataPointClick}
      />
    )

    fireEvent.click(screen.getAllByTestId('dot-strip-dot')[0])
    expect(onDataPointClick).toHaveBeenCalledTimes(1)
    expect(onDataPointClick.mock.calls[0][0]).toMatchObject({ clickedField: 'People.band' })
  })

  it('does not fire the drill handler when drill is disabled', () => {
    const onDataPointClick = vi.fn()
    renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} onDataPointClick={onDataPointClick} />
    )

    fireEvent.click(screen.getAllByTestId('dot-strip-dot')[0])
    expect(onDataPointClick).not.toHaveBeenCalled()
  })

  it('renders the empty state with no data', () => {
    renderWithProviders(<DotStripChart data={[]} chartConfig={chartConfig} height={400} />)
    expect(screen.getByText('No data points to display in dot strip plot')).toBeInTheDocument()
  })

  it('renders the config error when the mandatory zones are unfilled', () => {
    renderWithProviders(<DotStripChart data={data} chartConfig={{ xAxis: ['People.band'] }} height={400} />)
    expect(
      screen.getByText('Dot strip plot needs a dimension to band by and one measure')
    ).toBeInTheDocument()
  })

  it('reads drop zones stored as bare strings (the AnalysisBuilder shape for maxItems: 1)', () => {
    // `addFieldToAxis` writes a string, not an array, into any zone with
    // maxItems: 1 — which is all three of this chart's zones.
    renderWithProviders(
      <DotStripChart
        data={data}
        chartConfig={
          {
            xAxis: 'People.band',
            yAxis: 'People.prsPerDay',
            series: 'People.name',
          } as unknown as typeof chartConfig
        }
        height={400}
      />
    )

    expect(screen.getAllByTestId('dot-strip-dot')).toHaveLength(5)
    expect(screen.getByText('Team leads')).toBeInTheDocument()
    expect(screen.getByText('n=3')).toBeInTheDocument()
  })

  it('renders without an identity dimension', () => {
    renderWithProviders(
      <DotStripChart
        data={data}
        chartConfig={{ xAxis: ['People.band'], yAxis: ['People.prsPerDay'] }}
        height={400}
      />
    )
    expect(screen.getAllByTestId('dot-strip-dot')).toHaveLength(5)
  })

  it('gives a flat band a row tall enough for the gutter name and badges', () => {
    // A two-dot band packs onto one lane, so the swarm alone would be short —
    // the row still has to fit the band name plus the n= / spread badges.
    const flat = [
      { 'People.band': 'QA', 'People.name': 'Dee', 'People.prsPerDay': 1 },
      { 'People.band': 'QA', 'People.name': 'Eli', 'People.prsPerDay': 9 },
    ]

    const { unmount } = renderWithProviders(
      <DotStripChart data={flat} chartConfig={chartConfig} height={400} />
    )
    const withStats = Number(screen.getByTestId('dot-strip-band-QA').getAttribute('height'))
    expect(withStats).toBeGreaterThanOrEqual(60)
    unmount()

    renderWithProviders(
      <DotStripChart data={flat} chartConfig={chartConfig} height={400} displayConfig={{ showBandStats: false }} />
    )
    const nameOnly = Number(screen.getByTestId('dot-strip-band-QA').getAttribute('height'))
    expect(nameOnly).toBeLessThan(withStats)
  })

  it('draws gridlines only when showGrid is on', () => {
    const { container, unmount } = renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ showGrid: false }} />
    )
    const withoutGrid = container.querySelectorAll('svg line').length
    unmount()

    const { container: withGridContainer } = renderWithProviders(
      <DotStripChart data={data} chartConfig={chartConfig} height={400} displayConfig={{ showGrid: true }} />
    )
    expect(withGridContainer.querySelectorAll('svg line').length).toBeGreaterThan(withoutGrid)
  })
})
