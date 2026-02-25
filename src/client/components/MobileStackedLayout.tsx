/**
 * MobileStackedLayout component
 * Simple vertical stack layout for mobile screens (<768px)
 * Read-only view with portlets sorted by grid position
 */

import { useMemo, useRef, useState, useCallback } from 'react'
import { getIcon } from '../icons'
import AnalyticsPortlet from './AnalyticsPortlet'

const RefreshIcon = getIcon('refresh')
import { ScrollContainerProvider } from '../providers/ScrollContainerContext'
import type { DashboardFilter, DashboardConfig } from '../types'
import type { ColorPalette } from '../utils/colorPalettes'
import { ensureAnalysisConfig } from '../utils/configMigration'

/**
 * Finds the nearest scrollable ancestor of an element.
 */
function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null

  let current = element.parentElement

  while (current) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    const overflowX = style.overflowX

    const hasScrollableOverflow =
      overflowY === 'auto' || overflowY === 'scroll' ||
      overflowX === 'auto' || overflowX === 'scroll'

    const hasScrollContent =
      current.scrollHeight > current.clientHeight ||
      current.scrollWidth > current.clientWidth

    if (hasScrollableOverflow && hasScrollContent) {
      return current
    }

    if (current === document.body) break
    current = current.parentElement
  }

  return null
}

interface MobileStackedLayoutProps {
  config: DashboardConfig
  colorPalette?: ColorPalette
  dashboardFilters?: DashboardFilter[]
  onPortletRefresh?: (portletId: string) => void
}

/**
 * Mobile-optimized stacked layout for dashboard portlets
 * Renders portlets in a single column, sorted by grid position
 */
export default function MobileStackedLayout({
  config,
  colorPalette,
  dashboardFilters,
  onPortletRefresh
}: MobileStackedLayoutProps) {
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})

  // Scroll container detection for lazy loading
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    if (node) {
      setScrollContainer(findScrollableAncestor(node))
    }
  }, [])

  // Sort portlets by y position, then x position (top-to-bottom, left-to-right)
  const sortedPortlets = useMemo(() => {
    return [...config.portlets].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })
  }, [config.portlets])

  const handlePortletRefresh = (portletId: string) => {
    // Refresh the specific portlet component
    portletComponentRefs.current[portletId]?.refresh()
    // Also call external handler if provided
    onPortletRefresh?.(portletId)
  }

  return (
    <ScrollContainerProvider value={scrollContainer}>
      <div ref={setContainerRef} className="mobile-stacked-layout dc:space-y-4 dc:px-2">
        {sortedPortlets.map(portlet => {
        // Normalize portlet to ensure analysisConfig exists (on-the-fly migration)
        const normalizedPortlet = ensureAnalysisConfig(portlet)
        const { analysisConfig } = normalizedPortlet
        const chartModeConfig = analysisConfig.charts[analysisConfig.analysisType]
        const renderQuery = JSON.stringify(analysisConfig.query)
        const renderChartType = chartModeConfig?.chartType || 'line'
        const renderChartConfig = chartModeConfig?.chartConfig
        const renderDisplayConfig = chartModeConfig?.displayConfig

        // Markdown-specific display modes
        const isTransparent = renderChartType === 'markdown' && !!renderDisplayConfig?.transparentBackground
        const isAutoHeight = renderChartType === 'markdown' && (renderDisplayConfig?.autoHeight ?? true)
        const shouldHideHeader = renderDisplayConfig?.hideHeader ?? (renderChartType === 'markdown')

        // Calculate height: use stored h * rowHeight (80px), with minimum
        const portletHeight = Math.max(300, portlet.h * 80)
        // Header is approximately 40px when shown
        const headerHeight = shouldHideHeader ? 0 : 40
        // Content height = total - header - padding (py-3 = 24px)
        const contentHeight = portletHeight - headerHeight - 24

        return (
          <div
            key={portlet.id}
            data-portlet-id={portlet.id}
            className={isTransparent
              ? 'dc:flex dc:flex-col'
              : 'bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col'
            }
            style={{
              height: isAutoHeight ? 'auto' : portletHeight,
              boxShadow: isTransparent ? 'none' : 'var(--dc-shadow-sm)',
              borderColor: isTransparent ? 'transparent' : undefined,
              borderWidth: isTransparent ? '0' : undefined,
              backgroundColor: isTransparent ? 'transparent' : undefined,
            }}
          >
            {/* Portlet Header - Simplified for mobile (no edit controls) */}
            {!shouldHideHeader && (
              <div className="dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-2 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg">
                <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate dc:flex-1">
                  {portlet.title}
                </h3>
                <div className="dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-2">
                  <button
                    onClick={() => handlePortletRefresh(portlet.id)}
                    className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
                    title="Refresh portlet data"
                  >
                    <RefreshIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Portlet Content - explicit height for charts to render */}
            <div
              className={`dc:overflow-visible dc:flex dc:flex-col${isTransparent ? '' : ' dc:px-2 dc:py-3'}`}
              style={{ height: isAutoHeight ? 'auto' : contentHeight }}
            >
              <AnalyticsPortlet
                ref={el => { portletComponentRefs.current[portlet.id] = el }}
                query={renderQuery}
                chartType={renderChartType}
                chartConfig={renderChartConfig}
                displayConfig={renderDisplayConfig}
                dashboardFilters={dashboardFilters}
                dashboardFilterMapping={portlet.dashboardFilterMapping}
                eagerLoad={portlet.eagerLoad ?? config.eagerLoad ?? false}
                title={portlet.title}
                height={isAutoHeight ? 'auto' : contentHeight}
                colorPalette={colorPalette}
              />
            </div>
          </div>
        )
      })}
      </div>
    </ScrollContainerProvider>
  )
}
