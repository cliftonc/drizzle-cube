import React from 'react'
import Modal from './Modal'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary' | 'warning'
  isLoading?: boolean
}

/**
 * A reusable confirmation modal component.
 *
 * Usage:
 * ```tsx
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Portlet"
 *   message="Are you sure you want to delete this portlet? This action cannot be undone."
 *   confirmText="Delete"
 *   confirmVariant="danger"
 * />
 * ```
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  const getConfirmButtonClasses = () => {
    const baseClasses = 'dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-2 dc:disabled:opacity-50 dc:disabled:cursor-not-allowed'

    switch (confirmVariant) {
      case 'danger':
        return `${baseClasses} bg-dc-danger dc:text-white dc:hover:bg-dc-danger/90 focus:ring-dc-danger`
      case 'warning':
        return `${baseClasses} bg-dc-warning dc:text-white dc:hover:bg-dc-warning/90 focus:ring-dc-warning`
      case 'primary':
      default:
        return `${baseClasses} bg-dc-primary dc:text-white dc:hover:bg-dc-primary/90 focus:ring-dc-primary`
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border border-dc-border dc:rounded-md hover:bg-dc-surface-hover dc:transition-colors dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-2 focus:ring-dc-primary dc:disabled:opacity-50 dc:disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={getConfirmButtonClasses()}
          >
            {isLoading ? (
              <span className="dc:flex dc:items-center dc:gap-2">
                <svg className="dc:animate-spin dc:h-4 dc:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="dc:opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="dc:opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      <div className="text-dc-text-secondary">
        {message}
      </div>
    </Modal>
  )
}

export default ConfirmModal
