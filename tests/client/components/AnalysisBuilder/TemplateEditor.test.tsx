/**
 * The highlighted template editor.
 *
 * It is a real textarea with a coloured layer drawn underneath, so the things
 * worth asserting are that it still behaves as a text input and that the layer
 * is hidden from assistive technology.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TemplateEditor from '../../../../src/client/components/AnalysisBuilder/TemplateEditor'

describe('TemplateEditor', () => {
  it('renders the value in an editable textbox', () => {
    render(<TemplateEditor value="## Hello" onChange={vi.fn()} />)

    expect(screen.getByRole('textbox')).toHaveValue('## Hello')
  })

  it('reports what the user types', async () => {
    const onChange = vi.fn()
    render(<TemplateEditor value="" onChange={onChange} />)

    await userEvent.type(screen.getByRole('textbox'), 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('colours expressions, tags and headings differently', () => {
    const { container } = render(
      <TemplateEditor value={'## Title\n{% for r in rows %}{{ r.a }}{% endfor %}'} onChange={vi.fn()} />
    )

    const layer = container.querySelector('pre')
    const classes = Array.from(layer?.querySelectorAll('span') ?? []).map((span) => span.className)

    expect(new Set(classes).size).toBeGreaterThan(1)
  })

  // The layer duplicates the textarea's text; a screen reader must not read it.
  it('hides the highlight layer from assistive technology', () => {
    const { container } = render(<TemplateEditor value="text" onChange={vi.fn()} />)

    expect(container.querySelector('pre')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the placeholder while empty', () => {
    render(<TemplateEditor value="" onChange={vi.fn()} placeholder="Write a template" />)

    expect(screen.getAllByText('Write a template').length).toBeGreaterThan(0)
  })

  it('keeps the placeholder on the textbox for assistive technology', () => {
    render(<TemplateEditor value="" onChange={vi.fn()} placeholder="Write a template" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Write a template')
  })
})
