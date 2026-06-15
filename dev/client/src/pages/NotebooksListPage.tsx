import { getIcon } from '@drizzle-cube/client'
import { useNotebooks, useDeleteNotebook } from '../hooks/useNotebooks'
import { useNotebookCreate } from './useNotebookCreate'
import { CreateNotebookModal, NotebookListBody } from './notebookListParts'

const PlusIcon = getIcon('plus')

const NOTEBOOK_LIMIT = 20

export default function NotebooksListPage() {
  const { data: notebooks = [], isLoading, error } = useNotebooks()
  const deleteNotebook = useDeleteNotebook()
  const {
    createNotebook,
    showCreateForm,
    openCreateForm,
    newName, setNewName,
    newDescription, setNewDescription,
    handleCreate,
    cancelCreate,
  } = useNotebookCreate()

  const atLimit = notebooks.length >= NOTEBOOK_LIMIT

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
          onClick={openCreateForm}
          disabled={atLimit}
          className="inline-flex items-center px-4 py-2 bg-dc-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Notebook
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateNotebookModal
          newName={newName}
          setNewName={setNewName}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          isPending={createNotebook.isPending}
          onCreate={handleCreate}
          onCancel={cancelCreate}
        />
      )}

      {/* Limit Warning */}
      {atLimit && (
        <div className="mb-6 p-3 bg-dc-warning-bg border border-dc-warning rounded-lg text-sm text-dc-warning">
          Maximum of 20 notebooks reached. Delete a notebook to create a new one.
        </div>
      )}

      <NotebookListBody
        isLoading={isLoading}
        notebooks={notebooks}
        onCreate={openCreateForm}
        onDelete={(notebookId) => deleteNotebook.mutate(notebookId)}
      />
    </div>
  )
}
