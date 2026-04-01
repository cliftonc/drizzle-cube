import type { MouseEvent } from 'react'
import type { CubeMetaCube } from '../../types'
import { getIcon } from '../../icons'
import { useXyflow } from './xyflowContext'
import { useTranslation } from '../../hooks/useTranslation'

interface CubeNodeData {
  cube: CubeMetaCube
  onFieldClick?: (cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension', pos?: { x: number; y: number }) => void
  onCubeClick?: (cubeName: string, pos?: { x: number; y: number }) => void
  isHighlighted: boolean
  highlightedFields: string[]
  searchTerm?: string
  selectedField?: { cubeName: string; fieldName: string | null } | null
  [key: string]: unknown
}

interface CubeNodeProps {
  data: CubeNodeData
}

export function CubeNode({ data }: CubeNodeProps) {
  const { t } = useTranslation()
  const { Handle, Position } = useXyflow()
  const { cube, onFieldClick, onCubeClick, isHighlighted, highlightedFields, searchTerm, selectedField } = data

  const handleFieldClick = (e: MouseEvent, fieldName: string, fieldType: 'measure' | 'dimension') => {
    if (onFieldClick) {
      onFieldClick(cube.name, fieldName, fieldType, { x: e.clientX, y: e.clientY })
    }
  }

  const InfoIcon = getIcon('info')

  const handleCubeInfoClick = (e: MouseEvent) => {
    e.stopPropagation() // don't start drag
    if (onCubeClick) {
      onCubeClick(cube.name, { x: e.clientX, y: e.clientY })
    }
  }

  const isFieldSelected = (fieldName: string) => {
    if (!selectedField) return false
    return selectedField.cubeName === cube.name && selectedField.fieldName === fieldName
  }

  const isCubeSelected = selectedField?.cubeName === cube.name && selectedField?.fieldName === null

  const isFieldHighlighted = (fullFieldName: string) => {
    return highlightedFields.includes(fullFieldName)
  }

  const isFieldSearchMatch = (field: { name: string; title?: string }) => {
    if (!searchTerm?.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      field.name.toLowerCase().includes(term) ||
      (field.title && field.title.toLowerCase().includes(term))
    )
  }

  const cubeHasMatches = () => {
    if (!searchTerm?.trim()) return true
    return cube.measures.some(m => isFieldSearchMatch(m)) ||
           cube.dimensions.some(d => isFieldSearchMatch(d))
  }

  const hasCubeMatches = cubeHasMatches()

  const getFieldClasses = (
    field: { name: string; title?: string; type?: string },
    highlighted: boolean,
    _fieldType: 'measure' | 'dimension'
  ) => {
    const fieldName = field.name.split('.')[1] || field.name
    const selected = isFieldSelected(fieldName)
    const base = 'dc:px-4 dc:py-2 dc:text-xs dc:cursor-pointer dc:transition-all dc:border-b border-dc-border last:dc:border-b-0 nodrag nopan'

    if (selected) {
      return `${base} bg-dc-accent-bg text-dc-accent dc:font-semibold dc:ring-1 dc:ring-inset ring-dc-accent`
    }

    if (!hasCubeMatches && searchTerm?.trim()) {
      if (highlighted) return `${base} bg-dc-accent-bg text-dc-accent dc:font-semibold`
      return `${base} dc:hover:bg-dc-surface-hover text-dc-text-secondary`
    }

    if (searchTerm?.trim() && !isFieldSearchMatch(field)) {
      return `${base} dc:opacity-40 dc:hover:opacity-60 text-dc-text-muted`
    }

    if (searchTerm?.trim() && isFieldSearchMatch(field) && !highlighted) {
      return `${base} dc:font-bold dc:hover:bg-dc-accent-bg`
    }

    if (highlighted) {
      return `${base} bg-dc-accent-bg text-dc-accent dc:font-semibold`
    }

    return `${base} dc:hover:bg-dc-surface-hover text-dc-text-secondary`
  }

  const timeDimensions = cube.dimensions.filter(d => d.type === 'time')
  const regularDimensions = cube.dimensions.filter(d => d.type !== 'time')

  return (
    <div
      className={`
        dc:border-2 dc:rounded-lg dc:shadow-lg dc:min-w-[280px] dc:overflow-hidden dc:transition-all
        ${!hasCubeMatches && searchTerm?.trim() ? 'dc:opacity-30 dc:grayscale' : ''}
        ${isHighlighted ? 'border-dc-accent dc:ring-2 ring-dc-accent' : 'border-dc-border'}
      `}
      style={{ backgroundColor: 'var(--dc-surface)' }}
    >
      {/* Cube Header */}
      <div className={`dc:px-4 dc:py-3 dc:transition-colors ${
        isHighlighted ? 'bg-dc-accent-bg' : 'bg-dc-surface-secondary'
      }`}>
        <div className="dc:flex dc:items-center dc:justify-between">
          <div>
            <h3 className="dc:font-semibold text-dc-text dc:text-sm">
              {cube.title || cube.name}
            </h3>
            {cube.description && (
              <p className="dc:text-xs text-dc-text-muted dc:mt-1 dc:line-clamp-2">{cube.description}</p>
            )}
          </div>
          {onCubeClick && (
            <button
              className={`dc:ml-2 dc:p-1 dc:rounded dc:transition-colors nodrag nopan ${
                isCubeSelected
                  ? 'bg-dc-accent-bg text-dc-accent'
                  : 'text-dc-text-muted dc:hover:text-dc-text dc:hover:bg-dc-surface-hover'
              }`}
              onClick={handleCubeInfoClick}
              title={t('schema.cubeInfo')}
            >
              <InfoIcon className="dc:w-5 dc:h-5" />
            </button>
          )}
          {!onCubeClick && (
            <div className="dc:text-xs text-dc-text-muted dc:ml-2">
              <div>{cube.measures.length}M</div>
              <div>{cube.dimensions.length}D</div>
            </div>
          )}
        </div>
      </div>

      {/* Measures */}
      {cube.measures.length > 0 && (
        <div className="dc:border-t border-dc-border">
          <div className="dc:px-4 dc:py-1.5 dc:border-b border-dc-border" style={{ backgroundColor: 'color-mix(in srgb, var(--dc-warning) 10%, var(--dc-surface))' }}>
            <h4 className="dc:text-xs dc:font-medium text-dc-text-secondary dc:flex dc:items-center">
              <span className="dc:w-2 dc:h-2 bg-dc-warning dc:rounded-full dc:mr-2" />
              {t('schema.measures', { count: cube.measures.length })}
            </h4>
          </div>
          <div className="dc:max-h-64 dc:overflow-y-auto nowheel">
            {cube.measures.map((measure) => {
              const fieldName = measure.name.split('.')[1] || measure.name
              const highlighted = isFieldHighlighted(measure.name)
              return (
                <div
                  key={measure.name}
                  className={getFieldClasses(measure, highlighted, 'measure')}
                  onClick={(e) => handleFieldClick(e, fieldName, 'measure')}
                  title={measure.title}
                >
                  <div className="dc:flex dc:items-center dc:justify-between">
                    <span className="dc:font-mono dc:truncate">
                      {measure.shortTitle || measure.title || fieldName}
                    </span>
                    <span className="text-dc-text-muted dc:ml-2 dc:text-[10px] dc:uppercase">
                      {measure.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Time Dimensions */}
      {timeDimensions.length > 0 && (
        <div className="dc:border-t border-dc-border">
          <div className="dc:px-4 dc:py-1.5 dc:border-b border-dc-border" style={{ backgroundColor: 'color-mix(in srgb, var(--dc-accent) 10%, var(--dc-surface))' }}>
            <h4 className="dc:text-xs dc:font-medium text-dc-text-secondary dc:flex dc:items-center">
              <span className="dc:w-2 dc:h-2 bg-dc-accent dc:rounded-full dc:mr-2" />
              {t('schema.timeDimensions', { count: timeDimensions.length })}
            </h4>
          </div>
          <div className="dc:max-h-64 dc:overflow-y-auto nowheel">
            {timeDimensions.map((dimension) => {
              const fieldName = dimension.name.split('.')[1] || dimension.name
              const highlighted = isFieldHighlighted(dimension.name)
              return (
                <div
                  key={dimension.name}
                  className={getFieldClasses(dimension, highlighted, 'dimension')}
                  onClick={(e) => handleFieldClick(e, fieldName, 'dimension')}
                  title={dimension.title}
                >
                  <div className="dc:flex dc:items-center dc:justify-between">
                    <span className="dc:font-mono dc:truncate">
                      {dimension.shortTitle || dimension.title || fieldName}
                    </span>
                    <span className="text-dc-text-muted dc:ml-2 dc:text-[10px] dc:uppercase">
                      {dimension.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Regular Dimensions */}
      {regularDimensions.length > 0 && (
        <div className="dc:border-t border-dc-border">
          <div className="dc:px-4 dc:py-1.5 dc:border-b border-dc-border" style={{ backgroundColor: 'color-mix(in srgb, var(--dc-success) 10%, var(--dc-surface))' }}>
            <h4 className="dc:text-xs dc:font-medium text-dc-text-secondary dc:flex dc:items-center">
              <span className="dc:w-2 dc:h-2 bg-dc-success dc:rounded-full dc:mr-2" />
              {t('schema.dimensions', { count: regularDimensions.length })}
            </h4>
          </div>
          <div className="dc:max-h-64 dc:overflow-y-auto nowheel">
            {regularDimensions.map((dimension) => {
              const fieldName = dimension.name.split('.')[1] || dimension.name
              const highlighted = isFieldHighlighted(dimension.name)
              return (
                <div
                  key={dimension.name}
                  className={getFieldClasses(dimension, highlighted, 'dimension')}
                  onClick={(e) => handleFieldClick(e, fieldName, 'dimension')}
                  title={dimension.title}
                >
                  <div className="dc:flex dc:items-center dc:justify-between">
                    <span className="dc:font-mono dc:truncate">
                      {dimension.shortTitle || dimension.title || fieldName}
                    </span>
                    <span className="text-dc-text-muted dc:ml-2 dc:text-[10px] dc:uppercase">
                      {dimension.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Connection handles - hidden */}
      <Handle type="source" position={Position.Right} id="right" className="dc:opacity-0" isConnectable={false} />
      <Handle type="target" position={Position.Left} id="left" className="dc:opacity-0" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} id="bottom" className="dc:opacity-0" isConnectable={false} />
      <Handle type="target" position={Position.Top} id="top" className="dc:opacity-0" isConnectable={false} />
    </div>
  )
}
