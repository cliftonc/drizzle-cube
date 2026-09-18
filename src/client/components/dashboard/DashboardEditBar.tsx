/**
 * Sticky top edit bar for the dashboard toolbar. Reads everything from
 * DashboardContext; rendered only when the top toolbar variant is active.
 *
 * On a read-only dashboard (`editable` false) the editing controls are left out
 * and the bar carries only the export action.
 */

import { useRef } from 'react'
import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import ColorPaletteSelector from '../ColorPaletteSelector.js'
import { TextIcon } from './dashboardGridUtils.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardImportFileInput from './DashboardImportFileInput.js'
import LayoutModeToggle from './LayoutModeToggle.js'

const EditIcon = getIcon('edit')
const CheckIcon = getIcon('check')
const AddIcon = getIcon('add')
const DesktopIcon = getIcon('desktop')
const DownloadIcon = getIcon('download')
const UploadIcon = getIcon('upload')

const SECONDARY_BUTTON_CLASS =
  'dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover'
const SECONDARY_BUTTON_STYLE = { color: 'var(--dc-text-secondary)', borderColor: 'var(--dc-border)' }

/** The Edit / Finish-editing toggle button. */
function EditToggleButton({
  isEditMode,
  isResponsiveEditable,
  onToggle
}: {
  isEditMode: boolean
  isResponsiveEditable: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()

  const stateClass = !isResponsiveEditable
    ? 'dc:opacity-50 dc:cursor-not-allowed bg-dc-surface-secondary dc:border border-dc-border'
    : isEditMode
      ? 'bg-dc-surface-secondary dc:border border-dc-border hover:bg-dc-surface-hover'
      : 'bg-dc-surface dc:border border-dc-border hover:bg-dc-surface-hover'

  return (
    <button
      onClick={() => isResponsiveEditable && onToggle()}
      disabled={!isResponsiveEditable}
      className={`dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 ${stateClass}`}
      style={{
        color: !isResponsiveEditable ? 'var(--dc-text-muted)' : 'var(--dc-primary)',
        borderColor: !isResponsiveEditable ? 'var(--dc-border)' : isEditMode ? 'var(--dc-border)' : 'var(--dc-primary)'
      }}
    >
      {isEditMode ? <CheckIcon className="dc:w-4 dc:h-4 dc:mr-1.5" /> : <EditIcon className="dc:w-4 dc:h-4 dc:mr-1.5" />}
      {isEditMode ? t('dashboard.finishEditing') : t('dashboard.edit')}
    </button>
  )
}

/** Right-hand edit actions: palette, add text, add portlet. */
function EditActions({
  colorPalette,
  onPaletteChange,
  onAddText,
  onAddPortlet
}: {
  colorPalette: string | undefined
  onPaletteChange: (palette: string) => void
  onAddText: () => void
  onAddPortlet: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="dc:flex dc:items-center dc:gap-3">
      <ColorPaletteSelector
        currentPalette={colorPalette}
        onPaletteChange={onPaletteChange}
        className="dc:shrink-0"
      />

      <button
        onClick={onAddText}
        className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover"
        style={{ color: 'var(--dc-text-secondary)', borderColor: 'var(--dc-border)' }}
      >
        <TextIcon className="dc:w-5 dc:h-5 dc:mr-2" />
        {t('dashboard.addText')}
      </button>

      <button
        onClick={onAddPortlet}
        className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover"
        style={{ color: 'var(--dc-primary)', borderColor: 'var(--dc-primary)' }}
      >
        <AddIcon className="dc:w-5 dc:h-5 dc:mr-2" />
        {t('dashboard.addPortlet')}
      </button>
    </div>
  )
}

/**
 * Export / Import (features.dashboardImportExport). Export is always available;
 * Import replaces the dashboard, so it only shows while editing.
 */
function ImportExportActions({ showImport }: { showImport: boolean }) {
  const { t } = useTranslation()
  const { importExport } = useDashboardContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="dc:flex dc:items-center dc:gap-3">
      <button
        type="button"
        onClick={importExport.exportDashboard}
        title={t('dashboard.export.tooltip')}
        className={SECONDARY_BUTTON_CLASS}
        style={SECONDARY_BUTTON_STYLE}
      >
        <DownloadIcon className="dc:w-5 dc:h-5 dc:mr-2" />
        {t('dashboard.export.button')}
      </button>
      {showImport && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={t('dashboard.import.tooltip')}
            className={SECONDARY_BUTTON_CLASS}
            style={SECONDARY_BUTTON_STYLE}
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

export default function DashboardEditBar() {
  const { t } = useTranslation()
  const {
    editable,
    isEditMode,
    isResponsiveEditable,
    layoutMode,
    selectableModes,
    canChangeLayoutMode,
    isScrolled,
    editBarRef,
    config,
    actions,
    handleAddText,
    handleAddPortlet,
    handlePaletteChange,
    importExport,
  } = useDashboardContext()

  return (
    <div
      ref={editBarRef}
      className={`dc:mb-4 dc:flex ${editable ? 'dc:justify-between' : 'dc:justify-end'} dc:items-center dc:sticky dc:top-0 dc:z-10 dc:px-4 dc:py-4 bg-dc-surface-tertiary dc:border border-dc-border dc:rounded-lg dc:transition-all dc:duration-200 ${
        isScrolled ? 'dc:border-b' : ''
      }`}
      style={{ boxShadow: isScrolled ? 'var(--dc-shadow-md)' : 'var(--dc-shadow-sm)' }}
    >
      {editable && (
        <div className="dc:flex dc:items-center dc:gap-4">
          <EditToggleButton
            isEditMode={isEditMode}
            isResponsiveEditable={isResponsiveEditable}
            onToggle={actions.toggleEditMode}
          />
          {isEditMode && selectableModes.length > 1 && (
            <LayoutModeToggle
              layoutMode={layoutMode}
              canChangeLayoutMode={canChangeLayoutMode}
              onLayoutModeChange={actions.handleLayoutModeChange}
            />
          )}
          {!isResponsiveEditable && (
            <div className="dc:flex dc:items-center dc:gap-2 dc:text-sm text-dc-text-secondary">
              <DesktopIcon className="dc:w-4 dc:h-4" />
              <span>{t('dashboard.desktopRequired')}</span>
            </div>
          )}
          {isEditMode && isResponsiveEditable && (
            <p className="dc:hidden dc:md:block dc:text-sm text-dc-text-secondary">
              {t('dashboard.editModeHint')}
            </p>
          )}
        </div>
      )}

      <div className="dc:flex dc:items-center dc:gap-3">
        {importExport.enabled && (
          <ImportExportActions showImport={isEditMode && isResponsiveEditable} />
        )}

        {/* Color Palette Selector and Add Portlet - Only show in edit mode */}
        {editable && isEditMode && (
          <EditActions
            colorPalette={config.colorPalette}
            onPaletteChange={handlePaletteChange}
            onAddText={handleAddText}
            onAddPortlet={handleAddPortlet}
          />
        )}
      </div>
    </div>
  )
}
