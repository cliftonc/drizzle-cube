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

import FloatingEditToolbar from '../FloatingEditToolbar.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardEditBar from './DashboardEditBar.js'

export default function DashboardToolbar() {
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
    isEditBarVisible,
    config,
    actions,
  } = useDashboardContext()

  if (!editable || hideToolbar) return null

  return (
    <>
      {features.editToolbar !== 'floating' && <DashboardEditBar />}

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
