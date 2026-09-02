/**
 * Chat bubbles render assistant text as markdown.
 *
 * The previous hand-rolled parser anchored its regexes with no `s`/`m` flag, so
 * `.` never crossed a newline and every multi-line reply fell through to plain
 * text — literal `**` and `-` on screen. The multi-line cases below are the ones
 * that regressed in production.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatBubbleBody, getMessageFlags } from '../../../../src/client/components/AgenticNotebook/chatMessageParts'
import type { ChatMessage } from '../../../../src/client/stores/notebookStore'

function renderMessage(message: Partial<ChatMessage>) {
  const full = { id: 'm1', role: 'assistant', content: '', ...message } as ChatMessage
  return render(<ChatBubbleBody message={full} flags={getMessageFlags(full)} />)
}

describe('ChatBubbleBody', () => {
  it('renders a multi-line bulleted reply as real bullets and bold', () => {
    const { container } = renderMessage({
      content:
        'Here are the headline points:\n\n' +
        '- **Work Item Focus**: 3,468 features\n' +
        '- **PR Velocity**: 5,364 merged',
    })

    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelectorAll('strong').length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain('**')
    expect(screen.getByText('Work Item Focus')).toBeInTheDocument()
  })

  it('renders bold inside a single-line reply', () => {
    const { container } = renderMessage({ content: 'Just **bold** inline' })

    expect(container.querySelector('strong')?.textContent).toBe('bold')
    expect(container.textContent).not.toContain('**')
  })

  it('renders headings', () => {
    const { container } = renderMessage({ content: '## Findings\n\nSome detail.' })

    expect(container.querySelector('h2')?.textContent).toBe('Findings')
  })

  it('renders inline code', () => {
    const { container } = renderMessage({ content: 'Use `add_portlet` next.' })

    expect(container.querySelector('code')?.textContent).toBe('add_portlet')
  })

  it('leaves user text alone and keeps its whitespace', () => {
    const { container } = renderMessage({ role: 'user', content: 'literal **stars** please' })

    expect(container.querySelector('strong')).toBeNull()
    expect(container.textContent).toContain('**stars**')
    expect(container.querySelector('.dc\\:whitespace-pre-wrap')).not.toBeNull()
  })

  it('does not pre-wrap assistant markdown, which would double every blank line', () => {
    const { container } = renderMessage({ content: 'One\n\nTwo' })

    expect(container.querySelector('.dc\\:whitespace-pre-wrap')).toBeNull()
  })

  it('still shows the error row on a message that failed', () => {
    const { container } = renderMessage({ content: '', error: 'Something went wrong' })

    expect(container.textContent).toContain('Something went wrong')
  })
})
