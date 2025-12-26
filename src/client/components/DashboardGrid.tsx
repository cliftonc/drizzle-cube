/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  type DragEvent,
  type MouseEvent,
  type Ref
} from 'react'
import ReactGridLayout, { verticalCompactor, type LayoutItem, type Layout } from 'react-grid-layout'
import { getIcon } from '../icons'
import DashboardPortletCard from './DashboardPortletCard'
import RowManagedLayout from './RowManagedLayout'

const ChartBarIcon = getIcon('measure')
const RefreshIcon = getIcon('refresh')
const EditIcon = getIcon('edit')
const DeleteIcon = getIcon('delete')
const AddIcon = getIcon('add')
const CopyIcon = getIcon('copy')
const FilterIcon = getIcon('filter')
const DesktopIcon = getIcon('desktop')
const GridIcon = getIcon('segment')
const RowsIcon = getIcon('table')
import PortletEditModal from './PortletEditModal'
import PortletFilterConfigModal from './PortletFilterConfigModal'
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
import type {
  DashboardConfig,
  PortletConfig,
  DashboardFilter,
  CubeMeta,
  DashboardLayoutMode,
  DashboardGridSettings,
  RowLayout,
  RowLayoutColumn
} from '../types'

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
  dashboardModes?: DashboardLayoutMode[]
}

const DEFAULT_GRID_SETTINGS: DashboardGridSettings = {
  cols: 12,
  rowHeight: 80,
  minW: 2,
  minH: 2
}

const createRowId = () => `row-${Date.now()}`

const getGridSettings = (config: DashboardConfig): DashboardGridSettings => ({
  cols: config.grid?.cols ?? DEFAULT_GRID_SETTINGS.cols,
  rowHeight: config.grid?.rowHeight ?? DEFAULT_GRID_SETTINGS.rowHeight,
  minW: config.grid?.minW ?? DEFAULT_GRID_SETTINGS.minW,
  minH: config.grid?.minH ?? DEFAULT_GRID_SETTINGS.minH
})

const equalizeRowColumns = (
  portletIds: string[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  const count = portletIds.length
  if (count === 0) return []

  const { cols, minW } = gridSettings
  const minTotal = minW * count

  if (minTotal > cols) {
    const base = Math.floor(cols / count)
    const remainder = cols % count
    return portletIds.map((id, index) => ({
      portletId: id,
      w: base + (index < remainder ? 1 : 0)
    }))
  }

  const remaining = cols - minTotal
  const extra = Math.floor(remaining / count)
  const remainder = remaining % count

  return portletIds.map((id, index) => ({
    portletId: id,
    w: minW + extra + (index < remainder ? 1 : 0)
  }))
}

const adjustRowWidths = (
  columns: RowLayoutColumn[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  if (columns.length === 0) return []

  const { cols, minW } = gridSettings
  const adjusted = columns.map(column => ({
    ...column,
    w: Math.max(minW, column.w)
  }))

  let total = adjusted.reduce((sum, column) => sum + column.w, 0)
  if (total === cols) return adjusted

  if (total < cols) {
    let remaining = cols - total
    let index = 0
    while (remaining > 0) {
      adjusted[index % adjusted.length].w += 1
      remaining -= 1
      index += 1
    }
    return adjusted
  }

  let overflow = total - cols
  for (let index = adjusted.length - 1; index >= 0 && overflow > 0; index -= 1) {
    const column = adjusted[index]
    const reducible = Math.max(0, column.w - minW)
    if (reducible === 0) continue
    const delta = Math.min(reducible, overflow)
    column.w -= delta
    overflow -= delta
  }

  return adjusted
}

const convertPortletsToRows = (
  portlets: PortletConfig[],
  gridSettings: DashboardGridSettings
): RowLayout[] => {
  if (portlets.length === 0) return []

  const sorted = [...portlets].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const rowsByY = new Map<number, PortletConfig[]>()
  sorted.forEach(portlet => {
    const row = rowsByY.get(portlet.y) ?? []
    row.push(portlet)
    rowsByY.set(portlet.y, row)
  })

  return Array.from(rowsByY.entries())
    .sort(([a], [b]) => a - b)
    .map(([rowY, rowPortlets]) => {
      const rowHeight = Math.max(
        gridSettings.minH,
        ...rowPortlets.map(portlet => portlet.h)
      )
      const portletIds = rowPortlets.map(portlet => portlet.id)
      return {
        id: `row-${rowY}`,
        h: rowHeight,
        columns: equalizeRowColumns(portletIds, gridSettings)
      }
    })
}

const normalizeRows = (
  rows: RowLayout[],
  portlets: PortletConfig[],
  gridSettings: DashboardGridSettings
): RowLayout[] => {
  const portletIds = new Set(portlets.map(portlet => portlet.id))
  return rows
    .map(row => ({
      ...row,
      h: Math.max(gridSettings.minH, row.h),
      columns: adjustRowWidths(
        row.columns.filter(column => portletIds.has(column.portletId)),
        gridSettings
      )
    }))
    .filter(row => row.columns.length > 0)
}

const convertRowsToPortlets = (
  rows: RowLayout[],
  portlets: PortletConfig[],
  gridSettings: DashboardGridSettings
): PortletConfig[] => {
  const portletMap = new Map(portlets.map(portlet => [portlet.id, portlet]))
  let currentY = 0

  const updated: PortletConfig[] = []
  rows.forEach(row => {
    let currentX = 0
    row.columns.forEach(column => {
      const portlet = portletMap.get(column.portletId)
      if (!portlet) return
      updated.push({
        ...portlet,
        x: currentX,
        y: currentY,
        w: column.w,
        h: row.h
      })
      currentX += column.w
    })
    currentY += row.h
  })

  const updatedIds = new Set(updated.map(portlet => portlet.id))
  portlets.forEach(portlet => {
    if (!updatedIds.has(portlet.id)) {
      updated.push(portlet)
    }
  })

  return updated
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
  onDashboardFiltersChange,
  dashboardModes
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

  const allowedModes = dashboardModes && dashboardModes.length > 0
    ? dashboardModes
    : ['rows', 'grid']
  const fallbackMode = allowedModes.includes('rows') ? 'rows' : allowedModes[0] ?? 'grid'
  const layoutMode: DashboardLayoutMode = allowedModes.includes(config.layoutMode ?? 'grid')
    ? (config.layoutMode ?? fallbackMode)
    : fallbackMode
  const gridSettings = useMemo(() => getGridSettings(config), [config])

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
  const [draftRows, setDraftRows] = useState<RowLayout[] | null>(null)
  const draftRowsRef = useRef<RowLayout[] | null>(null)
  const dragStateRef = useRef<{ rowIndex: number; colIndex: number; portletId: string } | null>(null)
  const [isDraggingPortlet, setIsDraggingPortlet] = useState(false)

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

  // Determine if editing is allowed (only in desktop mode)
  const canEdit = editable && isEditMode && isResponsiveEditable && !selectedFilterId
  const canChangeLayoutMode = editable && isEditMode && isResponsiveEditable && !selectedFilterId && allowedModes.length > 1

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

  useEffect(() => {
    draftRowsRef.current = draftRows
  }, [draftRows])

  const resolvedRows = useMemo(() => {
    if (layoutMode !== 'rows') return []
    const baseRows = draftRows ?? config.rows ?? convertPortletsToRows(config.portlets, gridSettings)
    return normalizeRows(baseRows, config.portlets, gridSettings)
  }, [layoutMode, draftRows, config.rows, config.portlets, gridSettings])

  const updateRowLayout = useCallback(async (
    rows: RowLayout[],
    save = true,
    portletsOverride?: PortletConfig[]
  ) => {
    if (!onConfigChange) return
    const portlets = portletsOverride ?? config.portlets
    const normalizedRows = normalizeRows(rows, portlets, gridSettings)
    const updatedPortlets = convertRowsToPortlets(normalizedRows, portlets, gridSettings)
    const updatedConfig = {
      ...config,
      layoutMode: 'rows' as const,
      rows: normalizedRows,
      portlets: updatedPortlets
    }

    setDraftRows(null)
    onConfigChange(updatedConfig)

    if (save && onSave) {
      try {
        await onSave(updatedConfig)
      } catch (error) {
        console.error('Auto-save failed after row layout change:', error)
      }
    }
  }, [config, gridSettings, onConfigChange, onSave])

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

  const handleLayoutModeChange = useCallback(async (mode: DashboardLayoutMode) => {
    if (!onConfigChange || mode === layoutMode || !canChangeLayoutMode || !allowedModes.includes(mode)) return

    const baseRows = normalizeRows(
      config.rows && config.rows.length > 0
        ? config.rows
        : convertPortletsToRows(config.portlets, gridSettings),
      config.portlets,
      gridSettings
    )

    const updatedPortlets = convertRowsToPortlets(baseRows, config.portlets, gridSettings)
    const updatedConfig = {
      ...config,
      layoutMode: mode,
      rows: baseRows,
      portlets: updatedPortlets
    }

    setDraftRows(null)
    onConfigChange(updatedConfig)

    if (onSave) {
      try {
        await onSave(updatedConfig)
      } catch (error) {
        console.error('Auto-save failed after layout mode switch:', error)
      }
    }
  }, [allowedModes, canChangeLayoutMode, config, gridSettings, layoutMode, onConfigChange, onSave])

  const startRowResize = useCallback((rowIndex: number, event: MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return
    event.preventDefault()

    const startY = event.clientY
    const startRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY
      const deltaUnits = Math.round(delta / gridSettings.rowHeight)
      const nextRows = startRows.map((row, index) => {
        if (index !== rowIndex) return row
        return {
          ...row,
          h: Math.max(gridSettings.minH, row.h + deltaUnits)
        }
      })
      setDraftRows(nextRows)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const finalRows = draftRowsRef.current ?? startRows
      updateRowLayout(finalRows)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [canEdit, gridSettings, resolvedRows, updateRowLayout])

  const startColumnResize = useCallback((rowIndex: number, columnIndex: number, event: MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return
    event.preventDefault()

    const startX = event.clientX
    const startRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const row = startRows[rowIndex]
    const leftColumn = row?.columns[columnIndex]
    const rightColumn = row?.columns[columnIndex + 1]
    if (!row || !leftColumn || !rightColumn) return

    const columnGap = 16
    const rowContentWidth = gridWidth - (row.columns.length - 1) * columnGap
    const unitWidth = rowContentWidth / gridSettings.cols

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const deltaUnits = Math.round(delta / unitWidth)
      if (deltaUnits === 0) {
        setDraftRows(startRows)
        return
      }

      let nextLeft = leftColumn.w + deltaUnits
      let nextRight = rightColumn.w - deltaUnits

      if (nextLeft < gridSettings.minW) {
        const diff = gridSettings.minW - nextLeft
        nextLeft = gridSettings.minW
        nextRight -= diff
      }

      if (nextRight < gridSettings.minW) {
        const diff = gridSettings.minW - nextRight
        nextRight = gridSettings.minW
        nextLeft -= diff
      }

      if (nextLeft < gridSettings.minW || nextRight < gridSettings.minW) return

      const nextRows = startRows.map((rowItem, index) => {
        if (index !== rowIndex) return rowItem
        const nextColumns = rowItem.columns.map((column, colIndex) => {
          if (colIndex === columnIndex) {
            return { ...column, w: nextLeft }
          }
          if (colIndex === columnIndex + 1) {
            return { ...column, w: nextRight }
          }
          return column
        })
        return {
          ...rowItem,
          columns: adjustRowWidths(nextColumns, gridSettings)
        }
      })
      setDraftRows(nextRows)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const finalRows = draftRowsRef.current ?? startRows
      updateRowLayout(finalRows)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [canEdit, gridSettings, gridWidth, resolvedRows, updateRowLayout])

  const handlePortletDragStart = useCallback((rowIndex: number, colIndex: number, portletId: string, event: DragEvent<HTMLDivElement>) => {
    if (!canEdit) return
    dragStateRef.current = { rowIndex, colIndex, portletId }
    setIsDraggingPortlet(true)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', portletId)
  }, [canEdit])

  const handlePortletDragEnd = useCallback(() => {
    dragStateRef.current = null
    setIsDraggingPortlet(false)
  }, [])

  const handleRowDrop = useCallback((rowIndex: number, insertIndex: number | null) => {
    const dragState = dragStateRef.current
    if (!dragState) return

    const nextRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const sourceRowIndex = dragState.rowIndex
    const sourceRow = nextRows[sourceRowIndex]
    if (!sourceRow) return

    const [movedColumn] = sourceRow.columns.splice(dragState.colIndex, 1)
    let sourceRowRemoved = false
    if (sourceRow.columns.length === 0) {
      nextRows.splice(sourceRowIndex, 1)
      sourceRowRemoved = true
    }

    let targetRowIndex = rowIndex
    if (sourceRowRemoved && sourceRowIndex < rowIndex) {
      targetRowIndex -= 1
    }

    const targetRow = nextRows[targetRowIndex]
    if (!targetRow) return

    let targetIndex = insertIndex ?? targetRow.columns.length
    if (!sourceRowRemoved && sourceRowIndex === targetRowIndex && insertIndex !== null) {
      if (insertIndex > dragState.colIndex) {
        targetIndex -= 1
      }
    }
    targetRow.columns.splice(targetIndex, 0, movedColumn)

    const movedBetweenRows = sourceRowIndex !== targetRowIndex || sourceRowRemoved
    if (movedBetweenRows) {
      if (!sourceRowRemoved) {
        nextRows[sourceRowIndex] = {
          ...nextRows[sourceRowIndex],
          columns: equalizeRowColumns(
            nextRows[sourceRowIndex].columns.map(column => column.portletId),
            gridSettings
          )
        }
      }
      nextRows[targetRowIndex] = {
        ...nextRows[targetRowIndex],
        columns: equalizeRowColumns(
          nextRows[targetRowIndex].columns.map(column => column.portletId),
          gridSettings
        )
      }
    }

    updateRowLayout(nextRows)
  }, [gridSettings, resolvedRows, updateRowLayout])

  const handleNewRowDrop = useCallback((insertIndex: number) => {
    const dragState = dragStateRef.current
    if (!dragState) return

    const nextRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const sourceRow = nextRows[dragState.rowIndex]
    if (!sourceRow) return

    const [movedColumn] = sourceRow.columns.splice(dragState.colIndex, 1)
    if (sourceRow.columns.length === 0) {
      nextRows.splice(dragState.rowIndex, 1)
    } else {
      sourceRow.columns = equalizeRowColumns(
        sourceRow.columns.map(column => column.portletId),
        gridSettings
      )
    }

    const newRow: RowLayout = {
      id: createRowId(),
      h: Math.max(gridSettings.minH, 5),
      columns: equalizeRowColumns([movedColumn.portletId], gridSettings)
    }
    nextRows.splice(insertIndex, 0, newRow)

    updateRowLayout(nextRows)
  }, [gridSettings, resolvedRows, updateRowLayout])

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

    if (layoutMode === 'rows') {
      const baseRows = resolvedRows.length > 0
        ? resolvedRows.map(row => ({
          ...row,
          columns: row.columns.map(column => ({ ...column }))
        }))
        : normalizeRows(
          config.rows ?? convertPortletsToRows(config.portlets, gridSettings),
          updatedPortlets,
          gridSettings
        )

      const nextRows = isNewPortlet && newPortletId
        ? [
          ...baseRows,
          {
            id: createRowId(),
            h: Math.max(gridSettings.minH, 5),
            columns: equalizeRowColumns([newPortletId], gridSettings)
          }
        ]
        : baseRows

      await updateRowLayout(nextRows, true, updatedPortlets)
    } else {
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
  }, [config, editingPortlet, gridSettings, layoutMode, onConfigChange, onSave, resolvedRows, updateRowLayout])

  // Handle deleting portlet
  const handleDeletePortlet = useCallback(async (portletId: string) => {
    if (!onConfigChange) return
    
    if (window.confirm('Are you sure you want to delete this portlet?')) {
      const updatedPortlets = config.portlets.filter(p => p.id !== portletId)

      if (layoutMode === 'rows') {
        const nextRows = resolvedRows
          .map(row => ({
            ...row,
            columns: row.columns.filter(column => column.portletId !== portletId)
          }))
          .filter(row => row.columns.length > 0)
          .map(row => ({
            ...row,
            columns: equalizeRowColumns(
              row.columns.map(column => column.portletId),
              gridSettings
            )
          }))

        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
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
    }
  }, [config, gridSettings, layoutMode, onConfigChange, onSave, resolvedRows, updateRowLayout])

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
    if (layoutMode === 'rows') {
      const baseRows = resolvedRows.map(row => ({
        ...row,
        columns: row.columns.map(column => ({ ...column }))
      }))
      const nextRows = [
        ...baseRows,
        {
          id: createRowId(),
          h: Math.max(gridSettings.minH, 5),
          columns: equalizeRowColumns([duplicatedPortlet.id], gridSettings)
        }
      ]
      await updateRowLayout(nextRows, true, updatedPortlets)
    } else {
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
  }, [config, gridSettings, layoutMode, onConfigChange, onSave, resolvedRows, updateRowLayout])

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

  // Generate grid layout from portlets - only use for lg (desktop) breakpoint
  // Let react-grid-layout handle responsive adjustments automatically
  const baseLayout: LayoutItem[] = config.portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    minW: gridSettings.minW,
    minH: gridSettings.minH,  // 2 rows at 80px = 160px minimum
    // Only enable drag/resize in edit mode
    isDraggable: canEdit,
    isResizable: canEdit,
    ...(canEdit ? { resizeHandles: ['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'] as const } : {})
  }))

  const renderPortletCard = (
    portlet: PortletConfig,
    containerProps?: HTMLAttributes<HTMLDivElement>,
    headerProps?: HTMLAttributes<HTMLDivElement>
  ) => (
    <DashboardPortletCard
      portlet={portlet}
      editable={editable}
      isEditMode={isEditMode}
      selectedFilterId={selectedFilterId}
      debugData={debugData[portlet.id]}
      dashboardFilters={dashboardFilters}
      configEagerLoad={config.eagerLoad}
      loadingComponent={loadingComponent}
      colorPalette={colorPalette}
      containerProps={containerProps}
      headerProps={headerProps}
      onToggleFilter={handleToggleFilterForPortlet}
      onRefresh={handlePortletRefresh}
      onDuplicate={handleDuplicatePortlet}
      onEdit={handleEditPortlet}
      onDelete={handleDeletePortlet}
      onOpenFilterConfig={handleOpenFilterConfig}
      onDebugDataReady={(portletId, data) => {
        setDebugData(prev => ({
          ...prev,
          [portletId]: data
        }))
      }}
      setPortletRef={(portletId, element) => {
        portletRefs.current[portletId] = element
      }}
      setPortletComponentRef={(portletId, element) => {
        portletComponentRefs.current[portletId] = element
      }}
      icons={{ RefreshIcon, EditIcon, DeleteIcon, CopyIcon, FilterIcon }}
    />
  )

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
        cols: gridSettings.cols,
        rowHeight: gridSettings.rowHeight,
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
            ref={ref as Ref<HTMLDivElement>}
            className={`react-resizable-handle react-resizable-handle-${axis}`}
            style={{ opacity: 0 }}
          />
        )
      }}
      compactor={verticalCompactor}
    >
      {config.portlets.map(portlet => (
        <div key={portlet.id}>
          {renderPortletCard(portlet)}
        </div>
      ))}
    </ReactGridLayout>
  )

  const renderRowContent = () => (
    <RowManagedLayout
      rows={resolvedRows}
      portlets={config.portlets}
      gridSettings={gridSettings}
      gridWidth={gridWidth}
      canEdit={canEdit}
      isDragging={isDraggingPortlet}
      onRowResize={startRowResize}
      onColumnResize={startColumnResize}
      onPortletDragStart={handlePortletDragStart}
      onPortletDragEnd={handlePortletDragEnd}
      onRowDrop={handleRowDrop}
      onNewRowDrop={handleNewRowDrop}
      renderPortlet={renderPortletCard}
    />
  )

  const renderActiveLayout = layoutMode === 'rows' ? renderRowContent() : renderGridContent()
  const editModeHint = 'Drag • Resize • Auto-save'

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
            {isEditMode && allowedModes.length > 1 && (
              <div className="inline-flex rounded-md border border-dc-border overflow-hidden whitespace-nowrap">
                <button
                  onClick={() => handleLayoutModeChange('grid')}
                  disabled={!canChangeLayoutMode}
                  className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
                    layoutMode === 'grid'
                      ? 'bg-dc-surface-secondary text-dc-text shadow-inner'
                      : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover'
                  } ${!canChangeLayoutMode ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <GridIcon className="w-4 h-4 shrink-0" />
                  Grid
                </button>
                <button
                  onClick={() => handleLayoutModeChange('rows')}
                  disabled={!canChangeLayoutMode}
                  className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
                    layoutMode === 'rows'
                      ? 'bg-dc-surface-secondary text-dc-text shadow-inner'
                      : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover'
                  } ${!canChangeLayoutMode ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <RowsIcon className="w-4 h-4 shrink-0" />
                  Rows
                </button>
              </div>
            )}
            {!isResponsiveEditable && (
              <div className="flex items-center gap-2 text-sm text-dc-text-secondary">
                <DesktopIcon className="w-4 h-4" />
                <span>Desktop view required for editing</span>
              </div>
            )}
            {isEditMode && isResponsiveEditable && (
              <p className="hidden md:block text-sm text-dc-text-secondary">
                {editModeHint}
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
          {renderActiveLayout}
        </ScaledGridWrapper>
      ) : (
        renderActiveLayout
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
