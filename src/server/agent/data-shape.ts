/**
 * Data-shape summary for the agent's `execute_query` results.
 *
 * The agent used to receive every row and no summary, so it chose a chart type
 * blind and then spent its context — and its output-token budget — on raw data.
 * A per-field summary is what the chart decision actually needs: how many
 * distinct categories there are, and whether measures share a scale.
 */

/** How many rows of the result set are handed back to the model. */
export const AGENT_RESULT_ROW_LIMIT = 25

/** Per-field summary of a query result. */
export interface FieldShape {
  field: string
  kind: 'measure' | 'dimension' | 'timeDimension'
  type?: string
  /** Distinct non-null values seen. Capped at the rows inspected. */
  distinctCount: number
  nullCount: number
  /** Numeric range, present only when every non-null value is a number. */
  min?: number
  max?: number
}

interface ResultAnnotation {
  measures?: Record<string, { type?: string }>
  dimensions?: Record<string, { type?: string }>
  timeDimensions?: Record<string, { type?: string }>
}

/** Summarise one field across the rows. */
function summariseField(
  rows: Record<string, unknown>[],
  field: string,
  kind: FieldShape['kind'],
  type: string | undefined
): FieldShape {
  const distinct = new Set<unknown>()
  let nullCount = 0
  let min: number | undefined
  let max: number | undefined
  let allNumeric = true

  for (const row of rows) {
    const value = row[field]
    if (value === null || value === undefined) {
      nullCount++
      continue
    }
    distinct.add(value)
    // Numeric measures often arrive as strings from the driver, so coerce
    // before deciding the range — otherwise every measure looks non-numeric.
    const num = typeof value === 'number' ? value : Number(value)
    if (typeof value === 'boolean' || Number.isNaN(num)) {
      allNumeric = false
    } else {
      min = min === undefined || num < min ? num : min
      max = max === undefined || num > max ? num : max
    }
  }

  return {
    field,
    kind,
    ...(type ? { type } : {}),
    distinctCount: distinct.size,
    nullCount,
    ...(allNumeric && min !== undefined ? { min, max } : {}),
  }
}

/**
 * Build a per-field summary of a query result.
 *
 * Computed from the rows handed to the model, so `distinctCount` is a floor
 * rather than an exact count when the result was truncated.
 */
export function summariseDataShape(
  rows: Record<string, unknown>[],
  annotation: ResultAnnotation | undefined
): FieldShape[] {
  if (rows.length === 0) return []

  const shapes: FieldShape[] = []
  const seen = new Set<string>()
  const groups: Array<[FieldShape['kind'], Record<string, { type?: string }> | undefined]> = [
    ['dimension', annotation?.dimensions],
    ['timeDimension', annotation?.timeDimensions],
    ['measure', annotation?.measures],
  ]

  for (const [kind, group] of groups) {
    for (const [field, meta] of Object.entries(group ?? {})) {
      seen.add(field)
      shapes.push(summariseField(rows, field, kind, meta?.type))
    }
  }

  // Analysis-mode results (funnel/flow/retention) carry no annotation, so fall
  // back to the keys actually present rather than returning nothing.
  for (const field of Object.keys(rows[0])) {
    if (seen.has(field)) continue
    shapes.push(summariseField(rows, field, 'dimension', undefined))
  }

  return shapes
}
