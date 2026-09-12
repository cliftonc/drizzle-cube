/**
 * Knap template support for the markdown chart.
 *
 * A markdown portlet with a query renders its content as a Knap template rather
 * than as literal markdown, so a dashboard can carry a written summary that is
 * computed from live data instead of typed by hand.
 *
 * Knap resolves `a.b` as nested member access, so a cube-qualified result key
 * such as `Employees.avgSalary` is unreachable from a `for` loop or from the
 * `map` / `where` filters — those see a missing `Employees` object and yield
 * nothing. Every row is therefore offered three ways:
 *
 *   rows      aliased keys (`employees_avg_salary`) — loops and arithmetic
 *   labelled  human field labels as keys — `{{ labelled | table }}` headers
 *   data      the raw dotted keys — `{{ data[0]["Employees.avgSalary"] }}`
 *
 * `first` and `last` exist because Knap's filters stringify on assignment:
 * `{% set top = rows | sort:"x" %}` makes `top` a string, so a template cannot
 * sort and then index. The query's own ordering has to be surfaced directly.
 */

import {
  createEngine,
  standardFilters,
  type TemplateEngine,
  type TemplateVariables
} from 'knap'

/** One result field, in the three namings a template can address it by. */
export interface MarkdownTemplateField {
  /** The raw cube-qualified key, e.g. `Employees.avgSalary`. */
  key: string
  /** The template-safe alias, e.g. `employees_avg_salary`. */
  alias: string
  /** The human-readable label, e.g. `Avg Salary`. */
  label: string
}

/** The variables a markdown template is rendered against. */
export interface MarkdownTemplateContext {
  rows: Record<string, unknown>[]
  labelled: Record<string, unknown>[]
  data: Record<string, unknown>[]
  rowCount: number
  first: Record<string, unknown> | null
  last: Record<string, unknown> | null
  fields: MarkdownTemplateField[]
}

/** A rendered template, or the diagnostics explaining why it did not render. */
export interface MarkdownTemplateResult {
  output: string
  errors: MarkdownTemplateDiagnostic[]
}

export interface MarkdownTemplateDiagnostic {
  message: string
  line: number
  column: number
}

/**
 * Turn one segment of a field name into lower snake case.
 *
 * Splitting on camel-case boundaries is what keeps `avgSalary` readable as
 * `avg_salary`; a plain lower-casing would give `avgsalary`, which is both
 * hard to guess and hard to read back in a template.
 */
function snakeSegment(segment: string): string {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toLowerCase()
}

/**
 * Derive the template alias for a cube-qualified field key.
 *
 * `Employees.avgSalary` becomes `employees_avg_salary`. A key that would start
 * with a digit is prefixed, since Knap identifiers cannot.
 */
export function aliasForField(key: string): string {
  const alias = key
    .split('.')
    .map(snakeSegment)
    .filter(Boolean)
    .join('_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  if (!alias) return 'field'
  return /^[0-9]/.test(alias) ? `_${alias}` : alias
}

/**
 * Claim a name, suffixing it until it is unique.
 *
 * Two fields must never collapse onto one template variable — a silently lost
 * column is far worse than an ugly `_2`.
 */
function claimUnique(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name)
    return name
  }
  let suffix = 2
  while (taken.has(`${name}_${suffix}`)) suffix++
  const unique = `${name}_${suffix}`
  taken.add(unique)
  return unique
}

/**
 * Collect the result's field keys in a stable order.
 *
 * Driven by the rows rather than by the query, so a field the engine did not
 * return simply is not offered, and a field only some rows carry still is.
 */
function collectKeys(rows: Record<string, unknown>[]): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        keys.push(key)
      }
    }
  }
  return keys
}

/**
 * Build the template variables for a set of result rows.
 *
 * @param rows - raw result rows, as `resultSet.rawData()` returns them
 * @param getFieldLabel - resolves a field key to its human label; pass the
 *   value of `useCubeFieldLabel()` so labels match the rest of the app
 */
export function buildTemplateContext(
  rows: Record<string, unknown>[],
  getFieldLabel: (key: string) => string = (key) => key
): MarkdownTemplateContext {
  const keys = collectKeys(rows)

  const aliasTaken = new Set<string>()
  const labelTaken = new Set<string>()
  const fields: MarkdownTemplateField[] = keys.map((key) => ({
    key,
    alias: claimUnique(aliasForField(key), aliasTaken),
    label: claimUnique(safeLabel(getFieldLabel, key), labelTaken)
  }))

  const project = (pick: (field: MarkdownTemplateField) => string) =>
    rows.map((row) => {
      const projected: Record<string, unknown> = {}
      for (const field of fields) {
        if (field.key in row) projected[pick(field)] = row[field.key]
      }
      return projected
    })

  const aliased = project((field) => field.alias)

  return {
    rows: aliased,
    labelled: project((field) => field.label),
    data: rows,
    rowCount: rows.length,
    first: aliased[0] ?? null,
    last: aliased.length > 0 ? aliased[aliased.length - 1] : null,
    fields
  }
}

/**
 * Resolve a field label without letting a provider failure break the chart.
 * Falls back to the raw key, which is always meaningful.
 */
function safeLabel(getFieldLabel: (key: string) => string, key: string): string {
  try {
    return getFieldLabel(key) || key
  } catch {
    return key
  }
}

/**
 * Render limits for a dashboard portlet.
 *
 * Knap's defaults allow a five-megabyte output, which is not a size any portlet
 * should reach. These are tightened so that a runaway loop over a large result
 * fails with a diagnostic rather than locking up the browser tab.
 */
const RENDER_LIMITS = {
  maxTemplateLength: 100_000,
  maxOutputLength: 500_000,
  maxValueLength: 100_000,
  maxOperations: 500_000,
  maxDepth: 50
}

let engine: TemplateEngine | null = null

/**
 * The shared Knap engine.
 *
 * `allowRegex` is off: Knap's own guidance is that native regexes need worker
 * or process isolation before they are safe on untrusted input, and a template
 * whose variables come from the warehouse is not hand-typed input.
 */
function getEngine(): TemplateEngine {
  if (!engine) {
    engine = createEngine({ filters: standardFilters, allowRegex: false })
  }
  return engine
}

/**
 * Check a template for syntax errors and unknown filters without rendering it.
 * Synchronous, so an editor can show diagnostics as the author types.
 */
export function validateTemplate(template: string): MarkdownTemplateDiagnostic[] {
  if (!template.trim()) return []
  try {
    return getEngine()
      .validate(template)
      .map((error) => ({ message: error.message, line: error.line, column: error.column }))
  } catch (error) {
    return [{ message: toMessage(error), line: 1, column: 1 }]
  }
}

/**
 * Render a markdown template against result rows.
 *
 * Never throws. A broken template reports its diagnostics so the portlet can
 * show them in place, rather than taking the dashboard down with it.
 */
export async function renderMarkdownTemplate(
  template: string,
  context: MarkdownTemplateContext
): Promise<MarkdownTemplateResult> {
  try {
    // Listed field by field rather than spread: an interface is not assignable
    // to Knap's `Record<string, unknown>` variables, and writing them out keeps
    // this the one authoritative list of what a template can reference.
    const variables: TemplateVariables = {
      rows: context.rows,
      labelled: context.labelled,
      data: context.data,
      rowCount: context.rowCount,
      first: context.first,
      last: context.last,
      fields: context.fields
    }

    const result = await getEngine().render(template, { variables }, { limits: RENDER_LIMITS })
    return {
      output: result.output,
      errors: result.errors.map((error) => ({
        message: error.message,
        line: error.line,
        column: error.column
      }))
    }
  } catch (error) {
    return { output: '', errors: [{ message: toMessage(error), line: 1, column: 1 }] }
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
