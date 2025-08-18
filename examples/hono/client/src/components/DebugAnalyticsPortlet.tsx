import React from 'react'
import { useCubeQuery } from 'drizzle-cube/client'

interface DebugAnalyticsPortletProps {
  query: string
  title: string
}

export default function DebugAnalyticsPortlet({ query, title }: DebugAnalyticsPortletProps) {
  const [networkTest, setNetworkTest] = React.useState<any>(null)
  
  const parsedQuery = React.useMemo(() => {
    try {
      return JSON.parse(query)
    } catch (e) {
      return { error: 'Invalid query JSON' }
    }
  }, [query])

  // Test direct API call
  React.useEffect(() => {
    const testQuery = async () => {
      try {
        const response = await fetch('/cubejs-api/v1/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: parsedQuery })
        })
        const result = await response.json()
        setNetworkTest({ success: true, data: result })
      } catch (err) {
        setNetworkTest({ success: false, error: err })
      }
    }
    
    if (parsedQuery && !parsedQuery.error) {
      testQuery()
    }
  }, [parsedQuery])

  const { resultSet, error, isLoading } = useCubeQuery(parsedQuery)
  
  console.log('useCubeQuery result:', { resultSet, error, isLoading, parsedQuery })

  return (
    <div className="border p-4 bg-white rounded">
      <h3 className="font-bold mb-2">{title}</h3>
      
      <div className="text-xs space-y-2">
        <div>
          <strong>Query:</strong>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(parsedQuery, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>useCubeQuery Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        
        {error && (
          <div>
            <strong>useCubeQuery Error:</strong>
            <pre className="bg-red-100 p-2 rounded text-xs text-red-700">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
        
        {resultSet && (
          <div>
            <strong>useCubeQuery Data:</strong>
            <pre className="bg-green-100 p-2 rounded text-xs max-h-40 overflow-auto">
              {JSON.stringify(resultSet, null, 2)}
            </pre>
          </div>
        )}
        
        {!isLoading && !error && !resultSet && (
          <div className="text-gray-500">
            useCubeQuery: No data returned
          </div>
        )}
        
        {networkTest && (
          <div>
            <strong>Direct API Test:</strong>
            {networkTest.success ? (
              <pre className="bg-blue-100 p-2 rounded text-xs max-h-40 overflow-auto">
                {JSON.stringify(networkTest.data, null, 2)}
              </pre>
            ) : (
              <pre className="bg-red-100 p-2 rounded text-xs text-red-700">
                {JSON.stringify(networkTest.error, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}