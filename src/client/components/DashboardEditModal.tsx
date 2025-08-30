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
    } catch (error) {
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
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="dashboard-form"
        disabled={isSaving || !name.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <form id="dashboard-form" onSubmit={handleSubmit} className="space-y-4 w-full">
        <div>
          <label htmlFor="dashboard-name" className="block text-sm font-medium text-gray-700 mb-1">
            Dashboard Name
          </label>
          <input
            type="text"
            id="dashboard-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter dashboard name..."
            required
            autoFocus
          />
        </div>
        
        <div>
          <label htmlFor="dashboard-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="dashboard-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter description..."
          />
        </div>
      </form>
    </Modal>
  )
}