/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import { useCallback, useRef } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import AnalyticsPortlet from './AnalyticsPortlet'
import type { DashboardConfig } from '../types'

// CSS for react-grid-layout should be imported by the consuming app
// import 'react-grid-layout/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  config: DashboardConfig
  editable?: boolean
  onConfigChange?: (config: DashboardConfig) => void
  onPortletRefresh?: (portletId: string) => void
}

export default function DashboardGrid({ 
  config, 
  editable = false, 
  onConfigChange,
  onPortletRefresh 
}: DashboardGridProps) {
  // Refs to store portlet refs for refresh functionality
  const portletRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})

  const handleLayoutChange = useCallback((currentLayout: any[], allLayouts: any) => {
    if (!editable || !onConfigChange) return

    // Update portlet positions
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = currentLayout.find(item => item.i === portlet.id)
      if (layoutItem) {
        return {
          ...portlet,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      }
      return portlet
    })

    const updatedConfig = {
      portlets: updatedPortlets,
      layouts: allLayouts
    }
    
    onConfigChange(updatedConfig)
  }, [config.portlets, editable, onConfigChange])

  // Handle portlet refresh
  const handlePortletRefresh = useCallback((portletId: string) => {
    const portletComponent = portletComponentRefs.current[portletId]
    if (portletComponent && portletComponent.refresh) {
      portletComponent.refresh()
    }
    if (onPortletRefresh) {
      onPortletRefresh(portletId)
    }
  }, [onPortletRefresh])

  if (!config.portlets || config.portlets.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No Portlets</h3>
          <p className="text-sm text-gray-600 mb-4">Add your first portlet to start visualizing your data</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={config.layouts}
      onLayoutChange={handleLayoutChange}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      isDraggable={editable}
      isResizable={editable}
      draggableHandle=".portlet-drag-handle"
      margin={[16, 16]}
      rowHeight={80}
    >
      {config.portlets.map(portlet => (
        <div 
          key={portlet.id}
          data-portlet-id={portlet.id}
          ref={el => portletRefs.current[portlet.id] = el}
          className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col"
        >
          {/* Portlet Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-lg">
            <div className={`flex items-center gap-2 flex-1 min-w-0 ${editable ? 'portlet-drag-handle cursor-move' : ''}`}>
              <h3 className="font-semibold text-sm truncate">{portlet.title}</h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePortletRefresh(portlet.id)
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-600"
                title="Refresh portlet data"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Portlet Content */}
          <div className="p-3 flex-1 min-h-0">
            <AnalyticsPortlet
              ref={el => portletComponentRefs.current[portlet.id] = el}
              query={portlet.query}
              chartType={portlet.chartType}
              labelField={portlet.labelField}
              chartConfig={portlet.chartConfig}
              displayConfig={portlet.displayConfig}
              title={portlet.title}
              height="100%"
            />
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}