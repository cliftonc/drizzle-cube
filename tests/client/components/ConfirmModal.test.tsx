import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ConfirmModal from '../../../src/client/components/ConfirmModal'

describe('ConfirmModal', () => {
  describe('rendering', () => {
    it('should display title', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Item"
          message="Are you sure?"
        />
      )

      expect(screen.getByText('Delete Item')).toBeInTheDocument()
    })

    it('should display message', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Are you sure you want to delete this item?"
        />
      )

      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
    })

    it('should display confirm button with custom text', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          confirmText="Yes, Delete"
        />
      )

      expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument()
    })

    it('should display cancel button with custom text', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          cancelText="No, Keep It"
        />
      )

      expect(screen.getByRole('button', { name: 'No, Keep It' })).toBeInTheDocument()
    })

    it('should use default button text when not provided', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should use default title when not provided', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      // The default title is "Confirm" which appears in the heading
      const heading = screen.getByRole('heading', { name: 'Confirm' })
      expect(heading).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(
        <ConfirmModal
          isOpen={false}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      expect(screen.queryByText('Test message')).not.toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={onConfirm}
          message="Test message"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(onConfirm).toHaveBeenCalled()
    })

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when modal is closed via Escape key', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      // Click the backdrop (parent of dialog)
      const dialog = screen.getByRole('dialog')
      const backdrop = dialog.parentElement
      if (backdrop) {
        await user.click(backdrop)
      }

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose after onConfirm completes', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onConfirm = vi.fn().mockResolvedValue(undefined)

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          message="Test message"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should handle async onConfirm', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)))
      const onClose = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          message="Test message"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(onConfirm).toHaveBeenCalled()
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('states', () => {
    it('should show loading state on confirm button when isLoading is true', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          isLoading={true}
        />
      )

      // The loading state shows "Processing..." text
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('should disable confirm button when isLoading is true', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          isLoading={true}
        />
      )

      const confirmButton = screen.getByText('Processing...').closest('button')
      expect(confirmButton).toBeDisabled()
    })

    it('should disable cancel button when isLoading is true', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          isLoading={true}
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      expect(cancelButton).toBeDisabled()
    })

    it('should not close on Escape when isLoading is true', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={() => {}}
          message="Test message"
          isLoading={true}
        />
      )

      await user.keyboard('{Escape}')

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not close on backdrop click when isLoading is true', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <ConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={() => {}}
          message="Test message"
          isLoading={true}
        />
      )

      const dialog = screen.getByRole('dialog')
      const backdrop = dialog.parentElement
      if (backdrop) {
        await user.click(backdrop)
      }

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('variants', () => {
    it('should apply danger styling when confirmVariant is "danger"', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          confirmVariant="danger"
        />
      )

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      // The danger variant uses bg-dc-danger class
      expect(confirmButton.className).toContain('bg-dc-danger')
    })

    it('should apply warning styling when confirmVariant is "warning"', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          confirmVariant="warning"
        />
      )

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton.className).toContain('bg-dc-warning')
    })

    it('should apply primary styling when confirmVariant is "primary" (default)', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
          confirmVariant="primary"
        />
      )

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton.className).toContain('bg-dc-primary')
    })

    it('should default to primary styling when confirmVariant is not provided', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message="Test message"
        />
      )

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton.className).toContain('bg-dc-primary')
    })
  })

  describe('message content', () => {
    it('should support React nodes as message', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          message={<span data-testid="custom-message">Custom <strong>message</strong></span>}
        />
      )

      expect(screen.getByTestId('custom-message')).toBeInTheDocument()
      expect(screen.getByText('message')).toBeInTheDocument()
    })
  })
})
