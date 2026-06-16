/**
 * Sticky top edit bar for the dashboard toolbar. Reads everything from
 * DashboardContext; rendered only when the top toolbar variant is active.
 */

import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import ColorPaletteSelector from '../ColorPaletteSelector.js'
import { TextIcon } from './dashboardGridUtils.js'
import { useDashboardContext } from './DashboardContext.js'
import LayoutModeToggle from './LayoutModeToggle.js'

const EditIcon = getIcon('edit')
const CheckIcon = getIcon('check')
const AddIcon = getIcon('add')
const DesktopIcon = getIcon('desktop')

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

export default function DashboardEditBar() {
  const { t } = useTranslation()
  const {
    isEditMode,
    isResponsiveEditable,
    layoutMode,
    allowedModes,
    canChangeLayoutMode,
    isScrolled,
    editBarRef,
    config,
    actions,
    handleAddText,
    handleAddPortlet,
    handlePaletteChange,
  } = useDashboardContext()

  return (
    <div
      ref={editBarRef}
      className={`dc:mb-4 dc:flex dc:justify-between dc:items-center dc:sticky dc:top-0 dc:z-10 dc:px-4 dc:py-4 bg-dc-surface-tertiary dc:border border-dc-border dc:rounded-lg dc:transition-all dc:duration-200 ${
        isScrolled ? 'dc:border-b' : ''
      }`}
      style={{ boxShadow: isScrolled ? 'var(--dc-shadow-md)' : 'var(--dc-shadow-sm)' }}
    >
      <div className="dc:flex dc:items-center dc:gap-4">
        <EditToggleButton
          isEditMode={isEditMode}
          isResponsiveEditable={isResponsiveEditable}
          onToggle={actions.toggleEditMode}
        />
        {isEditMode && allowedModes.length > 1 && (
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

      {/* Color Palette Selector and Add Portlet - Only show in edit mode */}
      {isEditMode && (
        <EditActions
          colorPalette={config.colorPalette}
          onPaletteChange={handlePaletteChange}
          onAddText={handleAddText}
          onAddPortlet={handleAddPortlet}
        />
      )}
    </div>
  )
}
