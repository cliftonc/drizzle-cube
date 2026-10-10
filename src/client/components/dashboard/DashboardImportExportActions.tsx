/**
 * The dashboard Export / Import buttons (features.dashboardImportExport) as they sit
 * in the edit bar. Export needs a dashboard with portlets and is offered only outside
 * edit mode; Import seeds a still-empty dashboard and is only offered while editing.
 * Renders nothing when neither applies.
 *
 * Owns the hidden file input the Import button clicks.
 */

import { useRef } from 'react'
import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardImportFileInput from './DashboardImportFileInput.js'

const DownloadIcon = getIcon('download')
const UploadIcon = getIcon('upload')

const BUTTON_CLASS =
  'dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover'
const BUTTON_STYLE = { color: 'var(--dc-text-secondary)', borderColor: 'var(--dc-border)' }

export default function DashboardImportExportActions({
  showExport,
  showImport
}: {
  showExport: boolean
  showImport: boolean
}) {
  const { t } = useTranslation()
  const { importExport } = useDashboardContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!showExport && !showImport) return null

  return (
    <div className="dc:flex dc:items-center dc:gap-3">
      {showExport && (
        <button
          type="button"
          onClick={importExport.exportDashboard}
          title={t('dashboard.export.tooltip')}
          className={BUTTON_CLASS}
          style={BUTTON_STYLE}
        >
          <DownloadIcon className="dc:w-5 dc:h-5 dc:mr-2" />
          {t('dashboard.export.button')}
        </button>
      )}

      {showImport && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={t('dashboard.import.tooltip')}
            className={BUTTON_CLASS}
            style={BUTTON_STYLE}
          >
            <UploadIcon className="dc:w-5 dc:h-5 dc:mr-2" />
            {t('dashboard.import.button')}
          </button>
          <DashboardImportFileInput ref={fileInputRef} onFile={importExport.importFromFile} />
        </>
      )}
    </div>
  )
}
