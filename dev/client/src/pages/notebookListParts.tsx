/**
 * Presentational pieces for NotebooksListPage: the create-notebook modal and a
 * single notebook card. Extracted to flatten the list page component.
 */
import type React from 'react'
import { Link } from 'react-router-dom'
import { getIcon } from '@drizzle-cube/client'
import type { Notebook } from '../types'

const TrashIcon = getIcon('delete')
const PlusIcon = getIcon('add')
const SparklesIcon = getIcon('sparkles')

export function NotebooksLoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-dc-surface rounded-xl border border-dc-border p-6 animate-pulse">
          <div className="h-5 bg-dc-surface-secondary rounded w-2/3 mb-3" />
          <div className="h-4 bg-dc-surface-secondary rounded w-1/2 mb-4" />
          <div className="h-3 bg-dc-surface-secondary rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function NotebooksEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-16 bg-dc-surface rounded-xl border border-dc-border">
      <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
        <SparklesIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-dc-text mb-2">No notebooks yet</h3>
      <p className="text-dc-text-muted mb-6 max-w-sm mx-auto">
        Create a notebook to start exploring your data with AI. Ask questions, get visualizations, and uncover insights.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center px-4 py-2 bg-dc-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Your First Notebook
      </button>
    </div>
  )
}

interface CreateNotebookModalProps {
  newName: string
  setNewName: (value: string) => void
  newDescription: string
  setNewDescription: (value: string) => void
  isPending: boolean
  onCreate: () => void
  onCancel: () => void
}

export function CreateNotebookModal({
  newName, setNewName,
  newDescription, setNewDescription,
  isPending, onCreate, onCancel,
}: CreateNotebookModalProps) {
  return (
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
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
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
              onClick={onCancel}
              className="px-4 py-2 text-sm text-dc-text-secondary hover:text-dc-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              disabled={!newName.trim() || isPending}
              className="px-4 py-2 bg-dc-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
            >
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count !== 1 ? 's' : ''}`
}

function formatUpdatedAt(updatedAt: Notebook['updatedAt']): string | null {
  return updatedAt ? new Date(updatedAt).toLocaleDateString() : null
}

function NotebookCardStats({ notebook }: { notebook: Notebook }) {
  const config = notebook.config
  const blockCount = config?.blocks?.length ?? 0
  const messageCount = config?.messages?.length ?? 0
  const updatedAt = formatUpdatedAt(notebook.updatedAt)

  return (
    <div className="flex items-center gap-4 mt-3 text-xs text-dc-text-muted">
      <span>{pluralize(blockCount, 'block')}</span>
      <span>{pluralize(messageCount, 'message')}</span>
      {updatedAt && <span>Updated {updatedAt}</span>}
    </div>
  )
}

interface NotebookListBodyProps {
  isLoading: boolean
  notebooks: Notebook[]
  onCreate: () => void
  onDelete: (id: number) => void
}

/** Renders the loading skeleton, empty state, or the notebook grid. */
export function NotebookListBody({ isLoading, notebooks, onCreate, onDelete }: NotebookListBodyProps) {
  if (isLoading) {
    return <NotebooksLoadingGrid />
  }

  if (notebooks.length === 0) {
    return <NotebooksEmptyState onCreate={onCreate} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {notebooks.map((notebook) => (
        <NotebookCard key={notebook.id} notebook={notebook} onDelete={onDelete} />
      ))}
    </div>
  )
}

interface NotebookCardProps {
  notebook: Notebook
  onDelete: (id: number) => void
}

export function NotebookCard({ notebook, onDelete }: NotebookCardProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirm('Delete this notebook?')) {
      onDelete(notebook.id)
    }
  }

  return (
    <div
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
            onClick={handleDeleteClick}
            className="ml-2 p-1.5 rounded-md text-dc-text-muted hover:text-dc-error hover:bg-dc-danger-bg transition-colors opacity-0 group-hover:opacity-100"
            title="Delete notebook"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <NotebookCardStats notebook={notebook} />
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
}
