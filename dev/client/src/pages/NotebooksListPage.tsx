import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getIcon } from '@drizzle-cube/client'
import { useNotebooks, useCreateNotebook, useDeleteNotebook } from '../hooks/useNotebooks'

const PlusIcon = getIcon('plus')
const TrashIcon = getIcon('trash')
const SparklesIcon = getIcon('sparkles')

export default function NotebooksListPage() {
  const { data: notebooks = [], isLoading, error } = useNotebooks()
  const createNotebook = useCreateNotebook()
  const deleteNotebook = useDeleteNotebook()
  const navigate = useNavigate()
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-dc-error text-lg">Failed to load notebooks</p>
        <p className="text-dc-text-muted text-sm mt-2">{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dc-text">AI Notebooks</h1>
          <p className="text-dc-text-secondary mt-1">
            Explore your data with AI-powered analysis notebooks.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={notebooks.length >= 20}
          className="inline-flex items-center px-4 py-2 bg-dc-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Notebook
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-dc-surface rounded-xl shadow-xl max-w-md w-full p-6 border border-dc-border">
            <h2 className="text-lg font-semibold text-dc-text mb-4">Create New Notebook</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dc-text mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Analysis Notebook"
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dc-text mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe what this notebook is for"
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowCreateForm(false); setNewName(''); setNewDescription('') }}
                  className="px-4 py-2 text-sm text-dc-text-secondary hover:text-dc-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || createNotebook.isPending}
                  className="px-4 py-2 bg-dc-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
                >
                  {createNotebook.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limit Warning */}
      {notebooks.length >= 20 && (
        <div className="mb-6 p-3 bg-dc-warning-bg border border-dc-warning rounded-lg text-sm text-dc-warning">
          Maximum of 20 notebooks reached. Delete a notebook to create a new one.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-dc-surface rounded-xl border border-dc-border p-6 animate-pulse">
              <div className="h-5 bg-dc-surface-secondary rounded w-2/3 mb-3" />
              <div className="h-4 bg-dc-surface-secondary rounded w-1/2 mb-4" />
              <div className="h-3 bg-dc-surface-secondary rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notebooks.length === 0 && (
        <div className="text-center py-16 bg-dc-surface rounded-xl border border-dc-border">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-dc-text mb-2">No notebooks yet</h3>
          <p className="text-dc-text-muted mb-6 max-w-sm mx-auto">
            Create a notebook to start exploring your data with AI. Ask questions, get visualizations, and uncover insights.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-dc-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Notebook
          </button>
        </div>
      )}

      {/* Notebook Grid */}
      {!isLoading && notebooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {notebooks.map((notebook) => {
            const blockCount = notebook.config?.blocks?.length || 0
            const messageCount = notebook.config?.messages?.length || 0
            const updatedAt = notebook.updatedAt
              ? new Date(notebook.updatedAt).toLocaleDateString()
              : null

            return (
              <div
                key={notebook.id}
                className="group bg-dc-surface hover:bg-dc-surface-hover rounded-xl border border-dc-border hover:border-dc-border-hover transition-all duration-200 shadow-2xs hover:shadow-md overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-dc-text truncate">
                        {notebook.name}
                      </h3>
                      {notebook.description && (
                        <p className="text-sm text-dc-text-muted mt-1 line-clamp-2">
                          {notebook.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        if (confirm('Delete this notebook?')) {
                          deleteNotebook.mutate(notebook.id)
                        }
                      }}
                      className="ml-2 p-1.5 rounded-md text-dc-text-muted hover:text-dc-error hover:bg-dc-danger-bg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete notebook"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-dc-text-muted">
                    <span>{blockCount} block{blockCount !== 1 ? 's' : ''}</span>
                    <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                    {updatedAt && <span>Updated {updatedAt}</span>}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 border-t border-dc-border bg-dc-surface-secondary">
                  <Link
                    to={`/notebooks/${notebook.id}`}
                    className="text-sm font-medium text-dc-primary hover:opacity-80 transition-opacity"
                  >
                    Open Notebook &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
