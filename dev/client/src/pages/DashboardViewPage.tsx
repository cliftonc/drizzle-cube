import { useParams } from 'react-router-dom'
import { AnalyticsDashboard, DashboardEditModal } from '@drizzle-cube/client'
import { useAnalyticsPage } from '../hooks/useAnalyticsPages'
import { useDashboardViewState } from './useDashboardViewState'
import {
  DashboardLoadingState,
  DashboardErrorState,
  DashboardHeader,
  ResetDashboardModal,
} from './dashboardViewParts'

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
  const {
    config,
    resetPage,
    isEditModalOpen, setIsEditModalOpen,
    showResetConfirm, setShowResetConfirm,
    showOptionsMenu, setShowOptionsMenu,
    handleConfigChange,
    handleSave,
    handleDirtyStateChange,
    handleSaveThumbnail,
    handleEditMetadata,
    handleResetDashboard,
  } = useDashboardViewState({ page, id })

  if (isLoading) {
    return <DashboardLoadingState />
  }

  if (error || !page) {
    return <DashboardErrorState error={error} />
  }

  return (
    <div>
      <DashboardHeader
        name={page.name}
        description={page.description}
        showOptionsMenu={showOptionsMenu}
        onToggleOptions={() => setShowOptionsMenu(!showOptionsMenu)}
        onEdit={() => {
          setIsEditModalOpen(true)
          setShowOptionsMenu(false)
        }}
        onReset={() => {
          setShowResetConfirm(true)
          setShowOptionsMenu(false)
        }}
      />

      <AnalyticsDashboard
        config={config}
        editable={true}
        onConfigChange={handleConfigChange}
        onSave={handleSave}
        onSaveThumbnail={handleSaveThumbnail}
        onDirtyStateChange={handleDirtyStateChange}
        loadingComponent={<DrizzleCubeLoader />}
      />

      <DashboardEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditMetadata}
        title="Edit Dashboard"
        submitText="Save Changes"
        initialName={page.name}
        initialDescription={page.description}
      />

      {/* Reset Confirmation Modal - Mobile optimized */}
      {showResetConfirm && (
        <ResetDashboardModal
          isPending={resetPage.isPending}
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={handleResetDashboard}
        />
      )}
    </div>
  )
}
