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
    const baseClasses = 'px-4 py-2 text-xs cursor-pointer transition-all border-b border-gray-100 last:border-b-0'
    
    // If the whole cube has no matches, rely on cube-level fading
    if (!hasCubeMatches && searchTerm?.trim()) {
      // Still show selected field highlighting even in faded cubes
      if (isHighlighted) {
        if (fieldType === 'measure') {
          return `${baseClasses} bg-amber-100 text-amber-800`
        } else if (fieldType === 'dimension') {
          if (field.type === 'time') {
            return `${baseClasses} bg-blue-100 text-blue-800`
          } else {
            return `${baseClasses} bg-green-100 text-green-800`
          }
        }
      }
      return `${baseClasses} hover:bg-gray-50 text-gray-700`
    }
    
    // If searching and this specific field doesn't match, make it faded
    if (searchTerm?.trim() && !isSearchMatch) {
      return `${baseClasses} opacity-40 hover:opacity-60 text-gray-400`
    }
    
    // If searching and this field matches, make it prominent with bold purple text
    if (searchTerm?.trim() && isSearchMatch && !isHighlighted) {
      return `${baseClasses} text-purple-700 font-bold hover:bg-purple-50`
    }
    
    // Normal highlighting behavior for selected fields (takes priority over search match styling)
    if (isHighlighted) {
      if (fieldType === 'measure') {
        return `${baseClasses} bg-amber-100 text-amber-800 font-semibold`
      } else if (fieldType === 'dimension') {
        // Check if this is a time dimension
        if (field.type === 'time') {
          return `${baseClasses} bg-blue-100 text-blue-800 font-semibold` // time dimensions
        } else {
          return `${baseClasses} bg-green-100 text-green-800 font-semibold` // regular dimensions
        }
      }
    }
    
    return `${baseClasses} hover:bg-gray-50 text-gray-700`
  }

  return (
    <div 
      className={`
        bg-white border-2 rounded-lg shadow-lg min-w-[280px] overflow-hidden transition-all
        ${!hasCubeMatches && searchTerm?.trim() ? 'opacity-30 grayscale' : ''}
        ${isHighlighted ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'}
      `}
    >
      {/* Cube Header */}
      <div 
        className={`
          px-4 py-3 cursor-pointer transition-colors
          ${isHighlighted ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-50 hover:bg-gray-100'}
        `}
        onClick={handleCubeHeaderClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {cube.title || cube.name}
            </h3>
            {cube.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {cube.description}
              </p>
            )}
          </div>
          <div className="text-xs text-gray-500 ml-2">
            <div>{cube.measures.length}M</div>
            <div>{cube.dimensions.length}D</div>
          </div>
        </div>
      </div>

      {/* Measures Section */}
      {cube.measures.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="px-4 py-2 bg-amber-50 border-b border-gray-200">
            <h4 className="text-xs font-medium text-amber-800 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
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
                    <span className="text-gray-500 ml-2 text-[10px] uppercase">
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
        <div className="border-t border-gray-200">
          <div className="px-4 py-2 bg-blue-50 border-b border-gray-200">
            <h4 className="text-xs font-medium text-blue-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
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
                    <span className="text-gray-500 ml-2 text-[10px] uppercase">
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
        <div className="border-t border-gray-200">
          <div className="px-4 py-2 bg-green-50 border-b border-gray-200">
            <h4 className="text-xs font-medium text-green-800 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
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
                    <span className="text-gray-500 ml-2 text-[10px] uppercase">
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