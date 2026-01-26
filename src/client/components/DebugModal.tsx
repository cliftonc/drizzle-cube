import { useState, useEffect } from 'react'
import { highlightCodeBlocks } from '../utils/syntaxHighlighting'
import type { FlowChartData } from '../types/flow'
import type { RetentionChartData } from '../types/retention'

interface DebugModalProps {
  chartConfig: any
  displayConfig: any
  queryObject: any
  data: any[] | FlowChartData | RetentionChartData
  chartType: string
  cacheInfo?: { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | null
}

export default function DebugModal({
  chartConfig,
  displayConfig,
  queryObject,
  data,
  chartType,
  cacheInfo
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
        className="dc:p-1 text-dc-text-muted hover:text-dc-text-secondary dc:transition-colors"
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
      className="dc:absolute dc:inset-0 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:z-50 dc:overflow-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="dc:p-4 dc:h-full dc:flex dc:flex-col">
        <div className="dc:flex dc:justify-between dc:items-center dc:mb-4 dc:shrink-0">
          <h2 className="dc:text-lg dc:font-semibold text-dc-text">Chart Debug Information</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="dc:p-2 text-dc-text-muted hover:text-dc-text-secondary hover:bg-dc-surface-secondary dc:rounded-sm"
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

        <div className="dc:grid dc:grid-cols-1 dc:lg:grid-cols-2 dc:gap-4 dc:flex-1 dc:overflow-auto">
          <div>
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Chart Type</h3>
            <div className="bg-dc-surface-secondary dc:p-2 dc:rounded-sm dc:text-sm font-mono dc:border border-dc-border">
              {chartType}
            </div>
          </div>

          <div>
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Field Analysis</h3>
            <div className="bg-dc-surface-secondary dc:p-2 dc:rounded-sm dc:text-xs dc:space-y-1 dc:border border-dc-border">
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

          <div className="dc:lg:col-span-2">
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Chart Config</h3>
            <pre className="text-dc-text-secondary dc:overflow-x-auto font-mono dc:p-2 dc:rounded-sm dc:border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(chartConfig, null, 2)}</code>
            </pre>
          </div>

          <div className="dc:lg:col-span-2">
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Display Config</h3>
            <pre className="text-dc-text-secondary dc:overflow-x-auto font-mono dc:p-2 dc:rounded-sm dc:border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(displayConfig, null, 2)}</code>
            </pre>
          </div>

          <div className="dc:lg:col-span-2">
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Query Object</h3>
            <pre className="text-dc-text-secondary dc:overflow-x-auto font-mono dc:p-2 dc:rounded-sm dc:border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">{JSON.stringify(queryObject, null, 2)}</code>
            </pre>
          </div>

          <div className="dc:lg:col-span-2">
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Data Sample (first 3 rows)</h3>
            <pre className="text-dc-text-secondary dc:overflow-x-auto font-mono dc:p-2 dc:rounded-sm dc:border border-dc-border" style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <code className="language-json">
                {JSON.stringify(Array.isArray(data) ? data.slice(0, 3) : data, null, 2)}
              </code>
            </pre>
          </div>

          <div className="dc:lg:col-span-2">
            <h3 className="dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">Cache Status</h3>
            <div className="bg-dc-surface-secondary dc:p-2 dc:rounded-sm dc:text-xs dc:border border-dc-border">
              {cacheInfo ? (
                <div className="dc:flex dc:items-center dc:gap-4 dc:flex-wrap">
                  <span className="dc:inline-flex dc:items-center dc:px-2 dc:py-0.5 dc:rounded-sm dc:text-xs dc:font-medium bg-dc-success-bg text-dc-success">
                    Cache Hit
                  </span>
                  <span><strong>Cached At:</strong> {new Date(cacheInfo.cachedAt).toLocaleString()}</span>
                  <span><strong>TTL:</strong> {Math.round(cacheInfo.ttlMs / 1000)}s</span>
                  <span><strong>TTL Remaining:</strong> {Math.round(cacheInfo.ttlRemainingMs / 1000)}s</span>
                </div>
              ) : (
                <div className="dc:flex dc:items-center dc:gap-2">
                  <span className="dc:inline-flex dc:items-center dc:px-2 dc:py-0.5 dc:rounded-sm dc:text-xs dc:font-medium bg-dc-surface text-dc-text-muted dc:border border-dc-border">
                    Fresh Query
                  </span>
                  <span className="text-dc-text-muted">Result not served from cache</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dc:mt-4 dc:pt-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted dc:shrink-0">
          Press <kbd className="dc:px-1 dc:py-0.5 bg-dc-surface-secondary dc:rounded-sm dc:text-xs">ESC</kbd> to close
        </div>
      </div>
    </div>
  )
}
