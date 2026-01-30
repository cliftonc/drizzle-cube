import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DashboardEditModal from '../../../src/client/components/DashboardEditModal'

describe('DashboardEditModal', () => {
  // Store original body overflow to restore after tests
  let originalOverflow: string

  beforeEach(() => {
    originalOverflow = document.body.style.overflow
  })

  afterEach(() => {
    document.body.style.overflow = originalOverflow
  })

  const createDefaultProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    title: 'Edit Dashboard',
    submitText: 'Save',
    initialName: '',
    initialDescription: ''
  })

  describe('form fields', () => {
    it('should show title input with initial value', () => {
      const props = createDefaultProps()
      props.initialName = 'My Dashboard'

      render(<DashboardEditModal {...props} />)

      const input = screen.getByRole('textbox', { name: /dashboard name/i })
      expect(input).toHaveValue('My Dashboard')
    })

    it('should show description textarea with initial value', () => {
      const props = createDefaultProps()
      props.initialDescription = 'Dashboard description'

      render(<DashboardEditModal {...props} />)

      const textarea = screen.getByRole('textbox', { name: /description/i })
      expect(textarea).toHaveValue('Dashboard description')
    })

    it('should update title as user types', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const input = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(input, 'New Dashboard')

      expect(input).toHaveValue('New Dashboard')
    })

    it('should update description as user types', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const textarea = screen.getByRole('textbox', { name: /description/i })
      await user.type(textarea, 'New description')

      expect(textarea).toHaveValue('New description')
    })

    it('should autofocus the name input', () => {
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const input = screen.getByRole('textbox', { name: /dashboard name/i })
      expect(input).toHaveFocus()
    })

    it('should show placeholder text for name input', () => {
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const input = screen.getByRole('textbox', { name: /dashboard name/i })
      expect(input).toHaveAttribute('placeholder', 'Enter dashboard name...')
    })

    it('should show placeholder text for description textarea', () => {
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const textarea = screen.getByRole('textbox', { name: /description/i })
      expect(textarea).toHaveAttribute('placeholder', 'Enter description...')
    })

    it('should mark description as optional in label', () => {
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      expect(screen.getByText(/description \(optional\)/i)).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('should disable submit button when title is empty', () => {
      const props = createDefaultProps()
      props.initialName = ''

      render(<DashboardEditModal {...props} />)

      const submitButton = screen.getByRole('button', { name: props.submitText })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when title contains only whitespace', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.initialName = ''

      render(<DashboardEditModal {...props} />)

      const input = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(input, '   ')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when title has content', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.initialName = ''

      render(<DashboardEditModal {...props} />)

      const input = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(input, 'Valid Name')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      expect(submitButton).not.toBeDisabled()
    })

    it('should allow empty description', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.initialName = 'Dashboard Name'

      render(<DashboardEditModal {...props} />)

      const submitButton = screen.getByRole('button', { name: props.submitText })
      await user.click(submitButton)

      expect(props.onSave).toHaveBeenCalledWith({
        name: 'Dashboard Name',
        description: undefined
      })
    })

    it('should not call onSave if validation fails', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.initialName = ''

      render(<DashboardEditModal {...props} />)

      // Try to submit empty form by clicking the submit button (it should be disabled)
      const submitButton = screen.getByRole('button', { name: props.submitText })
      expect(submitButton).toBeDisabled()

      // Even if we somehow bypass the disabled state, onSave should not be called
      expect(props.onSave).not.toHaveBeenCalled()
    })
  })

  describe('submission', () => {
    it('should call onSave with updated values', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      const descInput = screen.getByRole('textbox', { name: /description/i })

      await user.type(nameInput, 'New Dashboard')
      await user.type(descInput, 'New description')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      await user.click(submitButton)

      expect(props.onSave).toHaveBeenCalledWith({
        name: 'New Dashboard',
        description: 'New description'
      })
    })

    it('should trim whitespace from name and description', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      const descInput = screen.getByRole('textbox', { name: /description/i })

      await user.type(nameInput, '  Dashboard Name  ')
      await user.type(descInput, '  Description  ')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      await user.click(submitButton)

      expect(props.onSave).toHaveBeenCalledWith({
        name: 'Dashboard Name',
        description: 'Description'
      })
    })

    it('should close modal after successful save', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(nameInput, 'New Dashboard')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      await user.click(submitButton)

      await waitFor(() => {
        expect(props.onClose).toHaveBeenCalled()
      })
    })

    it('should show loading state while saving', async () => {
      const user = userEvent.setup()
      let resolvePromise: () => void
      const savePromise = new Promise<void>(resolve => {
        resolvePromise = resolve
      })

      const props = createDefaultProps()
      props.onSave = vi.fn().mockReturnValue(savePromise)

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(nameInput, 'New Dashboard')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      await user.click(submitButton)

      // Should show "Saving..." while promise is pending
      expect(screen.getByText('Saving...')).toBeInTheDocument()

      // Resolve the promise
      resolvePromise!()

      await waitFor(() => {
        expect(props.onClose).toHaveBeenCalled()
      })
    })

    it('should disable buttons while saving', async () => {
      const user = userEvent.setup()
      let resolvePromise: () => void
      const savePromise = new Promise<void>(resolve => {
        resolvePromise = resolve
      })

      const props = createDefaultProps()
      props.onSave = vi.fn().mockReturnValue(savePromise)

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(nameInput, 'New Dashboard')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      await user.click(submitButton)

      // Both buttons should be disabled while saving
      expect(screen.getByText('Saving...').closest('button')).toBeDisabled()
      expect(cancelButton).toBeDisabled()

      // Resolve the promise
      resolvePromise!()

      await waitFor(() => {
        expect(props.onClose).toHaveBeenCalled()
      })
    })

    it('should NOT close modal if save fails', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.onSave = vi.fn().mockRejectedValue(new Error('Save failed'))

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(nameInput, 'New Dashboard')

      const submitButton = screen.getByRole('button', { name: props.submitText })
      await user.click(submitButton)

      // Wait for async operation to complete
      await waitFor(() => {
        // onClose should NOT have been called on error
        expect(props.onClose).not.toHaveBeenCalled()
      })

      // Modal should still be open (submit button should be re-enabled)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: props.submitText })).not.toBeDisabled()
      })
    })
  })

  describe('cancellation', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.initialName = 'Initial'

      render(<DashboardEditModal {...props} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(props.onClose).toHaveBeenCalled()
    })

    it('should reset form values when modal reopens', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.initialName = 'Initial Name'

      const { rerender } = render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')

      expect(nameInput).toHaveValue('Modified Name')

      // Close and reopen modal
      rerender(<DashboardEditModal {...props} isOpen={false} />)
      rerender(<DashboardEditModal {...props} isOpen={true} />)

      // Value should be reset to initial
      const reopenedInput = screen.getByRole('textbox', { name: /dashboard name/i })
      expect(reopenedInput).toHaveValue('Initial Name')
    })
  })

  describe('modal behavior', () => {
    it('should not render when isOpen is false', () => {
      const props = createDefaultProps()
      props.isOpen = false

      render(<DashboardEditModal {...props} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render with correct title', () => {
      const props = createDefaultProps()
      props.title = 'Create New Dashboard'

      render(<DashboardEditModal {...props} />)

      expect(screen.getByText('Create New Dashboard')).toBeInTheDocument()
    })

    it('should render with custom submit text', () => {
      const props = createDefaultProps()
      props.submitText = 'Create Dashboard'
      props.initialName = 'Test' // Need valid name to enable button

      render(<DashboardEditModal {...props} />)

      expect(screen.getByRole('button', { name: 'Create Dashboard' })).toBeInTheDocument()
    })

    it('should close when Escape key is pressed', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      await user.keyboard('{Escape}')

      expect(props.onClose).toHaveBeenCalled()
    })
  })

  describe('form submission via keyboard', () => {
    it('should submit form when Enter is pressed in name input', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      await user.type(nameInput, 'New Dashboard')
      await user.keyboard('{Enter}')

      expect(props.onSave).toHaveBeenCalledWith({
        name: 'New Dashboard',
        description: undefined
      })
    })
  })

  describe('initialization with different values', () => {
    it('should initialize with provided initialName', () => {
      const props = createDefaultProps()
      props.initialName = 'Existing Dashboard'

      render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      expect(nameInput).toHaveValue('Existing Dashboard')
    })

    it('should initialize with provided initialDescription', () => {
      const props = createDefaultProps()
      props.initialDescription = 'Existing description'

      render(<DashboardEditModal {...props} />)

      const descInput = screen.getByRole('textbox', { name: /description/i })
      expect(descInput).toHaveValue('Existing description')
    })

    it('should update values when initialName changes while modal is open', () => {
      const props = createDefaultProps()
      props.initialName = 'Original'

      const { rerender } = render(<DashboardEditModal {...props} />)

      const nameInput = screen.getByRole('textbox', { name: /dashboard name/i })
      expect(nameInput).toHaveValue('Original')

      // Simulate props change
      rerender(<DashboardEditModal {...props} initialName="Updated" />)

      expect(nameInput).toHaveValue('Updated')
    })
  })
})
