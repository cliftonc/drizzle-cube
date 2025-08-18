/**
 * Query Builder Page
 * 
 * Demonstrates the QueryBuilder component in the Hono example application.
 */

import { QueryBuilder } from 'drizzle-cube/client'

export default function QueryBuilderPage() {
  const cubeApiUrl = '/cubejs-api/v1'

  return (
    <div className="-m-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Query Builder</h1>
        <p className="mt-1 text-sm text-gray-600">
          Build and test queries against your cube schema. Select dimensions, measures, and time dimensions 
          from the schema explorer, then validate and run your queries to see results.
        </p>
      </div>

      {/* Query Builder - Full remaining height */}
      <div className="flex-1 min-h-0">
        <QueryBuilder 
          baseUrl={cubeApiUrl}
          onQueryChange={(query) => {
            // Optional: Log query changes for debugging
            console.log('Query changed:', query)
          }}
        />
      </div>
    </div>
  )
}