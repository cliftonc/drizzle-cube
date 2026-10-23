/**
 * Request cache headers → result-cache execution options, shared by REST
 * `/load` and `/batch`. No other endpoint reads these headers.
 *
 * - `x-cache-max-age: <seconds>` — the oldest cached result the caller will
 *   accept. A non-negative integer; anything else is ignored.
 * - `x-cache-control: no-cache` — max-age 0 (skip the read, still write).
 *
 * When both are present the smaller max-age wins. Neither has any effect when
 * the semantic layer has no cache provider configured.
 */

import type { ExecutionOptions } from '../../server/index.js'
import type { HeaderReader } from './security-context.js'

const NON_NEGATIVE_INTEGER = /^\d+$/

/** Parse `x-cache-max-age` (seconds) into milliseconds, or undefined when absent/invalid. */
function parseMaxAgeHeader(value: string | undefined): number | undefined {
  if (value === undefined || !NON_NEGATIVE_INTEGER.test(value.trim())) {
    return undefined
  }
  const ms = Number(value.trim()) * 1000
  return Number.isSafeInteger(ms) ? ms : undefined
}

/** Read the request cache headers into the `maxAgeMs` execution option. */
export function readCacheOptions(readHeader: HeaderReader): Pick<ExecutionOptions, 'maxAgeMs'> {
  const headerMaxAgeMs = parseMaxAgeHeader(readHeader('x-cache-max-age'))
  const maxAgeMs = readHeader('x-cache-control') === 'no-cache' ? 0 : headerMaxAgeMs
  return maxAgeMs === undefined ? {} : { maxAgeMs }
}
