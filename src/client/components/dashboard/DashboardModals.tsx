/**
 * DashboardModals
 *
 * The dashboard modals (add/edit portlet, add/edit text, portlet filter config,
 * delete confirmation, dashboard import, built-in Expand). All read their open/target
 * state from DashboardContext or the dashboard store; when closed they render nothing,
 * so always mounting them is harmless.
 */

import { useTranslation } from '../../hooks/useTranslation.js'
import { lazy, Suspense } from 'react'
import PortletFilterConfigModal from '../PortletFilterConfigModal.js'
import ConfirmModal from '../ConfirmModal.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardImportModals from './DashboardImportModals.js'
import PortletExpandModal from './PortletExpandModal.js'

// Edit-only modals, loaded when first opened. A read-only dashboard never opens
// them, and statically they pulled the analysis builder and the markdown
// renderer (markdown-to-jsx, knap, dayjs) into every dashboard (#1422). Both
// render nothing while closed, so mounting them only while open is equivalent.
const PortletAnalysisModal = lazy(() => import('../PortletAnalysisModal.js'))
const TextPortletModal = lazy(() => import('../TextPortletModal.js'))

export default function DashboardModals() {
  const { t } = useTranslation()
  const {
    config,
    colorPalette,
    dashboardFilters,
    schema,
    isPortletModalOpen,
    editingPortlet,
    isTextModalOpen,
    editingTextPortlet,
    isFilterConfigModalOpen,
    filterConfigPortlet,
    deleteConfirmPortletId,
    deleteConfirmGroupId,
    handlePortletSave,
    handleSaveFilterConfig,
    actions,
  } = useDashboardContext()

  const deletePortletTitle =
    config.portlets.find(p => p.id === deleteConfirmPortletId)?.title || t('dashboard.thisPortlet')

  const deletingGroup = config.groups?.find(group => group.id === deleteConfirmGroupId)
  const deletingGroupPortletCount =
    deletingGroup?.cells.reduce((sum, cell) => sum + cell.portletIds.length, 0) ?? 0

  return (
    <>
      {/* Portlet Modal */}
      {isPortletModalOpen && (
        <Suspense fallback={null}>
          <PortletAnalysisModal
            isOpen
            onClose={actions.closePortletModal}
            onSave={handlePortletSave}
            portlet={editingPortlet}
            title={editingPortlet ? t('dashboard.editPortlet') : t('dashboard.addNewPortlet')}
            submitText={editingPortlet ? t('dashboard.updatePortlet') : t('dashboard.addPortlet')}
            colorPalette={colorPalette}
            dashboardFilters={dashboardFilters}
            dashboardRefresh={config.refresh}
          />
        </Suspense>
      )}

      {/* Text Portlet Modal */}
      {isTextModalOpen && (
        <Suspense fallback={null}>
          <TextPortletModal
            isOpen
            onClose={actions.closeTextModal}
            onSave={handlePortletSave}
            portlet={editingTextPortlet}
            colorPalette={colorPalette}
            existingTitles={config.portlets.map(p => p.title)}
          />
        </Suspense>
      )}

      {/* Filter Configuration Modal */}
      <PortletFilterConfigModal
        isOpen={isFilterConfigModalOpen}
        onClose={actions.closeFilterConfig}
        dashboardFilters={dashboardFilters || []}
        currentMapping={filterConfigPortlet?.dashboardFilterMapping || []}
        onSave={handleSaveFilterConfig}
        portletTitle={filterConfigPortlet?.title || ''}
        schema={schema || null}
        portlet={filterConfigPortlet}
      />

      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmGroupId}
        onClose={actions.closeDeleteConfirm}
        onConfirm={actions.confirmDelete}
        title={t('dashboard.group.deleteTitle')}
        message={t('dashboard.group.deleteConfirm', { count: String(deletingGroupPortletCount) })}
        confirmText={t('common.actions.delete')}
        confirmVariant="danger"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmPortletId}
        onClose={actions.closeDeleteConfirm}
        onConfirm={actions.confirmDelete}
        title={t('dashboard.deletePortlet')}
        message={
          <>
            {t('dashboard.deletePortletConfirm')}{' '}
            <strong>{deletePortletTitle}</strong>
            {t('dashboard.deletePortletSuffix')}
          </>
        }
        confirmText={t('common.actions.delete')}
        confirmVariant="danger"
      />

      {/* Dashboard import confirm / error dialogs (features.dashboardImportExport) */}
      <DashboardImportModals />

      {/* Built-in Expand view of a card (features.portletExpand without onPortletExpand) */}
      <PortletExpandModal />
    </>
  )
}
