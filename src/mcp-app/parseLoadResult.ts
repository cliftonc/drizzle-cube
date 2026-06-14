/**
 * Pure parsing of the various shapes a tool result can arrive in for the MCP App.
 *
 * Extracted from McpApp's `processResult` to keep the React callback flat: this
 * module owns only the "turn an unknown payload into a LoadResult" logic, with no
 * React state or side effects.
 */

export interface LoadResult {
  data: any[]
  annotation?: any
  query?: any
}

export type ParseErrorKind = 'noTextContent' | 'invalidResultFormat'

export type ParseLoadResultOutcome =
  | { ok: true; result: LoadResult }
  | { ok: false; error: ParseErrorKind }

/** Extract the raw LoadResult-ish object from any supported wrapper shape. */
function unwrapPayload(res: unknown): LoadResult | 'noTextContent' {
  if (res && typeof res === 'object' && 'content' in res) {
    const content = (res as { content: Array<{ type: string; text?: string }> }).content
    const textContent = content.find((c) => c.type === 'text')
    if (!textContent?.text) {
      return 'noTextContent'
    }
    return JSON.parse(textContent.text)
  }

  if (res && typeof res === 'object' && 'data' in res) {
    return res as LoadResult
  }

  if (typeof res === 'string') {
    return JSON.parse(res)
  }

  return res as LoadResult
}

/** When the payload wraps a `results` array, flatten its first entry. */
function flattenResults(parsed: LoadResult): LoadResult {
  if (parsed && 'results' in parsed && Array.isArray((parsed as any).results)) {
    const firstResult = (parsed as any).results[0]
    if (firstResult) {
      return {
        data: firstResult.data || [],
        query: firstResult.query || (parsed as any).query,
        annotation: firstResult.annotation,
      }
    }
  }
  return parsed
}

/**
 * Normalize an unknown tool result into a LoadResult, or describe why it could
 * not be parsed. Throws (via JSON.parse) on malformed JSON, matching the
 * original try/catch behaviour in the caller.
 */
export function parseLoadResult(res: unknown): ParseLoadResultOutcome {
  const unwrapped = unwrapPayload(res)
  if (unwrapped === 'noTextContent') {
    return { ok: false, error: 'noTextContent' }
  }

  const parsed = flattenResults(unwrapped)

  if (!parsed?.data || !Array.isArray(parsed.data)) {
    return { ok: false, error: 'invalidResultFormat' }
  }

  return { ok: true, result: parsed }
}
