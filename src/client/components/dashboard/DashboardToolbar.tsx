/**
 * DashboardToolbar
 *
 * The bundled action toolbar: the sticky top edit bar (Edit / layout-mode toggle /
 * palette / Add Text / Add Portlet) plus the FloatingEditToolbar that appears when the
 * top bar scrolls out of view.
 *
 * Reads everything from DashboardContext. Renders nothing when `hideToolbar` is set, so
 * a host can either omit this component or pass `hideToolbar` to suppress it.
 */

import { getIcon } from '../../icons'
import { useTranslation } from '../../hooks/useTranslation'
import ColorPaletteSelector from '../ColorPaletteSelector'
import FloatingEditToolbar from '../FloatingEditToolbar'
import { TextIcon } from './dashboardGridUtils'
import { useDashboardContext } from './DashboardContext'

const EditIcon = getIcon('edit')
const CheckIcon = getIcon('check')
const AddIcon = getIcon('add')
const DesktopIcon = getIcon('desktop')
const GridIcon = getIcon('segment')
const RowsIcon = getIcon('table')

export default function DashboardToolbar() {
  const { t } = useTranslation()
  const {
    editable,
    hideToolbar,
    features,
    displayMode,
    isEditMode,
    isResponsiveEditable,
    layoutMode,
    allowedModes,
    canChangeLayoutMode,
    isScrolled,
    isEditBarVisible,
    editBarRef,
    config,
    actions,
    handleAddText,
    handleAddPortlet,
    handlePaletteChange,
  } = useDashboardContext()

  if (!editable || hideToolbar) return null

  return (
    <>
      {features.editToolbar !== 'floating' && (
        <div
          ref={editBarRef}
          className={`dc:mb-4 dc:flex dc:justify-between dc:items-center dc:sticky dc:top-0 dc:z-10 dc:px-4 dc:py-4 bg-dc-surface-tertiary dc:border border-dc-border dc:rounded-lg dc:transition-all dc:duration-200 ${
            isScrolled ? 'dc:border-b' : ''
          }`}
          style={{
            boxShadow: isScrolled ? 'var(--dc-shadow-md)' : 'var(--dc-shadow-sm)'
          }}
        >
          <div className="dc:flex dc:items-center dc:gap-4">
            <button
              onClick={() => isResponsiveEditable && actions.toggleEditMode()}
              disabled={!isResponsiveEditable}
              className={`dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 ${
                !isResponsiveEditable
                  ? 'dc:opacity-50 dc:cursor-not-allowed bg-dc-surface-secondary dc:border border-dc-border'
                  : isEditMode
                    ? 'bg-dc-surface-secondary dc:border border-dc-border hover:bg-dc-surface-hover'
                    : 'bg-dc-surface dc:border border-dc-border hover:bg-dc-surface-hover'
              }`}
              style={{
                color: !isResponsiveEditable ? 'var(--dc-text-muted)' : 'var(--dc-primary)',
                borderColor: !isResponsiveEditable ? 'var(--dc-border)' : isEditMode ? 'var(--dc-border)' : 'var(--dc-primary)'
              }}
            >
              {isEditMode ? <CheckIcon className="dc:w-4 dc:h-4 dc:mr-1.5" /> : <EditIcon className="dc:w-4 dc:h-4 dc:mr-1.5" />}
              {isEditMode ? t('dashboard.finishEditing') : t('dashboard.edit')}
            </button>
            {isEditMode && allowedModes.length > 1 && (
              <div className="dc:inline-flex dc:rounded-md dc:border border-dc-border dc:overflow-hidden dc:whitespace-nowrap">
                <button
                  onClick={() => actions.handleLayoutModeChange('grid')}
                  disabled={!canChangeLayoutMode}
                  className={`dc:inline-flex dc:items-center dc:gap-2 dc:whitespace-nowrap dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors dc:border-b-2 ${
                    layoutMode === 'grid'
                      ? 'bg-dc-accent-bg text-dc-accent border-b-dc-accent'
                      : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover border-b-transparent'
                  } ${!canChangeLayoutMode ? 'dc:cursor-not-allowed dc:opacity-50' : ''}`}
                >
                  <GridIcon className="dc:w-4 dc:h-4 dc:shrink-0" />
                  {t('dashboard.grid')}
                </button>
                <button
                  onClick={() => actions.handleLayoutModeChange('rows')}
                  disabled={!canChangeLayoutMode}
                  className={`dc:inline-flex dc:items-center dc:gap-2 dc:whitespace-nowrap dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors dc:border-b-2 ${
                    layoutMode === 'rows'
                      ? 'bg-dc-accent-bg text-dc-accent border-b-dc-accent'
                      : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover border-b-transparent'
                  } ${!canChangeLayoutMode ? 'dc:cursor-not-allowed dc:opacity-50' : ''}`}
                >
                  <RowsIcon className="dc:w-4 dc:h-4 dc:shrink-0" />
                  {t('dashboard.rows')}
                </button>
              </div>
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
            <div className="dc:flex dc:items-center dc:gap-3">
              <ColorPaletteSelector
                currentPalette={config.colorPalette}
                onPaletteChange={handlePaletteChange}
                className="dc:shrink-0"
              />

              <button
                onClick={handleAddText}
                className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover"
                style={{
                  color: 'var(--dc-text-secondary)',
                  borderColor: 'var(--dc-border)'
                }}
              >
                <TextIcon className="dc:w-5 dc:h-5 dc:mr-2" />
                {t('dashboard.addText')}
              </button>

              <button
                onClick={handleAddPortlet}
                className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover"
                style={{
                  color: 'var(--dc-primary)',
                  borderColor: 'var(--dc-primary)'
                }}
              >
                <AddIcon className="dc:w-5 dc:h-5 dc:mr-2" />
                {t('dashboard.addPortlet')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Edit Toolbar - appears when top edit bar scrolls out of view (or always if editToolbar='floating') */}
      {features.editToolbar !== 'top' && displayMode === 'desktop' && (
        <FloatingEditToolbar
          isEditBarVisible={features.editToolbar === 'floating' ? false : isEditBarVisible}
          position={features.floatingToolbarPosition || 'right'}
          isEditMode={isEditMode}
          onEditModeToggle={() => isResponsiveEditable && actions.toggleEditMode()}
          layoutMode={layoutMode}
          onLayoutModeChange={actions.handleLayoutModeChange}
          allowedModes={allowedModes}
          canChangeLayoutMode={canChangeLayoutMode}
          currentPalette={config.colorPalette || 'default'}
          onPaletteChange={actions.handlePaletteChange}
          onAddPortlet={actions.openAddPortlet}
          onAddText={actions.openAddText}
        />
      )}
    </>
  )
}
