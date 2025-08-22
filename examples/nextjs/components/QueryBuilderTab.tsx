'use client'

import { QueryBuilder } from 'drizzle-cube/client'

export default function QueryBuilderTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Query Builder
        </h2>
        <p className="text-sm text-gray-600">
          Build custom queries using the interactive query builder
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <QueryBuilder 
          baseUrl="/api/cubejs-api/v1"
        />
      </div>
    </div>
  )
}