import { useParams, Link } from 'react-router-dom'
import { useCallback, useState, useEffect } from 'react'
import { AnalyticsDashboard, DashboardEditModal } from 'drizzle-cube/client'
import { useAnalyticsPage, useUpdateAnalyticsPage, useResetAnalyticsPage } from '../hooks/useAnalyticsPages'
import type { DashboardConfig } from '../types'
import { ArrowPathIcon, PencilIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

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

  // Update config when page data loads
  useEffect(() => {
    if (page) {
      setConfig(page.config)
      setLastSaved(new Date(page.updatedAt))
    }
  }, [page])

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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load dashboard</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'Dashboard not found'}
        </p>
        <Link
          to="/dashboards"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
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
                <Link to="/dashboards" className="text-gray-400 hover:text-gray-500 text-sm">
                  Dashboards
                </Link>
              </li>
              <li>
                <svg
                  className="shrink-0 h-5 w-5 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              </li>
              <li>
                <span className="text-gray-500 text-sm truncate">{page.name}</span>
              </li>
            </ol>
          </nav>
          
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{page.name}</h1>
              {page.description && (
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">{page.description}</p>
              )}
            </div>
            
            {/* Options menu */}
            <div className="relative flex-shrink-0" data-options-menu>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
                title="More options"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>
              
              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true)
                        setShowOptionsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowResetConfirm(true)
                        setShowOptionsMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Reset Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 px-4 py-3 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-purple-200/50 rounded-lg shadow-md shadow-purple-100/50">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <p className="text-sm font-semibold text-purple-900">
                  Demo Note
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  This dashboard uses the <a href="https://github.com/cliftonc/drizzle-cube/blob/main/src/client/components/AnalyticsDashboard.tsx" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-800"><code className="px-1 py-0.5 bg-purple-100 rounded text-xs font-mono">AnalyticsDashboard</code></a> component from drizzle-cube/client. It includes drag-and-drop, auto-save, and real-time updates. These dashboards are limited to 20 portlets, in your implementation this limit does not need to apply.
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
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reset Dashboard
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to reset this dashboard to the default configuration? 
              This will remove all your customizations and cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDashboard}
                disabled={resetPage.isPending}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
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