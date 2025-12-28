/**
 * ShareWarningModal Component
 *
 * Displayed when the query is too large to share via URL,
 * even after dropping chart configuration.
 */

import React from 'react'
import Modal from '../Modal'
import { getIcon } from '../../icons'

export interface ShareWarningModalProps {
  isOpen: boolean
  onClose: () => void
  size: number
  maxSize: number
}

const ShareWarningModal: React.FC<ShareWarningModalProps> = ({
  isOpen,
  onClose,
  size,
  maxSize
}) => {
  const percentUsed = Math.min(Math.round((size / maxSize) * 100), 100)

  const WarningIcon = getIcon('warning')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Query Too Large to Share"
      size="sm"
    >
      <div className="space-y-4">
        {/* Warning icon and message */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 bg-dc-warning-bg dark:bg-dc-warning-bg rounded-full">
            <WarningIcon className="w-5 h-5 text-dc-warning dark:text-dc-warning" />
          </div>
          <div className="text-sm text-dc-text-secondary">
            Your query is too large to fit in a shareable URL. Even after removing chart settings,
            the compressed query exceeds the safe URL length limit.
          </div>
        </div>

        {/* Size indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-dc-text-muted">
            <span>Compressed size</span>
            <span className="text-dc-error dark:text-dc-error font-medium">
              {size.toLocaleString()} / {maxSize.toLocaleString()} chars
            </span>
          </div>
          <div className="h-2 bg-dc-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-dc-danger-bg0 dark:bg-dc-error transition-all duration-300"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        {/* Suggestions */}
        <div className="border-t border-dc-border pt-4">
          <p className="text-xs font-medium text-dc-text mb-2">
            To make your query shareable, try:
          </p>
          <ul className="text-xs text-dc-text-secondary space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-dc-text-muted">-</span>
              <span>Remove some filters, especially complex nested filter groups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dc-text-muted">-</span>
              <span>Reduce the number of dimensions or measures</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dc-text-muted">-</span>
              <span>Simplify date range filters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dc-text-muted">-</span>
              <span>Use the &quot;Copy Query&quot; button to copy the raw JSON instead</span>
            </li>
          </ul>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-dc-primary hover:bg-dc-primary-hover rounded-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ShareWarningModal
