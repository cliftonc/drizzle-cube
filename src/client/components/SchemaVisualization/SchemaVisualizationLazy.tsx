/**
 * Lazy-loaded SchemaVisualization with graceful fallback
 * when @xyflow/react is not installed.
 */

import { lazy, Suspense } from 'react'
import type { SchemaVisualizationProps } from './index'

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
  try {
    const mod = await import('./index')
    return { default: mod.SchemaVisualization }
  } catch {
    loadFailed = true
    return { default: MissingDependencyFallback }
  }
})

export function SchemaVisualizationLazy(props: SchemaVisualizationProps) {
  if (loadFailed) {
    return <MissingDependencyFallback {...props} />
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LazySchemaVisualization {...props} />
    </Suspense>
  )
}

export function isSchemaVisualizationAvailable(): boolean {
  return !loadFailed
}
