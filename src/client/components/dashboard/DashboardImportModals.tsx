/**
 * DashboardImportModals
 *
 * The two dialogs of the dashboard import flow (features.dashboardImportExport):
 * a confirmation before the current dashboard is replaced, and an error list when
 * the picked file could not be parsed. Both read from DashboardContext and render
 * nothing while idle.
 */

import { useTranslation } from '../../hooks/useTranslation.js'
import type { DashboardImportError, DashboardImportWarning } from '../../utils/dashboardExport.js'
import ConfirmModal from '../ConfirmModal.js'
import Modal from '../Modal.js'
import { useDashboardContext } from './DashboardContext.js'

type Translate = (key: string, params?: Record<string, unknown>) => string

function describeError(error: DashboardImportError, t: Translate): string {
  switch (error.code) {
    case 'invalidJson':
      return t('dashboard.import.error.invalidJson')
    case 'unknownFormat':
      return t('dashboard.import.error.unknownFormat')
    case 'invalidConfig':
      return t('dashboard.import.error.invalidConfig', { path: error.path || 'config' })
    case 'invalidPortlet':
      return t('dashboard.import.error.invalidPortlet', { index: error.index + 1, path: error.path || 'portlet' })
  }
}

function describeWarning(warning: DashboardImportWarning, t: Translate): string {
  switch (warning.code) {
    case 'unknownFilterMapping':
      return t('dashboard.import.warning.unknownFilterMapping', {
        portlet: warning.portletTitle || warning.portletId,
        filterId: warning.filterId,
      })
  }
}

export default function DashboardImportModals() {
  const { t } = useTranslation()
  const { importExport } = useDashboardContext()
  const { pendingImport, failedImport, isImporting, canRename } = importExport

  const showRename = Boolean(canRename && pendingImport?.name)

  return (
    <>
      <ConfirmModal
        isOpen={pendingImport !== null}
        onClose={importExport.cancelImport}
        onConfirm={importExport.confirmImport}
        title={t('dashboard.import.confirmTitle')}
        confirmText={t('dashboard.import.confirmAction')}
        confirmVariant="warning"
        isLoading={isImporting}
        message={
          pendingImport && (
            <div className="dc:space-y-3">
              <p>
                {t('dashboard.import.confirmMessage', {
                  count: pendingImport.config.portlets.length,
                  fileName: pendingImport.fileName,
                })}
              </p>
              {showRename && (
                <p>{t('dashboard.import.confirmRename', { name: pendingImport.name })}</p>
              )}
              {pendingImport.warnings.length > 0 && (
                <div className="dc:text-sm">
                  <p className="dc:font-medium text-dc-text">{t('dashboard.import.warningsTitle')}</p>
                  <ul className="dc:list-disc dc:pl-5 dc:mt-1 dc:space-y-1">
                    {pendingImport.warnings.map((warning, index) => (
                      <li key={index}>{describeWarning(warning, t)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        }
      />

      <Modal
        isOpen={failedImport !== null}
        onClose={importExport.dismissImportError}
        title={t('dashboard.import.errorTitle')}
        size="sm"
        footer={
          <button
            type="button"
            onClick={importExport.dismissImportError}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border border-dc-border dc:rounded-md hover:bg-dc-surface-hover dc:transition-colors dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-2 focus:ring-dc-primary"
          >
            {t('common.actions.close')}
          </button>
        }
      >
        {failedImport && (
          <div className="text-dc-text-secondary dc:space-y-2">
            <p>{t('dashboard.import.errorIntro', { fileName: failedImport.fileName })}</p>
            <ul className="dc:list-disc dc:pl-5 dc:space-y-1 dc:text-sm">
              {failedImport.errors.map((error, index) => (
                <li key={index}>{describeError(error, t)}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  )
}
