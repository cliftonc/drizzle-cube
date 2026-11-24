/**
 * MarkdownChart — static text and the data-bound template path.
 *
 * The chart has two modes and the switch between them is `queryObject`: without
 * one the content is literal markdown, exactly as it has always been; with one
 * it is a Knap template rendered over the rows.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import MarkdownChart from '../../../src/client/components/charts/MarkdownChart'
import AnalyticsPortlet from '../../../src/client/components/AnalyticsPortlet'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'
import type { CubeQuery, DashboardFilter } from '../../../src/client/types'
import { server } from '../../client-setup/msw-server'

const QUERY: CubeQuery = { measures: ['Employees.count'], dimensions: ['Employees.department'] }

const ROWS = [
  { 'Employees.department': 'Engineering', 'Employees.count': 42 },
  { 'Employees.department': 'Sales', 'Employees.count': 31 }
]

describe('MarkdownChart', () => {
  describe('disclosure', () => {
    it('preserves reader state through filtered query loading and resets on dashboard remount', async () => {
      const user = userEvent.setup()
      const apiUrl = 'https://markdown.example.test/cube'
      let release = () => {}
      let responseReady = Promise.resolve()
      let requests = 0
      server.use(
        http.get(`${apiUrl}/meta`, () => HttpResponse.json({ cubes: [] })),
        http.get(`${apiUrl}/load`, async ({ request }) => {
          requests++
          await responseReady
          return HttpResponse.json({
            query: JSON.parse(new URL(request.url).searchParams.get('query') ?? '{}'),
            data: [{ 'Employees.count': 42 }],
            annotation: { measures: {}, dimensions: {}, segments: {}, timeDimensions: {} },
          })
        }),
      )
      const view = (department?: string) => {
        const filters: DashboardFilter[] = department ? [{
          id: 'department', label: 'Department',
          filter: { member: 'Employees.department', operator: 'equals', values: [department] },
        }] : []
        return (
          <CubeProvider apiOptions={{ apiUrl }} enableBatching={false}>
            <AnalyticsPortlet
              query={JSON.stringify({ measures: ['Employees.count'] })}
              chartType="markdown" eagerLoad
              dashboardFilters={filters} dashboardFilterMapping={['department']}
              displayConfig={{ content: '<details><summary>Details</summary>\n\nTotal {{ first.employees_count }}\n\n</details>' }}
              loadingComponent={<p>Loading Markdown query</p>}
            />
          </CubeProvider>
        )
      }
      const { rerender, unmount } = render(view())
      await screen.findByText('Total 42')
      expect(screen.getByText('Details').closest('details')).not.toHaveAttribute('open')
      await user.click(screen.getByText('Details'))
      for (const [department, open] of [['Engineering', true], ['Sales', false]] as const) {
        const requestsBefore = requests
        responseReady = new Promise<void>(resolve => { release = resolve })
        rerender(view(department))
        await waitFor(() => expect(requests).toBe(requestsBefore + 1))
        expect(screen.getByText('Loading Markdown query')).toBeInTheDocument()
        expect(screen.queryByText('Total 42')).toBeNull()
        release()
        await screen.findByText('Total 42')
        expect(screen.getByText('Details').closest('details')?.hasAttribute('open')).toBe(open)
        if (open) await user.click(screen.getByText('Details'))
      }
      await user.click(screen.getByText('Details'))
      expect(screen.getByText('Details').closest('details')).toHaveAttribute('open')
      unmount()
      render(view())
      await screen.findByText('Total 42')
      expect(screen.getByText('Details').closest('details')).not.toHaveAttribute('open')
    })

    it('starts closed, toggles by pointer and preserves open state across rerenders', async () => {
      const user = userEvent.setup()
      const displayConfig = { content: '<details><summary>About this data</summary>\n\n[Read more](https://example.com)\n\n</details>', hideHeader: true }
      const { rerender, unmount } = render(<MarkdownChart data={[]} displayConfig={displayConfig} />)
      const summary = screen.getByText('About this data')
      const details = summary.closest('details')

      expect(details).not.toHaveAttribute('open')
      expect(screen.getByText('Read more')).not.toBeVisible()
      await user.click(summary)
      expect(details).toHaveAttribute('open')
      expect(screen.getByRole('link', { name: 'Read more' })).toBeVisible()
      rerender(<MarkdownChart data={ROWS} displayConfig={{ ...displayConfig, fontSize: 'large' }} />)
      expect(details).toHaveAttribute('open')
      await user.click(summary)
      expect(details).not.toHaveAttribute('open')
      await user.click(summary)
      unmount()
      render(<MarkdownChart data={[]} displayConfig={displayConfig} />)
      expect(screen.getByText('About this data').closest('details')).not.toHaveAttribute('open')
    })

    it('renders same-line body content and Markdown in the summary', async () => {
      const user = userEvent.setup()
      render(<MarkdownChart data={[]} displayConfig={{ content: '<details><summary>**About** this data</summary>Explanation</details>' }} />)
      await user.click(screen.getByText('About'))
      expect(screen.getByText('About').tagName).toBe('STRONG')
      expect(screen.getByText('Explanation')).toBeVisible()
    })

    it('keeps multiple and nested disclosures independent across rerenders', async () => {
      const user = userEvent.setup()
      const content = '<details><summary>Outer</summary>\n\n<details><summary>Inner</summary>\n\nNested body\n\n</details>\n\n</details>\n\n<details><summary>Second</summary>\n\nSecond body\n\n</details>'
      const { rerender } = render(<MarkdownChart data={[]} displayConfig={{ content }} />)
      await user.click(screen.getByText('Outer'))
      await user.click(screen.getByText('Inner'))
      rerender(<MarkdownChart data={[]} displayConfig={{ content, fontSize: 'large' }} />)
      expect(screen.getByText('Nested body')).toBeVisible()
      expect(screen.getByText('Second body')).not.toBeVisible()
      await user.click(screen.getByText('Outer'))
      expect(screen.getByText('Nested body')).not.toBeVisible()
      await user.click(screen.getByText('Second'))
      expect(screen.getByText('Second body')).toBeVisible()
    })

    it('keeps a section open by its summary when sections before it change', async () => {
      const user = userEvent.setup()
      const section = (name: string) => `<details><summary>${name}</summary>\n\n${name} body\n\n</details>`
      const content = `${section('Sales')}\n\n${section('Engineering')}`
      let reported: unknown
      const onViewStateChange = (state: unknown) => { reported = state }
      const { rerender, unmount } = render(<MarkdownChart data={[]} displayConfig={{ content: section('Engineering') }} onViewStateChange={onViewStateChange} />)
      await user.click(screen.getByText('Engineering'))
      rerender(<MarkdownChart data={[]} displayConfig={{ content }} onViewStateChange={onViewStateChange} />)
      expect(screen.getByText('Engineering body')).toBeVisible()
      expect(screen.getByText('Sales body')).not.toBeVisible()
      unmount()
      render(<MarkdownChart data={[]} displayConfig={{ content }} initialViewState={reported} />)
      expect(screen.getByText('Engineering body')).toBeVisible()
      expect(screen.getByText('Sales body')).not.toBeVisible()
    })

    it('restores nested and repeated sections from the reported view state', async () => {
      const user = userEvent.setup()
      const content = '<details><summary>Outer</summary>\n\n<details><summary>Inner</summary>\n\nNested body\n\n</details>\n\n</details>\n\n<details><summary>Inner</summary>\n\nSecond body\n\n</details>'
      let reported: unknown
      const { unmount } = render(<MarkdownChart data={[]} displayConfig={{ content }} onViewStateChange={state => { reported = state }} />)
      await user.click(screen.getByText('Outer'))
      await user.click(screen.getAllByText('Inner')[0])
      unmount()
      render(<MarkdownChart data={[]} displayConfig={{ content }} initialViewState={reported} />)
      expect(screen.getByText('Nested body')).toBeVisible()
      expect(screen.getByText('Second body')).not.toBeVisible()
    })

    it.each([
      'Revenue <USD> and Array<string>',
      'Acme <!-- x --> done',
      'Customer: <b x={{"toString":1}}>Acme</b>'
    ])('shows %j as written inside and outside a section', (markdown) => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{ content: `${markdown}\n\n<details><summary>About</summary>\n\n${markdown}\n\n</details>` }} />)
      expect(Array.from(container.querySelectorAll('p'), p => p.textContent)).toEqual([markdown, markdown])
    })

    it('keeps content after an unclosed comment visible', () => {
      render(<MarkdownChart data={[]} displayConfig={{ content: '<details><summary>About</summary>\n\n<!--\n\n**Warning**\n\n</details>' }} />)
      expect(screen.getByText('Warning').tagName).toBe('STRONG')
    })

    it('renders Markdown inside an HTML wrapper in a section', () => {
      render(<MarkdownChart data={[]} displayConfig={{ content: '<details><summary>About</summary>\n\n<div align="center">\n\n# Title\n\n</div>\n\n</details>' }} />)
      expect(screen.getByRole('heading', { name: 'Title', hidden: true })).toBeInTheDocument()
    })

    it.each([
      ['<details><summary>About</summary>\n\n```html\n<details><summary>Example</summary>\n</details>\n```\n\nAfter block\n\n</details>', '<details><summary>Example</summary>'],
      ['<details><summary>About</summary>\n\n<script>alert(1)</script>\n\nAfter block\n\n</details>', '<script>alert(1)</script>'],
      ['<details><summary>About</summary><pre>x</pre> After block</details>', '<pre>x</pre>']
    ])('keeps the body of %j inside its section', (content, literal) => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{ content }} />)
      const sections = container.querySelectorAll('details')
      expect(sections).toHaveLength(1)
      expect(sections[0].querySelector('summary')?.textContent).toBe('About')
      expect(sections[0].textContent).toContain(literal)
      expect(sections[0].textContent).toContain('After block')
    })

    it('keeps a closing tag in an indented code example inside its section', () => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{ content: '<details><summary>About</summary>\n\nExample:\n\n    code</details>\n    </details>\n\nAfter code\n\n</details>' }} />)
      const sections = container.querySelectorAll('details')
      expect(sections).toHaveLength(1)
      expect(sections[0].querySelector('pre code')?.textContent).toBe('code</details>\n</details>')
      expect(sections[0]).toHaveTextContent('After code')
    })

    it('joins text after the summary with the next line into one paragraph', () => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{ content: '<details><summary>About</summary>Intro\nmore text\n</details>' }} />)
      expect(Array.from(container.querySelectorAll('details p'), p => p.textContent)).toEqual(['Intro\nmore text'])
    })

    it.each([
      'Text\n\n</details>',
      '<details><summary>About</summary>\n\nNo closing tag',
      '<summary>Alone</summary>'
    ])('shows unmatched disclosure tags in %j as text', (content) => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{ content }} />)
      expect(container.querySelector('details, summary')).toBeNull()
      for (const line of content.split('\n').filter(Boolean)) expect(container).toHaveTextContent(line)
    })

    it('keeps ordinary Markdown visible without a disclosure', () => {
      const { container } = render(<MarkdownChart data={[]} displayConfig={{ content: '# Hello' }} />)
      expect(screen.getByRole('heading', { name: 'Hello' })).toBeVisible()
      expect(container.querySelector('details')).toBeNull()
    })

    it('keeps the existing blank-content behavior', () => {
      const { container, rerender } = render(<MarkdownChart data={[]} displayConfig={{ content: ' ' }} />)
      expect(screen.getByText('No content')).toBeVisible()
      expect(container.querySelector('details')).toBeNull()
      rerender(<MarkdownChart data={[]} displayConfig={{ content: ' ', transparentBackground: true }} />)
      expect(container).toBeEmptyDOMElement()
    })

    it.each([
      ['{{ rows | nosuchfilter }}', 'Template error'],
      ['Total {{ rowCount }}. Missing {{ first.nope }}.', 'Unresolved references']
    ])('keeps template diagnostics visible for %s', async (content, diagnostic) => {
      render(<MarkdownChart data={ROWS} queryObject={QUERY} displayConfig={{ content: `<details><summary>Details</summary>\n\n${content}\n\n</details>` }} />)
      const message = await screen.findByText(diagnostic)
      expect(message).toBeVisible()
    })
  })

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
