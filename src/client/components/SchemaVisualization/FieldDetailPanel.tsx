import type { ReactNode } from 'react'
import type { CubeMetaCube, CubeMetaMeasure, CubeMetaDimension } from '../../types'
import { getIcon } from '../../icons'

export interface FieldSelection {
  cubeName: string
  fieldName: string | null // null = cube-level selection
  fieldType: 'measure' | 'dimension' | 'cube'
}

interface FieldDetailPanelProps {
  selection: FieldSelection
  meta: { cubes: CubeMetaCube[] }
  onClose: () => void
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="dc:flex dc:items-start dc:gap-2 dc:text-xs">
      <span className="text-dc-text-muted dc:w-20 dc:flex-shrink-0 dc:font-medium">{label}</span>
      <span className="text-dc-text dc:flex-1 dc:min-w-0">{children}</span>
    </div>
  )
}

function TypeBadge({ type, color }: { type: string; color: string }) {
  return (
    <span
      className="dc:inline-flex dc:items-center dc:px-1.5 dc:py-0.5 dc:rounded dc:text-[10px] dc:font-medium dc:uppercase"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, var(--dc-surface))`, color }}
    >
      {type}
    </span>
  )
}

function MeasureDetail({ measure, cube }: { measure: CubeMetaMeasure; cube: CubeMetaCube }) {
  const typeColor = {
    count: '#f59e0b',
    countDistinct: '#f59e0b',
    countDistinctApprox: '#f59e0b',
    sum: '#10b981',
    avg: '#3b82f6',
    min: '#8b5cf6',
    max: '#ec4899',
    runningTotal: '#06b6d4',
    number: '#6b7280',
  }[measure.type] || '#6b7280'

  return (
    <div className="dc:flex dc:flex-col dc:gap-2">
      <DetailRow label="Cube">{cube.title || cube.name}</DetailRow>
      <DetailRow label="Type"><TypeBadge type={measure.type} color={typeColor} /></DetailRow>
      {measure.title && measure.title !== measure.shortTitle && (
        <DetailRow label="Title">{measure.title}</DetailRow>
      )}
      {measure.drillMembers && measure.drillMembers.length > 0 && (
        <DetailRow label="Drill into">
          <div className="dc:flex dc:flex-wrap dc:gap-1">
            {measure.drillMembers.map(dm => (
              <span key={dm} className="dc:font-mono dc:text-[10px] dc:px-1 dc:py-0.5 dc:rounded bg-dc-surface-secondary border-dc-border dc:border">
                {dm.split('.')[1] || dm}
              </span>
            ))}
          </div>
        </DetailRow>
      )}
    </div>
  )
}

function DimensionDetail({ dimension, cube }: { dimension: CubeMetaDimension; cube: CubeMetaCube }) {
  const typeColor = dimension.type === 'time' ? '#3b82f6' : '#10b981'

  // Find hierarchies this dimension belongs to
  const hierarchies = cube.hierarchies?.filter(h =>
    h.levels.some(l => l === dimension.name || l === `${cube.name}.${dimension.name.split('.')[1]}`)
  ) || []

  return (
    <div className="dc:flex dc:flex-col dc:gap-2">
      <DetailRow label="Cube">{cube.title || cube.name}</DetailRow>
      <DetailRow label="Type"><TypeBadge type={dimension.type} color={typeColor} /></DetailRow>
      {dimension.title && dimension.title !== dimension.shortTitle && (
        <DetailRow label="Title">{dimension.title}</DetailRow>
      )}
      {dimension.type === 'time' && dimension.granularities && dimension.granularities.length > 0 && (
        <DetailRow label="Granularity">
          <div className="dc:flex dc:flex-wrap dc:gap-1">
            {dimension.granularities.map(g => (
              <span key={g} className="dc:font-mono dc:text-[10px] dc:px-1 dc:py-0.5 dc:rounded bg-dc-surface-secondary border-dc-border dc:border">
                {g}
              </span>
            ))}
          </div>
        </DetailRow>
      )}
      {hierarchies.length > 0 && (
        <DetailRow label="Hierarchy">
          {hierarchies.map(h => (
            <div key={h.name} className="dc:text-[10px]">
              <span className="dc:font-medium">{h.title}</span>
              <span className="text-dc-text-muted dc:ml-1">
                ({h.levels.map(l => l.split('.')[1] || l).join(' > ')})
              </span>
            </div>
          ))}
        </DetailRow>
      )}
    </div>
  )
}

function CubeDetail({ cube }: { cube: CubeMetaCube }) {
  const relationshipColors: Record<string, string> = {
    belongsTo: '#10b981',
    hasOne: '#3b82f6',
    hasMany: '#f59e0b',
    belongsToMany: '#8b5cf6',
  }

  return (
    <div className="dc:flex dc:flex-col dc:gap-2">
      {cube.description && (
        <DetailRow label="Description">{cube.description}</DetailRow>
      )}
      <DetailRow label="Measures">
        <span className="dc:font-mono">{cube.measures.length}</span>
        {cube.measures.length > 0 && (
          <span className="text-dc-text-muted dc:ml-1">
            ({[...new Set(cube.measures.map(m => m.type))].join(', ')})
          </span>
        )}
      </DetailRow>
      <DetailRow label="Dimensions">
        <span className="dc:font-mono">{cube.dimensions.length}</span>
        {cube.dimensions.some(d => d.type === 'time') && (
          <span className="text-dc-text-muted dc:ml-1">
            ({cube.dimensions.filter(d => d.type === 'time').length} time)
          </span>
        )}
      </DetailRow>
      {cube.relationships && cube.relationships.length > 0 && (
        <DetailRow label="Joins">
          <div className="dc:flex dc:flex-col dc:gap-1">
            {cube.relationships.map((rel, i) => (
              <div key={i} className="dc:flex dc:items-center dc:gap-1.5 dc:text-[10px]">
                <TypeBadge type={rel.relationship} color={relationshipColors[rel.relationship] || '#6b7280'} />
                <span className="dc:font-mono">{rel.targetCube}</span>
              </div>
            ))}
          </div>
        </DetailRow>
      )}
      {cube.hierarchies && cube.hierarchies.length > 0 && (
        <DetailRow label="Hierarchies">
          <div className="dc:flex dc:flex-col dc:gap-1">
            {cube.hierarchies.map(h => (
              <div key={h.name} className="dc:text-[10px]">
                <span className="dc:font-medium">{h.title}</span>
                <span className="text-dc-text-muted dc:ml-1">
                  ({h.levels.map(l => l.split('.')[1] || l).join(' > ')})
                </span>
              </div>
            ))}
          </div>
        </DetailRow>
      )}
      {cube.meta?.eventStream && (
        <DetailRow label="Event Stream">
          <div className="dc:text-[10px]">
            <span className="text-dc-text-muted">binding: </span>
            <span className="dc:font-mono">{cube.meta.eventStream.bindingKey.split('.')[1] || cube.meta.eventStream.bindingKey}</span>
            <span className="text-dc-text-muted dc:ml-2">time: </span>
            <span className="dc:font-mono">{cube.meta.eventStream.timeDimension.split('.')[1] || cube.meta.eventStream.timeDimension}</span>
          </div>
        </DetailRow>
      )}
    </div>
  )
}

export function FieldDetailPanel({ selection, meta, onClose }: FieldDetailPanelProps) {
  const CloseIcon = getIcon('close')

  const cube = meta.cubes.find(c => c.name === selection.cubeName)
  if (!cube) return null

  // Determine what to show
  let title: string
  let dotColor: string
  let sectionBgColor: string
  let content: ReactNode

  if (selection.fieldType === 'cube' || !selection.fieldName) {
    title = cube.title || cube.name
    dotColor = 'var(--dc-accent)'
    sectionBgColor = 'color-mix(in srgb, var(--dc-accent) 10%, var(--dc-surface))'
    content = <CubeDetail cube={cube} />
  } else if (selection.fieldType === 'measure') {
    const measure = cube.measures.find(m => {
      const mField = m.name.split('.')[1] || m.name
      return mField === selection.fieldName || m.name === selection.fieldName
    })
    if (!measure) return null
    title = measure.shortTitle || measure.title || selection.fieldName
    dotColor = 'var(--dc-warning)'
    sectionBgColor = 'color-mix(in srgb, var(--dc-warning) 10%, var(--dc-surface))'
    content = <MeasureDetail measure={measure} cube={cube} />
  } else {
    const dimension = cube.dimensions.find(d => {
      const dField = d.name.split('.')[1] || d.name
      return dField === selection.fieldName || d.name === selection.fieldName
    })
    if (!dimension) return null
    title = dimension.shortTitle || dimension.title || selection.fieldName
    dotColor = dimension.type === 'time' ? 'var(--dc-accent)' : 'var(--dc-success)'
    sectionBgColor = dimension.type === 'time'
      ? 'color-mix(in srgb, var(--dc-accent) 10%, var(--dc-surface))'
      : 'color-mix(in srgb, var(--dc-success) 10%, var(--dc-surface))'
    content = <DimensionDetail dimension={dimension} cube={cube} />
  }

  return (
    <div
      className="dc:border-2 dc:rounded-lg dc:shadow-lg dc:min-w-[260px] dc:max-w-[320px] dc:overflow-hidden dc:transition-all border-dc-border"
      style={{ backgroundColor: 'var(--dc-surface)' }}
    >
      {/* Header - same style as CubeNode section headers */}
      <div
        className="dc:px-4 dc:py-2.5 dc:border-b border-dc-border dc:flex dc:items-center dc:justify-between"
        style={{ backgroundColor: sectionBgColor }}
      >
        <div className="dc:flex dc:items-center dc:gap-2 dc:min-w-0">
          <span
            className="dc:w-2 dc:h-2 dc:rounded-full dc:flex-shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:truncate">{title}</h4>
        </div>
        <button
          onClick={onClose}
          className="dc:ml-2 dc:flex-shrink-0 text-dc-text-muted dc:hover:text-dc-text dc:transition-colors"
        >
          <CloseIcon className="dc:w-3.5 dc:h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="dc:px-4 dc:py-3">
        {content}
      </div>
    </div>
  )
}
