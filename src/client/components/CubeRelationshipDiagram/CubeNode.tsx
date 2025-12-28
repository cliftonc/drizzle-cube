import { Handle, Position } from 'reactflow'
import type { CubeMetaCube } from '../../hooks/useCubeMeta'

interface CubeNodeProps {
  data: {
    cube: CubeMetaCube
    onCubeClick?: (cubeName: string) => void
    onFieldClick?: (cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension') => void
    isHighlighted: boolean
    highlightedFields: string[]
    searchTerm?: string
  }
}

export function CubeNode({ data }: CubeNodeProps) {
  const { cube, onFieldClick, isHighlighted, highlightedFields, searchTerm } = data

  const handleCubeHeaderClick = () => {
    // Do nothing - disable cube header clicks in ERD
  }

  const handleFieldClick = (fieldName: string, fieldType: 'measure' | 'dimension') => {
    if (onFieldClick) {
      onFieldClick(cube.name, fieldName, fieldType)
    }
  }

  const isFieldHighlighted = (fullFieldName: string) => {
    return highlightedFields.includes(fullFieldName)
  }

  const isFieldSearchMatch = (field: { name: string; title?: string }) => {
    if (!searchTerm?.trim()) return true // No search term, show all fields
    
    const term = searchTerm.toLowerCase()
    return (
      field.name.toLowerCase().includes(term) ||
      (field.title && field.title.toLowerCase().includes(term))
    )
  }

  // Check if the cube has any matching fields
  const cubeHasMatches = () => {
    if (!searchTerm?.trim()) return true // No search term, show all cubes normally
    
    // Check if any measure matches
    const measureMatches = cube.measures.some(measure => isFieldSearchMatch(measure))
    
    // Check if any dimension matches
    const dimensionMatches = cube.dimensions.some(dimension => isFieldSearchMatch(dimension))
    
    return measureMatches || dimensionMatches
  }

  const hasCubeMatches = cubeHasMatches()

  const getFieldVisibilityClasses = (field: { name: string; title?: string; type?: string }, isHighlighted: boolean, fieldType: 'measure' | 'dimension') => {
    const isSearchMatch = isFieldSearchMatch(field)
    const baseClasses = 'px-4 py-2 text-xs cursor-pointer transition-all border-b border-dc-border last:border-b-0'

    // If the whole cube has no matches, rely on cube-level fading
    if (!hasCubeMatches && searchTerm?.trim()) {
      // Still show selected field highlighting even in faded cubes
      if (isHighlighted) {
        if (fieldType === 'measure') {
          return `${baseClasses} bg-dc-warning-bg text-dc-warning`
        } else if (fieldType === 'dimension') {
          if (field.type === 'time') {
            return `${baseClasses} bg-dc-accent-bg text-dc-accent`
          } else {
            return `${baseClasses} bg-dc-success-bg text-dc-success`
          }
        }
      }
      return `${baseClasses} hover:bg-dc-surface-hover text-dc-text-secondary`
    }

    // If searching and this specific field doesn't match, make it faded
    if (searchTerm?.trim() && !isSearchMatch) {
      return `${baseClasses} opacity-40 hover:opacity-60 text-dc-text-muted`
    }

    // If searching and this field matches, make it prominent with bold purple text
    if (searchTerm?.trim() && isSearchMatch && !isHighlighted) {
      return `${baseClasses} font-bold hover:bg-dc-accent-bg`
    }

    // Normal highlighting behavior for selected fields (takes priority over search match styling)
    if (isHighlighted) {
      if (fieldType === 'measure') {
        return `${baseClasses} bg-dc-warning-bg text-dc-warning font-semibold`
      } else if (fieldType === 'dimension') {
        // Check if this is a time dimension
        if (field.type === 'time') {
          return `${baseClasses} bg-dc-accent-bg text-dc-accent font-semibold` // time dimensions
        } else {
          return `${baseClasses} bg-dc-success-bg text-dc-success font-semibold` // regular dimensions
        }
      }
    }

    return `${baseClasses} hover:bg-dc-surface-hover text-dc-text-secondary`
  }

  return (
    <div
      className={`
        border-2 rounded-lg shadow-lg min-w-[280px] overflow-hidden transition-all
        ${!hasCubeMatches && searchTerm?.trim() ? 'opacity-30 grayscale' : ''}
        ${isHighlighted ? 'border-dc-accent ring-2 ring-dc-accent' : 'border-dc-border'}
      `}
      style={{
        backgroundColor: 'var(--dc-surface)'
      }}
    >
      {/* Cube Header */}
      <div
        className={`
          px-4 py-3 cursor-pointer transition-colors
          ${isHighlighted ? 'bg-dc-accent-bg hover:bg-dc-accent-bg' : 'bg-dc-surface-secondary hover:bg-dc-surface-hover'}
        `}
        onClick={handleCubeHeaderClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-dc-text text-sm">
              {cube.title || cube.name}
            </h3>
            {cube.description && (
              <p className="text-xs text-dc-text-muted mt-1 line-clamp-2">
                {cube.description}
              </p>
            )}
          </div>
          <div className="text-xs text-dc-text-muted ml-2">
            <div>{cube.measures.length}M</div>
            <div>{cube.dimensions.length}D</div>
          </div>
        </div>
      </div>

      {/* Measures Section */}
      {cube.measures.length > 0 && (
        <div className="border-t border-dc-border">
          <div className="px-4 py-2 bg-dc-warning-bg border-b border-dc-border">
            <h4 className="text-xs font-medium text-dc-warning flex items-center">
              <span className="w-2 h-2 bg-dc-warning-bg0 rounded-full mr-2"></span>
              Measures ({cube.measures.length})
            </h4>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {cube.measures.map((measure) => {
              const fieldName = measure.name.split('.')[1] || measure.name
              const highlighted = isFieldHighlighted(measure.name)
              return (
                <div
                  key={measure.name}
                  className={getFieldVisibilityClasses(measure, highlighted, 'measure')}
                  onClick={() => handleFieldClick(fieldName, 'measure')}
                  title={measure.title}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono truncate">
                      {measure.shortTitle || measure.title || fieldName}
                    </span>
                    <span className="text-dc-text-muted ml-2 text-[10px] uppercase">
                      {measure.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Time Dimensions Section */}
      {cube.dimensions.filter(d => d.type === 'time').length > 0 && (
        <div className="border-t border-dc-border">
          <div className="px-4 py-2 bg-dc-accent-bg border-b border-dc-border">
            <h4 className="text-xs font-medium text-dc-accent flex items-center">
              <span className="w-2 h-2 bg-dc-accent-bg0 rounded-full mr-2"></span>
              Time Dimensions ({cube.dimensions.filter(d => d.type === 'time').length})
            </h4>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {cube.dimensions.filter(d => d.type === 'time').map((dimension) => {
              const fieldName = dimension.name.split('.')[1] || dimension.name
              const highlighted = isFieldHighlighted(dimension.name)
              return (
                <div
                  key={dimension.name}
                  className={getFieldVisibilityClasses(dimension, highlighted, 'dimension')}
                  onClick={() => handleFieldClick(fieldName, 'dimension')}
                  title={dimension.title}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono truncate">
                      {dimension.shortTitle || dimension.title || fieldName}
                    </span>
                    <span className="text-dc-text-muted ml-2 text-[10px] uppercase">
                      {dimension.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dimensions Section (non-time) */}
      {cube.dimensions.filter(d => d.type !== 'time').length > 0 && (
        <div className="border-t border-dc-border">
          <div className="px-4 py-2 bg-dc-success-bg border-b border-dc-border">
            <h4 className="text-xs font-medium text-dc-success flex items-center">
              <span className="w-2 h-2 bg-dc-success-bg0 rounded-full mr-2"></span>
              Dimensions ({cube.dimensions.filter(d => d.type !== 'time').length})
            </h4>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {cube.dimensions.filter(d => d.type !== 'time').map((dimension) => {
              const fieldName = dimension.name.split('.')[1] || dimension.name
              const highlighted = isFieldHighlighted(dimension.name)
              return (
                <div
                  key={dimension.name}
                  className={getFieldVisibilityClasses(dimension, highlighted, 'dimension')}
                  onClick={() => handleFieldClick(fieldName, 'dimension')}
                  title={dimension.title}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono truncate">
                      {dimension.shortTitle || dimension.title || fieldName}
                    </span>
                    <span className="text-dc-text-muted ml-2 text-[10px] uppercase">
                      {dimension.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Connection handles for relationships - hidden */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0"
        isConnectable={false}
      />
    </div>
  )
}

export default CubeNode