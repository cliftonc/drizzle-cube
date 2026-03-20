import type { Edge, EdgeProps } from '@xyflow/react'
import type { CubeMetaRelationship } from '../../types'
import { useXyflow } from './xyflowContext'

interface RelationshipEdgeData {
  relationship: CubeMetaRelationship
  joinFields: Array<{
    sourceField: string
    targetField: string
  }>
  [key: string]: unknown
}

export type RelationshipEdgeType = Edge<RelationshipEdgeData, 'relationshipEdge'>

export function RelationshipEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<RelationshipEdgeType>) {
  const { getBezierPath, BaseEdge, EdgeLabelRenderer } = useXyflow()
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  if (!data) return null

  const { relationship, joinFields } = data

  const getSymbol = (rel: string) => {
    switch (rel) {
      case 'belongsTo': return '\u2208' // belongs to
      case 'hasOne': return '1:1'
      case 'hasMany': return '1:M'
      case 'belongsToMany': return 'M:M'
      default: return '?'
    }
  }

  const getColor = (rel: string) => {
    switch (rel) {
      case 'belongsTo': return '#10b981'
      case 'hasOne': return '#3b82f6'
      case 'hasMany': return '#f59e0b'
      case 'belongsToMany': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const color = getColor(relationship.relationship)
  const symbol = getSymbol(relationship.relationship)

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: color }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className="dc:border-2 dc:rounded-md dc:px-2 dc:py-1 dc:shadow-xs"
            style={{ backgroundColor: 'var(--dc-surface)', borderColor: color }}
          >
            <div className="dc:text-center">
              <div className="dc:font-bold dc:text-xs dc:mb-1" style={{ color }}>
                {symbol}
              </div>
              <div className="dc:text-[9px] text-dc-text-muted dc:leading-tight">
                {joinFields.map((field, index) => (
                  <div key={index} className="dc:font-mono">
                    {field.sourceField} → {field.targetField}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
