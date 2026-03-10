import { useState, useEffect, useRef, useMemo } from 'react'
import { Position, type Node, type Edge } from '@xyflow/react'

export interface LayoutOptions {
  direction: 'TB' | 'LR'
  nodeWidth: number
  nodeSep: number
  rankSep: number
}

export const defaultLayoutOptions: LayoutOptions = {
  direction: 'LR',
  nodeWidth: 340,
  nodeSep: 150,
  rankSep: 350,
}

/**
 * Layout state machine phases:
 *  waiting   → ELK not loaded yet, nothing to show
 *  computing → ELK loaded, running layout algorithm
 *  ready     → layout complete, node positions available
 */
export type LayoutPhase = 'waiting' | 'computing' | 'ready'

function getTargetPosition(direction: string): Position {
  switch (direction) {
    case 'TB': return Position.Top
    case 'LR': return Position.Left
    default: return Position.Top
  }
}

function getSourcePosition(direction: string): Position {
  switch (direction) {
    case 'TB': return Position.Bottom
    case 'LR': return Position.Right
    default: return Position.Bottom
  }
}

/**
 * Estimate the rendered pixel height of a CubeNode.
 */
function estimateNodeHeight(node: Node): number {
  const cube = node.data?.cube as {
    measures?: unknown[]
    dimensions?: { type?: string }[]
    description?: string
  } | undefined
  if (!cube) return 300

  const HEADER = cube.description ? 80 : 56
  const SECTION_HEADER = 36
  const ROW = 34
  const MAX_BODY = 256
  const PADDING = 30

  let h = HEADER
  const measures = cube.measures?.length ?? 0
  const timeDims = cube.dimensions?.filter((d) => d.type === 'time').length ?? 0
  const regularDims = cube.dimensions?.filter((d) => d.type !== 'time').length ?? 0

  if (measures > 0) h += SECTION_HEADER + Math.min(measures * ROW, MAX_BODY)
  if (timeDims > 0) h += SECTION_HEADER + Math.min(timeDims * ROW, MAX_BODY)
  if (regularDims > 0) h += SECTION_HEADER + Math.min(regularDims * ROW, MAX_BODY)

  return h + PADDING
}

// --- ELK singleton (module-level, loaded once) ---

interface ELKInstance {
  layout(graph: unknown): Promise<unknown>
}

let elkInstance: ELKInstance | null = null

const elkLoadPromise: Promise<ELKInstance | null> = import('elkjs/lib/elk.bundled.js')
  .then((mod) => {
    const ELK = (mod as unknown as { default?: new () => ELKInstance }).default || mod
    elkInstance = new (ELK as unknown as new () => ELKInstance)()
    return elkInstance
  })
  .catch(() => null)

// Force-export to prevent tree shaking of the side-effectful import
export { elkLoadPromise as _elkLoadPromise }

// --- ELK layout computation (pure async function, no hooks) ---

interface ElkPort {
  id: string
  layoutOptions: Record<string, string>
}

interface ElkNode {
  id: string
  width: number
  height: number
  layoutOptions?: Record<string, string>
  ports?: ElkPort[]
}

interface ElkEdge {
  id: string
  sources: string[]
  targets: string[]
}

interface ElkResultNode { id: string; x: number; y: number }

interface ElkResult {
  children?: ElkResultNode[]
}

export interface ElkLayoutResult {
  nodes: Node[]
  edges: Edge[]
}

async function computeElkLayout(
  nodes: Node[],
  edges: Edge[],
  opts: LayoutOptions,
): Promise<ElkLayoutResult> {
  // Ensure ELK is loaded (await the singleton promise)
  await elkLoadPromise
  if (!elkInstance) {
    // ELK failed to load — return grid fallback
    return { nodes: layoutWithGrid(nodes, opts), edges }
  }

  const sourceSide = opts.direction === 'LR' ? 'EAST' : 'SOUTH'
  const targetSide = opts.direction === 'LR' ? 'WEST' : 'NORTH'

  // Per-edge ports so ELK spreads connections along the node side
  const nodeSourceEdges = new Map<string, string[]>()
  const nodeTargetEdges = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!nodeSourceEdges.has(edge.source)) nodeSourceEdges.set(edge.source, [])
    nodeSourceEdges.get(edge.source)!.push(edge.id)
    if (!nodeTargetEdges.has(edge.target)) nodeTargetEdges.set(edge.target, [])
    nodeTargetEdges.get(edge.target)!.push(edge.id)
  })

  const elkNodes: ElkNode[] = nodes.map((node) => {
    const w = opts.nodeWidth
    const h = estimateNodeHeight(node)

    const srcEdges = nodeSourceEdges.get(node.id) || []
    const tgtEdges = nodeTargetEdges.get(node.id) || []
    const ports: ElkPort[] = [
      ...srcEdges.map(edgeId => ({
        id: `${node.id}__src__${edgeId}`,
        layoutOptions: { 'elk.port.side': sourceSide },
      })),
      ...tgtEdges.map(edgeId => ({
        id: `${node.id}__tgt__${edgeId}`,
        layoutOptions: { 'elk.port.side': targetSide },
      })),
    ]

    return {
      id: node.id,
      width: w,
      height: h,
      layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
      ports,
    }
  })

  const elkEdges: ElkEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [`${edge.source}__src__${edge.id}`],
    targets: [`${edge.target}__tgt__${edge.id}`],
  }))

  const elkDirection = opts.direction === 'LR' ? 'RIGHT' : 'DOWN'

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': elkDirection,
      'elk.edgeRouting': 'SPLINES',
      'elk.layered.edgeRouting.splines.mode': 'CONSERVATIVE',
      'elk.spacing.nodeNode': String(opts.nodeSep),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(opts.rankSep),
      'elk.spacing.edgeNode': '60',
      'elk.layered.spacing.edgeNodeBetweenLayers': '60',
      'elk.spacing.edgeEdge': '25',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: elkNodes,
    edges: elkEdges,
  }

  const result = await elkInstance.layout(graph) as ElkResult

  // Extract node positions (ELK returns top-left, same as React Flow)
  const positionMap = new Map<string, { x: number; y: number }>()
  if (result.children) {
    for (const child of result.children) {
      positionMap.set(child.id, { x: child.x, y: child.y })
    }
  }

  const layoutedNodes = nodes.map((node) => ({
    ...node,
    position: positionMap.get(node.id) || node.position,
    targetPosition: getTargetPosition(opts.direction),
    sourcePosition: getSourcePosition(opts.direction),
  }))

  // Return positioned nodes + original edges.
  // Edge rendering is handled by React Flow's getBezierPath() which knows
  // the actual handle positions — much more accurate than ELK's spline routes.
  return { nodes: layoutedNodes, edges }
}

function layoutWithGrid(nodes: Node[], opts: LayoutOptions): Node[] {
  const COL_HEIGHT_LIMIT = 1200
  let col = 0
  let colY = 0

  return nodes.map((node) => {
    const h = estimateNodeHeight(node)
    if (colY + h > COL_HEIGHT_LIMIT && colY > 0) {
      col++
      colY = 0
    }
    const position = { x: col * (opts.nodeWidth + opts.nodeSep), y: colY }
    colY += h + 40

    return {
      ...node,
      position,
      sourcePosition: getSourcePosition(opts.direction),
      targetPosition: getTargetPosition(opts.direction),
    }
  })
}

// --- Hook: single computation per structure key, no races ---

/**
 * Layout hook with explicit state machine.
 *
 * - Waits for ELK to load (phase: 'waiting')
 * - Runs layout once per unique node/edge structure (phase: 'computing')
 * - Returns stable result (phase: 'ready')
 *
 * The effect only depends on a string structure key, NOT object references.
 * This prevents re-renders from cancelling in-flight computations.
 */
export function useERDLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[]; phase: LayoutPhase } {
  const opts = useMemo(
    () => ({ ...defaultLayoutOptions, ...options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.direction, options.nodeWidth, options.nodeSep, options.rankSep]
  )

  // Stable structure key — only changes when node/edge IDs change
  const structureKey = useMemo(() => {
    if (nodes.length === 0) return ''
    return nodes.map(n => n.id).sort().join(',') + '|' + edges.map(e => e.id).sort().join(',')
  }, [nodes, edges])

  // Refs hold latest values so the effect closure always reads current data
  // without needing them as dependencies
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const optsRef = useRef(opts)
  nodesRef.current = nodes
  edgesRef.current = edges
  optsRef.current = opts

  const [phase, setPhase] = useState<LayoutPhase>('waiting')
  const [result, setResult] = useState<ElkLayoutResult | null>(null)
  const [resultKey, setResultKey] = useState('')

  // Single computation per structure key
  const computeIdRef = useRef(0)

  useEffect(() => {
    if (!structureKey) {
      setPhase('ready')
      setResult(null)
      setResultKey('')
      return
    }

    const id = ++computeIdRef.current
    setPhase('computing')

    computeElkLayout(nodesRef.current, edgesRef.current, optsRef.current)
      .then(layoutResult => {
        // Only apply if this is still the latest computation
        if (id !== computeIdRef.current) return
        setResult(layoutResult)
        setResultKey(structureKey)
        setPhase('ready')
      })
      .catch(() => {
        if (id !== computeIdRef.current) return
        // On error, use grid fallback
        setResult({
          nodes: layoutWithGrid(nodesRef.current, optsRef.current),
          edges: edgesRef.current,
        })
        setResultKey(structureKey)
        setPhase('ready')
      })
  }, [structureKey]) // ONLY depends on structure key — no object refs

  // Output: only return layout when it matches current structure
  if (phase === 'ready' && result && resultKey === structureKey) {
    return { nodes: result.nodes, edges: result.edges, phase: 'ready' }
  }

  return { nodes: [], edges: [], phase }
}
