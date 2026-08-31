/**
 * Tests for the RecordsTable component.
 *
 * Covers the parts that are easy to get silently wrong: column resolution and
 * ordering, hidden columns, each of the five column formats, sorting, and the
 * pager.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecordsTable from '../../../../src/client/components/charts/RecordsTable'
import type { ColorPalette } from '../../../../src/client/types'

vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeMeta: () => ({
    getFieldLabel: (field: string) => ({
      'Employees.name': 'Name',
      'Employees.id': 'ID',
      'Employees.salary': 'Salary',
      'Employees.startedAt': 'Started',
      'Employees.attr_1': 'Health',
      'Employees.attr_2': 'Completion'
    }[field] ?? field),
    meta: null
  })
}))

const palette: ColorPalette = {
  name: 'test',
  label: 'Test',
  colors: ['#ff0000', '#00ff00', '#0000ff'],
  gradient: []
}

const rows = [
  { 'Employees.id': 1, 'Employees.name': 'Ada', 'Employees.attr_1': 'At risk', 'Employees.attr_2': '68' },
  { 'Employees.id': 2, 'Employees.name': 'Grace', 'Employees.attr_1': 'On track', 'Employees.attr_2': '95' },
  { 'Employees.id': 3, 'Employees.name': 'Linus', 'Employees.attr_1': 'Blocked', 'Employees.attr_2': 'n/a' }
]

function headerTexts(): string[] {
  return within(screen.getAllByRole('rowgroup')[0])
    .getAllByRole('columnheader')
    .map(cell => cell.textContent?.trim() ?? '')
}

function bodyRowTexts(): string[][] {
  return within(screen.getAllByRole('rowgroup')[1])
    .getAllByRole('row')
    .map(row => within(row).getAllByRole('cell').map(cell => cell.textContent?.trim() ?? ''))
}

describe('RecordsTable — columns', () => {
  it('renders columns in the configured order', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name', 'Employees.attr_1'] }}
      />
    )

    expect(headerTexts()).toEqual(['Name', 'Health'])
  })

  it('falls back to the row keys when no columns are configured', () => {
    render(<RecordsTable data={rows} />)

    expect(headerTexts()).toEqual(['ID', 'Name', 'Health', 'Completion'])
  })

  it('omits hidden columns while keeping their values available to the row', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.id', 'Employees.name'], hiddenColumns: ['Employees.id'] }}
      />
    )

    expect(headerTexts()).toEqual(['Name'])
    expect(bodyRowTexts()[0]).toEqual(['Ada'])
  })

  it('shows an empty state with no rows', () => {
    render(<RecordsTable data={[]} />)

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })
})

describe('RecordsTable — column formats', () => {
  it('renders a badge with its mapped palette colour and leaves unmapped values neutral', () => {
    render(
      <RecordsTable
        data={rows}
        colorPalette={palette}
        chartConfig={{ columns: ['Employees.attr_1'] }}
        displayConfig={{
          columnFormats: {
            'Employees.attr_1': {
              kind: 'badge',
              badgeColors: [{ value: 'At risk', colorIndex: 0 }]
            }
          }
        }}
      />
    )

    expect(screen.getByText('At risk')).toHaveStyle({ color: '#ff0000' })
    // 'Blocked' has no mapping, so it must not be given a guessed colour.
    expect(screen.getByText('Blocked')).not.toHaveStyle({ color: '#ff0000' })
  })

  it('renders a progress bar clamped to its bounds and falls back to text for unparseable values', () => {
    const { container } = render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.attr_2'] }}
        displayConfig={{ columnFormats: { 'Employees.attr_2': { kind: 'progress' } } }}
      />
    )

    const widths = Array.from(container.querySelectorAll('div[style*="width"]'))
      .map(el => (el as HTMLElement).style.width)
    expect(widths).toContain('68%')
    expect(widths).toContain('95%')
    // 'n/a' is a legitimate EAV value — it renders as text, not as 0%.
    expect(screen.getByText('n/a')).toBeInTheDocument()
    // The bar is the default: no ring is drawn.
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('gives every progress bar the same track length regardless of its label', () => {
    // jsdom does no layout, so this asserts the mechanism rather than pixels:
    // the label is fixed-width and the track flexes into what is left. Without
    // it, a wider label ('£117K') shortens its own row's bar and two equal
    // values draw different lengths — visible in a currency column.
    const { container } = render(
      <RecordsTable
        data={[{ 'Employees.salary': 85000 }, { 'Employees.salary': 117000 }]}
        chartConfig={{ columns: ['Employees.salary'] }}
        displayConfig={{
          columnFormats: {
            'Employees.salary': { kind: 'progress', progressMax: 200000 }
          }
        }}
      />
    )

    const labels = Array.from(container.querySelectorAll('tbody span'))
    expect(labels).toHaveLength(2)
    for (const label of labels) {
      expect(label.className).toContain('dc:w-16')
      expect(label.className).toContain('dc:shrink-0')
    }
  })

  it('renders a ring instead of a bar when the progress column asks for the circle style', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.attr_2'] }}
        displayConfig={{
          columnFormats: { 'Employees.attr_2': { kind: 'progress', progressStyle: 'circle' } }
        }}
      />
    )

    // The ring alone carries the value, so it must be labelled with it.
    expect(screen.getByRole('img', { name: '68' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '95' })).toBeInTheDocument()
    // The unparseable value still degrades to text rather than an empty ring.
    expect(screen.getByText('n/a')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('formats numbers through the shared axis formatter', () => {
    render(
      <RecordsTable
        data={[{ 'Employees.salary': 1250 }]}
        chartConfig={{ columns: ['Employees.salary'] }}
        displayConfig={{
          columnFormats: {
            'Employees.salary': {
              kind: 'number',
              numberFormat: { unit: 'currency', currencyCode: 'GBP', abbreviate: false, decimals: 0 }
            }
          }
        }}
      />
    )

    expect(screen.getByText('£1,250')).toBeInTheDocument()
  })

  it('uses a custom header label when one is set', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.attr_1'] }}
        displayConfig={{ columnFormats: { 'Employees.attr_1': { kind: 'text', label: 'Status' } } }}
      />
    )

    expect(headerTexts()).toEqual(['Status'])
  })
})

describe('RecordsTable — reordering columns', () => {
  function dragHeader(from: string, to: string) {
    const headers = screen.getAllByRole('columnheader')
    const source = headers.find(h => h.textContent?.includes(from))!
    const target = headers.find(h => h.textContent?.includes(to))!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(source, { dataTransfer })
    fireEvent.dragOver(target, { dataTransfer })
    fireEvent.drop(target, { dataTransfer })
  }

  it('moves a column when its header is dragged onto another', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name', 'Employees.attr_1', 'Employees.attr_2'] }}
      />
    )

    expect(headerTexts()).toEqual(['Name', 'Health', 'Completion'])

    dragHeader('Completion', 'Name')
    expect(headerTexts()).toEqual(['Completion', 'Name', 'Health'])
  })

  it('does not also toggle the sort when a header is dragged', () => {
    render(
      <RecordsTable data={rows} chartConfig={{ columns: ['Employees.name', 'Employees.attr_1'] }} />
    )

    const headers = screen.getAllByRole('columnheader')
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(headers[0], { dataTransfer })
    fireEvent.dragEnd(headers[0], { dataTransfer })
    fireEvent.click(headers[0])

    expect(bodyRowTexts().map(r => r[0])).toEqual(['Ada', 'Grace', 'Linus'])
  })

  it('reorders the cells with the headers', () => {
    render(
      <RecordsTable data={rows} chartConfig={{ columns: ['Employees.name', 'Employees.attr_1'] }} />
    )

    dragHeader('Health', 'Name')
    expect(bodyRowTexts()[0]).toEqual(['At risk', 'Ada'])
  })
})

describe('RecordsTable — sorting', () => {
  it('cycles a header through ascending, descending and unsorted', () => {
    render(<RecordsTable data={rows} chartConfig={{ columns: ['Employees.name'] }} />)

    const header = screen.getAllByRole('columnheader')[0]
    expect(bodyRowTexts().map(r => r[0])).toEqual(['Ada', 'Grace', 'Linus'])

    fireEvent.click(header)
    expect(bodyRowTexts().map(r => r[0])).toEqual(['Ada', 'Grace', 'Linus'])

    fireEvent.click(header)
    expect(bodyRowTexts().map(r => r[0])).toEqual(['Linus', 'Grace', 'Ada'])

    fireEvent.click(header)
    expect(bodyRowTexts().map(r => r[0])).toEqual(['Ada', 'Grace', 'Linus'])
  })

  it('sorts numeric-looking attribute values as numbers, not as text', () => {
    // Sorted as text '100' would come before '68'.
    const numeric = [
      { 'Employees.attr_2': '68' },
      { 'Employees.attr_2': '100' },
      { 'Employees.attr_2': '9' }
    ]
    render(<RecordsTable data={numeric} chartConfig={{ columns: ['Employees.attr_2'] }} />)

    fireEvent.click(screen.getAllByRole('columnheader')[0])
    expect(bodyRowTexts().map(r => r[0])).toEqual(['9', '68', '100'])
  })
})

describe('RecordsTable — paging', () => {
  const many = Array.from({ length: 7 }, (_, i) => ({ 'Employees.name': `Person ${i}` }))

  it('pages client-side and reports the visible range', () => {
    render(
      <RecordsTable
        data={many}
        chartConfig={{ columns: ['Employees.name'] }}
        displayConfig={{ pageSize: 5 }}
      />
    )

    expect(bodyRowTexts()).toHaveLength(5)
    expect(screen.getByText('1\u20135 of 7')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Next page'))
    expect(bodyRowTexts()).toHaveLength(2)
  })

  it('shows no pager when everything fits on one page', () => {
    render(<RecordsTable data={many} chartConfig={{ columns: ['Employees.name'] }} />)

    expect(screen.queryByLabelText('Next page')).toBeNull()
  })
})

describe('RecordsTable — server-side pagination', () => {
  function serverPagination(overrides: Partial<import('../../../../src/client/types').ChartPagination> = {}) {
    return {
      page: 0,
      pageSize: 25,
      pageSizeOptions: [25, 50, 100],
      total: 120,
      setPage: vi.fn(),
      setPageSize: vi.fn(),
      toggleSort: vi.fn(),
      ...overrides
    }
  }

  it('renders every loaded row — the server already applied the page', () => {
    const pagination = serverPagination({ pageSize: 2 })
    render(
      <RecordsTable data={rows} chartConfig={{ columns: ['Employees.name'] }} pagination={pagination} />
    )

    expect(bodyRowTexts()).toHaveLength(rows.length)
  })

  it('reports the server total rather than the loaded row count', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'] }}
        pagination={serverPagination({ page: 1, pageSize: 25, total: 120 })}
      />
    )

    expect(screen.getByText('26\u201328 of 120')).toBeInTheDocument()
  })

  it('delegates a header click to the host so the whole result set re-sorts', () => {
    const pagination = serverPagination()
    render(
      <RecordsTable data={rows} chartConfig={{ columns: ['Employees.name'] }} pagination={pagination} />
    )

    fireEvent.click(screen.getAllByRole('columnheader')[0])

    expect(pagination.toggleSort).toHaveBeenCalledWith('Employees.name')
    // The rows must not be locally reordered — that would sort one page only.
    expect(bodyRowTexts().map(r => r[0])).toEqual(['Ada', 'Grace', 'Linus'])
  })

  it('delegates paging to the host', () => {
    const pagination = serverPagination({ page: 1 })
    render(
      <RecordsTable data={rows} chartConfig={{ columns: ['Employees.name'] }} pagination={pagination} />
    )

    fireEvent.click(screen.getByLabelText('Next page'))
    expect(pagination.setPage).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByLabelText('Previous page'))
    expect(pagination.setPage).toHaveBeenCalledWith(0)
  })
})

describe('RecordsTable — row links', () => {
  it('renders each cell as a real anchor so modifier-clicks work', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'], hiddenColumns: ['Employees.id'] }}
        displayConfig={{ rowLink: { urlTemplate: '/employees/{Employees.id}' } }}
      />
    )

    const link = screen.getByText('Ada').closest('a')
    expect(link).not.toBeNull()
    // The token comes from a hidden column.
    expect(link).toHaveAttribute('href', '/employees/1')
    expect(link).not.toHaveAttribute('target')
  })

  it('opens in a new tab with rel protection when asked', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'], hiddenColumns: ['Employees.id'] }}
        displayConfig={{ rowLink: { urlTemplate: '/employees/{Employees.id}', target: 'blank' } }}
      />
    )

    const link = screen.getByText('Ada').closest('a')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders no link for an unsafe template', () => {
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'] }}
        displayConfig={{ rowLink: { urlTemplate: 'javascript:alert(1)' } }}
      />
    )

    expect(screen.getByText('Ada').closest('a')).toBeNull()
  })

  it('takes precedence over drill, so the row is a link rather than a drill target', () => {
    const onDataPointClick = vi.fn()
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'], hiddenColumns: ['Employees.id'] }}
        displayConfig={{ rowLink: { urlTemplate: '/employees/{Employees.id}' } }}
        drillEnabled
        onDataPointClick={onDataPointClick}
      />
    )

    fireEvent.click(screen.getByText('Ada'))
    expect(onDataPointClick).not.toHaveBeenCalled()
  })
})

describe('RecordsTable — row clicks', () => {
  it('fires onDataPointClick with the whole row when drill is enabled', () => {
    const onDataPointClick = vi.fn()
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'], hiddenColumns: ['Employees.id'] }}
        drillEnabled
        onDataPointClick={onDataPointClick}
      />
    )

    fireEvent.click(screen.getByText('Ada'))

    expect(onDataPointClick).toHaveBeenCalledTimes(1)
    const event = onDataPointClick.mock.calls[0][0]
    expect(event.clickedField).toBe('Employees.name')
    // Hidden columns stay on the data point so drill and links can use them.
    expect(event.dataPoint['Employees.id']).toBe(1)
  })

  it('does not fire when drill is disabled', () => {
    const onDataPointClick = vi.fn()
    render(
      <RecordsTable
        data={rows}
        chartConfig={{ columns: ['Employees.name'] }}
        onDataPointClick={onDataPointClick}
      />
    )

    fireEvent.click(screen.getByText('Ada'))

    expect(onDataPointClick).not.toHaveBeenCalled()
  })
})
