/**
 * Presentational helpers for DebugAnalyticsPortlet.
 *
 * Extracted to flatten the portlet: each labelled JSON block is the same markup
 * with a different colour, and the direct-API network probe is a self-contained
 * hook.
 */
import React from 'react'

interface JsonBlockProps {
  label: string
  value: unknown
  /** Tailwind background class for the <pre> block. */
  bg: string
  /** Extra classes (e.g. text colour, max height). */
  extra?: string
}

/** A labelled, syntax-highlighted JSON block. */
export function JsonBlock({ label, value, bg, extra = '' }: JsonBlockProps) {
  return (
    <div>
      <strong>{label}</strong>
      <pre className={`${bg} p-2 rounded-xs text-xs ${extra}`}>
        <code className="language-json">{JSON.stringify(value, null, 2)}</code>
      </pre>
    </div>
  )
}

export interface NetworkTestState {
  success: boolean
  data?: unknown
  error?: unknown
}

/**
 * Runs a direct POST to the load API for the given query and reports the raw
 * outcome. Mirrors the original inline effect (no abort/cleanup).
 */
export function useDirectApiTest(parsedQuery: any): NetworkTestState | null {
  const [networkTest, setNetworkTest] = React.useState<NetworkTestState | null>(null)

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

  return networkTest
}

interface LoadQueryState {
  resultSet: unknown
  error: unknown
  isLoading: boolean
  isFetching: boolean
}

function LoadQueryStatusLine({ isLoading, isFetching }: { isLoading: boolean; isFetching: boolean }) {
  const loadingLabel = isLoading ? 'Yes' : 'No'
  const fetchingSuffix = isFetching ? '(fetching...)' : ''
  return (
    <div>
      <strong>useCubeLoadQuery Loading:</strong> {loadingLabel} {fetchingSuffix}
    </div>
  )
}

function LoadQueryEmptyNotice({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="text-gray-500">
      useCubeLoadQuery: No data returned
    </div>
  )
}

function hasNoOutcome({ resultSet, error, isLoading }: LoadQueryState): boolean {
  return !isLoading && !error && !resultSet
}

/** Renders the useCubeLoadQuery loading/error/data/empty states. */
export function LoadQueryResult(props: LoadQueryState) {
  const { resultSet, error, isLoading, isFetching } = props
  const showEmpty = hasNoOutcome(props)

  return (
    <>
      <LoadQueryStatusLine isLoading={isLoading} isFetching={isFetching} />
      {error ? (
        <JsonBlock label="useCubeLoadQuery Error:" value={error} bg="bg-red-100" extra="text-red-700" />
      ) : null}
      {resultSet ? (
        <JsonBlock label="useCubeLoadQuery Data:" value={resultSet} bg="bg-green-100" extra="max-h-40 overflow-auto" />
      ) : null}
      <LoadQueryEmptyNotice show={showEmpty} />
    </>
  )
}

/** Renders the direct-API probe outcome, if any. */
export function DirectApiResult({ networkTest }: { networkTest: NetworkTestState | null }) {
  if (!networkTest) return null

  return networkTest.success
    ? <JsonBlock label="Direct API Test:" value={networkTest.data} bg="bg-blue-100" extra="max-h-40 overflow-auto" />
    : <JsonBlock label="Direct API Test:" value={networkTest.error} bg="bg-red-100" extra="text-red-700" />
}
