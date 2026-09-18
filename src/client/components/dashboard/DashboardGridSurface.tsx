/**
 * DashboardGridSurface
 *
 * Renders the portlet layout (grid / row / scaled / mobile) inside the
 * thumbnail-capture wrapper, or the empty-state placeholder when there are no
 * portlets. Reads everything from DashboardContext.
 */

import { useRef } from 'react'
import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import MobileStackedLayout from '../MobileStackedLayout.js'
import ScaledGridWrapper from '../ScaledGridWrapper.js'
import { TextIcon } from './dashboardGridUtils.js'
import { useDashboardContext } from './DashboardContext.js'
import DashboardImportFileInput from './DashboardImportFileInput.js'

const ChartBarIcon = getIcon('measure')
const AddIcon = getIcon('add')
const UploadIcon = getIcon('upload')

export default function DashboardGridSurface() {
  const { t } = useTranslation()
  const {
    config,
    gridContentRef,
    displayMode,
    scaleFactor,
    designWidth,
    colorPalette,
    dashboardFilters,
    handlePortletRefresh,
    renderActiveLayout,
    editable,
    handleAddText,
    handleAddPortlet,
    importExport,
  } = useDashboardContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEmpty = !config.portlets || config.portlets.length === 0

  if (isEmpty) {
    return (
      <div className="dc:flex dc:justify-center dc:items-center dc:min-h-[50vh]">
        <div className="dc:text-center">
          <ChartBarIcon style={{ width: '64px', height: '64px', color: 'var(--dc-text-muted)', margin: '0 auto 16px auto' }} />
          <h3 className="dc:text-lg dc:font-semibold dc:mb-2 text-dc-text">{t('dashboard.noPortlets')}</h3>
          <p className="dc:text-sm text-dc-text-secondary dc:mb-4">{t('dashboard.noPortletsDescription')}</p>
          {editable && (
            <div className="dc:flex dc:items-center dc:gap-3">
              {/* An empty dashboard has no toolbar, so Import lives here too */}
              {importExport.enabled && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title={t('dashboard.import.tooltip')}
                    className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:border border-dc-border bg-dc-surface dc:rounded-md focus:outline-hidden dc:focus:ring-2"
                    style={{
                      color: 'var(--dc-text-secondary)',
                      borderColor: 'var(--dc-border)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface)'}
                  >
                    <UploadIcon className="dc:w-5 dc:h-5 dc:mr-2" />
                    {t('dashboard.import.button')}
                  </button>
                  <DashboardImportFileInput ref={fileInputRef} onFile={importExport.importFromFile} />
                </>
              )}
              <button
                onClick={handleAddText}
                className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:border border-dc-border bg-dc-surface dc:rounded-md focus:outline-hidden dc:focus:ring-2"
                style={{
                  color: 'var(--dc-text-secondary)',
                  borderColor: 'var(--dc-border)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface)'}
              >
                <TextIcon className="dc:w-5 dc:h-5 dc:mr-2" />
                {t('dashboard.addText')}
              </button>
              <button
                onClick={handleAddPortlet}
                className="dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:border border-dc-border bg-dc-surface dc:rounded-md focus:outline-hidden dc:focus:ring-2"
                style={{
                  color: 'var(--dc-primary)',
                  borderColor: 'var(--dc-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface)'}
              >
                <AddIcon className="dc:w-5 dc:h-5 dc:mr-2" />
                {t('dashboard.addPortlet')}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Grid content ref wrapper for thumbnail capture (excludes toolbar/filters)
  return (
    <div ref={gridContentRef}>
      {displayMode === 'mobile' ? (
        <MobileStackedLayout
          config={config}
          colorPalette={colorPalette}
          dashboardFilters={dashboardFilters}
          onPortletRefresh={handlePortletRefresh}
        />
      ) : displayMode === 'scaled' ? (
        <ScaledGridWrapper scaleFactor={scaleFactor} designWidth={designWidth}>
          {renderActiveLayout()}
        </ScaledGridWrapper>
      ) : (
        renderActiveLayout()
      )}
    </div>
  )
}
