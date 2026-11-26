import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextPortletModal from '../../../src/client/components/TextPortletModal'
import { renderWithProviders } from '../../client-setup/test-utils'
import type { PortletConfig } from '../../../src/client/types'

describe('TextPortletModal Markdown disclosures', () => {
  it('saves and reopens disclosure Markdown without persisting reader state', async () => {
    const user = userEvent.setup()
    const content = '<details><summary>About this data</summary>\n\nComplete **Markdown** body.\n\n</details>'
    const onSave = vi.fn<(portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void>()
    const { unmount } = renderWithProviders(<TextPortletModal isOpen onClose={vi.fn()} onSave={onSave} />)

    await user.type(screen.getByPlaceholderText(/^# Welcome/), content)
    await user.click(screen.getByText('About this data', { selector: 'summary' }))
    expect(onSave).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.analysisConfig?.charts.query?.displayConfig).toEqual({
      content, accentBorder: 'none', accentColorIndex: 0, alignment: 'left', autoHeight: true,
      fontSize: 'medium', hideHeader: true, transparentBackground: false,
    })
    unmount()
    renderWithProviders(<TextPortletModal isOpen onClose={vi.fn()} onSave={onSave} portlet={{ ...saved, id: 'note', x: 0, y: 0 }} />)
    expect(screen.getByPlaceholderText(/^# Welcome/)).toHaveValue(content)
    expect(screen.getByText('About this data', { selector: 'summary' }).closest('details')).not.toHaveAttribute('open')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    expect(onSave.mock.calls[1][0].analysisConfig?.charts.query?.displayConfig).toMatchObject({
      content,
    })
  })
})

describe('TextPortletModal backdrop', () => {
  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<TextPortletModal isOpen onClose={onClose} onSave={vi.fn()} />)

    await user.click(screen.getByPlaceholderText(/^# Welcome/).closest('.dc\\:fixed')!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stays open when a drag starts in the Markdown field and ends on the backdrop', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<TextPortletModal isOpen onClose={onClose} onSave={vi.fn()} />)
    const markdown = screen.getByPlaceholderText(/^# Welcome/)

    await user.pointer([
      { keys: '[MouseLeft>]', target: markdown },
      { target: markdown.closest('.dc\\:fixed')! },
      { keys: '[/MouseLeft]' },
    ])

    expect(onClose).not.toHaveBeenCalled()
  })
})
