import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Modal from '../../../src/client/components/Modal'

describe('Modal', () => {
  // Store original body overflow to restore after tests
  let originalOverflow: string

  beforeEach(() => {
    originalOverflow = document.body.style.overflow
  })

  afterEach(() => {
    document.body.style.overflow = originalOverflow
  })

  describe('visibility', () => {
    it('should render children when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render anything when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('should render overlay when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      // The modal should have a dialog role
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('closing', () => {
    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal content</div>
        </Modal>
      )

      // Click the backdrop (the outer div with inset-0)
      const backdrop = screen.getByRole('dialog').parentElement
      if (backdrop) {
        await user.click(backdrop)
      }

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal content</div>
        </Modal>
      )

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('should NOT call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal content</div>
        </Modal>
      )

      await user.click(screen.getByText('Modal content'))

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should NOT call onClose on Escape when closeOnEscape is false', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Modal isOpen={true} onClose={onClose} closeOnEscape={false}>
          <div>Modal content</div>
        </Modal>
      )

      await user.keyboard('{Escape}')

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should NOT call onClose on backdrop click when closeOnBackdropClick is false', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Modal isOpen={true} onClose={onClose} closeOnBackdropClick={false}>
          <div>Modal content</div>
        </Modal>
      )

      const backdrop = screen.getByRole('dialog').parentElement
      if (backdrop) {
        await user.click(backdrop)
      }

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      )

      const closeButton = screen.getByRole('button', { name: /close modal/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal Title">
          <div>Modal content</div>
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('should prevent body scroll when modal is open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('customization', () => {
    it('should render custom title when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Custom Title">
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('should not show close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.queryByRole('button', { name: /close modal/i })).not.toBeInTheDocument()
    })

    it('should render footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          footer={<button>Footer Button</button>}
        >
          <div>Modal content</div>
        </Modal>
      )

      expect(screen.getByRole('button', { name: 'Footer Button' })).toBeInTheDocument()
    })
  })
})
