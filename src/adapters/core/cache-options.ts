/**
 * Request cache headers → result-cache execution options, shared by REST
 * `/load` and `/batch`. No other endpoint reads these headers.
 *
 * - `x-cache-max-age: <seconds>` — the oldest cached result the caller will
 *   accept. A non-negative integer; anything else is ignored.
 * - `x-cache-control: no-cache` — max-age 0 (skip the read, still write).
 *
 * When both are present the smaller max-age wins (resolved by the server's
 * result cache). Neither has any effect when the semantic layer has no cache
 * provider configured.
 */

import type { ExecutionOptions } from '../../server/index.js'
import type { HeaderReader } from './security-context.js'

const NON_NEGATIVE_INTEGER = /^\d+$/

/** Parse `x-cache-max-age` (seconds) into milliseconds, or undefined when absent/invalid. */
function parseMaxAgeHeader(value: string | undefined): number | undefined {
  if (value === undefined || !NON_NEGATIVE_INTEGER.test(value.trim())) {
    return undefined
  }
  return Number(value.trim()) * 1000
}

/** Read the request cache headers into the result-cache execution options. */
export function readCacheOptions(readHeader: HeaderReader): Pick<ExecutionOptions, 'skipCache' | 'maxAgeMs'> {
  return {
    skipCache: readHeader('x-cache-control') === 'no-cache',
    maxAgeMs: parseMaxAgeHeader(readHeader('x-cache-max-age'))
  }
}
