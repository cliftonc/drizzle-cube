/**
 * Analysis Builder Page
 *
 * Demonstrates the AnalysisBuilder component with:
 * - Results panel on the left (chart + table)
 * - Query builder panel on the right
 * - Search-based field selection via modal
 * - Metrics (measures), Breakdown (dimensions), Filters sections
 */

import { AnalysisBuilder } from '@drizzle-cube/client'

export default function AnalysisBuilderPage() {
  return (
    <div className="-m-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-dc-border px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dc-text">Analysis Builder</h1>
        <p className="mt-1 text-sm text-dc-text-secondary leading-relaxed">
          A modern query builder with search-based field selection. Build analytics queries with
          Metrics (measures), Breakdowns (dimensions), and Filters. Results appear instantly as you build.
        </p>
        <div className="mt-4 px-4 py-3 bg-dc-info-bg border border-dc-info-border rounded-lg shadow-md">
          <div className="flex items-start">
            <span className="text-2xl mr-3">🧪</span>
            <div>
              <p className="text-sm font-semibold text-dc-info">
                Experimental Component
              </p>
              <p className="text-sm text-dc-text-secondary mt-1">
                This page demonstrates the{' '}
                <a
                  href="https://github.com/cliftonc/drizzle-cube/blob/main/src/client/components/AnalysisBuilder/index.tsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-dc-primary"
                >
                  <code className="px-1 py-0.5 bg-dc-muted-bg rounded-sm text-xs font-mono">
                    AnalysisBuilder
                  </code>
                </a>{' '}
                component - a redesigned query builder inspired by modern analytics tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Builder - Fixed height */}
      <div className="flex-1">
        <AnalysisBuilder maxHeight="calc(100vh - 220px)" />
      </div>
    </div>
  )
}
