import React, { useEffect, useCallback } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full' | 'fullscreen' | 'fullscreen-mobile'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
  noPadding?: boolean
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
  footer,
  noPadding = false
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

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'dc:max-w-md'
      case 'md':
        return 'dc:max-w-lg'
      case 'lg':
        return 'dc:max-w-2xl'
      case 'xl':
        return 'dc:max-w-6xl'
      case 'xxl':
        return 'dc:max-w-[1400px]' // Good for retina/mac displays
      case 'full':
        return 'dc:max-w-7xl'
      case 'fullscreen':
        return 'dc:w-[90vw] dc:h-[90vh] dc:max-w-none'
      case 'fullscreen-mobile':
        return 'dc:w-full dc:h-full dc:md:w-[min(90vw,1400px)] dc:md:h-[90vh]'
      default:
        return 'dc:max-w-lg'
    }
  }

  return (
    <div
      className={`dc:fixed dc:inset-0 dc:z-50 dc:backdrop-blur-md ${size === 'fullscreen-mobile' ? 'dc:flex dc:md:flex dc:md:items-center dc:md:justify-center' : 'dc:flex dc:items-center dc:justify-center'}`}
      style={{ backgroundColor: 'var(--dc-overlay)' }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={`dc:relative bg-dc-surface dc:border border-dc-border ${size === 'fullscreen-mobile' ? 'dc:rounded-none dc:md:rounded-lg' : 'dc:rounded-lg'} ${size === 'fullscreen' || size === 'fullscreen-mobile' ? '' : 'dc:mx-4'} ${getSizeClasses()} ${size === 'fullscreen' || size === 'fullscreen-mobile' ? '' : 'dc:max-h-[90vh]'} dc:flex dc:flex-col`}
        style={{ boxShadow: 'var(--dc-shadow-2xl)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-4 dc:border-b border-dc-border">
            {title && (
              <h2 id="modal-title" className="dc:text-xl dc:font-semibold text-dc-text">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-dc-text-muted hover:text-dc-text-secondary dc:transition-colors dc:p-2 dc:-mr-2"
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
        <div className={`dc:flex-1 dc:overflow-y-auto ${noPadding ? '' : 'dc:px-6 dc:py-4'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="dc:flex dc:items-center dc:justify-end dc:space-x-3 dc:px-6 dc:py-4 dc:border-t border-dc-border bg-dc-surface-secondary">
            {React.Children.toArray(footer)}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal