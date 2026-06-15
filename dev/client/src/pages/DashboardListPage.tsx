import { useState } from 'react'
import { DashboardEditModal, useCubeFeatures } from '@drizzle-cube/client'
import { useAnalyticsPages } from '../hooks/useAnalyticsPages'
import { useDashboardListActions } from './useDashboardListActions'
import {
  DashboardListLoadingState,
  DashboardListErrorState,
  DashboardListToolbar,
  DashboardListBody,
} from './dashboardListParts'

export default function DashboardListPage() {
  const { data: pages = [], isLoading, error } = useAnalyticsPages()
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const { features } = useCubeFeatures()
  const thumbnailEnabled = features.thumbnail?.enabled ?? false
  const {
    atLimit,
    createExample,
    deletePage,
    handleCreateExample,
    handleDelete,
    handleCreateDashboard,
  } = useDashboardListActions(pages.length)

  if (isLoading) {
    return <DashboardListLoadingState />
  }

  if (error) {
    return <DashboardListErrorState error={error} />
  }

  return (
    <div>
      <DashboardListToolbar
        createPending={createExample.isPending}
        atLimit={atLimit}
        onCreateExample={handleCreateExample}
        onNew={() => setIsNewModalOpen(true)}
      />

      <DashboardListBody
        pages={pages}
        thumbnailEnabled={thumbnailEnabled}
        deletePending={deletePage.isPending}
        createPending={createExample.isPending}
        atLimit={atLimit}
        onCreateExample={handleCreateExample}
        onNew={() => setIsNewModalOpen(true)}
        onDelete={handleDelete}
      />

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
