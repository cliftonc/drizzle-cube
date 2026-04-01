import { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useCubeContext } from '../../providers/CubeProvider'
import { CubeNode } from './CubeNode'
import { RelationshipEdge } from './RelationshipEdge'
import { FieldDetailPanel } from './FieldDetailPanel'
import type { FieldSelection } from './FieldDetailPanel'
import { useERDLayout } from './useERDLayout'
import { getIcon } from '../../icons'
import { useXyflow } from './xyflowContext'
import { useTranslation } from '../../hooks/useTranslation'

const nodeTypes = { cubeNode: CubeNode }
const edgeTypes = { relationshipEdge: RelationshipEdge }

/**
 * Inner component that uses useNodesInitialized() (must be inside <ReactFlow>).
 * Calls fitView exactly once per fitViewToken change, after all nodes are measured.
 */
function FitViewOnReady({ token }: { token: number }) {
  const { useNodesInitialized, useReactFlow } = useXyflow()
  const nodesInitialized = useNodesInitialized()
  const { fitView } = useReactFlow()
  const appliedTokenRef = useRef(0)

  useEffect(() => {
    if (token === 0 || token === appliedTokenRef.current) return
    if (!nodesInitialized) return
    appliedTokenRef.current = token
    fitView({ padding: 0.1 })
  }, [token, nodesInitialized, fitView])

  return null
}

// Stable empty arrays (avoid new [] on every render)
const EMPTY_STRINGS: string[] = []

export interface SchemaVisualizationProps {
  className?: string
  onFieldClick?: (cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension') => void
  highlightedCubes?: string[]
  highlightedFields?: string[]
  searchTerm?: string
  height?: string | number
}

function getRelationshipColor(relationship: string): string {
  switch (relationship) {
    case 'belongsTo': return '#10b981'
    case 'hasOne': return '#3b82f6'
    case 'hasMany': return '#f59e0b'
    case 'belongsToMany': return '#8b5cf6'
    default: return '#6b7280'
  }
}

export function SchemaVisualization({
  className = '',
  onFieldClick,
  highlightedCubes,
  highlightedFields,
  searchTerm,
  height = '100%',
}: SchemaVisualizationProps) {
  const { t } = useTranslation()
  const {
    ReactFlow: ReactFlowComponent,
    Controls,
    MiniMap,
    Background,
    applyNodeChanges,
  } = useXyflow()
  const { meta, metaLoading, metaError } = useCubeContext()

  // Stabilize array props to avoid re-creating references every render
  const stableHighlightedCubes = highlightedCubes || EMPTY_STRINGS
  const stableHighlightedFields = highlightedFields || EMPTY_STRINGS

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [searchInput, setSearchInput] = useState(searchTerm || '')
  const [autoLayoutCounter, setAutoLayoutCounter] = useState(0)
  const [selectedField, setSelectedField] = useState<FieldSelection | null>(null)
  const [detailPosition, setDetailPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // In standalone mode (no onFieldClick), clicking fields shows the detail panel
  const isStandaloneMode = !onFieldClick
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [positionsLoaded, setPositionsLoaded] = useState(false)

  const SearchIcon = getIcon('search')
  const CloseIcon = getIcon('close')

  const effectiveSearchTerm = searchTerm !== undefined ? searchTerm : searchInput

  // Load saved positions from localStorage (once)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drizzle-cube-erd-node-positions')
      if (saved) setSavedPositions(JSON.parse(saved))
    } catch { /* ignore */ }
    setPositionsLoaded(true)
  }, [])

  // --- Structural data: only depends on meta (stable) ---
  // Separate structure (for layout) from presentation (highlights/search)

  const { structuralNodes, structuralEdges } = useMemo(() => {
    if (!meta) return { structuralNodes: [] as Node[], structuralEdges: [] as Edge[] }

    const nodes: Node[] = meta.cubes.map((cube, index) => ({
      id: cube.name,
      type: 'cubeNode',
      // Placeholder position — ELK will override for auto-layout
      position: { x: (index % 3) * 400, y: Math.floor(index / 3) * 300 },
      data: { cube },
    }))

    const edges: Edge[] = []
    meta.cubes.forEach(cube => {
      if (cube.relationships) {
        cube.relationships.forEach((rel, i) => {
          if (rel.relationship === 'belongsTo') return
          edges.push({
            id: `${cube.name}-${rel.targetCube}-${i}`,
            source: cube.name,
            target: rel.targetCube,
            type: 'relationshipEdge',
            data: { relationship: rel, joinFields: rel.joinFields || [] },
            animated: false,
            style: { stroke: getRelationshipColor(rel.relationship), strokeWidth: 2 },
          })
        })
      }
    })

    return { structuralNodes: nodes, structuralEdges: edges }
  }, [meta]) // Only meta — no highlights/search/callbacks

  // --- Layout decision ---
  const needsAutoLayout = autoLayoutCounter > 0 || (positionsLoaded && Object.keys(savedPositions).length === 0)

  // Run ELK layout (only when auto-layout needed, otherwise pass empty to skip)
  const { nodes: elkNodes, edges: elkEdges, phase: layoutPhase } = useERDLayout(
    needsAutoLayout ? structuralNodes : [],
    needsAutoLayout ? structuralEdges : [],
    { direction: 'LR', nodeWidth: 340, nodeSep: 150, rankSep: 350 }
  )

  // --- Build display data: merge layout positions + presentation data ---

  // Convert client coords to container-relative, clamped to keep panel in view
  const toContainerPos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: clientX, y: clientY }
    const panelW = 300, panelH = 200 // approximate panel size for clamping
    let x = clientX - rect.left + 12 // offset slightly right of cursor
    let y = clientY - rect.top + 12  // offset slightly below cursor
    // Clamp so panel doesn't overflow right/bottom
    if (x + panelW > rect.width) x = clientX - rect.left - panelW - 12
    if (y + panelH > rect.height) y = rect.height - panelH - 8
    if (x < 0) x = 8
    if (y < 0) y = 8
    return { x, y }
  }, [])

  // Internal field click handler for standalone mode
  const handleInternalFieldClick = useCallback((cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension', pos?: { x: number; y: number }) => {
    setSelectedField(prev => {
      if (prev && prev.cubeName === cubeName && prev.fieldName === fieldName) {
        setDetailPosition(null)
        return null
      }
      if (pos) setDetailPosition(toContainerPos(pos.x, pos.y))
      return { cubeName, fieldName, fieldType }
    })
  }, [toContainerPos])

  const handleInternalCubeClick = useCallback((cubeName: string, pos?: { x: number; y: number }) => {
    setSelectedField(prev => {
      if (prev && prev.cubeName === cubeName && prev.fieldName === null) {
        setDetailPosition(null)
        return null
      }
      if (pos) setDetailPosition(toContainerPos(pos.x, pos.y))
      return { cubeName, fieldName: null, fieldType: 'cube' }
    })
  }, [toContainerPos])

  const effectiveFieldClick = isStandaloneMode ? handleInternalFieldClick : onFieldClick
  const effectiveCubeClick = isStandaloneMode ? handleInternalCubeClick : undefined

  const buildNodeData = useCallback((cube: unknown) => ({
    cube,
    onFieldClick: effectiveFieldClick,
    onCubeClick: effectiveCubeClick,
    isHighlighted: stableHighlightedCubes.includes((cube as { name: string }).name),
    highlightedFields: stableHighlightedFields,
    searchTerm: effectiveSearchTerm,
    selectedField: isStandaloneMode ? selectedField : null,
  }), [effectiveFieldClick, effectiveCubeClick, stableHighlightedCubes, stableHighlightedFields, effectiveSearchTerm, isStandaloneMode, selectedField])

  // Determine if layout is resolved (ready to render ReactFlow)
  const layoutReady = !needsAutoLayout || layoutPhase === 'ready'

  const displayNodes = useMemo(() => {
    if (!meta || !layoutReady || !positionsLoaded) return []

    if (needsAutoLayout && elkNodes.length > 0) {
      // Use ELK-positioned nodes, inject presentation data
      return elkNodes.map(node => ({
        ...node,
        data: buildNodeData(node.data?.cube || meta.cubes.find(c => c.name === node.id)),
      }))
    }

    // Use saved positions
    return structuralNodes.map(node => ({
      ...node,
      position: savedPositions[node.id] || node.position,
      data: buildNodeData(node.data?.cube),
    }))
  }, [meta, layoutReady, positionsLoaded, needsAutoLayout, elkNodes, structuralNodes, savedPositions, buildNodeData])

  const displayEdges = useMemo(() => {
    if (!meta || !layoutReady) return []
    if (needsAutoLayout && elkEdges.length > 0) return elkEdges
    return structuralEdges
  }, [meta, layoutReady, needsAutoLayout, elkEdges, structuralEdges])

  // --- Controlled ReactFlow state ---
  const [rfNodes, setRfNodes] = useState<Node[]>([])
  const [rfEdges, setRfEdges] = useState<Edge[]>([])
  const appliedLayoutKeyRef = useRef('')
  const [fitViewToken, setFitViewToken] = useState(0) // increment to request fitView

  // Push layout to ReactFlow — only when positions change (not on data-only changes)
  useEffect(() => {
    if (displayNodes.length === 0) return

    const key = displayNodes.map(n => `${n.id}:${Math.round(n.position.x)},${Math.round(n.position.y)}`).join('|')
    if (key === appliedLayoutKeyRef.current) return

    const isFirstLayout = appliedLayoutKeyRef.current === ''
    appliedLayoutKeyRef.current = key
    setRfNodes(displayNodes)
    setRfEdges(displayEdges)

    // Request fitView on first layout
    if (isFirstLayout) {
      setFitViewToken(prev => prev + 1)
    }
  }, [displayNodes, displayEdges])

  // Update presentation data (highlights, search) without resetting positions
  const prevPresentationRef = useRef('')
  useEffect(() => {
    const selectedKey = selectedField ? `${selectedField.cubeName}.${selectedField.fieldName}` : ''
    const presentationKey = `${stableHighlightedCubes.join(',')}|${stableHighlightedFields.join(',')}|${effectiveSearchTerm}|${String(onFieldClick)}|${selectedKey}`
    if (presentationKey === prevPresentationRef.current) return
    prevPresentationRef.current = presentationKey

    if (rfNodes.length === 0 || !meta) return
    setRfNodes(prev => prev.map(node => {
      const cube = meta.cubes.find(c => c.name === node.id)
      if (!cube) return node
      return { ...node, data: buildNodeData(cube) }
    }))
  }, [stableHighlightedCubes, stableHighlightedFields, effectiveSearchTerm, onFieldClick, selectedField, rfNodes.length, meta, buildNodeData])

  // Handle node changes (dragging)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes(nds => applyNodeChanges(changes, nds))

    // Save positions on drag end
    const dragEnds = changes.filter(
      (c) => c.type === 'position' && 'dragging' in c && c.dragging === false
    )
    if (dragEnds.length > 0) {
      setRfNodes(currentNodes => {
        const positions: Record<string, { x: number; y: number }> = {}
        currentNodes.forEach(n => { if (n.position) positions[n.id] = n.position })
        try { localStorage.setItem('drizzle-cube-erd-node-positions', JSON.stringify(positions)) } catch { /* ignore */ }
        setSavedPositions(positions)
        return currentNodes
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEdgesChange = useCallback((_changes: EdgeChange[]) => {}, [])

  const handleContextMenu = useCallback((event: ReactMouseEvent | MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }, [])

  const handleClick = useCallback(() => {
    if (contextMenu) setContextMenu(null)
    if (selectedField) { setSelectedField(null); setDetailPosition(null) }
  }, [contextMenu, selectedField])

  const handleAutoLayout = useCallback(() => {
    setSavedPositions({})
    appliedLayoutKeyRef.current = '' // force re-apply → layout effect will request fitView
    try { localStorage.removeItem('drizzle-cube-erd-node-positions') } catch { /* ignore */ }
    setAutoLayoutCounter(c => c + 1)
    setContextMenu(null)
  }, [])

  // --- Render ---

  if (metaLoading) {
    return (
      <div className={`dc:flex dc:items-center dc:justify-center dc:h-96 ${className}`}>
        <div className="dc:text-center">
          <div className="dc:animate-spin dc:rounded-full dc:h-8 dc:w-8 dc:border-b-2 border-dc-accent dc:mx-auto dc:mb-2" />
          <p className="text-dc-text-muted">{t('schema.loading')}</p>
        </div>
      </div>
    )
  }

  if (metaError) {
    return (
      <div className={`dc:flex dc:items-center dc:justify-center dc:h-96 ${className}`}>
        <div className="dc:text-center text-dc-error">
          <p className="dc:font-medium">{t('schema.error')}</p>
          <p className="dc:text-sm dc:mt-1">{metaError}</p>
        </div>
      </div>
    )
  }

  if (!meta || meta.cubes.length === 0) {
    return (
      <div className={`dc:flex dc:items-center dc:justify-center dc:h-96 ${className}`}>
        <div className="dc:text-center text-dc-text-muted">
          <p className="dc:font-medium">{t('schema.noCubes')}</p>
          <p className="dc:text-sm dc:mt-1">{t('schema.noCubesHint')}</p>
        </div>
      </div>
    )
  }

  // Show loading while ELK computes layout (no grid flash)
  if (!layoutReady) {
    return (
      <div className={`dc:flex dc:items-center dc:justify-center dc:h-96 ${className}`}>
        <div className="dc:text-center">
          <div className="dc:animate-spin dc:rounded-full dc:h-8 dc:w-8 dc:border-b-2 border-dc-accent dc:mx-auto dc:mb-2" />
          <p className="text-dc-text-muted">{t('schema.computingLayout')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`dc:flex dc:flex-col ${className}`} style={{ height, minHeight: 400 }}>
      {searchTerm === undefined && (
        <div className="dc:px-3 dc:py-2 dc:border-b border-dc-border bg-dc-surface dc:flex dc:items-center dc:gap-2 dc:flex-shrink-0">
          <SearchIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('schema.searchPlaceholder')}
            className="dc:flex-1 dc:text-sm dc:bg-transparent dc:outline-none text-dc-text dc:placeholder:text-dc-text-muted"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="text-dc-text-muted dc:hover:text-dc-text">
              <CloseIcon className="dc:w-3 dc:h-3" />
            </button>
          )}
        </div>
      )}

      <div ref={containerRef} className="dc:relative dc:flex-1 dc:min-h-0">
        <div style={{ position: 'absolute', inset: 0 }}>
          <ReactFlowComponent
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={'loose' as never}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            onPaneContextMenu={handleContextMenu}
            onPaneClick={handleClick}
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => stableHighlightedCubes.includes(node.id) ? '#8b5cf6' : '#e5e7eb'}
              maskColor="rgb(240, 242, 246, 0.7)"
            />
            <Background variant={'dots' as never} gap={12} size={1} />
            <FitViewOnReady token={fitViewToken} />
          </ReactFlowComponent>
        </div>

        {/* Field detail panel for standalone browse mode */}
        {isStandaloneMode && selectedField && detailPosition && meta && (
          <div
            className="dc:absolute dc:z-20"
            style={{ left: detailPosition.x, top: detailPosition.y }}
          >
            <FieldDetailPanel
              selection={selectedField}
              meta={meta}
              onClose={() => { setSelectedField(null); setDetailPosition(null) }}
            />
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="dc:fixed dc:z-50 bg-dc-surface dc:rounded-md dc:shadow-lg dc:border border-dc-border dc:py-1 dc:min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleAutoLayout}
            className="dc:w-full dc:px-3 dc:py-2 dc:text-sm text-dc-text-secondary dc:hover:bg-dc-surface-hover dc:text-left"
          >
            {t('schema.autoLayout')}
          </button>
        </div>
      )}
    </div>
  )
}

export default SchemaVisualization
