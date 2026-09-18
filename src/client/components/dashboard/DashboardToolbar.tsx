/**
 * DashboardToolbar
 *
 * The bundled action toolbar: the sticky top edit bar (Edit / layout-mode toggle /
 * palette / Add Text / Add Portlet) plus the FloatingEditToolbar that appears when the
 * top bar scrolls out of view.
 *
 * Reads everything from DashboardContext. Renders nothing when `hideToolbar` is set, so
 * a host can either omit this component or pass `hideToolbar` to suppress it.
 *
 * A read-only dashboard (`editable` false) normally has no toolbar at all. When the
 * dashboard export feature is on it still gets one, reduced to the Export button.
 */

import { useRef } from 'react'
import FloatingEditToolbar from '../FloatingEditToolbar.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardEditBar from './DashboardEditBar.js'
import DashboardImportFileInput from './DashboardImportFileInput.js'

export default function DashboardToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    editable,
    hideToolbar,
    features,
    displayMode,
    isEditMode,
    isResponsiveEditable,
    layoutMode,
    selectableModes,
    canChangeLayoutMode,
    isEditBarVisible,
    config,
    actions,
    importExport,
  } = useDashboardContext()

  if (hideToolbar) return null
  if (!editable && !importExport.enabled) return null

  const showImportExport = importExport.enabled

  return (
    <>
      {features.editToolbar !== 'floating' && <DashboardEditBar />}

      {/* Floating Edit Toolbar - appears when top edit bar scrolls out of view (or always if editToolbar='floating') */}
      {features.editToolbar !== 'top' && displayMode === 'desktop' && (
        <FloatingEditToolbar
          isEditBarVisible={features.editToolbar === 'floating' ? false : isEditBarVisible}
          position={features.floatingToolbarPosition || 'right'}
          isEditMode={isEditMode}
          canEdit={editable === true}
          onEditModeToggle={() => isResponsiveEditable && actions.toggleEditMode()}
          layoutMode={layoutMode}
          onLayoutModeChange={actions.handleLayoutModeChange}
          allowedModes={selectableModes}
          canChangeLayoutMode={canChangeLayoutMode}
          currentPalette={config.colorPalette || 'default'}
          onPaletteChange={actions.handlePaletteChange}
          onAddPortlet={actions.openAddPortlet}
          onAddText={actions.openAddText}
          onExportDashboard={showImportExport ? importExport.exportDashboard : undefined}
          onImportDashboard={showImportExport ? () => fileInputRef.current?.click() : undefined}
        />
      )}
      {showImportExport && (
        <DashboardImportFileInput ref={fileInputRef} onFile={importExport.importFromFile} />
      )}
    </>
  )
}
