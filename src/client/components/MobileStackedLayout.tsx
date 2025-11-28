/**
 * MobileStackedLayout component
 * Simple vertical stack layout for mobile screens (<768px)
 * Read-only view with portlets sorted by grid position
 */

import { useMemo, useRef } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import AnalyticsPortlet from './AnalyticsPortlet'
import type { DashboardFilter, DashboardConfig } from '../types'
import type { ColorPalette } from '../utils/colorPalettes'

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
    <div className="mobile-stacked-layout space-y-4 px-2">
      {sortedPortlets.map(portlet => {
        // Calculate height: use stored h * rowHeight (80px), with minimum
        const portletHeight = Math.max(300, portlet.h * 80)
        // Header is approximately 40px when shown
        const headerHeight = portlet.displayConfig?.hideHeader ? 0 : 40
        // Content height = total - header - padding (py-3 = 24px)
        const contentHeight = portletHeight - headerHeight - 24

        return (
          <div
            key={portlet.id}
            data-portlet-id={portlet.id}
            className="bg-dc-surface border border-dc-border rounded-lg flex flex-col"
            style={{
              height: portletHeight,
              boxShadow: 'var(--dc-shadow-sm)'
            }}
          >
            {/* Portlet Header - Simplified for mobile (no edit controls) */}
            {!portlet.displayConfig?.hideHeader && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-dc-border shrink-0 bg-dc-surface-secondary rounded-t-lg">
                <h3 className="font-semibold text-sm text-dc-text truncate flex-1">
                  {portlet.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handlePortletRefresh(portlet.id)}
                    className="p-1 bg-transparent border-none rounded-sm text-dc-text-secondary cursor-pointer hover:bg-dc-surface-hover transition-colors"
                    title="Refresh portlet data"
                  >
                    <ArrowPathIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Portlet Content - explicit height for charts to render */}
            <div
              className="px-2 py-3 overflow-visible flex flex-col"
              style={{ height: contentHeight }}
            >
              <AnalyticsPortlet
                ref={el => { portletComponentRefs.current[portlet.id] = el }}
                query={portlet.query}
                chartType={portlet.chartType}
                chartConfig={portlet.chartConfig}
                displayConfig={portlet.displayConfig}
                dashboardFilters={dashboardFilters}
                dashboardFilterMapping={portlet.dashboardFilterMapping}
                eagerLoad={portlet.eagerLoad ?? config.eagerLoad ?? false}
                isVisible={true}
                title={portlet.title}
                height={contentHeight}
                colorPalette={colorPalette}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
