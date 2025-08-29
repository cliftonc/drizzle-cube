import { useMemo } from 'react'
import { Node, Edge, Position } from 'reactflow'
import dagre from 'dagre'

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL'
  nodeWidth: number
  nodeHeight: number
  nodeSep: number
  rankSep: number
  ranker: 'network-simplex' | 'tight-tree' | 'longest-path'
}

const defaultOptions: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 320,
  nodeHeight: 220,
  nodeSep: 80,
  rankSep: 150,
  ranker: 'network-simplex',
}

export function useERDLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node[], edges: Edge[] } {
  const layoutOptions = useMemo(() => ({ ...defaultOptions, ...options }), [options])

  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    if (nodes.length === 0) {
      return { layoutedNodes: [], layoutedEdges: [] }
    }

    // Create a new dagre graph
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ 
      rankdir: layoutOptions.direction,
      nodesep: layoutOptions.nodeSep,
      ranksep: layoutOptions.rankSep,
      ranker: layoutOptions.ranker,
    })

    // Add nodes to the graph
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { 
        width: layoutOptions.nodeWidth, 
        height: layoutOptions.nodeHeight 
      })
    })

    // Add edges to the graph
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })

    // Run the layout algorithm
    dagre.layout(dagreGraph)

    // Apply the calculated positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      
      const newNode = {
        ...node,
        targetPosition: getTargetPosition(layoutOptions.direction),
        sourcePosition: getSourcePosition(layoutOptions.direction),
        position: {
          x: nodeWithPosition.x - layoutOptions.nodeWidth / 2,
          y: nodeWithPosition.y - layoutOptions.nodeHeight / 2,
        },
      }

      return newNode
    })

    return { 
      layoutedNodes, 
      layoutedEdges: edges 
    }
  }, [nodes, edges, layoutOptions.direction, layoutOptions.nodeSep, layoutOptions.rankSep, layoutOptions.ranker, layoutOptions.nodeWidth, layoutOptions.nodeHeight])

  return { nodes: layoutedNodes, edges: layoutedEdges }
}

// Helper functions to determine handle positions based on layout direction
function getTargetPosition(direction: string): Position {
  switch (direction) {
    case 'TB':
      return Position.Top
    case 'BT':
      return Position.Bottom
    case 'LR':
      return Position.Left
    case 'RL':
      return Position.Right
    default:
      return Position.Top
  }
}

function getSourcePosition(direction: string): Position {
  switch (direction) {
    case 'TB':
      return Position.Bottom
    case 'BT':
      return Position.Top
    case 'LR':
      return Position.Right
    case 'RL':
      return Position.Left
    default:
      return Position.Bottom
  }
}

// Custom layout function for manual positioning with smart defaults
export function useManualLayout(
  nodes: Node[],
  edges: Edge[],
  spacing = { x: 400, y: 300 }
): { nodes: Node[], edges: Edge[] } {
  return useMemo(() => {
    if (nodes.length === 0) {
      return { nodes: [], edges }
    }

    // Simple grid layout as fallback
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * spacing.x,
        y: Math.floor(index / 3) * spacing.y,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }))

    return { nodes: layoutedNodes, edges }
  }, [nodes, edges, spacing])
}

export default useERDLayout