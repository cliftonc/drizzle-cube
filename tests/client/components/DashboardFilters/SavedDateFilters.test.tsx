import { useState } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { eq } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import CompactFilterBar from '../../../../src/client/components/DashboardFilters/CompactFilterBar'
import DashboardFilterConfigModal from '../../../../src/client/components/DashboardFilters/DashboardFilterConfigModal'
import type { DashboardConfig, DashboardFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'
import { useDirtyStateTracking } from '../../../../src/client/hooks/useDirtyStateTracking'
import { getApplicableDashboardFilters } from '../../../../src/client/utils/filterUtils'
import { validateQueryAgainstCubes } from '../../../../src/server/query-validator'
import type { Cube, SemanticQuery } from '../../../../src/server/types'
import { renderWithProviders } from '../../../client-setup/test-utils'

const savedRange = ['2026-08-01', '2026-08-31']
const changedRange = ['2026-09-01', '2026-09-15']
const historyTable = pgTable('test_history', {
  organisationId: text('organisation_id'),
  snapshotDate: timestamp('snapshot_date')
})
const historyCubes = new Map<string, Cube>([['History', {
  name: 'History',
  sql: ({ securityContext }) => {
    if (typeof securityContext.organisationId !== 'string') throw new Error('An organization identifier is required')
    return { from: historyTable, where: eq(historyTable.organisationId, securityContext.organisationId) }
  },
  dimensions: { snapshotDate: { name: 'snapshotDate', type: 'time', sql: historyTable.snapshotDate } },
  measures: {}
}]])
const independentFilter: DashboardFilter = {
  id: 'document-date',
  label: 'Document date',
  filter: { member: 'Documents.createdAt', operator: 'inDateRange', values: [], dateRange: ['2026-07-01', '2026-07-31'] }
}

/** Mount the real filter controls with controlled state and JSON persistence. */
function SavedDashboard({ initialFilter }: { initialFilter: DashboardFilter }) {
  const [config, setConfig] = useState<DashboardConfig>({
    portlets: [],
    filters: [initialFilter, independentFilter]
  })
  const [saved, setSaved] = useState('')
  const [revision, setRevision] = useState(0)
  const filters = config.filters ?? []
  const { handleConfigChange, handleSave } = useDirtyStateTracking({
    initialConfig: config,
    onConfigChange: setConfig,
    onSave: updated => setSaved(JSON.stringify(updated))
  })
  return (
    <>
      <CompactFilterBar
        key={revision}
        dashboardFilters={filters}
        onDashboardFiltersChange={filters => handleConfigChange({ ...config, filters })}
        schema={null}
        isEditMode={false}
      />
      <button onClick={() => handleConfigChange({ ...config, eagerLoad: true })}>Load widgets immediately</button>
      <button onClick={() => handleSave(config)}>Save dashboard</button>
      <button onClick={() => {
        setConfig(JSON.parse(saved))
        setRevision(revision + 1)
      }}>Reopen dashboard</button>
      <output aria-label="Report filters">{JSON.stringify(getApplicableDashboardFilters(filters, ['history']))}</output>
      <output aria-label="Saved dashboard">{saved}</output>
    </>
  )
}

/** Read the native date inputs, which have no accessible role or label. */
function dateInputs(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'))
}

/** Read the JSON emitted by the host save callback. */
function savedFilters(): DashboardFilter[] {
  const saved: DashboardConfig = JSON.parse(screen.getByLabelText('Saved dashboard').textContent ?? '')
  return saved.filters ?? []
}

/** Verify that the displayed report filters pass the server's query validation. */
function expectValidReportQuery() {
  const filters: SemanticQuery['filters'] = JSON.parse(screen.getByLabelText('Report filters').textContent ?? '[]')
  expect(validateQueryAgainstCubes(historyCubes, { dimensions: ['History.snapshotDate'], filters })).toMatchObject({
    isValid: true, errors: []
  })
}

test.each([{ values: savedRange }, { values: [] }, { values: changedRange }])('should save and reopen the selected range with initial values=$values', async ({ values }) => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<SavedDashboard initialFilter={{
    id: 'history',
    label: 'History date',
    filter: {
      member: 'History.snapshotDate', operator: 'inDateRange', dateRange: savedRange,
      values
    }
  }} />)
  expect(screen.getAllByTitle('History date 2026-08-01, 2026-08-31')[0]).toBeInTheDocument()
  await user.click(screen.getAllByText('History date')[0])
  const [start, end] = dateInputs(container)
  expect(start).toHaveValue(savedRange[0])
  expect(end).toHaveValue(savedRange[1])
  fireEvent.change(start, { target: { value: changedRange[0] } })
  fireEvent.change(end, { target: { value: changedRange[1] } })
  await user.click(screen.getByRole('button', { name: 'Save dashboard' }))
  expect(savedFilters()[0].filter).toEqual({
    member: 'History.snapshotDate', operator: 'inDateRange', values: [], dateRange: changedRange
  })
  expect(savedFilters()[1]).toEqual(independentFilter)
  await user.click(screen.getByRole('button', { name: 'Reopen dashboard' }))
  await user.click(screen.getAllByText('History date')[0])
  expect(dateInputs(container)[0]).toHaveValue(changedRange[0])
  expect(dateInputs(container)[1]).toHaveValue(changedRange[1])
  expect(screen.getByLabelText('Report filters')).toHaveTextContent(JSON.stringify([savedFilters()[0].filter]))
})

test('should save and reopen cleared dates without the previous query range', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<SavedDashboard initialFilter={{
    id: 'history', label: 'History date',
    filter: { member: 'History.snapshotDate', operator: 'inDateRange', values: savedRange, dateRange: savedRange }
  }} />)
  await user.click(screen.getAllByText('History date')[0])
  const [start, end] = dateInputs(container)
  await user.clear(start)
  await user.clear(end)
  await user.click(screen.getByRole('button', { name: 'Save dashboard' }))
  expect(savedFilters()[0].filter).toEqual({ member: 'History.snapshotDate', operator: 'inDateRange', values: [] })
  expect(screen.getByLabelText('Report filters')).toHaveTextContent('[]')
  await user.click(screen.getByRole('button', { name: 'Reopen dashboard' }))
  await user.click(screen.getAllByText('History date')[0])
  expect(dateInputs(container)[0]).toHaveValue('')
  expect(dateInputs(container)[1]).toHaveValue('')
  expect(screen.getByLabelText('Report filters')).toHaveTextContent('[]')
})

test('should preserve the other date while a range is incomplete and finish the edited range', async () => {
  const user = userEvent.setup()
  const { container } = renderWithProviders(<SavedDashboard initialFilter={{
    id: 'history', label: 'History date',
    filter: { member: 'History.snapshotDate', operator: 'inDateRange', values: [], dateRange: savedRange }
  }} />)
  await user.click(screen.getAllByText('History date')[0])
  const [start, end] = dateInputs(container)
  await user.clear(start)
  expect(end).toHaveValue(savedRange[1])
  expectValidReportQuery()
  fireEvent.change(start, { target: { value: changedRange[0] } })
  fireEvent.change(end, { target: { value: changedRange[1] } })
  await user.click(screen.getByRole('button', { name: 'Save dashboard' }))
  expect(savedFilters()[0].filter).toMatchObject({ values: [], dateRange: changedRange })
  expectValidReportQuery()
})

test.each([0, 1])('should retain the saved query when endpoint %i is cleared and the dashboard is saved', async (endpoint) => {
  const user = userEvent.setup()
  const filter = { member: 'History.snapshotDate', operator: 'inDateRange' as const, values: [], dateRange: savedRange }
  const { container } = renderWithProviders(<SavedDashboard initialFilter={{ id: 'history', label: 'History date', filter }} />)
  await user.click(screen.getByRole('button', { name: 'Load widgets immediately' }))
  await user.click(screen.getAllByText('History date')[0])
  await user.clear(dateInputs(container)[endpoint])
  expect(dateInputs(container)[endpoint]).toHaveValue('')
  expect(dateInputs(container)[1 - endpoint]).toHaveValue(savedRange[1 - endpoint])
  expectValidReportQuery()
  expect(screen.getByLabelText('Report filters')).toHaveTextContent(JSON.stringify([filter]))
  await user.keyboard('{Escape}')
  await user.click(screen.getAllByText('History date')[0])
  expect(dateInputs(container)[endpoint]).toHaveValue(savedRange[endpoint])
  await user.clear(dateInputs(container)[endpoint])
  await user.click(screen.getByRole('button', { name: 'Save dashboard' }))
  expect(savedFilters()[0].filter).toEqual(filter)
  expect(savedFilters()[1]).toEqual(independentFilter)
  expect(screen.getByLabelText('Saved dashboard')).toHaveTextContent('"eagerLoad":true')
  await user.click(screen.getByRole('button', { name: 'Reopen dashboard' }))
  await user.click(screen.getAllByText('History date')[0])
  expect(dateInputs(container)[0]).toHaveValue(savedRange[0])
  expect(dateInputs(container)[1]).toHaveValue(savedRange[1])
  expectValidReportQuery()
})

test('should save and reopen a relative universal range without resolving it to fixed dates', async () => {
  const user = userEvent.setup()
  renderWithProviders(<SavedDashboard initialFilter={{
    id: 'history', label: 'History date', isUniversalTime: true,
    filter: { member: '__universal_time__', operator: 'inDateRange', values: [], dateRange: savedRange }
  }} />)
  await user.click(screen.getAllByRole('button', { name: '12M' })[0])
  await user.click(screen.getByRole('button', { name: 'Save dashboard' }))
  expect(savedFilters()[0].filter).toEqual({
    member: '__universal_time__', operator: 'inDateRange', values: [], dateRange: 'last 12 months'
  })
  await user.click(screen.getByRole('button', { name: 'Reopen dashboard' }))
  expect(screen.getByLabelText('Report filters')).toHaveTextContent('last 12 months')
  expect(savedFilters()[1]).toEqual(independentFilter)
})

const historySchema: MetaResponse = {
  cubes: [{
    name: 'History', title: 'History', description: '', segments: [], measures: [],
    dimensions: [{ name: 'History.snapshotDate', type: 'time', title: 'Snapshot date', shortTitle: 'Snapshot date' }]
  }]
}

test.each([
  {
    edit: 'preset', values: ['last 7 days'], dateRange: 'last 7 days', expected: 'last 30 days',
    change: async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole('button', { name: 'Last N days' }))
      await user.click(screen.getByRole('button', { name: 'Last 30 days' }))
    }
  },
  {
    edit: 'preset (values only)', values: ['last 7 days'], dateRange: undefined, expected: 'last 30 days',
    change: async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole('button', { name: 'This month' }))
      await user.click(screen.getByRole('button', { name: 'Last 30 days' }))
    }
  },
  {
    edit: 'count', values: ['last 5 days'], dateRange: 'last 5 days', expected: 'last 6 days',
    change: async () => {
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '6' } })
    }
  },
  {
    edit: 'start date', values: savedRange, dateRange: savedRange, expected: ['2026-08-15', savedRange[1]],
    change: async (_user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
      fireEvent.change(dateInputs(container)[0], { target: { value: '2026-08-15' } })
    }
  },
  {
    edit: 'end date', values: savedRange, dateRange: savedRange, expected: [savedRange[0], changedRange[1]],
    change: async (_user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
      fireEvent.change(dateInputs(container)[1], { target: { value: changedRange[1] } })
    }
  }
])('should save only the new range when the filter modal edits the $edit of a range saved in values', async ({ values, dateRange, expected, change }) => {
  const user = userEvent.setup()
  const edits: DashboardFilter[] = []
  const { container } = renderWithProviders(
    <DashboardFilterConfigModal
      filter={{
        id: 'history', label: 'History date',
        filter: { member: 'History.snapshotDate', operator: 'inDateRange', values, dateRange }
      }}
      fullSchema={historySchema}
      filteredSchema={historySchema}
      isOpen
      onSave={filter => edits.push(filter)}
      onDelete={() => {}}
      onClose={() => {}}
    />
  )
  await change(user, container)
  await user.click(screen.getByRole('button', { name: 'Done' }))
  expect(edits[0].filter).toEqual({
    member: 'History.snapshotDate', operator: 'inDateRange', values: [], dateRange: expected
  })
  expect(validateQueryAgainstCubes(historyCubes, {
    dimensions: ['History.snapshotDate'], filters: JSON.parse(JSON.stringify([edits[0].filter]))
  })).toMatchObject({ isValid: true, errors: [] })
})

test('should query only the dateRange of a filter saved with the values of an older range', () => {
  const saved: DashboardFilter = {
    id: 'history', label: 'History date',
    filter: { member: 'History.snapshotDate', operator: 'inDateRange', values: ['last 7 days'], dateRange: 'last 30 days' }
  }
  const applied = getApplicableDashboardFilters([saved], ['history'])
  expect(applied).toEqual([
    { member: 'History.snapshotDate', operator: 'inDateRange', values: [], dateRange: 'last 30 days' }
  ])
  expect(validateQueryAgainstCubes(historyCubes, {
    dimensions: ['History.snapshotDate'], filters: JSON.parse(JSON.stringify(applied))
  })).toMatchObject({ isValid: true, errors: [] })
})
