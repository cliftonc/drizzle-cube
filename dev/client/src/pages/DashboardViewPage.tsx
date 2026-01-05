import { useParams, Link } from 'react-router-dom'
import { useCallback, useState, useEffect, useRef } from 'react'
import { AnalyticsDashboard, DashboardEditModal, getIcon } from '@drizzle-cube/client'
import { useAnalyticsPage, useUpdateAnalyticsPage, useResetAnalyticsPage } from '../hooks/useAnalyticsPages'
import type { DashboardConfig } from '../types'

const ArrowPathIcon = getIcon('refresh')
const PencilIcon = getIcon('edit')
const EllipsisHorizontalIcon = getIcon('ellipsisHorizontal')

// Custom loading indicator using the drizzle-cube logo
const DrizzleCubeLoader = () => (
  <div className="flex items-center justify-center">
    <img
      src="/drizzle-cube.png"
      alt="Loading..."
      className="h-10 w-10 animate-spin"
      style={{ animationDuration: '1.5s' }}
    />
  </div>
)

export default function DashboardViewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: page, isLoading, error } = useAnalyticsPage(id!)
  const updatePage = useUpdateAnalyticsPage()
  const resetPage = useResetAnalyticsPage()
  const [config, setConfig] = useState<DashboardConfig>({ portlets: [] })
  const [, setLastSaved] = useState<Date | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  // Track if this is the initial load to prevent overwriting local edits
  const hasInitializedRef = useRef(false)
  const lastPageIdRef = useRef<string | null>(null)

  // Update config when page data loads - but only on initial load or page change
  // This prevents the useEffect from overwriting local edits after a save
  useEffect(() => {
    if (page) {
      // Only sync from server on initial load or when viewing a different page
      const isInitialLoad = !hasInitializedRef.current
      const isPageChange = lastPageIdRef.current !== null && lastPageIdRef.current !== id

      if (isInitialLoad || isPageChange) {
        setConfig(page.config)
        setLastSaved(new Date(page.updatedAt))
        hasInitializedRef.current = true
        lastPageIdRef.current = id ?? null
      }
    }
  }, [page, id])

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptionsMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-options-menu]')) {
          setShowOptionsMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu])

  // Handle config changes (for local state)
  const handleConfigChange = useCallback((newConfig: DashboardConfig) => {
    setConfig(newConfig)
  }, [])

  // Handle auto-save
  const handleSave = useCallback(async (configToSave: DashboardConfig) => {
    if (!page || !id) return

    try {
      await updatePage.mutateAsync({
        id: parseInt(id),
        name: page.name,
        description: page.description || undefined,
        config: configToSave
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
      throw error // Re-throw to keep dirty state
    }
  }, [page, id, updatePage])

  // Handle dirty state changes
  const handleDirtyStateChange = useCallback((isDirty: boolean) => {
    // For view mode, we don't need to show dirty state, just save automatically
    if (!isDirty) {
      setLastSaved(new Date())
    }
  }, [])

  // Handle metadata editing
  const handleEditMetadata = useCallback(async (data: { name: string; description?: string }) => {
    if (!page || !id) return

    try {
      await updatePage.mutateAsync({
        id: parseInt(id),
        name: data.name,
        description: data.description,
        config: config
      })
    } catch (error) {
      console.error('Failed to save metadata:', error)
      throw error // Re-throw to keep modal open
    }
  }, [page, id, config, updatePage])

  // Handle dashboard reset
  const handleResetDashboard = useCallback(async () => {
    if (!id) return

    try {
      const resetResult = await resetPage.mutateAsync(parseInt(id))
      setConfig(resetResult.config)
      setLastSaved(new Date())
      setShowResetConfirm(false)
    } catch (error) {
      console.error('Failed to reset dashboard:', error)
    }
  }, [id, resetPage])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-dc-primary"></div>
        <p className="mt-2 text-dc-text-muted">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="text-center py-8">
        <p className="text-dc-error">Failed to load dashboard</p>
        <p className="text-sm text-dc-text-muted mt-1">
          {error instanceof Error ? error.message : 'Dashboard not found'}
        </p>
        <Link
          to="/dashboards"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover"
        >
          Back to Dashboards
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/dashboards" className="text-dc-text-muted hover:text-dc-text-secondary text-sm">
                  Dashboards
                </Link>
              </li>
              <li>
                <svg
                  className="shrink-0 h-5 w-5 text-dc-border"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              </li>
              <li>
                <span className="text-dc-text-secondary text-sm truncate">{page.name}</span>
              </li>
            </ol>
          </nav>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-dc-text">{page.name}</h1>
              {page.description && (
                <p className="mt-1 text-sm text-dc-text-secondary leading-relaxed">{page.description}</p>
              )}
            </div>

            {/* Options menu */}
            <div className="relative shrink-0" data-options-menu>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 border border-dc-border bg-dc-surface text-dc-text-muted hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-primary focus:ring-offset-2 focus:ring-offset-dc-surface rounded-md"
                title="More options"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-dc-surface border border-dc-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true)
                        setShowOptionsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-dc-text hover:bg-dc-surface-hover"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowResetConfirm(true)
                        setShowOptionsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-dc-text hover:bg-dc-surface-hover"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Reset Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 px-4 py-3 bg-dc-info-bg border border-dc-info-border rounded-lg shadow-md">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <p className="text-sm font-semibold text-dc-info">
                  Demo Note
                </p>
                <p className="text-sm text-dc-text-secondary mt-1">
                  This dashboard uses the <a href="https://github.com/cliftonc/drizzle-cube/blob/main/src/client/components/AnalyticsDashboard.tsx" target="_blank" rel="noopener noreferrer" className="underline hover:text-dc-primary"><code className="px-1 py-0.5 bg-dc-muted-bg rounded-sm text-xs font-mono">AnalyticsDashboard</code></a> component from drizzle-cube/client. It includes drag-and-drop, auto-save, and real-time updates. These dashboards are limited to 20 portlets, in your implementation this limit does not need to apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnalyticsDashboard
        config={config}
        editable={true}
        onConfigChange={handleConfigChange}
        onSave={handleSave}
        onDirtyStateChange={handleDirtyStateChange}
        loadingComponent={<DrizzleCubeLoader />}
      />

      <DashboardEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditMetadata}
        title="Edit Dashboard"
        submitText="Save Changes"
        initialName={page?.name}
        initialDescription={page?.description}
      />

      {/* Reset Confirmation Modal - Mobile optimized */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-dc-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-dc-surface rounded-lg p-6 max-w-md w-full border border-dc-border">
            <h3 className="text-lg font-medium text-dc-text mb-4">
              Reset Dashboard
            </h3>
            <p className="text-sm text-dc-text-muted mb-6 leading-relaxed">
              Are you sure you want to reset this dashboard to the default configuration?
              This will remove all your customizations and cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="inline-flex items-center justify-center px-4 py-2 border border-dc-border rounded-md shadow-2xs text-sm font-medium text-dc-text bg-dc-surface hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dc-primary w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDashboard}
                disabled={resetPage.isPending}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-2xs text-sm font-medium text-white bg-dc-danger hover:bg-dc-danger-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dc-danger disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
              >
                {resetPage.isPending ? 'Resetting...' : 'Reset Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}