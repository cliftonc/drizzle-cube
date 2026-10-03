/**
 * Query Validator
 *
 * Standalone query validation against registered cubes. Extracted from
 * compiler.ts so that both the compiler and the executor can validate
 * queries without importing each other (breaks the compiler ↔ executor
 * circular dependency).
 */

import type { SemanticQuery, Cube, Filter, FilterCondition, TimeDimension } from './types/index.js'
import { getActiveQueryModes } from './query-modes.js'
import { isResolvableDateRange, isValidDateValue } from './builders/date-time-helpers.js'
import { validateInDateRange, inDateRangeDiagnostic } from './builders/in-date-range-validation.js'
import {
  isSupportedFilterOperator,
  SUPPORTED_FILTER_OPERATORS
} from './builders/filter-operators.js'
import { LogicalPlanner } from './logical-plan/logical-planner.js'
import { flattenFilters } from './filter-cache.js'
import { isFilterOnlyTimeDimension } from './execution/query-normalizer.js'
import { t } from '../i18n/runtime.js'

type ValidationMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

/**
 * A member the query references that no cube provides, reported alongside the
 * human-readable errors.
 *
 * The joined error string cannot be split back apart reliably — the per-field
 * "did you mean" hints contain the same separator — so a caller that wants to
 * react to a *specific* missing member (a dashboard dropping a column for a
 * deleted attribute, say) needs this rather than the prose. `source` is the
 * part that matters: dropping a projected member narrows what is displayed,
 * whereas dropping a filter would widen the result set, so the two cannot be
 * treated alike.
 */
export interface QueryValidationIssue {
  source: 'measure' | 'dimension' | 'timeDimension' | 'filter'
  /** The full `Cube.field` reference as the query wrote it. */
  member: string
  message: string
}

/**
 * Thrown when a query fails validation during execution.
 *
 * Carries the structured issues alongside the joined message so a caller can
 * react to a specific unknown member — the batch endpoint, which validates
 * inside execution rather than ahead of it, would otherwise only have prose.
 */
export class QueryValidationError extends Error {
  readonly issues: QueryValidationIssue[]

  constructor(message: string, issues: QueryValidationIssue[]) {
    super(message)
    this.name = 'QueryValidationError'
    this.issues = issues
  }
}

export interface QueryValidationResult {
  isValid: boolean
  errors: string[]
  /** Unknown members, when any — see {@link QueryValidationIssue}. */
  issues: QueryValidationIssue[]
}

/**
 * Collects both representations at once so the two can never drift: every
 * unknown-member error is also recorded structurally.
 */
class ValidationErrors {
  readonly messages: string[] = []
  readonly issues: QueryValidationIssue[] = []

  push(message: string): void {
    this.messages.push(message)
  }

  /** Record an unknown member: prose for humans, structure for callers. */
  pushMissingMember(source: QueryValidationIssue['source'], member: string, message: string): void {
    this.messages.push(message)
    this.issues.push({ source, member, message })
  }
}

function getActiveValidationModes(query: SemanticQuery): Exclude<ValidationMode, 'regular'>[] {
  return getActiveQueryModes(query)
}

/**
 * Validate a query against a cubes map
 * Standalone function that can be used by both compiler and executor
 */
export function validateQueryAgainstCubes(
  cubes: Map<string, Cube>,
  query: SemanticQuery
): QueryValidationResult {
  const errors = new ValidationErrors()
  const activeModes = getActiveValidationModes(query)
  if (activeModes.length > 1) {
    errors.push(t('server.validation.query.multipleQueryModes', { modes: activeModes.join(', ') }))
    return { isValid: false, errors: errors.messages, issues: errors.issues }
  }

  if (activeModes.length === 1 && activeModes[0] !== 'comparison') {
    validateSpecialMode(activeModes[0], query, cubes, errors)
    return { isValid: errors.messages.length === 0, errors: errors.messages, issues: errors.issues }
  }

  // Track all referenced cubes
  const referencedCubes = new Set<string>()

  validateMeasures(query, cubes, errors, referencedCubes)
  validateDimensions(query, cubes, errors, referencedCubes)
  validateTimeDimensions(query, cubes, errors, referencedCubes)

  // Validate filters
  if (query.filters) {
    for (const filter of query.filters) {
      validateFilter(filter, cubes, errors, referencedCubes)
    }
  }

  // Ensure at least one cube is referenced
  if (referencedCubes.size === 0) {
    errors.push(t('server.validation.query.mustReferenceAtLeastOneCube'))
  }

  if (query.ungrouped) {
    validateUngroupedConstraints(query, cubes, errors, referencedCubes)
  }

  return {
    isValid: errors.messages.length === 0,
    errors: errors.messages,
    issues: errors.issues
  }
}

/** Dispatch to the basic per-mode validator for funnel/flow/retention queries. */
function validateSpecialMode(
  mode: Exclude<ValidationMode, 'regular'>,
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors
): void {
  if (mode === 'comparison') return
  if (mode === 'funnel') validateFunnelMode(query, cubes, errors)
  else if (mode === 'flow') validateFlowMode(query, cubes, errors)
  else if (mode === 'retention') validateRetentionMode(query, cubes, errors)
}

function validateFunnelMode(query: SemanticQuery, cubes: Map<string, Cube>, errors: ValidationErrors): void {
  // Basic funnel validation here - full validation happens in executor
  // Just ensure the cube referenced by bindingKey exists
  const bindingKey = query.funnel!.bindingKey
  if (typeof bindingKey === 'string') {
    const [cubeName] = bindingKey.split('.')
    if (cubeName && !cubes.has(cubeName)) {
      errors.push(t('server.validation.query.funnelBindingKeyCubeNotFound', { cubeName }))
    }
  } else if (Array.isArray(bindingKey)) {
    for (const mapping of bindingKey) {
      if (!cubes.has(mapping.cube)) {
        errors.push(t('server.validation.query.funnelBindingKeyCubeNotFound', { cubeName: mapping.cube }))
      }
    }
  }
}

function validateFlowMode(query: SemanticQuery, cubes: Map<string, Cube>, errors: ValidationErrors): void {
  // Basic flow validation here - full validation happens in executor
  // Just ensure the cube referenced by bindingKey exists
  const bindingKey = query.flow!.bindingKey
  if (typeof bindingKey === 'string') {
    const [cubeName] = bindingKey.split('.')
    if (cubeName && !cubes.has(cubeName)) {
      errors.push(t('server.validation.query.flowBindingKeyCubeNotFound', { cubeName }))
    }
  }
}

function validateRetentionMode(query: SemanticQuery, cubes: Map<string, Cube>, errors: ValidationErrors): void {
  const retention = query.retention!

  // Validate cube from time dimension exists
  const cubeName = extractCubeFromRetentionTimeDimension(retention.timeDimension)
  if (cubeName && !cubes.has(cubeName)) {
    errors.push(t('server.validation.query.retentionCubeNotFound', { cubeName }))
  }

  // Validate binding key cube(s) exist
  const bindingKey = retention.bindingKey
  if (typeof bindingKey === 'string') {
    const [bkCubeName] = bindingKey.split('.')
    if (bkCubeName && !cubes.has(bkCubeName)) {
      errors.push(t('server.validation.query.retentionBindingKeyCubeNotFound', { cubeName: bkCubeName }))
    }
  } else if (Array.isArray(bindingKey)) {
    for (const mapping of bindingKey) {
      if (!cubes.has(mapping.cube)) {
        errors.push(t('server.validation.query.retentionBindingKeyCubeNotFound', { cubeName: mapping.cube }))
      }
    }
  }

  // Validate breakdown dimension cubes exist
  if (retention.breakdownDimensions && Array.isArray(retention.breakdownDimensions)) {
    for (const dim of retention.breakdownDimensions) {
      const [bdCubeName] = dim.split('.')
      if (bdCubeName && !cubes.has(bdCubeName)) {
        errors.push(t('server.validation.query.retentionBreakdownCubeNotFound', { cubeName: bdCubeName }))
      }
    }
  }
}

/** Suggestion hint shown when a member's field name equals its cube name. */
function suggestionHint(fieldName: string, cubeName: string, candidates: string[]): string {
  if (fieldName !== cubeName) return ''
  const list = candidates.slice(0, 5).map(m => `'${cubeName}.${m}'`).join(', ')
  return `. Did you mean one of: ${list}?`
}

function validateMeasures(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors,
  referencedCubes: Set<string>
): void {
  if (!query.measures) return

  for (const measure of query.measures) {
    const [cubeName, fieldName] = measure.split('.')

    if (!cubeName || !fieldName) {
      errors.push(t('server.validation.query.invalidMeasureFormat', { measure }))
      continue
    }

    referencedCubes.add(cubeName)

    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.pushMissingMember('measure', measure,
        t('server.validation.query.cubeNotFoundForMeasure', { cubeName, measure }))
      continue
    }

    if (!cube.measures[fieldName]) {
      const hint = suggestionHint(fieldName, cubeName, Object.keys(cube.measures))
      errors.pushMissingMember('measure', measure,
        t('server.validation.query.measureNotFound', { fieldName, cubeName, hint }))
    }
  }
}

function validateDimensions(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors,
  referencedCubes: Set<string>
): void {
  if (!query.dimensions) return

  for (const dimension of query.dimensions) {
    const [cubeName, fieldName] = dimension.split('.')

    if (!cubeName || !fieldName) {
      errors.push(t('server.validation.query.invalidDimensionFormat', { dimension }))
      continue
    }

    referencedCubes.add(cubeName)

    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.pushMissingMember('dimension', dimension,
        t('server.validation.query.cubeNotFoundForDimension', { cubeName, dimension }))
      continue
    }

    if (!cube.dimensions[fieldName]) {
      const hint = suggestionHint(fieldName, cubeName, Object.keys(cube.dimensions))
      errors.pushMissingMember('dimension', dimension,
        t('server.validation.query.dimensionNotFound', { fieldName, cubeName, hint }))
    }
  }
}

function validateTimeDimensions(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors,
  referencedCubes: Set<string>
): void {
  if (!query.timeDimensions) return

  for (const timeDimension of query.timeDimensions) {
    const [cubeName, fieldName] = timeDimension.dimension.split('.')

    if (!cubeName || !fieldName) {
      errors.push(t('server.validation.query.invalidTimeDimensionFormat', { dimension: timeDimension.dimension }))
      continue
    }

    referencedCubes.add(cubeName)

    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.pushMissingMember('timeDimension', timeDimension.dimension,
        t('server.validation.query.cubeNotFoundForTimeDimension', { cubeName, dimension: timeDimension.dimension }))
      continue
    }

    // timeDimensions reference dimensions
    if (!cube.dimensions[fieldName]) {
      errors.pushMissingMember('timeDimension', timeDimension.dimension,
        t('server.validation.query.timeDimensionNotFound', { fieldName, cubeName }))
    }

    validateTimeDimensionRanges(timeDimension, errors)
  }

  validateGranularityLessTimeDimensions(query, errors)
}

/** Relative-range examples quoted in date-range error messages. */
const RELATIVE_RANGE_EXAMPLES = "'today', 'last 7 days', 'last 3 months', 'this month', 'last quarter', 'next week'"

function pushInvalidDateRange(errors: ValidationErrors, member: string, dateRange: unknown): void {
  errors.push(t('server.validation.query.invalidDateRange', {
    dateRange: JSON.stringify(dateRange),
    member,
    examples: RELATIVE_RANGE_EXAMPLES
  }))
}

/** Reject timeDimension dateRange / compareDateRange entries that would not resolve. */
function validateTimeDimensionRanges(timeDimension: TimeDimension, errors: ValidationErrors): void {
  if (timeDimension.dateRange !== undefined && !isResolvableDateRange(timeDimension.dateRange)) {
    pushInvalidDateRange(errors, timeDimension.dimension, timeDimension.dateRange)
  }
  for (const range of timeDimension.compareDateRange ?? []) {
    if (!isResolvableDateRange(range)) {
      pushInvalidDateRange(errors, timeDimension.dimension, range)
    }
  }
}

/**
 * A timeDimension without a granularity is a filter only (Cube.js semantics) —
 * it restricts the date range but is not selected or grouped. A grouped query
 * made up solely of such time dimensions would therefore select nothing.
 */
function validateGranularityLessTimeDimensions(query: SemanticQuery, errors: ValidationErrors): void {
  if (query.ungrouped) return
  if ((query.measures?.length ?? 0) > 0 || (query.dimensions?.length ?? 0) > 0) return
  const timeDimensions = query.timeDimensions ?? []
  const filterOnly = timeDimensions.filter(isFilterOnlyTimeDimension)
  if (filterOnly.length > 0 && filterOnly.length === timeDimensions.length) {
    errors.push(t('server.validation.query.granularityLessTimeDimensionOnly', {
      dimension: filterOnly[0].dimension
    }))
  }
}

/** Measure types that cannot be expressed as raw columns in an ungrouped query. */
const UNGROUPED_INCOMPATIBLE_MEASURE_TYPES = new Set([
  'count', 'countDistinct', 'countDistinctApprox',
  'calculated',
  'stddev', 'stddevSamp', 'variance', 'varianceSamp',
  'median', 'p95', 'p99', 'percentile',
  'lag', 'lead', 'rank', 'denseRank', 'rowNumber',
  'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'
])
const UNGROUPED_ALLOWED_MEASURE_TYPES = ['sum', 'avg', 'min', 'max', 'number']

function validateUngroupedConstraints(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors,
  referencedCubes: Set<string>
): void {
  const hasDimensions = (query.dimensions && query.dimensions.length > 0) ||
                        (query.timeDimensions && query.timeDimensions.length > 0)
  if (!hasDimensions) {
    errors.push(t('server.validation.query.ungroupedRequiresDimension'))
  }

  // Reject incompatible query modes
  if (query.funnel) {
    errors.push(t('server.validation.query.ungroupedIncompatibleFunnel'))
  }
  if (query.flow) {
    errors.push(t('server.validation.query.ungroupedIncompatibleFlow'))
  }
  if (query.retention) {
    errors.push(t('server.validation.query.ungroupedIncompatibleRetention'))
  }

  // Reject compareDateRange
  if (query.timeDimensions?.some(td => td.compareDateRange && td.compareDateRange.length > 0)) {
    errors.push(t('server.validation.query.ungroupedIncompatibleCompareDateRange'))
  }

  // Reject fillMissingDates
  if (query.timeDimensions?.some(td => td.fillMissingDates === true)) {
    errors.push(t('server.validation.query.ungroupedIncompatibleFillMissingDates'))
  }

  validateUngroupedMeasures(query, cubes, errors)
  validateUngroupedHasManyJoins(query, cubes, errors, referencedCubes)
}

/** Validate measure types/filters are compatible with ungrouped queries. */
function validateUngroupedMeasures(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors
): void {
  if (!query.measures) return

  for (const measureName of query.measures) {
    const [cubeName, fieldName] = measureName.split('.')
    const cube = cubes.get(cubeName)
    const measure = cube?.measures[fieldName]
    if (!measure) continue

    if (UNGROUPED_INCOMPATIBLE_MEASURE_TYPES.has(measure.type)) {
      errors.push(
        `Measure '${measureName}' has type '${measure.type}' which is incompatible with ungrouped queries. ` +
        `Only ${UNGROUPED_ALLOWED_MEASURE_TYPES.join(', ')} types are allowed.`
      )
    }

    // Reject measures with filters (require CASE WHEN + aggregate)
    if (measure.filters && measure.filters.length > 0) {
      errors.push(
        `Measure '${measureName}' has filters which are incompatible with ungrouped queries ` +
        `(measure filters require aggregation)`
      )
    }
  }
}

/**
 * Reject ungrouped queries whose join path — from the primary cube the planner
 * would actually choose — traverses a hasMany edge. A cube that merely
 * *declares* a hasMany back to the primary cube is fine when the path used is
 * belongsTo/hasOne.
 */
function validateUngroupedHasManyJoins(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: ValidationErrors,
  referencedCubes: Set<string>
): void {
  const cubeNames = [...referencedCubes].filter(name => cubes.has(name))
  if (cubeNames.length < 2) return

  const planner = new LogicalPlanner()
  const primaryCube = planner.analyzePrimaryCube(cubeNames, query, cubes).selectedCube

  for (const targetCube of cubeNames) {
    if (targetCube === primaryCube) continue
    const analysis = planner.analyzeJoinPathForTarget(cubes, primaryCube, targetCube, query)
    const hasManyStep = analysis.path?.find(step => step.relationship === 'hasMany')
    if (hasManyStep) {
      errors.push(
        `Ungrouped queries are incompatible with hasMany relationships ` +
        `(${hasManyStep.fromCube} → ${hasManyStep.toCube} is hasMany)`
      )
    }
  }
}

/**
 * Validate a single filter (recursive for logical filters)
 */
function validateFilter(
  filter: any,
  cubes: Map<string, Cube>,
  errors: ValidationErrors,
  referencedCubes: Set<string>
): void {
  // Handle logical filters (AND/OR)
  if ('and' in filter || 'or' in filter) {
    const logicalFilters = filter.and || filter.or || []
    for (const subFilter of logicalFilters) {
      validateFilter(subFilter, cubes, errors, referencedCubes)
    }
    if (filter.or) {
      validateOrGroupMemberKinds(filter.or, cubes, errors)
    }
    return
  }

  // Handle simple filter condition
  if (!('member' in filter)) {
    errors.push(t('server.validation.query.filterMustHaveMember'))
    return
  }

  const [cubeName, fieldName] = filter.member.split('.')
  
  if (!cubeName || !fieldName) {
    errors.push(t('server.validation.query.invalidFilterMemberFormat', { member: filter.member }))
    return
  }

  referencedCubes.add(cubeName)
  // Check the shape even if the referenced cube has since been removed.
  if (filter.operator === 'inDateRange') {
    const result = validateInDateRange(filter.values, filter.dateRange)
    if (!result.valid) errors.push(inDateRangeDiagnostic(filter.member, result))
  }

  // Check if cube exists
  const cube = cubes.get(cubeName)
  if (!cube) {
    errors.pushMissingMember('filter', filter.member,
      t('server.validation.query.cubeNotFoundForFilter', { cubeName, member: filter.member }))
    return
  }

  // Check if field exists on cube (can be dimension or measure)
  if (!cube.dimensions[fieldName] && !cube.measures[fieldName]) {
    const hint = fieldName === cubeName
      ? `. Did you mean one of: ${[...Object.keys(cube.dimensions), ...Object.keys(cube.measures)].slice(0, 5).map(f => `'${cubeName}.${f}'`).join(', ')}?`
      : ''
    errors.pushMissingMember('filter', filter.member,
      t('server.validation.query.filterFieldNotFound', { fieldName, cubeName, hint }))
  }

  validateFilterOperatorAndValues(filter, errors)
}

/** Operators whose single value must parse as a date. */
const SINGLE_DATE_OPERATORS = new Set(['beforeDate', 'afterDate'])

/**
 * Reject operators the SQL layer cannot build, and date filters whose values
 * would not resolve — both used to be silently dropped at SQL-build time.
 */
function validateFilterOperatorAndValues(filter: FilterCondition, errors: ValidationErrors): void {
  const { member, operator } = filter
  if (!isSupportedFilterOperator(operator)) {
    errors.push(t('server.validation.query.unknownFilterOperator', {
      operator: String(operator),
      member,
      operators: SUPPORTED_FILTER_OPERATORS.join(', ')
    }))
    return
  }

  const values: unknown[] = Array.isArray(filter.values) ? filter.values : []

  if (operator === 'inDateRange') return

  if (SINGLE_DATE_OPERATORS.has(operator) && values.length > 0 && !isValidDateValue(values[0])) {
    errors.push(t('server.validation.query.invalidDateValue', {
      member,
      operator,
      value: JSON.stringify(values[0])
    }))
  }
}

/**
 * An OR group mixing measure and dimension filters cannot be expressed: the
 * dimension branches land in WHERE and the measure branches in HAVING, which
 * ANDs them together instead of ORing.
 */
function validateOrGroupMemberKinds(
  orFilters: Filter[],
  cubes: Map<string, Cube>,
  errors: ValidationErrors
): void {
  const measures: string[] = []
  const dimensions: string[] = []
  for (const { member } of flattenFilters(orFilters)) {
    const [cubeName, fieldName] = member.split('.')
    const cube = cubes.get(cubeName)
    if (cube?.measures[fieldName]) measures.push(member)
    else if (cube?.dimensions[fieldName]) dimensions.push(member)
  }
  if (measures.length > 0 && dimensions.length > 0) {
    errors.push(t('server.validation.query.orMixesMeasuresAndDimensions', {
      measures: measures.join(', '),
      dimensions: dimensions.join(', ')
    }))
  }
}

/**
 * Extract cube name from retention time dimension (string or object format)
 */
function extractCubeFromRetentionTimeDimension(
  timeDim: string | { cube: string; dimension: string }
): string | null {
  if (typeof timeDim === 'string') {
    const [cubeName] = timeDim.split('.')
    return cubeName || null
  }
  return timeDim.cube
}
