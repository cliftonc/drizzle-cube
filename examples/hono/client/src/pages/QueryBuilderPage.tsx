/**
 * Query Builder Page
 * 
 * Demonstrates the QueryBuilder component in the Hono example application.
 */

import { QueryBuilder } from 'drizzle-cube/client'

export default function QueryBuilderPage() {
  const cubeApiUrl = '/cubejs-api/v1'

  return (
    <div className="-m-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/20 px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Query Builder</h1>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          Build and test queries against your cube schema. Select dimensions, measures, and time dimensions 
          from the schema explorer, then validate and run your queries to see results.
        </p>
      </div>

      {/* Query Builder - Responsive height for mobile */}
      <div className="flex-1 min-h-[calc(100vh-12rem)] sm:min-h-[calc(100vh-10rem)] lg:min-h-[800px]">
        <QueryBuilder 
          baseUrl={cubeApiUrl}
        />
      </div>
    </div>
  )
}