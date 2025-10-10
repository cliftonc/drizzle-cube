import { Link } from 'react-router-dom'
import { useState } from 'react'
import { DashboardEditModal } from '@drizzle-cube/client'
import { 
  useAnalyticsPages, 
  useCreateExamplePage, 
  useDeleteAnalyticsPage,
  useCreateAnalyticsPage
} from '../hooks/useAnalyticsPages'

export default function DashboardListPage() {
  const { data: pages = [], isLoading, error } = useAnalyticsPages()
  const createExample = useCreateExamplePage()
  const deletePage = useDeleteAnalyticsPage()
  const createPage = useCreateAnalyticsPage()
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  const handleCreateExample = async () => {
    if (pages.length >= 10) {
      alert('I think 10 is enough dashboards for now, just delete one if you want to test that feature!')
      return
    }
    try {
      await createExample.mutateAsync()
    } catch (error) {
      console.error('Failed to create example dashboard:', error)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deletePage.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete dashboard:', error)
      }
    }
  }

  const handleCreateDashboard = async (data: { name: string; description?: string }) => {
    if (pages.length >= 10) {
      alert('I think 10 is enough dashboards for now, just delete one if you want to test that feature!')
      return
    }
    try {
      await createPage.mutateAsync({
        name: data.name,
        description: data.description,
        config: { portlets: [] }
      })
      // Note: We could navigate to the new page here if desired
      // navigate(`/dashboards/${newPage.id}`)
    } catch (error) {
      console.error('Failed to create dashboard:', error)
      throw error // Re-throw to keep modal open
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-dc-primary"></div>
        <p className="mt-2 text-dc-text-muted">Loading dashboards...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-dc-error">Failed to load dashboards</p>
        <p className="text-sm text-dc-text-muted">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-dc-text">Analytics Dashboards</h1>
          <p className="mt-1 sm:mt-2 text-sm text-dc-text-secondary leading-relaxed">
            Manage your analytics dashboards and visualizations
          </p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <button
              onClick={handleCreateExample}
              disabled={createExample.isPending || pages.length >= 10}
              className="inline-flex items-center justify-center rounded-md border border-dc-border bg-dc-surface px-4 py-2 text-sm font-medium text-dc-text shadow-2xs hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-primary focus:ring-offset-2 focus:ring-offset-dc-surface disabled:opacity-50 w-full sm:w-auto"
            >
              {createExample.isPending ? 'Creating...' : 'Create Example'}
            </button>
            <button
              onClick={() => setIsNewModalOpen(true)}
              disabled={pages.length >= 10}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-dc-primary px-4 py-2 text-sm font-medium text-dc-primary-content shadow-2xs hover:bg-dc-primary-hover focus:outline-hidden focus:ring-2 focus:ring-dc-primary focus:ring-offset-2 focus:ring-offset-dc-surface disabled:opacity-50 w-full sm:w-auto"
            >
              New Dashboard
            </button>
          </div>

          {pages.length >= 10 && (
            <div className="px-3 py-2 bg-dc-warning-bg border border-dc-warning-border rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">😊</span>
                <p className="text-sm text-dc-warning font-medium">
                  I think we have enough dashboards for now
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <svg
            className="mx-auto h-12 w-12 text-dc-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-dc-text">No dashboards</h3>
          <p className="mt-1 text-sm text-dc-text-muted leading-relaxed max-w-md mx-auto">
            Get started by creating a new dashboard or example dashboard.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto sm:max-w-none">
            <button
              onClick={handleCreateExample}
              disabled={createExample.isPending || pages.length >= 10}
              className="inline-flex items-center justify-center rounded-md border border-dc-border bg-dc-surface px-4 py-2 text-sm font-medium text-dc-text shadow-2xs hover:bg-dc-surface-hover disabled:opacity-50 w-full sm:w-auto"
            >
              Create Example Dashboard
            </button>
            <button
              onClick={() => setIsNewModalOpen(true)}
              disabled={pages.length >= 10}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-dc-primary px-4 py-2 text-sm font-medium text-dc-primary-content shadow-2xs hover:bg-dc-primary-hover disabled:opacity-50 w-full sm:w-auto"
            >
              Create New Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="relative group bg-dc-card-bg rounded-lg shadow-2xs hover:shadow-md transition-shadow touch-manipulation border border-dc-card-border"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-medium text-dc-text pr-2 leading-tight">
                    {page.name}
                  </h3>
                  <button
                    onClick={() => handleDelete(page.id, page.name)}
                    disabled={deletePage.isPending}
                    className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-dc-muted hover:text-dc-danger transition-opacity disabled:opacity-50 p-1 -m-1 touch-manipulation shrink-0"
                    title="Delete dashboard"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {page.description && (
                  <p className="text-sm text-dc-text-secondary line-clamp-2 mb-3 leading-relaxed">
                    {page.description}
                  </p>
                )}

                <div className="flex items-center text-xs sm:text-sm text-dc-text-muted mb-4">
                  <span>{page.config.portlets.length} portlets</span>
                  <span className="mx-2">•</span>
                  <span className="truncate">Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                </div>

                <div>
                  <Link
                    to={`/dashboards/${page.id}`}
                    className="block w-full text-center bg-dc-accent-bg text-dc-accent hover:bg-dc-primary hover:text-dc-primary-content px-3 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-colors touch-manipulation"
                  >
                    View Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DashboardEditModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateDashboard}
        title="Create New Dashboard"
        submitText="Create Dashboard"
      />
    </div>
  )
}