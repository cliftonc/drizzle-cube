/**
 * Dropdown holding the dashboard Export / Import actions
 * (features.dashboardImportExport), so the edit bar keeps a single control
 * instead of two inline buttons. Export needs a dashboard with portlets; Import
 * seeds a still-empty dashboard and is only offered while editing. Renders nothing
 * when neither item applies.
 *
 * Owns the hidden file input the Import item clicks.
 */

import { useEffect, useRef, useState } from 'react'
import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardImportFileInput from './DashboardImportFileInput.js'

const EllipsisIcon = getIcon('ellipsisHorizontal')
const ChevronDownIcon = getIcon('chevronDown')
const DownloadIcon = getIcon('download')
const UploadIcon = getIcon('upload')

const MENU_ITEM_CLASS =
  'dc:w-full dc:inline-flex dc:items-center dc:gap-2 dc:px-3 dc:py-2 dc:text-left dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover text-dc-text-secondary'

export default function DashboardImportExportMenu({
  showExport,
  showImport
}: {
  showExport: boolean
  showImport: boolean
}) {
  const { t } = useTranslation()
  const { importExport } = useDashboardContext()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!showExport && !showImport) return null

  return (
    <div className="dc:relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('dashboard.importExport.tooltip')}
        aria-label={t('dashboard.importExport.menu')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="dc:inline-flex dc:items-center dc:gap-1 dc:px-3 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover"
        style={{ color: 'var(--dc-text-secondary)', borderColor: 'var(--dc-border)' }}
      >
        <EllipsisIcon className="dc:w-5 dc:h-5" />
        <ChevronDownIcon className={`dc:w-4 dc:h-4 dc:transition-transform ${isOpen ? 'dc:rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="dc:absolute dc:top-full dc:right-0 dc:mt-1 dc:w-56 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:z-50 dc:py-1"
          style={{ boxShadow: 'var(--dc-shadow-lg)' }}
        >
          {showExport && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                importExport.exportDashboard()
              }}
              title={t('dashboard.export.tooltip')}
              className={MENU_ITEM_CLASS}
            >
              <DownloadIcon className="dc:w-5 dc:h-5 dc:shrink-0" />
              {t('dashboard.export.button')}
            </button>
          )}
          {showImport && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                fileInputRef.current?.click()
              }}
              title={t('dashboard.import.tooltip')}
              className={MENU_ITEM_CLASS}
            >
              <UploadIcon className="dc:w-5 dc:h-5 dc:shrink-0" />
              {t('dashboard.import.button')}
            </button>
          )}
        </div>
      )}

      {showImport && <DashboardImportFileInput ref={fileInputRef} onFile={importExport.importFromFile} />}
    </div>
  )
}
