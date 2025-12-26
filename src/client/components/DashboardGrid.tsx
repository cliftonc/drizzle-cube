/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react'
import ReactGridLayout, { verticalCompactor, type LayoutItem, type Layout } from 'react-grid-layout'
import { getIcon } from '../icons'
import AnalyticsPortlet from './AnalyticsPortlet'

const ChartBarIcon = getIcon('measure')
const RefreshIcon = getIcon('refresh')
const EditIcon = getIcon('edit')
const DeleteIcon = getIcon('delete')
const AddIcon = getIcon('add')
const CopyIcon = getIcon('copy')
const FilterIcon = getIcon('filter')
const DesktopIcon = getIcon('desktop')
import PortletEditModal from './PortletEditModal'
import PortletFilterConfigModal from './PortletFilterConfigModal'
import DebugModal from './DebugModal'
import ColorPaletteSelector from './ColorPaletteSelector'
import DashboardFilterPanel from './DashboardFilterPanel'
import ScaledGridWrapper from './ScaledGridWrapper'
import MobileStackedLayout from './MobileStackedLayout'
import { useResponsiveDashboard } from '../hooks/useResponsiveDashboard'
import { ScrollContainerProvider } from '../providers/ScrollContainerContext'
import type { ColorPalette } from '../utils/colorPalettes'

/**
 * Finds the nearest scrollable ancestor of an element.
 * Used to detect scroll container for lazy loading IntersectionObserver.
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

  return null // Use viewport
}
import type { DashboardConfig, PortletConfig, DashboardFilter, CubeMeta } from '../types'

// CSS for react-grid-layout should be imported by the consuming app
// import 'react-grid-layout/css/styles.css'

interface DashboardGridProps {
  config: DashboardConfig
  editable?: boolean
  dashboardFilters?: DashboardFilter[] // Dashboard-level filters to apply to portlets
  loadingComponent?: ReactNode // Custom loading indicator for all portlets
  onConfigChange?: (config: DashboardConfig) => void
  onPortletRefresh?: (portletId: string) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  colorPalette?: ColorPalette  // Complete palette with both colors and gradient
  schema?: CubeMeta | null  // Cube metadata for filter panel
  onDashboardFiltersChange?: (filters: DashboardFilter[]) => void  // Handler for filter changes
}

export default function DashboardGrid({
  config,
  editable = false,
  dashboardFilters,
  loadingComponent,
  onConfigChange,
  onPortletRefresh,
  onSave,
  colorPalette,
  schema,
  onDashboardFiltersChange
}: DashboardGridProps) {
  // Responsive dashboard hook for three-tier layout strategy
  const {
    containerRef,
    containerWidth,
    displayMode,
    scaleFactor,
    isEditable: isResponsiveEditable,
    designWidth
  } = useResponsiveDashboard()

  // Scroll container detection for lazy loading
  // Null = viewport, element = scrolling container
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)

  // Detect scroll container after mount
  useEffect(() => {
    if (containerElementRef.current) {
      setScrollContainer(findScrollableAncestor(containerElementRef.current))
    }
  }, [])

  // Combined ref for container
  const combinedContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerElementRef.current = node
    containerRef(node)
    if (node) {
      setScrollContainer(findScrollableAncestor(node))
    }
  }, [containerRef])

  // Calculate grid width based on display mode
  // Desktop: use actual container width (allows wider than 1200px)
  // Scaled: use design width (1200px) and apply CSS scaling
  const gridWidth = displayMode === 'desktop' ? containerWidth : designWidth

  // Refs to store portlet refs for refresh functionality
  const portletRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})

  // Track if component has been initialized to prevent saves during initial load
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastKnownLayout, setLastKnownLayout] = useState<any[]>([])

  // Edit mode state - dashboard is readonly by default
  const [isEditMode, setIsEditMode] = useState(false)

  // Filter selection mode state
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null)

  // Exit filter selection mode when leaving edit mode or when switching to non-desktop mode
  useEffect(() => {
    if ((!isEditMode || !isResponsiveEditable) && selectedFilterId) {
      setSelectedFilterId(null)
    }
  }, [isEditMode, isResponsiveEditable, selectedFilterId])

  // Exit edit mode when switching to non-desktop view
  useEffect(() => {
    if (!isResponsiveEditable && isEditMode) {
      setIsEditMode(false)
    }
  }, [isResponsiveEditable, isEditMode])

  // Track scroll state for sticky header
  const [isScrolled, setIsScrolled] = useState(false)

  // Modal states
  const [isPortletModalOpen, setIsPortletModalOpen] = useState(false)
  const [editingPortlet, setEditingPortlet] = useState<PortletConfig | null>(null)
  const [isFilterConfigModalOpen, setIsFilterConfigModalOpen] = useState(false)
  const [filterConfigPortlet, setFilterConfigPortlet] = useState<PortletConfig | null>(null)

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

  // Set up ESC key listener for filter selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFilterId) {
        setSelectedFilterId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedFilterId])

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

  const handleLayoutChange = useCallback((_layout: Layout) => {
    // This function is called for ALL layout changes
    // We should NOT save here - only update internal state if needed
    // Actual saving only happens in handleDragStop and handleResizeStop for explicit user actions

    // Note: We don't call onConfigChange here to prevent saving intermediate layout changes
    // The layout changes are handled by react-grid-layout internally
  }, [])  // No dependencies since we're not doing anything

  // Handle drag stop - save when user finishes dragging (only if layout actually changed)
  const handleDragStop = useCallback(async (layout: Layout, _oldItem: LayoutItem | null, _newItem: LayoutItem | null, _placeholder: LayoutItem | null, _e: Event, _element: HTMLElement | undefined) => {
    if (!editable || !isEditMode || !onSave || !isInitialized) return

    // Only save if the layout actually changed from user interaction
    // Convert readonly Layout to mutable array for comparison
    const mutableLayout = [...layout]
    if (!hasLayoutActuallyChanged(mutableLayout)) {
      return // No actual change, don't save
    }

    // Get the current updated config (only called in desktop mode)
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = mutableLayout.find(item => item.i === portlet.id)
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
      ...config,
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: mutableLayout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    setLastKnownLayout(mutableLayout)

    // Update config state first
    onConfigChange?.(updatedConfig)

    // Auto-save after drag operation
    try {
      await onSave(updatedConfig)
    } catch (error) {
      console.error('Auto-save failed after drag:', error)
    }
  }, [config.portlets, config.layouts, editable, isEditMode, onConfigChange, onSave, isInitialized, hasLayoutActuallyChanged])

  // Handle resize stop - update config and save (resize is user interaction)
  const handleResizeStop = useCallback(async (layout: Layout, _oldItem: LayoutItem | null, _newItem: LayoutItem | null, _placeholder: LayoutItem | null, _e: Event, _element: HTMLElement | undefined) => {
    if (!editable || !isEditMode || !onConfigChange || !isInitialized) return

    // Only proceed if the layout actually changed from user interaction
    // Convert readonly Layout to mutable array for comparison
    const mutableLayout = [...layout]
    if (!hasLayoutActuallyChanged(mutableLayout)) {
      return // No actual change, don't save
    }

    // Get the current updated config (only called in desktop mode)
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = mutableLayout.find(item => item.i === portlet.id)
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
      ...config,
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: mutableLayout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    setLastKnownLayout(mutableLayout)

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
  }, [config.portlets, config.layouts, editable, isEditMode, onConfigChange, onSave, isInitialized, hasLayoutActuallyChanged])

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

  // Handle opening filter config modal
  const handleOpenFilterConfig = useCallback((portlet: PortletConfig) => {
    setFilterConfigPortlet(portlet)
    setIsFilterConfigModalOpen(true)
  }, [])

  // Handle saving filter configuration
  const handleSaveFilterConfig = useCallback(async (mapping: string[]) => {
    if (!onConfigChange || !filterConfigPortlet) return

    const updatedPortlets = config.portlets.map(p => {
      if (p.id === filterConfigPortlet.id) {
        return {
          ...p,
          dashboardFilterMapping: mapping
        }
      }
      return p
    })

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
  }, [config, filterConfigPortlet, onConfigChange, onSave])

  // Handle toggling filter for a portlet (used in filter selection mode)
  const handleToggleFilterForPortlet = useCallback(async (portletId: string, filterId: string) => {
    if (!onConfigChange) return

    const updatedPortlets = config.portlets.map(p => {
      if (p.id === portletId) {
        const currentMapping = p.dashboardFilterMapping || []
        const hasFilter = currentMapping.includes(filterId)

        return {
          ...p,
          dashboardFilterMapping: hasFilter
            ? currentMapping.filter(id => id !== filterId)
            : [...currentMapping, filterId]
        }
      }
      return p
    })

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
  }, [config, onConfigChange, onSave])

  // Handle filter selection (click on filter chip)
  const handleFilterSelect = useCallback((filterId: string) => {
    // Toggle selection: if already selected, deselect
    setSelectedFilterId(prev => prev === filterId ? null : filterId)
  }, [])

  // Handle select all - apply current filter to all portlets
  const handleSelectAllForFilter = useCallback(async (filterId: string) => {
    if (!onConfigChange) return

    const updatedPortlets = config.portlets.map(p => {
      const currentMapping = p.dashboardFilterMapping || []
      // Add the filter if it's not already in the mapping
      if (!currentMapping.includes(filterId)) {
        return {
          ...p,
          dashboardFilterMapping: [...currentMapping, filterId]
        }
      }
      return p
    })

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
  }, [config, onConfigChange, onSave])

  // Get the selected filter object
  const selectedFilter = selectedFilterId
    ? dashboardFilters?.find(f => f.id === selectedFilterId)
    : null

  if (!config.portlets || config.portlets.length === 0) {
    return (
      <>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <ChartBarIcon style={{ width: '64px', height: '64px', color: 'var(--dc-text-muted)', margin: '0 auto 16px auto' }} />
            <h3 className="text-lg font-semibold mb-2 text-dc-text">No Portlets</h3>
            <p className="text-sm text-dc-text-secondary mb-4">Add your first portlet to start visualizing your data</p>
            {editable && (
              <button
                onClick={handleAddPortlet}
                className="inline-flex items-center px-4 py-2 border border-dc-border bg-dc-surface rounded-md focus:outline-hidden focus:ring-2"
                style={{
                  color: 'var(--dc-primary)',
                  borderColor: 'var(--dc-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface)'}
              >
                <AddIcon className="w-5 h-5 mr-2" />
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

  // Determine if editing is allowed (only in desktop mode)
  const canEdit = editable && isEditMode && isResponsiveEditable && !selectedFilterId

  // Generate grid layout from portlets - only use for lg (desktop) breakpoint
  // Let react-grid-layout handle responsive adjustments automatically
  const baseLayout: LayoutItem[] = config.portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    minW: 2,
    minH: 2,  // 2 rows at 80px = 160px minimum
    // Only enable drag/resize in edit mode
    isDraggable: canEdit,
    isResizable: canEdit,
    ...(canEdit ? { resizeHandles: ['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'] as const } : {})
  }))

  // Render the portlet grid content (shared between desktop and scaled modes)
  const renderGridContent = () => (
    <ReactGridLayout
      className="layout"
      layout={baseLayout}
      onLayoutChange={handleLayoutChange}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      width={gridWidth}
      gridConfig={{
        cols: 12,
        rowHeight: 80,
        margin: [16, 16],
        containerPadding: [0, 0]
      }}
      dragConfig={{
        enabled: canEdit,
        handle: '.portlet-drag-handle'
      }}
      resizeConfig={{
        enabled: canEdit,
        handles: ['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'],
        // Invisible but functional resize handles
        handleComponent: (axis, ref) => (
          <div
            ref={ref as React.Ref<HTMLDivElement>}
            className={`react-resizable-handle react-resizable-handle-${axis}`}
            style={{ opacity: 0 }}
          />
        )
      }}
      compactor={verticalCompactor}
    >
      {config.portlets.map(portlet => {
        const hasSelectedFilter = selectedFilterId
          ? (portlet.dashboardFilterMapping || []).includes(selectedFilterId)
          : false
        const isInSelectionMode = !!selectedFilterId

        return (
          <div
            key={portlet.id}
            data-portlet-id={portlet.id}
            ref={el => { portletRefs.current[portlet.id] = el }}
            className={`bg-dc-surface border rounded-lg flex flex-col h-full transition-all ${
              isInSelectionMode ? 'cursor-pointer' : ''
            }`}
            style={{
              boxShadow: 'var(--dc-shadow-sm)',
              borderColor: isInSelectionMode && hasSelectedFilter
                ? 'var(--dc-primary)'
                : 'var(--dc-border)',
              borderWidth: isInSelectionMode && hasSelectedFilter ? '2px' : '1px',
              backgroundColor: isInSelectionMode && hasSelectedFilter
                ? 'rgba(var(--dc-primary-rgb), 0.05)'
                : 'var(--dc-surface)',
              opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1'
            }}
            onClick={(e) => {
              if (isInSelectionMode && selectedFilterId) {
                e.stopPropagation()
                handleToggleFilterForPortlet(portlet.id, selectedFilterId)
              }
            }}
          >
            {/* Portlet Header - Conditionally rendered based on displayConfig.hideHeader */}
            {(!portlet.displayConfig?.hideHeader || isEditMode) && (
              <div className={`flex items-center justify-between px-3 py-1.5 md:px-4 md:py-1 border-b border-dc-border shrink-0 bg-dc-surface-secondary rounded-t-lg portlet-drag-handle ${isEditMode ? 'cursor-move' : 'cursor-default'}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-dc-text truncate">{portlet.title}</h3>
                  {/* Debug button - only show in edit mode */}
                  {editable && isEditMode && debugData[portlet.id] && (
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
                  className="flex items-center gap-1 shrink-0 ml-4 -mr-2"
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
                    disabled={isInSelectionMode}
                    className={`p-1 bg-transparent border-none rounded-sm text-dc-text-secondary transition-colors ${
                      isInSelectionMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-dc-surface-hover'
                    }`}
                    title="Refresh portlet data"
                  >
                    <RefreshIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                  </button>

                  {editable && isEditMode && !isInSelectionMode && (
                    <>
                      {/* Filter configuration button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenFilterConfig(portlet)
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleOpenFilterConfig(portlet)
                        }}
                        className="p-1 bg-transparent border-none rounded-sm cursor-pointer hover:bg-dc-surface-hover transition-colors relative"
                        title={`Configure dashboard filters${portlet.dashboardFilterMapping && portlet.dashboardFilterMapping.length > 0 ? ` (${portlet.dashboardFilterMapping.length} active)` : ''}`}
                        style={{
                          color: portlet.dashboardFilterMapping && portlet.dashboardFilterMapping.length > 0
                            ? 'var(--dc-primary)'
                            : 'var(--dc-text-secondary)'
                        }}
                      >
                        <FilterIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                      </button>

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
                        className="p-1 bg-transparent border-none rounded-sm text-dc-text-secondary cursor-pointer hover:bg-dc-surface-hover transition-colors"
                        title="Duplicate portlet"
                      >
                        <CopyIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
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
                        className="p-1 bg-transparent border-none rounded-sm text-dc-text-secondary cursor-pointer hover:bg-dc-surface-hover transition-colors"
                        title="Edit portlet"
                      >
                        <EditIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
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
                        className="p-1 mr-0.5 bg-transparent border-none rounded-sm cursor-pointer hover:bg-red-50 transition-colors"
                        style={{ color: '#ef4444' }}
                        title="Delete portlet"
                      >
                        <DeleteIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Portlet Content */}
            <div className="flex-1 px-2 py-3 md:px-4 md:py-4 min-h-0 overflow-visible flex flex-col">
              <AnalyticsPortlet
                ref={el => { portletComponentRefs.current[portlet.id] = el }}
                query={portlet.query}
                chartType={portlet.chartType}
                chartConfig={portlet.chartConfig}
                displayConfig={portlet.displayConfig}
                dashboardFilters={dashboardFilters}
                dashboardFilterMapping={portlet.dashboardFilterMapping}
                eagerLoad={portlet.eagerLoad ?? config.eagerLoad ?? false}
                title={portlet.title}
                height="100%"
                colorPalette={colorPalette}
                loadingComponent={loadingComponent}
                onDebugDataReady={(data) => {
                  setDebugData(prev => ({
                    ...prev,
                    [portlet.id]: data
                  }))
                }}
              />
            </div>
          </div>
        )
      })}
    </ReactGridLayout>
  )

  return (
    <ScrollContainerProvider value={scrollContainer}>
      <div ref={combinedContainerRef} className="dashboard-grid-container w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {editable && (
        <div
          className={`mb-4 flex justify-between items-center sticky top-0 z-10 px-4 py-4 bg-dc-surface-tertiary border border-dc-border rounded-lg transition-all duration-200 ${
            isScrolled ? 'border-b' : ''
          }`}
          style={{
            boxShadow: isScrolled ? 'var(--dc-shadow-md)' : 'var(--dc-shadow-sm)'
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => isResponsiveEditable && setIsEditMode(!isEditMode)}
              disabled={!isResponsiveEditable}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                !isResponsiveEditable
                  ? 'opacity-50 cursor-not-allowed bg-dc-surface-secondary border border-dc-border'
                  : isEditMode
                    ? 'bg-dc-surface-secondary border border-dc-border hover:bg-dc-surface-hover'
                    : 'bg-dc-surface border border-dc-border hover:bg-dc-surface-hover'
              }`}
              style={{
                color: !isResponsiveEditable ? 'var(--dc-text-muted)' : 'var(--dc-primary)',
                borderColor: !isResponsiveEditable ? 'var(--dc-border)' : isEditMode ? 'var(--dc-border)' : 'var(--dc-primary)'
              }}
            >
              <EditIcon className="w-4 h-4 mr-1.5" />
              {isEditMode ? 'Finished Editing' : 'Edit'}
            </button>
            {!isResponsiveEditable && (
              <div className="flex items-center gap-2 text-sm text-dc-text-secondary">
                <DesktopIcon className="w-4 h-4" />
                <span>Desktop view required for editing</span>
              </div>
            )}
            {isEditMode && isResponsiveEditable && (
              <p className="hidden md:block text-sm text-dc-text-secondary">
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
              className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
              isEditMode
                ? 'border-dc-border bg-dc-surface hover:bg-dc-surface-hover'
                : 'border-dc-border bg-dc-surface-secondary cursor-not-allowed'
            }`}
              style={{
                color: isEditMode ? 'var(--dc-primary)' : 'var(--dc-text-muted)',
                borderColor: isEditMode ? 'var(--dc-primary)' : 'var(--dc-border)'
              }}
          >
            <AddIcon className="w-5 h-5 mr-2" />
            Add Portlet
          </button>
          </div>
        </div>
      )}

      {/* Dashboard Filter Panel - Always visible below toolbar */}
      <DashboardFilterPanel
        dashboardFilters={dashboardFilters || []}
        editable={editable}
        schema={schema || null}
        dashboardConfig={config}
        onDashboardFiltersChange={onDashboardFiltersChange || (() => {})}
        onSaveFilters={onSave ? async (filters: DashboardFilter[]) => {
          const updatedConfig = {
            ...config,
            filters
          }
          await onSave(updatedConfig)
        } : undefined}
        selectedFilterId={selectedFilterId}
        onFilterSelect={handleFilterSelect}
        isEditMode={isEditMode}
      />

      {/* Filter Selection Mode Banner */}
      {selectedFilterId && selectedFilter && (
        <div
          className="mb-4 px-4 py-3 rounded-md border-2 transition-all"
          style={{
            backgroundColor: 'var(--dc-primary)',
            borderColor: 'var(--dc-primary)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterIcon className="w-5 h-5 shrink-0" />
              <span className="font-medium">
                Filter Selection Mode - Click portlets to toggle '{selectedFilter.label}'
              </span>
              <span className="text-sm opacity-90 hidden sm:inline">• Press ESC to exit</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectAllForFilter(selectedFilterId)}
                className="px-3 py-1 rounded-md transition-colors text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedFilterId(null)}
                className="px-3 py-1 rounded-md transition-colors text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Render layout based on display mode */}
      {displayMode === 'mobile' ? (
        <MobileStackedLayout
          config={config}
          colorPalette={colorPalette}
          dashboardFilters={dashboardFilters}
          onPortletRefresh={handlePortletRefresh}
        />
      ) : displayMode === 'scaled' ? (
        <ScaledGridWrapper scaleFactor={scaleFactor} designWidth={designWidth}>
          {renderGridContent()}
        </ScaledGridWrapper>
      ) : (
        renderGridContent()
      )}
      
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

      {/* Filter Configuration Modal */}
      <PortletFilterConfigModal
        isOpen={isFilterConfigModalOpen}
        onClose={() => {
          setIsFilterConfigModalOpen(false)
          setFilterConfigPortlet(null)
        }}
        dashboardFilters={dashboardFilters || []}
        currentMapping={filterConfigPortlet?.dashboardFilterMapping || []}
        onSave={handleSaveFilterConfig}
        portletTitle={filterConfigPortlet?.title || ''}
      />
      </div>
    </ScrollContainerProvider>
  )
}