import { 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow'
import type { CubeMetaRelationship } from '../../hooks/useCubeMeta'

interface RelationshipEdgeData {
  relationship: CubeMetaRelationship
  joinFields: Array<{
    sourceField: string
    targetField: string
  }>
}

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
}: EdgeProps<RelationshipEdgeData>) {
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

  // Get relationship symbols and colors
  const getRelationshipSymbol = (rel: string) => {
    switch (rel) {
      case 'belongsTo':
        return '∈' // belongs to symbol
      case 'hasOne':
        return '1:1'
      case 'hasMany':
        return '1:M'
      default:
        return '?'
    }
  }

  const getRelationshipColor = (rel: string) => {
    switch (rel) {
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

  const color = getRelationshipColor(relationship.relationship)
  const symbol = getRelationshipSymbol(relationship.relationship)

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
            className="bg-white border-2 rounded-md px-2 py-1 shadow-sm"
            style={{ borderColor: color }}
          >
            <div className="text-center">
              <div 
                className="font-bold text-xs mb-1"
                style={{ color }}
              >
                {symbol}
              </div>
              <div className="text-[9px] text-gray-600 leading-tight">
                {joinFields.map((field, index) => (
                  <div key={index} className="font-mono">
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

export default RelationshipEdge