import React, { useEffect, useCallback } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fullscreen' | 'fullscreen-mobile'
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
        return 'max-w-md'
      case 'md':
        return 'max-w-lg'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-6xl'
      case 'full':
        return 'max-w-7xl'
      case 'fullscreen':
        return 'w-[90vw] h-[90vh] max-w-none'
      case 'fullscreen-mobile':
        return 'w-full h-full md:w-[90vw] md:h-[90vh] max-w-none'
      default:
        return 'max-w-lg'
    }
  }

  return (
    <div 
      className={`fixed inset-0 z-50 backdrop-blur-md ${size === 'fullscreen-mobile' ? 'flex md:flex md:items-center md:justify-center' : 'flex items-center justify-center'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div 
        className={`relative bg-white border border-gray-300 ${size === 'fullscreen-mobile' ? 'rounded-none md:rounded-lg' : 'rounded-lg'} shadow-2xl ${size === 'fullscreen' || size === 'fullscreen-mobile' ? '' : 'mx-4'} ${getSizeClasses()} ${size === 'fullscreen' || size === 'fullscreen-mobile' ? '' : 'max-h-[90vh]'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
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
        <div className={`flex-1 overflow-y-auto ${noPadding ? '' : 'px-6 py-4'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal