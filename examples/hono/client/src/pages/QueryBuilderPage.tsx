/**
 * Query Builder Page
 * 
 * Demonstrates the QueryBuilder component in the Hono example application.
 */

import { QueryBuilder } from 'drizzle-cube/client'

export default function QueryBuilderPage() {
  return (
    <div className="-m-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/20 px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Query Builder</h1>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          Build and test queries against your cube schema. Select dimensions, measures, and time dimensions 
          from the schema explorer, then validate and run your queries to see results.
        </p>
        <div className="mt-4 px-4 py-3 bg-gradient-to-br from-purple-50 via-violet-50 to-pink-50 border border-purple-200/50 rounded-lg shadow-md shadow-purple-100/50">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <p className="text-sm font-semibold text-purple-900">
                Demo Note
              </p>
              <p className="text-sm text-purple-700 mt-1">
                This page demonstrates the <a href="https://github.com/cliftonc/drizzle-cube/blob/main/src/client/components/QueryBuilder/index.tsx" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-800"><code className="px-1 py-0.5 bg-purple-100 rounded text-xs font-mono">QueryBuilder</code></a> React component from drizzle-cube/client that you can embed in your own application.
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