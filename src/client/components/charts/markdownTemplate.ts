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
  parse,
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
  /**
   * References the template makes that resolve to nothing. Knap renders an
   * unknown name as an empty string, so a misspelt field produces a blank
   * heading rather than any complaint — the failure is invisible at exactly the
   * moment the author needs to see it.
   */
  warnings: MarkdownTemplateDiagnostic[]
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

/** The variables every template is given, whatever the query returned. */
const CONTEXT_NAMES = ['rows', 'labelled', 'data', 'rowCount', 'first', 'last', 'fields']

/** Variables whose members are result fields, so `x.alias` must be a real one. */
const ROW_SHAPED = ['first', 'last']

/** The members a `fields` entry carries. */
const FIELD_MEMBERS = ['key', 'alias', 'label']

/** A Knap identifier, which carries its dotted access as a `path`. */
interface IdentifierNode {
  type: 'identifier'
  name: string
  path?: string[]
  line: number
  column: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIdentifier(node: unknown): node is IdentifierNode {
  return isRecord(node) && node.type === 'identifier' && typeof node.name === 'string'
}

/** Depth-first walk over the parsed template, visiting every node once. */
function walkNodes(node: unknown, visit: (node: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walkNodes(child, visit)
    return
  }
  if (!isRecord(node)) return
  visit(node)
  for (const value of Object.values(node)) walkNodes(value, visit)
}

/**
 * Map each `{% for %}` iterator to what it iterates.
 *
 * A loop variable is only checkable once we know its source: `row` in
 * `for row in rows` holds a result row, so its members are field aliases, while
 * `f` in `for f in fields` holds metadata instead.
 */
function collectLoopSources(ast: unknown): Map<string, string> {
  const sources = new Map<string, string>()
  walkNodes(ast, (node) => {
    if (node.type !== 'for' || typeof node.iterator !== 'string') return
    const iterable = node.iterable
    sources.set(node.iterator, isIdentifier(iterable) ? iterable.name : '')
  })
  return sources
}

/** What a root variable holds, which decides how its members are checked. */
type RootKind =
  /** A row under aliases — members must be real aliases. */
  | { kind: 'aliased' }
  /** A `fields` entry — members are the metadata keys. */
  | { kind: 'metadata' }
  /** A raw row with dotted keys — dotted access never resolves on it. */
  | { kind: 'raw' }
  /** Not checkable, e.g. `labelled`, whose keys contain spaces. */
  | { kind: 'skip' }

function rootKind(root: string, loopSources: Map<string, string>): RootKind {
  if (ROW_SHAPED.includes(root)) return { kind: 'aliased' }

  switch (loopSources.get(root)) {
    case 'rows': return { kind: 'aliased' }
    case 'fields': return { kind: 'metadata' }
    case 'data': return { kind: 'raw' }
    default: return { kind: 'skip' }
  }
}

/**
 * Find references that will silently render as nothing.
 *
 * Two mistakes account for nearly all of them: naming a variable the context
 * does not provide, and reading a field off a row under a name that is not its
 * alias. Both look identical in the output — a blank space where a value should
 * be — so they are reported with the names that would have worked.
 */
export function findUnknownReferences(
  template: string,
  context: MarkdownTemplateContext
): MarkdownTemplateDiagnostic[] {
  const { ast, errors } = parse(template)
  // A template that does not parse has real errors to fix first.
  if (errors.length > 0) return []

  const aliases = context.fields.map((field) => field.alias)
  const loopSources = collectLoopSources(ast)
  const knownRoots = new Set([...CONTEXT_NAMES, ...loopSources.keys()])
  const available = aliases.length > 0 ? aliases.join(', ') : CONTEXT_NAMES.join(', ')

  const scope: ReferenceScope = { aliases, loopSources, knownRoots, available }
  const diagnostics: MarkdownTemplateDiagnostic[] = []
  const reported = new Set<string>()

  walkNodes(ast, (node) => {
    if (!isIdentifier(node)) return
    const message = describeReference(node.path ?? [node.name], scope)
    if (message) addOnce(diagnostics, reported, node, message)
  })

  return diagnostics
}

/** What a template may legitimately name, derived from the context and its loops. */
interface ReferenceScope {
  aliases: string[]
  loopSources: Map<string, string>
  knownRoots: Set<string>
  /** The alias list as prose, for the "Available: …" half of a message. */
  available: string
}

/** The problem with one reference, or null if there is none. */
function describeReference(path: string[], scope: ReferenceScope): string | null {
  const [root, member] = path

  if (!scope.knownRoots.has(root)) {
    return `Unknown variable "${root}". Available: ${CONTEXT_NAMES.join(', ')}.`
  }
  if (member === undefined) return null

  return describeMember(path, member, scope)
}

/** The problem with reading `member` off a known root, or null if there is none. */
function describeMember(path: string[], member: string, scope: ReferenceScope): string | null {
  const root = path[0]

  switch (rootKind(root, scope.loopSources).kind) {
    case 'raw':
      // `data` keeps the cube-qualified keys, and Knap reads `r.Employees.count`
      // as two levels of nesting rather than one literal key, so it resolves to
      // nothing. Bracket syntax is the only way in.
      return `"${root}" holds raw rows, so dotted access does not resolve. `
        + `Use ${root}["${path.slice(1).join('.')}"], or loop over rows and use ${root}.${scope.aliases[0] ?? 'alias'}.`
    case 'aliased':
      return unknownField(member, scope.aliases, scope.available)
    case 'metadata':
      return unknownField(member, FIELD_MEMBERS, FIELD_MEMBERS.join(', '))
    case 'skip':
      return null
  }
}

/** "Unknown field" with the names that would have worked, or null if it is known. */
function unknownField(member: string, known: string[], available: string): string | null {
  return known.includes(member) ? null : `Unknown field "${member}". Available: ${available}.`
}

/** Record a diagnostic once per name, so a loop does not repeat the same advice. */
function addOnce(
  diagnostics: MarkdownTemplateDiagnostic[],
  reported: Set<string>,
  node: IdentifierNode,
  message: string
): void {
  if (reported.has(message)) return
  reported.add(message)
  diagnostics.push({ message, line: node.line, column: node.column })
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
    const errors = result.errors.map((error) => ({
      message: error.message,
      line: error.line,
      column: error.column
    }))
    return {
      output: result.output,
      errors,
      // Only worth computing when the template ran: a parse failure has real
      // errors to fix first, and every reference would look unresolved.
      warnings: errors.length > 0 ? [] : findUnknownReferences(template, context)
    }
  } catch (error) {
    return {
      output: '',
      errors: [{ message: toMessage(error), line: 1, column: 1 }],
      warnings: []
    }
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
