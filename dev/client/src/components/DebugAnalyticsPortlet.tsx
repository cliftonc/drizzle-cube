import React from 'react'
import { useCubeLoadQuery } from '@drizzle-cube/client'
import { JsonBlock, useDirectApiTest, LoadQueryResult, DirectApiResult } from './DebugAnalyticsParts'

interface DebugAnalyticsPortletProps {
  query: string
  title: string
}

export default function DebugAnalyticsPortlet({ query, title }: DebugAnalyticsPortletProps) {
  const parsedQuery = React.useMemo(() => {
    try {
      return JSON.parse(query)
    } catch (e) {
      return { error: 'Invalid query JSON' }
    }
  }, [query])

  const networkTest = useDirectApiTest(parsedQuery)

  const { resultSet, error, isLoading, isFetching } = useCubeLoadQuery(parsedQuery)

  console.log('useCubeLoadQuery result:', { resultSet, error, isLoading, isFetching, parsedQuery })

  return (
    <div className="border p-4 bg-white rounded-xs">
      <h3 className="font-bold mb-2">{title}</h3>

      <div className="text-xs space-y-2">
        <JsonBlock label="Query:" value={parsedQuery} bg="bg-gray-100" extra="overflow-auto" />

        <LoadQueryResult
          resultSet={resultSet}
          error={error}
          isLoading={isLoading}
          isFetching={isFetching}
        />

        <DirectApiResult networkTest={networkTest} />
      </div>
    </div>
  )
}
