/**
 * Query Builder Page
 * 
 * Demonstrates the QueryBuilder component in the Hono example application.
 */

import { QueryBuilder } from '@drizzle-cube/client'

export default function QueryBuilderPage() {
  return (
    <div className="-m-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-dc-border px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dc-text">Query Builder</h1>
        <p className="mt-1 text-sm text-dc-text-secondary leading-relaxed">
          Build and test queries against your cube schema. Select dimensions, measures, and time dimensions
          from the schema explorer, then validate and run your queries to see results.
        </p>
        <div className="mt-4 px-4 py-3 bg-dc-info-bg border border-dc-info-border rounded-lg shadow-md">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <p className="text-sm font-semibold text-dc-info">
                Demo Note
              </p>
              <p className="text-sm text-dc-text-secondary mt-1">
                This page demonstrates the <a href="https://github.com/cliftonc/drizzle-cube/blob/main/src/client/components/QueryBuilder/index.tsx" target="_blank" rel="noopener noreferrer" className="underline hover:text-dc-primary"><code className="px-1 py-0.5 bg-dc-muted-bg rounded-sm text-xs font-mono">QueryBuilder</code></a> React component from drizzle-cube/client that you can embed in your own application.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Query Builder - Responsive height for mobile */}
      <div className="flex-1 min-h-[calc(100vh-12rem)] sm:min-h-[calc(100vh-10rem)] lg:min-h-[800px]">
        <QueryBuilder />
      </div>
    </div>
  )
}