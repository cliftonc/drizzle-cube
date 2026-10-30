/**
 * The age of the rows a query hook shows, read when a refetch records a
 * `newerThanShown` max-age.
 */

import { useCallback, useRef } from 'react'
import { shownRowsAgeMs } from '../../utils/freshness.js'

/**
 * A stable getter for the age of the shown rows. Stable, so refetch callbacks
 * (and the subscription timer that depends on them) do not change with every
 * result.
 */
export function useShownRowsAge(servedAgeMs: number | undefined, receivedAtMs: number): () => number | undefined {
  const latest = useRef({ servedAgeMs, receivedAtMs })
  latest.current = { servedAgeMs, receivedAtMs }
  return useCallback(() => shownRowsAgeMs(latest.current.servedAgeMs, latest.current.receivedAtMs), [])
}
