import { useCallback, useMemo, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useCubeContext } from '../../providers/CubeProvider'
import { CubeNode } from './CubeNode'
import { RelationshipEdge } from './RelationshipEdge'
import { useERDLayout } from './useERDLayout'

// Define the custom node and edge types OUTSIDE the component to prevent re-creation
const nodeTypes = {
  cubeNode: CubeNode,
}

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
}

interface CubeRelationshipDiagramProps {
  className?: string
  onCubeClick?: (cubeName: string) => void
  onFieldClick?: (cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension') => void
  highlightedCubes?: string[]
  highlightedFields?: string[]
  searchTerm?: string
}

export function CubeRelationshipDiagram({
  className = '',
  onCubeClick,
  onFieldClick,
  highlightedCubes = [],
  highlightedFields = [],
  searchTerm,
}: CubeRelationshipDiagramProps) {
  const { meta, metaLoading, metaError } = useCubeContext()

  const [savedPositions, setSavedPositions] = useState<Record<string, {x: number, y: number}>>({})
  const [autoLayoutRequested, setAutoLayoutRequested] = useState(false)
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null)

  // Load saved positions from localStorage on mount
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('drizzle-cube-erd-node-positions')
      if (savedPos) {
        setSavedPositions(JSON.parse(savedPos))
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }, [])

  // Create base nodes and edges structure (without selection data)
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    if (!meta) return { nodes: [], edges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Create nodes for each cube
    meta.cubes.forEach((cube, index) => {
      nodes.push({
        id: cube.name,
        type: 'cubeNode',
        position: savedPositions[cube.name] || { x: (index % 3) * 400, y: Math.floor(index / 3) * 300 },
        data: {
          cube,
          onCubeClick,
          onFieldClick,
          isHighlighted: false, // Will be updated separately
          highlightedFields: [], // Will be updated separately
        },
      })
    })

    // Create edges for relationships (excluding belongsTo)
    meta.cubes.forEach(cube => {
      if (cube.relationships) {
        cube.relationships.forEach((relationship, index) => {
          // Skip belongsTo relationships
          if (relationship.relationship === 'belongsTo') {
            return
          }
          
          const edgeId = `${cube.name}-${relationship.targetCube}-${index}`
          edges.push({
            id: edgeId,
            source: cube.name,
            target: relationship.targetCube,
            type: 'relationshipEdge',
            data: {
              relationship,
              joinFields: relationship.joinFields,
            },
            animated: false,
            style: {
              stroke: getRelationshipColor(relationship.relationship),
              strokeWidth: 2,
            },
          })
        })
      }
    })

    return { nodes, edges }
  }, [meta, onCubeClick, onFieldClick, savedPositions])

  // Apply auto-layout when explicitly requested or if no saved positions
  const needsAutoLayout = autoLayoutRequested || Object.keys(savedPositions).length === 0
  
  // Get auto-layout result
  const { nodes: autoLayoutedNodes, edges: autoLayoutedEdges } = useERDLayout(baseNodes, baseEdges, {
    direction: 'LR',
    nodeWidth: 320,
    nodeHeight: 220,
    nodeSep: 100,
    rankSep: 200
  })
  
  // Use auto-layout or base nodes based on needsAutoLayout, and update selection data
  const layoutedNodes = useMemo(() => {
    const nodes = needsAutoLayout ? autoLayoutedNodes : baseNodes
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: highlightedCubes.includes(node.id),
        highlightedFields: highlightedFields,
        searchTerm: searchTerm,
      }
    }))
  }, [needsAutoLayout, autoLayoutedNodes, baseNodes, highlightedCubes, highlightedFields, searchTerm])
  
  const layoutedEdges = needsAutoLayout ? autoLayoutedEdges : baseEdges
  
  // Reset auto-layout request and clear saved positions when auto-layout is applied
  useEffect(() => {
    if (autoLayoutRequested && layoutedNodes.length > 0) {
      // Clear saved positions so we use the new auto-layout positions
      setSavedPositions({})
      try {
        localStorage.removeItem('drizzle-cube-erd-node-positions')
      } catch (error) {
        // Ignore localStorage errors
      }
      setAutoLayoutRequested(false)
    }
  }, [autoLayoutRequested, layoutedNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)


  // Sync React Flow nodes with layout changes
  useEffect(() => {
    setNodes(layoutedNodes)
  }, [layoutedNodes, setNodes])

  // Sync React Flow edges with changes
  useEffect(() => {
    setEdges(layoutedEdges)
  }, [layoutedEdges, setEdges])

  // Save node positions to localStorage when manually moved
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)
    
    // Check if any nodes were dragged and save positions
    const dragChanges = changes.filter(change => change.type === 'position' && change.dragging === false)
    if (dragChanges.length > 0) {
      setNodes((currentNodes) => {
        const newPositions: Record<string, {x: number, y: number}> = {}
        currentNodes.forEach(node => {
          if (node.position) {
            newPositions[node.id] = node.position
          }
        })
        
        // Save to localStorage
        try {
          localStorage.setItem('drizzle-cube-erd-node-positions', JSON.stringify(newPositions))
        } catch (error) {
          // Ignore localStorage errors
        }
        
        setSavedPositions(newPositions)
        return currentNodes
      })
    }
  }, [onNodesChange, setNodes])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Handle right-click context menu
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Context menu triggered at:', event.clientX, event.clientY) // Debug
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  // Close context menu when clicking elsewhere
  const handleClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null)
    }
  }, [contextMenu])

  // Handle auto layout from context menu
  const handleAutoLayout = useCallback(() => {
    setAutoLayoutRequested(true)
    setContextMenu(null)
  }, [])


  // Loading state
  if (metaLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading cube schema...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (metaError) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-red-500">
          <p className="font-medium">Failed to load cube schema</p>
          <p className="text-sm mt-1">{metaError}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!meta || meta.cubes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="font-medium">No cubes found</p>
          <p className="text-sm mt-1">Register some cubes to see the relationship diagram</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full ${className}`} style={{ height: '600px' }}>
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView // Always fit view to show entire ERD
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
          onPaneContextMenu={handleContextMenu}
          onPaneClick={handleClick}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const isHighlighted = highlightedCubes.includes(node.id)
              return isHighlighted ? '#8b5cf6' : '#e5e7eb'
            }}
            maskColor="rgb(240, 242, 246, 0.7)"
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleAutoLayout}
            className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
          >
            Auto Layout
          </button>
        </div>
      )}
    </div>
  )
}

// Helper function to get relationship colors
function getRelationshipColor(relationship: 'belongsTo' | 'hasOne' | 'hasMany'): string {
  switch (relationship) {
    case 'belongsTo':
      return '#10b981' // green
    case 'hasOne':
      return '#3b82f6' // blue
    case 'hasMany':
      return '#f59e0b' // amber
    default:
      return '#6b7280' // gray
  }
}

export default CubeRelationshipDiagram