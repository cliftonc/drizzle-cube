/**
 * DashboardModals
 *
 * The four dashboard modals (add/edit portlet, add/edit text, portlet filter config,
 * delete confirmation). All read their open/target state from DashboardContext; when
 * closed they render nothing, so always mounting them is harmless.
 */

import { useTranslation } from '../../hooks/useTranslation.js'
import PortletAnalysisModal from '../PortletAnalysisModal.js'
import TextPortletModal from '../TextPortletModal.js'
import PortletFilterConfigModal from '../PortletFilterConfigModal.js'
import ConfirmModal from '../ConfirmModal.js'
import { useDashboardContext } from './DashboardContext.js'

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
    handlePortletSave,
    handleSaveFilterConfig,
    actions,
  } = useDashboardContext()

  const deletePortletTitle =
    config.portlets.find(p => p.id === deleteConfirmPortletId)?.title || t('dashboard.thisPortlet')

  return (
    <>
      {/* Portlet Modal */}
      <PortletAnalysisModal
        isOpen={isPortletModalOpen}
        onClose={actions.closePortletModal}
        onSave={handlePortletSave}
        portlet={editingPortlet}
        title={editingPortlet ? t('dashboard.editPortlet') : t('dashboard.addNewPortlet')}
        submitText={editingPortlet ? t('dashboard.updatePortlet') : t('dashboard.addPortlet')}
        colorPalette={colorPalette}
        dashboardFilters={dashboardFilters}
      />

      {/* Text Portlet Modal */}
      <TextPortletModal
        isOpen={isTextModalOpen}
        onClose={actions.closeTextModal}
        onSave={handlePortletSave}
        portlet={editingTextPortlet}
        colorPalette={colorPalette}
        existingTitles={config.portlets.map(p => p.title)}
      />

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
    </>
  )
}
