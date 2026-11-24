/**
 * Only disclosure tags in chart Markdown become live DOM.
 *
 * Markdown content reaches the browser from shared dashboards, imported files,
 * warehouse values (template mode) and model output. markdown-to-jsx's own
 * attribute stripping misses some forms (e.g. a newline before `=`).
 * Chart disclosures discard all source attributes; other render sites disable HTML.
 */

import { render, waitFor } from '@testing-library/react'
import Markdown from 'markdown-to-jsx'
import { describe, it, expect } from 'vitest'
import MarkdownChart from '../../../src/client/components/charts/MarkdownChart'
import { buildMarkdownOptions } from '../../../src/client/components/charts/MarkdownChart.helpers'
import { CHAT_MARKDOWN_OPTIONS, NOTEBOOK_MARKDOWN_OPTIONS } from '../../../src/client/components/markdownOverrides'
import type { CubeQuery } from '../../../src/client/types'

const PAYLOADS = [
  '<div><pre></pre><img src=x onerror\n="alert(1)"></div>',
  '<div><pre></pre><img src=x onerror="alert(1)"></div>',
  '<div><pre></pre><svg onload="alert(1)"></svg></div>',
  '<div><pre></pre><details open ontoggle="alert(1)"></details></div>',
  '<div><pre></pre><input autofocus onfocus="alert(1)"></div>',
  '<div><pre></pre><a href="javascript:alert(1)">x</a></div>',
  '<script>alert(1)</script>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>'
]

function assertInert(container: HTMLElement, allowDetails = false) {
  expect(container.querySelector('script, iframe, img, svg, input')).toBeNull()
  if (!allowDetails) expect(container.querySelector('details')).toBeNull()
  for (const el of Array.from(container.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.toLowerCase().startsWith('on')).toBe(false)
      expect(attr.name.toLowerCase()).not.toBe('srcdoc')
      expect(attr.value.toLowerCase().replace(/\s/g, '')).not.toContain('javascript:')
    }
  }
}

const OPTION_SETS = {
  MarkdownChart: buildMarkdownOptions('#000', 'medium'),
  notebook: NOTEBOOK_MARKDOWN_OPTIONS,
  chat: CHAT_MARKDOWN_OPTIONS
}

describe('markdown raw HTML', () => {
  it.each(PAYLOADS)('keeps %j inert in Markdown with disclosure tags', (content) => {
    const { container } = render(<MarkdownChart data={[]} displayConfig={{ content: `<details><summary>About</summary>\n\n${content}\n\n</details>` }} />)
    const sections = container.querySelectorAll('details')
    expect(sections).toHaveLength(1)
    expect(sections[0].querySelector('summary')?.textContent).toBe('About')
    expect(sections[0]).toHaveTextContent('alert(1)')
    assertInert(container, true)
    for (const details of container.querySelectorAll('details')) expect(details).not.toHaveAttribute('open')
  })

  it('discards attributes on allowed tags and keeps fenced tags literal', () => {
    const content = '<details open ontoggle="alert(1)" style="display:none" name="group"><summary onclick="alert(1)" tabindex="-1">About</summary>\n\nBody\n\n</details>\n\n```html\n<details><summary>Example</summary></details>\n```'
    const { container } = render(<MarkdownChart data={[]} displayConfig={{ content }} />)
    const details = container.querySelector('details')
    expect(details).not.toHaveAttribute('open')
    expect(details).not.toHaveAttribute('name')
    expect(details).not.toHaveAttribute('style')
    expect(details).not.toHaveAttribute('ontoggle')
    expect(container.querySelector('summary')).not.toHaveAttribute('onclick')
    expect(container.querySelector('summary')).not.toHaveAttribute('tabindex')
    expect(container.querySelector('pre code')?.textContent).toBe('<details><summary>Example</summary></details>')
    expect(container.querySelectorAll('details')).toHaveLength(1)
  })

  for (const [name, options] of Object.entries(OPTION_SETS)) {
    describe(name, () => {
      it.each(PAYLOADS)('renders %j inert', (payload) => {
        const { container } = render(<div><Markdown options={options}>{payload}</Markdown></div>)
        assertInert(container)
      })

      it('still renders markdown syntax', () => {
        const { container } = render(<Markdown options={options}>{'**bold** and [link](https://example.com)'}</Markdown>)
        expect(container.querySelector('strong')?.textContent).toBe('bold')
        expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
      })
    })
  }

  it('renders a warehouse value carrying HTML as text in template mode', async () => {
    const query: CubeQuery = { measures: ['Employees.count'], dimensions: ['Employees.department'] }
    const rows = [{ 'Employees.department': PAYLOADS[0], 'Employees.count': 1 }]
    const { container } = render(
      <MarkdownChart data={rows} queryObject={query} displayConfig={{ content: '{{ first.employees_department }}' }} />
    )
    await waitFor(() => expect(container.textContent).toContain('onerror'))
    assertInert(container)
  })
})
