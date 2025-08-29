import { useReactFlow } from 'reactflow'

interface ERDControlsProps {
  onLayoutChange?: (layout: 'auto' | 'manual') => void
  onAutoLayout?: () => void
  currentLayout?: 'auto' | 'manual'
}

export function ERDControls({ 
  onAutoLayout
}: ERDControlsProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  const handleFitView = () => {
    fitView({ padding: 0.1, duration: 300 })
  }


  return (
    <div className="flex items-center gap-1 bg-white rounded-md shadow-sm border border-gray-200 px-2 py-1">
      <button
        onClick={handleFitView}
        className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Fit to view"
      >
        Fit
      </button>
      
      <button
        onClick={() => zoomIn()}
        className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Zoom in"
      >
        Zoom+
      </button>
      
      <button
        onClick={() => zoomOut()}
        className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Zoom out"
      >
        Zoom-
      </button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      <button
        onClick={() => {
          if (onAutoLayout) {
            onAutoLayout()
          }
        }}
        className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Apply automatic layout"
      >
        Auto Layout
      </button>
    </div>
  )
}

export default ERDControls