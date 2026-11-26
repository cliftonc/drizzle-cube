import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { useBackdropClose } from '../../../src/client/hooks/useBackdropClose'

function Overlay({ onClose, enabled }: { onClose: () => void; enabled?: boolean }) {
  const backdropProps = useBackdropClose(onClose, enabled)
  return (
    <div data-testid="backdrop" {...backdropProps}>
      <div role="dialog" onClick={(event) => event.stopPropagation()}>
        <input aria-label="Title" />
      </div>
    </div>
  )
}

describe('useBackdropClose', () => {
  it('should close when a click starts and ends on the backdrop', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} />)

    await user.click(screen.getByTestId('backdrop'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not close when a click is inside the dialog', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} />)

    await user.click(screen.getByRole('textbox', { name: 'Title' }))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should not close when a drag starts inside the dialog and ends on the backdrop', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} />)

    await user.pointer([
      { keys: '[MouseLeft>]', target: screen.getByRole('textbox', { name: 'Title' }) },
      { target: screen.getByTestId('backdrop') },
      { keys: '[/MouseLeft]' },
    ])

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should close on a later backdrop click after a drag that ended on the backdrop', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} />)

    await user.pointer([
      { keys: '[MouseLeft>]', target: screen.getByRole('textbox', { name: 'Title' }) },
      { target: screen.getByTestId('backdrop') },
      { keys: '[/MouseLeft]' },
    ])
    await user.click(screen.getByTestId('backdrop'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not close when disabled', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} enabled={false} />)

    await user.click(screen.getByTestId('backdrop'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
