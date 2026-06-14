/**
 * Create-notebook form state + handler for NotebooksListPage, extracted to keep
 * the page component flat.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateNotebook } from '../hooks/useNotebooks'

export function useNotebookCreate() {
  const navigate = useNavigate()
  const createNotebook = useCreateNotebook()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const result = await createNotebook.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || undefined
      })
      setShowCreateForm(false)
      setNewName('')
      setNewDescription('')
      navigate(`/notebooks/${result.id}`)
    } catch (err) {
      console.error('Failed to create notebook:', err)
    }
  }

  const cancelCreate = () => {
    setShowCreateForm(false)
    setNewName('')
    setNewDescription('')
  }

  return {
    createNotebook,
    showCreateForm,
    openCreateForm: () => setShowCreateForm(true),
    newName, setNewName,
    newDescription, setNewDescription,
    handleCreate,
    cancelCreate,
  }
}
