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
    <div className="flex items-center gap-1 bg-dc-surface rounded-md shadow-xs border border-dc-border px-2 py-1">
      <button
        onClick={handleFitView}
        className="px-2 py-1 text-xs text-dc-text-secondary hover:bg-dc-surface-hover rounded-sm transition-colors"
        title="Fit to view"
      >
        Fit
      </button>

      <button
        onClick={() => zoomIn()}
        className="px-2 py-1 text-xs text-dc-text-secondary hover:bg-dc-surface-hover rounded-sm transition-colors"
        title="Zoom in"
      >
        Zoom+
      </button>

      <button
        onClick={() => zoomOut()}
        className="px-2 py-1 text-xs text-dc-text-secondary hover:bg-dc-surface-hover rounded-sm transition-colors"
        title="Zoom out"
      >
        Zoom-
      </button>

      <div className="w-px h-4 bg-dc-border mx-1"></div>

      <button
        onClick={() => {
          if (onAutoLayout) {
            onAutoLayout()
          }
        }}
        className="px-2 py-1 text-xs text-dc-text-secondary hover:bg-dc-surface-hover rounded-sm transition-colors"
        title="Apply automatic layout"
      >
        Auto Layout
      </button>
    </div>
  )
}

export default ERDControls