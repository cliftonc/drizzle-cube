/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { ChartBarIcon, ArrowPathIcon, PencilIcon, TrashIcon, PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import AnalyticsPortlet from './AnalyticsPortlet'
import PortletEditModal from './PortletEditModal'
import DebugModal from './DebugModal'
import ColorPaletteSelector from './ColorPaletteSelector'
import type { ColorPalette } from '../utils/colorPalettes'
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
  colorPalette?: ColorPalette  // Complete palette with both colors and gradient
}

export default function DashboardGrid({ 
  config, 
  editable = false, 
  onConfigChange,
  onPortletRefresh,
  onSave,
  colorPalette
}: DashboardGridProps) {
  // Refs to store portlet refs for refresh functionality
  const portletRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})

  // Track if component has been initialized to prevent saves during initial load
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastKnownLayout, setLastKnownLayout] = useState<any[]>([])
  
  // Edit mode state - dashboard is readonly by default
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Track current breakpoint to handle mobile vs desktop saves differently
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg')
  
  // Track scroll state for sticky header
  const [isScrolled, setIsScrolled] = useState(false)

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

  // Set up scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 20) // Add sticky styling after scrolling 20px
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Check initial scroll position
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

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

  const handleLayoutChange = useCallback((_currentLayout: any[], _allLayouts: any) => {
    // This function is called for ALL layout changes including responsive breakpoints
    // We should NOT save here - only update internal state if needed
    // Actual saving only happens in handleDragStop and handleResizeStop for explicit user actions
    
    // Note: We don't call onConfigChange here to prevent saving responsive layout changes
    // The layout changes are handled by react-grid-layout internally
  }, [])  // No dependencies since we're not doing anything

  // Handle drag stop - save when user finishes dragging (only if layout actually changed)
  const handleDragStop = useCallback(async (layout: any[], _oldItem: any, _newItem: any, _placeholder: any, _e: any, _element: any) => {
    if (!editable || !isEditMode || !onSave || !isInitialized) return

    // Only save if the layout actually changed from user interaction
    if (!hasLayoutActuallyChanged(layout)) {
      return // No actual change, don't save
    }

    // Get the current updated config - on mobile only update position, preserve desktop sizing
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = layout.find(item => item.i === portlet.id)
      if (layoutItem) {
        if (currentBreakpoint === 'lg') {
          // Desktop: update everything (position and size)
          return {
            ...portlet,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        } else {
          // Mobile/tablet: only update position, preserve original size
          return {
            ...portlet,
            x: layoutItem.x,
            y: layoutItem.y,
            // Keep original desktop w and h
            w: portlet.w,
            h: portlet.h
          }
        }
      }
      return portlet
    })

    // Preserve existing responsive layouts, only update with new lg layout
    const updatedConfig = {
      ...config,
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: layout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    setLastKnownLayout(layout)

    // Update config state first
    onConfigChange?.(updatedConfig)

    // Auto-save after drag operation
    try {
      await onSave(updatedConfig)
    } catch (error) {
      console.error('Auto-save failed after drag:', error)
    }
  }, [config.portlets, config.layouts, editable, isEditMode, currentBreakpoint, onConfigChange, onSave, isInitialized, hasLayoutActuallyChanged])

  // Handle resize stop - update config and save (resize is user interaction)
  const handleResizeStop = useCallback(async (layout: any[], _oldItem: any, _newItem: any, _placeholder: any, _e: any, _element: any) => {
    if (!editable || !isEditMode || !onConfigChange || !isInitialized) return

    // Only proceed if the layout actually changed from user interaction
    if (!hasLayoutActuallyChanged(layout)) {
      return // No actual change, don't save
    }

    // Get the current updated config - on mobile only update position, preserve desktop sizing
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = layout.find(item => item.i === portlet.id)
      if (layoutItem) {
        if (currentBreakpoint === 'lg') {
          // Desktop: update everything (position and size)
          return {
            ...portlet,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        } else {
          // Mobile/tablet: only update position, preserve original size
          return {
            ...portlet,
            x: layoutItem.x,
            y: layoutItem.y,
            // Keep original desktop w and h
            w: portlet.w,
            h: portlet.h
          }
        }
      }
      return portlet
    })

    // Preserve existing responsive layouts, only update with new lg layout
    const updatedConfig = {
      ...config,
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
  }, [config.portlets, config.layouts, editable, isEditMode, currentBreakpoint, onConfigChange, onSave, isInitialized, hasLayoutActuallyChanged])

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
    let isNewPortlet = false
    let newPortletId: string | null = null

    if (editingPortlet) {
      // Editing existing portlet
      const index = updatedPortlets.findIndex(p => p.id === editingPortlet.id)
      if (index !== -1) {
        updatedPortlets[index] = portletData as PortletConfig
      }
    } else {
      // Adding new portlet
      isNewPortlet = true
      const newPortlet: PortletConfig = {
        ...portletData,
        id: `portlet-${Date.now()}`,
        x: 0,
        y: 0
      } as PortletConfig

      newPortletId = newPortlet.id

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

    // Scroll to the new portlet after DOM update
    if (isNewPortlet && newPortletId) {
      setTimeout(() => {
        const scrollToPortlet = () => {
          // Try both the ref and DOM query selector
          let portletElement: HTMLElement | null = portletRefs.current[newPortletId!]
          if (!portletElement) {
            portletElement = document.querySelector(`[data-portlet-id="${newPortletId}"]`)
          }
          
          if (portletElement) {
            portletElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            })
            return true
          }
          return false
        }
        
        // Try multiple times with increasing delays
        if (!scrollToPortlet()) {
          setTimeout(() => {
            if (!scrollToPortlet()) {
              setTimeout(() => {
                scrollToPortlet()
              }, 300)
            }
          }, 200)
        }
      }, 200)
    }
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

  // Handle duplicating portlet
  const handleDuplicatePortlet = useCallback(async (portletId: string) => {
    if (!onConfigChange) return
    
    const originalPortlet = config.portlets.find(p => p.id === portletId)
    if (!originalPortlet) return

    // Create duplicated portlet with new ID and updated title
    const duplicatedPortlet: PortletConfig = {
      ...originalPortlet,
      id: `portlet-${Date.now()}`,
      title: `${originalPortlet.title} Duplicated`,
      x: 0,
      y: 0
    }

    // Find the best position for the duplicated portlet
    const gridLayout = config.portlets.map(p => ({ i: p.id, x: p.x, y: p.y, w: p.w, h: p.h }))
    let maxY = 0
    gridLayout.forEach(item => {
      if (item.y + item.h > maxY) {
        maxY = item.y + item.h
      }
    })
    duplicatedPortlet.y = maxY

    const updatedPortlets = [...config.portlets, duplicatedPortlet]
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

    // Scroll to the duplicated portlet after DOM update
    setTimeout(() => {
      const scrollToPortlet = () => {
        // Try both the ref and DOM query selector
        let portletElement: HTMLElement | null = portletRefs.current[duplicatedPortlet.id]
        if (!portletElement) {
          portletElement = document.querySelector(`[data-portlet-id="${duplicatedPortlet.id}"]`)
        }
        
        if (portletElement) {
          portletElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
          return true
        }
        return false
      }
      
      // Try multiple times with increasing delays
      if (!scrollToPortlet()) {
        setTimeout(() => {
          if (!scrollToPortlet()) {
            setTimeout(() => {
              scrollToPortlet()
            }, 300)
          }
        }, 200)
      }
    }, 200)
  }, [config, onConfigChange, onSave])

  // Handle color palette changes
  const handlePaletteChange = useCallback(async (paletteName: string) => {
    if (!onConfigChange) return

    const updatedConfig = {
      ...config,
      colorPalette: paletteName
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
          colorPalette={colorPalette}
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
        <div className={`mb-4 flex justify-between items-center sticky top-0 z-10 px-4 py-4 bg-blue-100 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 ${
          isScrolled ? 'border-b border-gray-200 shadow-md' : ''
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isEditMode
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
              }`}
            >
              <PencilIcon className="w-4 h-4 mr-1.5" />
              {isEditMode ? 'Finished Editing' : 'Edit'}
            </button>
            {isEditMode && (
              <p className="hidden md:block text-sm text-gray-500">
                Drag to rearrange • Resize from corners • Changes save automatically
              </p>
            )}
          </div>

          {/* Color Palette Selector - Only show in edit mode */}
          <div className="flex items-center gap-3">
            {isEditMode && (
              <ColorPaletteSelector
                currentPalette={config.colorPalette}
                onPaletteChange={handlePaletteChange}
                className="shrink-0"
              />
            )}
            
            <button
              onClick={handleAddPortlet}
              disabled={!isEditMode}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isEditMode
                ? 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50'
                : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Portlet
          </button>
          </div>
        </div>
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        onBreakpointChange={(newBreakpoint) => setCurrentBreakpoint(newBreakpoint)}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        isDraggable={editable && isEditMode}
        isResizable={editable && isEditMode}
        draggableHandle=".portlet-drag-handle"
        margin={{ lg: [16, 16], md: [12, 12], sm: [8, 8], xs: [6, 6], xxs: [4, 4] }}
        containerPadding={[0, 0]}
        rowHeight={80}
        compactType="vertical"
        preventCollision={false}
      >
        {config.portlets.map(portlet => (
          <div 
            key={portlet.id}
            data-portlet-id={portlet.id}
            ref={el => { portletRefs.current[portlet.id] = el }}
            className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full"
          >
          {/* Portlet Header */}
          <div className={`flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-lg portlet-drag-handle ${isEditMode ? 'cursor-move' : 'cursor-default'}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">{portlet.title}</h3>
              {/* Debug button - right next to title, outside drag area */}
              {debugData[portlet.id] && (
                <div 
                  onMouseDown={(e) => e.stopPropagation()} 
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
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
            <div 
              className="flex items-center gap-3 flex-shrink-0 ml-4 -mr-2" 
              onMouseDown={(e) => e.stopPropagation()} 
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePortletRefresh(portlet.id)
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handlePortletRefresh(portlet.id)
                }}
                className="p-2 bg-transparent border-none rounded text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                title="Refresh portlet data"
              >
                <ArrowPathIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
              </button>
              {editable && isEditMode && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicatePortlet(portlet.id)
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      handleDuplicatePortlet(portlet.id)
                    }}
                    className="p-2 bg-transparent border-none rounded text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                    title="Duplicate portlet"
                  >
                    <DocumentDuplicateIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditPortlet(portlet)
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
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
                    onTouchEnd={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
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
              ref={el => { portletComponentRefs.current[portlet.id] = el }}
              query={portlet.query}
              chartType={portlet.chartType}
              chartConfig={portlet.chartConfig}
              displayConfig={portlet.displayConfig}
              title={portlet.title}
              height="100%"
              colorPalette={colorPalette}
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
        colorPalette={colorPalette}
      />
    </>
  )
}