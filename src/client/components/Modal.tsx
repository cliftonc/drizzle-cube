import React, { useEffect, useCallback } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  footer
}) => {
  // Handle ESC key press
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [closeOnEscape, onClose])


  // Manage ESC key listener and body scroll
  useEffect(() => {
    if (isOpen) {
      // Add ESC key listener
      if (closeOnEscape) {
        document.addEventListener('keydown', handleEscapeKey)
      }

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset'
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closeOnEscape, handleEscapeKey])


  if (!isOpen) return null

  return (
    <div 
      className="drizzle-cube-modal-backdrop"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div 
        className={`drizzle-cube-modal ${size ? `drizzle-cube-modal-${size}` : 'drizzle-cube-modal-md'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="drizzle-cube-modal-header">
            {title && (
              <h2 id="modal-title" className="drizzle-cube-modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="drizzle-cube-modal-close"
                aria-label="Close modal"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="drizzle-cube-modal-content">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="drizzle-cube-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal