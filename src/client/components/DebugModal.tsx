import { useState, useEffect } from 'react'
import { highlightCodeBlocks } from '../utils/syntaxHighlighting'

interface DebugModalProps {
  chartConfig: any
  displayConfig: any
  queryObject: any
  data: any[]
  chartType: string
}

export default function DebugModal({ 
  chartConfig, 
  displayConfig, 
  queryObject, 
  data, 
  chartType 
}: DebugModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Trigger syntax highlighting when modal opens and content is rendered
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        highlightCodeBlocks().catch((err) => {
          console.debug('Syntax highlighting not available:', err)
        })
      }, 10)

      return () => clearTimeout(timer)
    }
  }, [isOpen])


  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 text-dc-text-muted hover:text-dc-text-secondary transition-colors"
        title="Debug chart configuration"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </button>
    )
  }

  return (
    <div
      className="absolute inset-0 bg-dc-surface border border-dc-border rounded-lg z-50 overflow-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-lg font-semibold text-dc-text">Chart Debug Information</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-dc-text-muted hover:text-dc-text-secondary hover:bg-dc-surface-secondary rounded-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
          <div>
            <h3 className="text-sm font-medium text-dc-text-secondary mb-2">Chart Type</h3>
            <div className="bg-dc-surface-secondary p-2 rounded-sm text-sm font-mono border border-dc-border">
              {chartType}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-dc-text-secondary mb-2">Field Analysis</h3>
            <div className="bg-dc-surface-secondary p-2 rounded-sm text-xs space-y-1 border border-dc-border">
              <div>
                <strong>xAxis:</strong> {Array.isArray(chartConfig?.xAxis) ? `Array: [${chartConfig.xAxis.join(', ')}]` : `String: "${chartConfig?.xAxis}"`}
              </div>
              <div>
                <strong>yAxis:</strong> {Array.isArray(chartConfig?.yAxis) ? `Array: [${chartConfig.yAxis.join(', ')}]` : `String: "${chartConfig?.yAxis}"`}
              </div>
              <div>
                <strong>series:</strong> {Array.isArray(chartConfig?.series) ? `Array: [${chartConfig.series.join(', ')}]` : `String: "${chartConfig?.series}"`}
              </div>
              {chartConfig?.sizeField && (
                <div>
                  <strong>sizeField:</strong> {Array.isArray(chartConfig?.sizeField) ? `Array: [${chartConfig.sizeField.join(', ')}]` : `String: "${chartConfig?.sizeField}"`}
                </div>
              )}
              {chartConfig?.colorField && (
                <div>
                  <strong>colorField:</strong> {Array.isArray(chartConfig?.colorField) ? `Array: [${chartConfig.colorField.join(', ')}]` : `String: "${chartConfig?.colorField}"`}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-medium text-dc-text-secondary mb-2">Chart Config</h3>
            <pre className="text-dc-text-secondary overflow-x-auto font-mono p-2 rounded-sm border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(chartConfig, null, 2)}</code>
            </pre>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-medium text-dc-text-secondary mb-2">Display Config</h3>
            <pre className="text-dc-text-secondary overflow-x-auto font-mono p-2 rounded-sm border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(displayConfig, null, 2)}</code>
            </pre>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-medium text-dc-text-secondary mb-2">Query Object</h3>
            <pre className="text-dc-text-secondary overflow-x-auto font-mono p-2 rounded-sm border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(queryObject, null, 2)}</code>
            </pre>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-medium text-dc-text-secondary mb-2">Data Sample (first 3 rows)</h3>
            <pre className="text-dc-text-secondary overflow-x-auto font-mono p-2 rounded-sm border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(data?.slice(0, 3) || [], null, 2)}</code>
            </pre>
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-dc-border text-xs text-dc-text-muted shrink-0">
          Press <kbd className="px-1 py-0.5 bg-dc-surface-secondary rounded-sm text-xs">ESC</kbd> to close
        </div>
      </div>
    </div>
  )
}