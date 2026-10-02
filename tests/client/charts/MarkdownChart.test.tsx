/**
 * MarkdownChart — static text and the data-bound template path.
 *
 * The chart has two modes and the switch between them is `queryObject`: without
 * one the content is literal markdown, exactly as it has always been; with one
 * it is a Knap template rendered over the rows.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MarkdownChart from '../../../src/client/components/charts/MarkdownChart'
import type { CubeQuery } from '../../../src/client/types'

const QUERY: CubeQuery = { measures: ['Employees.count'], dimensions: ['Employees.department'] }

const ROWS = [
  { 'Employees.department': 'Engineering', 'Employees.count': 42 },
  { 'Employees.department': 'Sales', 'Employees.count': 31 }
]

describe('MarkdownChart', () => {
  describe('static content', () => {
    it('renders markdown when there is no query', () => {
      render(<MarkdownChart data={[]} displayConfig={{ content: '# Hello' }} />)

      expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument()
    })

    it('leaves template syntax untouched without a query', () => {
      render(<MarkdownChart data={[]} displayConfig={{ content: 'Total {{ rowCount }}' }} />)

      expect(screen.getByText('Total {{ rowCount }}')).toBeInTheDocument()
    })

    it('shows the empty state when there is no content', () => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{}} />)

      expect(container.textContent).toContain('No content')
    })
  })

  describe('template content', () => {
    it('interpolates aggregates from the rows', async () => {
      render(
        <MarkdownChart
          data={ROWS}
          queryObject={QUERY}
          displayConfig={{ content: 'We employ {{ rows | map:"employees_count" | sum }} people.' }}
        />
      )

      expect(await screen.findByText('We employ 73 people.')).toBeInTheDocument()
    })

    it('renders a markdown table from the rows', async () => {
      render(
        <MarkdownChart data={ROWS} queryObject={QUERY} displayConfig={{ content: '{{ labelled | table }}' }} />
      )

      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
      expect(screen.getAllByRole('row')).toHaveLength(3)
    })

    it('renders its copy when the query returned no rows', async () => {
      render(
        <MarkdownChart
          data={[]}
          queryObject={QUERY}
          displayConfig={{ content: '{% if rowCount %}Some{% else %}No incidents this week.{% endif %}' }}
        />
      )

      expect(await screen.findByText('No incidents this week.')).toBeInTheDocument()
    })

    it('renders a heading per row from a loop', async () => {
      const content = '{% for row in rows %}\n## {{ row.employees_department }}\n{% endfor %}'
      render(<MarkdownChart data={ROWS} queryObject={QUERY} displayConfig={{ content }} />)

      expect(await screen.findByRole('heading', { name: 'Engineering' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Sales' })).toBeInTheDocument()
    })

    // Knap renders an unknown name as an empty string, so the only symptom of a
    // misspelt field is a blank heading. The warning is the whole point.
    it('warns when a loop reads a field that does not exist', async () => {
      const content = '{% for row in rows %}\n## {{ row.employee_department }}\n{% endfor %}'
      const { container } = render(
        <MarkdownChart data={ROWS} queryObject={QUERY} displayConfig={{ content }} />
      )

      await waitFor(() => expect(container.textContent).toContain('Unresolved references'))
      expect(container.textContent).toContain('Unknown field "employee_department"')
      expect(container.textContent).toContain('employees_department')
    })

    it('still renders the body alongside a warning', async () => {
      const content = 'Total {{ rowCount }}. Missing {{ first.nope }}.'
      render(<MarkdownChart data={ROWS} queryObject={QUERY} displayConfig={{ content }} />)

      expect(await screen.findByText(/Total 2\./)).toBeInTheDocument()
    })

    it('reports a template error in place rather than throwing', async () => {
      const { container } = render(
        <MarkdownChart data={ROWS} queryObject={QUERY} displayConfig={{ content: '{{ rows | nosuchfilter }}' }} />
      )

      await waitFor(() => expect(container.textContent).toContain('Template error'))
      expect(container.textContent).toContain('nosuchfilter')
    })
  })
})
