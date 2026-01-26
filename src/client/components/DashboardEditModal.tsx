import React, { useState, useEffect } from 'react'
import Modal from './Modal'

interface DashboardEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; description?: string }) => Promise<void> | void
  title: string
  submitText: string
  initialName?: string
  initialDescription?: string
}

export default function DashboardEditModal({
  isOpen,
  onClose,
  onSave,
  title,
  submitText,
  initialName = '',
  initialDescription = ''
}: DashboardEditModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form values when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setDescription(initialDescription)
    }
  }, [isOpen, initialName, initialDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    setIsSaving(true)
    
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined
      })
      handleClose()
    } catch {
      // Failed to save dashboard
      // Don't close modal on error so user can retry
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setIsSaving(false)
    onClose()
  }

  const footer = (
    <>
      <button
        type="button"
        onClick={handleClose}
        disabled={isSaving}
        className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border border-dc-border dc:rounded-md hover:bg-dc-surface-hover dc:disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="dashboard-form"
        disabled={isSaving || !name.trim()}
        className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-primary dc:border border-transparent dc:rounded-md hover:bg-dc-primary-hover dc:disabled:opacity-50 dc:disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : submitText}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="fullscreen-mobile"
      footer={footer}
    >
      <form id="dashboard-form" onSubmit={handleSubmit} className="dc:space-y-4 dc:w-full">
        <div>
          <label htmlFor="dashboard-name" className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-1">
            Dashboard Name
          </label>
          <input
            type="text"
            id="dashboard-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="dc:w-full dc:px-3 dc:py-2 dc:border border-dc-border dc:rounded-md bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-primary focus:border-dc-primary"
            placeholder="Enter dashboard name..."
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="dashboard-description" className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-1">
            Description (optional)
          </label>
          <textarea
            id="dashboard-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="dc:w-full dc:px-3 dc:py-2 dc:border border-dc-border dc:rounded-md bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-primary focus:border-dc-primary"
            placeholder="Enter description..."
          />
        </div>
      </form>
    </Modal>
  )
}