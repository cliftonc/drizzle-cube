/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import { useCallback, useRef, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { ChartBarIcon, ArrowPathIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import AnalyticsPortlet from './AnalyticsPortlet'
import PortletEditModal from './PortletEditModal'
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

  // Modal states
  const [isPortletModalOpen, setIsPortletModalOpen] = useState(false)
  const [editingPortlet, setEditingPortlet] = useState<PortletConfig | null>(null)

  const handleLayoutChange = useCallback(async (currentLayout: any[], allLayouts: any) => {
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
    
    // Auto-save if handler is provided
    if (onSave) {
      try {
        await onSave(updatedConfig)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }
  }, [config.portlets, editable, onConfigChange, onSave])

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

  // Generate grid layout from portlets (like fintune-react does)
  const gridLayout = config.portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    minW: 3,
    minH: 3
  }))


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
        layouts={{ lg: gridLayout, md: gridLayout, sm: gridLayout, xs: gridLayout, xxs: gridLayout }}
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
            className="drizzle-cube-portlet"
          >
          {/* Portlet Header */}
          <div className="drizzle-cube-portlet-header">
            <div className="drizzle-cube-portlet-drag-handle portlet-drag-handle">
              <h3 className="drizzle-cube-portlet-title">{portlet.title}</h3>
            </div>
            <div className="drizzle-cube-portlet-controls">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePortletRefresh(portlet.id)
                }}
                className="drizzle-cube-portlet-control-button"
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
                    className="drizzle-cube-portlet-control-button"
                    title="Edit portlet"
                  >
                    <PencilIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePortlet(portlet.id)
                    }}
                    className="drizzle-cube-portlet-control-button"
                    title="Delete portlet"
                  >
                    <TrashIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Portlet Content */}
          <div className="drizzle-cube-portlet-content">
            <AnalyticsPortlet
              ref={el => portletComponentRefs.current[portlet.id] = el}
              query={portlet.query}
              chartType={portlet.chartType}
              chartConfig={portlet.chartConfig}
              displayConfig={portlet.displayConfig}
              title={portlet.title}
              height="100%"
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