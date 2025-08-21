/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { ChartBarIcon, ArrowPathIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import AnalyticsPortlet from './AnalyticsPortlet'
import PortletEditModal from './PortletEditModal'
import DebugModal from './DebugModal'
import type { DashboardConfig, PortletConfig } from '../types'

// CSS for react-grid-layout should be imported by the consuming app
// import 'react-grid-layout/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  config: DashboardConfig
  editable?: boolean
  onConfigChange?: (config: DashboardConfig) => void
  onPortletRefresh?: (portletId: string) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  apiUrl?: string
}

export default function DashboardGrid({ 
  config, 
  editable = false, 
  onConfigChange,
  onPortletRefresh,
  onSave,
  apiUrl = '/cubejs-api/v1'
}: DashboardGridProps) {
  // Refs to store portlet refs for refresh functionality
  const portletRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})

  // Track if component has been initialized to prevent saves during initial load
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastKnownLayout, setLastKnownLayout] = useState<any[]>([])

  // Modal states
  const [isPortletModalOpen, setIsPortletModalOpen] = useState(false)
  const [editingPortlet, setEditingPortlet] = useState<PortletConfig | null>(null)

  // Debug data state - keyed by portlet ID
  const [debugData, setDebugData] = useState<{ [portletId: string]: {
    chartConfig: any
    displayConfig: any
    queryObject: any
    data: any[]
    chartType: string
  } }>({})

  // Set up initialization tracking
  useEffect(() => {
    // Mark as initialized after first render to prevent saves during load/resize
    const timer = setTimeout(() => {
      setIsInitialized(true)
      // Store initial layout for comparison
      const initialLayout = config.portlets.map(portlet => ({
        i: portlet.id,
        x: portlet.x,
        y: portlet.y,
        w: portlet.w,
        h: portlet.h
      }))
      setLastKnownLayout(initialLayout)
    }, 200) // Slightly longer delay to ensure responsive grid is fully settled

    return () => clearTimeout(timer)
  }, [config.portlets])

  // Helper function to check if layout actually changed (not just reordered due to responsive changes)
  const hasLayoutActuallyChanged = useCallback((newLayout: any[]) => {
    if (!isInitialized || lastKnownLayout.length === 0) return false
    
    // Compare each item's position and size
    for (const newItem of newLayout) {
      const oldItem = lastKnownLayout.find(item => item.i === newItem.i)
      if (!oldItem) continue // New item, this is a change
      
      if (oldItem.x !== newItem.x || oldItem.y !== newItem.y || 
          oldItem.w !== newItem.w || oldItem.h !== newItem.h) {
        return true
      }
    }
    return false
  }, [isInitialized, lastKnownLayout])

  const handleLayoutChange = useCallback((currentLayout: any[], allLayouts: any) => {
    if (!editable || !onConfigChange) return

    // Only update portlet positions based on the large (desktop) layout to preserve original sizing
    // This prevents mobile responsive changes from permanently affecting the desktop layout
    const lgLayout = allLayouts.lg || currentLayout
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = lgLayout.find((item: any) => item.i === portlet.id)
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

  // Handle drag stop - save when user finishes dragging (only if layout actually changed)
  const handleDragStop = useCallback(async (layout: any[], _oldItem: any, _newItem: any, _placeholder: any, _e: any, _element: any) => {
    if (!editable || !onSave || !isInitialized) return

    // Only save if the layout actually changed from user interaction
    if (!hasLayoutActuallyChanged(layout)) {
      return // No actual change, don't save
    }

    // Get the current updated config from the layout change (only update from lg layout)
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = layout.find(item => item.i === portlet.id)
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

    // Preserve existing responsive layouts, only update with new lg layout
    const updatedConfig = {
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: layout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    setLastKnownLayout(layout)

    // Auto-save after drag operation
    try {
      await onSave(updatedConfig)
    } catch (error) {
      console.error('Auto-save failed after drag:', error)
    }
  }, [config.portlets, config.layouts, editable, onSave, isInitialized, hasLayoutActuallyChanged])

  // Handle resize stop - update config and save (resize is user interaction)
  const handleResizeStop = useCallback(async (layout: any[], _oldItem: any, _newItem: any, _placeholder: any, _e: any, _element: any) => {
    if (!editable || !onConfigChange || !isInitialized) return

    // Only proceed if the layout actually changed from user interaction
    if (!hasLayoutActuallyChanged(layout)) {
      return // No actual change, don't save
    }

    // Get the current updated config from the layout change (only update from lg layout)
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = layout.find(item => item.i === portlet.id)
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

    // Preserve existing responsive layouts, only update with new lg layout
    const updatedConfig = {
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: layout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    setLastKnownLayout(layout)

    // Update config state
    onConfigChange(updatedConfig)

    // Auto-save after resize operation (user deliberately resized)
    if (onSave) {
      try {
        await onSave(updatedConfig)
      } catch (error) {
        console.error('Auto-save failed after resize:', error)
      }
    }
  }, [config.portlets, config.layouts, editable, onConfigChange, onSave, isInitialized, hasLayoutActuallyChanged])

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

  // Handle adding new portlet
  const handleAddPortlet = useCallback(() => {
    setEditingPortlet(null)
    setIsPortletModalOpen(true)
  }, [])

  // Handle editing existing portlet
  const handleEditPortlet = useCallback((portlet: PortletConfig) => {
    setEditingPortlet(portlet)
    setIsPortletModalOpen(true)
  }, [])

  // Handle portlet save
  const handlePortletSave = useCallback(async (portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => {
    if (!onConfigChange) return

    let updatedPortlets = [...config.portlets]

    if (editingPortlet) {
      // Editing existing portlet
      const index = updatedPortlets.findIndex(p => p.id === editingPortlet.id)
      if (index !== -1) {
        updatedPortlets[index] = portletData as PortletConfig
      }
    } else {
      // Adding new portlet
      const newPortlet: PortletConfig = {
        ...portletData,
        id: `portlet-${Date.now()}`,
        x: 0,
        y: 0
      } as PortletConfig

      // Find the best position for the new portlet
      const gridLayout = updatedPortlets.map(p => ({ i: p.id, x: p.x, y: p.y, w: p.w, h: p.h }))
      let maxY = 0
      gridLayout.forEach(item => {
        if (item.y + item.h > maxY) {
          maxY = item.y + item.h
        }
      })
      newPortlet.y = maxY

      updatedPortlets.push(newPortlet)
    }

    const updatedConfig = {
      ...config,
      portlets: updatedPortlets
    }

    onConfigChange(updatedConfig)

    // Auto-save if handler is provided
    if (onSave) {
      try {
        await onSave(updatedConfig)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }

    setIsPortletModalOpen(false)
    setEditingPortlet(null)
  }, [config, editingPortlet, onConfigChange, onSave])

  // Handle deleting portlet
  const handleDeletePortlet = useCallback(async (portletId: string) => {
    if (!onConfigChange) return
    
    if (window.confirm('Are you sure you want to delete this portlet?')) {
      const updatedPortlets = config.portlets.filter(p => p.id !== portletId)
      const updatedConfig = {
        ...config,
        portlets: updatedPortlets
      }
      
      onConfigChange(updatedConfig)

      // Auto-save if handler is provided
      if (onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }
  }, [config, onConfigChange, onSave])

  if (!config.portlets || config.portlets.length === 0) {
    return (
      <>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <ChartBarIcon style={{ width: '64px', height: '64px', color: '#9ca3af', margin: '0 auto 16px auto' }} />
            <h3 className="text-lg font-semibold mb-2">No Portlets</h3>
            <p className="text-sm text-gray-600 mb-4">Add your first portlet to start visualizing your data</p>
            {editable && (
              <button
                onClick={handleAddPortlet}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-white rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Portlet
              </button>
            )}
          </div>
        </div>
        
        {/* Portlet Modal */}
        <PortletEditModal
          isOpen={isPortletModalOpen}
          onClose={() => {
            setIsPortletModalOpen(false)
            setEditingPortlet(null)
          }}
          onSave={handlePortletSave}
          portlet={editingPortlet}
          title={editingPortlet ? 'Edit Portlet' : 'Add New Portlet'}
          submitText={editingPortlet ? 'Update Portlet' : 'Add Portlet'}
          apiUrl={apiUrl}
        />
      </>
    )
  }

  // Generate grid layout from portlets - only use for lg (desktop) breakpoint
  // Let react-grid-layout handle responsive adjustments automatically
  const baseLayout = config.portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    minW: 3,
    minH: 3
  }))

  // Create responsive layouts - use stored layouts if available, otherwise let RGL auto-generate
  // The key insight: only the 'lg' layout should be controlled by our stored portlet positions
  // All other breakpoints should be auto-generated by react-grid-layout for proper responsive behavior
  const responsiveLayouts = {
    lg: baseLayout // Only control the large desktop layout, let RGL handle all responsive adjustments
  }


  return (
    <>
      {editable && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleAddPortlet}
            className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-white rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Portlet
          </button>
        </div>
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        isDraggable={editable}
        isResizable={editable}
        draggableHandle=".portlet-drag-handle"
        margin={{ lg: [16, 16], md: [12, 12], sm: [8, 8], xs: [6, 6], xxs: [4, 4] }}
        rowHeight={80}
        compactType="vertical"
        preventCollision={false}
      >
        {config.portlets.map(portlet => (
          <div 
            key={portlet.id}
            data-portlet-id={portlet.id}
            ref={el => portletRefs.current[portlet.id] = el}
            className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full"
          >
          {/* Portlet Header */}
          <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-lg cursor-move portlet-drag-handle">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">{portlet.title}</h3>
              {/* Debug button - right next to title, outside drag area */}
              {debugData[portlet.id] && (
                <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <DebugModal 
                    chartConfig={debugData[portlet.id].chartConfig}
                    displayConfig={debugData[portlet.id].displayConfig}
                    queryObject={debugData[portlet.id].queryObject}
                    data={debugData[portlet.id].data}
                    chartType={debugData[portlet.id].chartType}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4 -mr-2" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePortletRefresh(portlet.id)
                }}
                className="p-2 bg-transparent border-none rounded text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                title="Refresh portlet data"
              >
                <ArrowPathIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
              </button>
              {editable && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditPortlet(portlet)
                    }}
                    className="p-2 bg-transparent border-none rounded text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                    title="Edit portlet"
                  >
                    <PencilIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePortlet(portlet.id)
                    }}
                    className="p-2 bg-transparent border-none rounded text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                    title="Delete portlet"
                  >
                    <TrashIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Portlet Content */}
          <div className="flex-1 px-2 py-3 md:px-4 md:py-4 min-h-0 overflow-visible flex flex-col">
            <AnalyticsPortlet
              ref={el => portletComponentRefs.current[portlet.id] = el}
              query={portlet.query}
              chartType={portlet.chartType}
              chartConfig={portlet.chartConfig}
              displayConfig={portlet.displayConfig}
              title={portlet.title}
              height="100%"
              onDebugDataReady={(data) => {
                setDebugData(prev => ({
                  ...prev,
                  [portlet.id]: data
                }))
              }}
            />
          </div>
        </div>
      ))}
      </ResponsiveGridLayout>
      
      {/* Portlet Modal */}
      <PortletEditModal
        isOpen={isPortletModalOpen}
        onClose={() => {
          setIsPortletModalOpen(false)
          setEditingPortlet(null)
        }}
        onSave={handlePortletSave}
        portlet={editingPortlet}
        title={editingPortlet ? 'Edit Portlet' : 'Add New Portlet'}
        submitText={editingPortlet ? 'Update Portlet' : 'Add Portlet'}
        apiUrl={apiUrl}
      />
    </>
  )
}