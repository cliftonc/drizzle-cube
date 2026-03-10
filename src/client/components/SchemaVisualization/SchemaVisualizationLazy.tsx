/**
 * Lazy-loaded SchemaVisualization with graceful fallback
 * when @xyflow/react is not installed.
 *
 * All @xyflow/react imports are dynamic here so the built chunk
 * has NO static imports from @xyflow/react. This prevents consuming
 * projects from failing at build time when xyflow is not installed.
 */

import { lazy, Suspense, useState, useEffect } from 'react'
import type { SchemaVisualizationProps } from './index'
import { XyflowProvider } from './xyflowContext'
import type { XyflowModule } from './xyflowContext'

let loadFailed = false

function MissingDependencyFallback(_props: SchemaVisualizationProps) {
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:h-full dc:p-8">
      <div className="dc:text-center dc:max-w-md">
        <div className="dc:text-4xl dc:mb-4">&#128269;</div>
        <h3 className="dc:text-lg dc:font-semibold text-dc-text dc:mb-2">
          Schema Visualization requires additional packages
        </h3>
        <p className="dc:text-sm text-dc-text-secondary dc:mb-4">
          Install the required dependencies to enable the interactive schema diagram:
        </p>
        <code className="dc:block dc:px-4 dc:py-2 dc:rounded bg-dc-surface-secondary dc:text-sm dc:font-mono text-dc-text dc:border border-dc-border">
          npm install @xyflow/react elkjs
        </code>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
      <div className="dc:text-center">
        <div className="dc:animate-spin dc:rounded-full dc:h-8 dc:w-8 dc:border-b-2 border-dc-accent dc:mx-auto dc:mb-2" />
        <p className="dc:text-sm text-dc-text-muted">Loading schema visualization...</p>
      </div>
    </div>
  )
}

const LazySchemaVisualization = lazy(async () => {
  const mod = await import('./index')
  return { default: mod.SchemaVisualization }
})

export function SchemaVisualizationLazy(props: SchemaVisualizationProps) {
  const [xyflow, setXyflow] = useState<XyflowModule | null>(null)
  const [failed, setFailed] = useState(loadFailed)

  useEffect(() => {
    if (loadFailed) return
    let cancelled = false

    import('@xyflow/react')
      .then((mod) => {
        if (!cancelled) setXyflow(mod)
      })
      .catch(() => {
        loadFailed = true
        if (!cancelled) setFailed(true)
      })

    return () => { cancelled = true }
  }, [])

  if (failed) {
    return <MissingDependencyFallback {...props} />
  }

  if (!xyflow) {
    return <LoadingFallback />
  }

  return (
    <XyflowProvider value={xyflow}>
      <Suspense fallback={<LoadingFallback />}>
        <LazySchemaVisualization {...props} />
      </Suspense>
    </XyflowProvider>
  )
}

export function isSchemaVisualizationAvailable(): boolean {
  return !loadFailed
}
