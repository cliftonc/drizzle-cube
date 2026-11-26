import { Column, is } from 'drizzle-orm'
import type {
  Cube,
  CubeJoin,
  ExistenceJoin,
  Filter,
  FilterCondition,
  FilterOperator,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../types/index.js'
import { getMemberReferences } from '../template-substitution.js'
import { getWindowBaseMeasure } from '../measure-classification.js'
import { isDiscardedFilterValue, NO_VALUE_FILTER_OPERATORS } from '../filter-values.js'
import { flattenFilters } from '../filter-cache.js'
import { resolveCubeReference } from '../cube-utils.js'
import { analyzeCubeUsage } from './planner-utils.js'
import type { JoinRef, PlannedJoin } from './types.js'

/** A query without the filters on cubes it uses only for filtering, those filters by cube, and the cubes it uses for more than filtering. */
export interface ExistenceSplit {
  query: SemanticQuery
  filtersByCube: Map<string, Filter[]>
  usedCubes: Set<string>
}

/** A filter whose conditions all name one cube: a condition, or an `or` group. */
interface CubeFilter {
  cubeName: string
  filter: Filter
  conditions: FilterCondition[]
}

/**
 * Take the filters on cubes that a query uses only for filtering out of the
 * query, grouped by cube.
 *
 * A cube is filter-only when no measure, dimension, time dimension, order
 * entry, measure filter, `or` group that names another cube too, filter that
 * matches a missing row, filter with no values or filter on a computed
 * dimension names it, directly or through a calculated or window measure,
 * wherever in the filters that measure stands.
 * Top-level filters and members of
 * `and` groups, nested or not, move one by one. An `or` group among them
 * moves whole when its conditions all name one cube, so one row of that cube
 * has to meet the group and every other filter on the cube.
 *
 * @param cubes - Every registered cube
 * @param query - Query to split
 * @param ctx - Query context, for dimensions that are functions of it
 * @returns The split, or null when no filter moves
 */
export function splitExistenceFilters(
  cubes: Map<string, Cube>,
  query: SemanticQuery,
  ctx: QueryContext
): ExistenceSplit | null {
  const cubeFilters: CubeFilter[] = []
  const kept: Filter[] = []
  const collect = (filters: Filter[]) => {
    for (const filter of filters) {
      if ('and' in filter && filter.and) {
        collect(filter.and)
        continue
      }
      const cubeFilter = toCubeFilter(filter, cubes, ctx)
      if (cubeFilter) cubeFilters.push(cubeFilter)
      else kept.push(filter)
    }
  }
  collect(query.filters ?? [])

  const isMeasure = (member: string) => {
    const [cubeName, field] = member.split('.')
    return Boolean(cubes.get(cubeName)?.measures?.[field])
  }
  const measureFilters = cubeFilters.filter(({ conditions }) => conditions.some(condition => isMeasure(condition.member)))
  const usedCubes = analyzeCubeUsage({ ...query, filters: [...kept, ...measureFilters.map(({ filter }) => filter)] })
  const filteredMeasures = flattenFilters(query.filters ?? []).map(condition => condition.member).filter(isMeasure)
  for (const member of measureDependencies(cubes, [...(query.measures ?? []), ...filteredMeasures])) {
    usedCubes.add(member.split('.')[0])
  }

  const filtersByCube = new Map<string, Filter[]>()
  for (const { cubeName, filter } of cubeFilters) {
    if (usedCubes.has(cubeName) || !cubes.has(cubeName)) {
      kept.push(filter)
      continue
    }
    filtersByCube.set(cubeName, [...(filtersByCube.get(cubeName) ?? []), filter])
  }

  if (filtersByCube.size === 0) {
    return null
  }
  return { query: { ...query, filters: kept }, filtersByCube, usedCubes }
}

/**
 * Read a filter as a filter on one cube that an existence test can hold.
 *
 * @param filter - A condition or an `or` group
 * @param cubes - Every registered cube
 * @param ctx - Query context, for dimensions that are functions of it
 * @returns The filter with its cube and conditions, or null when its conditions name no cube or several, or one of them keeps the row-level join
 */
function toCubeFilter(filter: Filter, cubes: Map<string, Cube>, ctx: QueryContext): CubeFilter | null {
  const conditions = flattenFilters([filter])
  const cubeNames = new Set(conditions.map(condition => condition.member.split('.')[0]))
  if (cubeNames.size !== 1 || conditions.some(condition => staysRowLevel(condition) || filtersComputedDimension(condition, cubes, ctx))) {
    return null
  }
  const [cubeName] = cubeNames
  return { cubeName, filter, conditions }
}

/**
 * Detach from a join plan every subtree that reaches only cubes used for
 * filtering, so the query tests it with an existence condition on the cube it
 * hangs from instead of joining it. A filter-only cube that the plan still
 * joins, because a used cube lies beyond it, keeps its filters row by row.
 *
 * @param primaryCubeName - Cube that the join plan starts from
 * @param joins - Join plan over the used cubes and the filter-only cubes
 * @param usedCubes - Cubes that the query uses for more than filtering
 * @param filtersByCube - Filters by filter-only cube, from `splitExistenceFilters`
 * @returns The joins to keep, the detached joins and the filters to keep row by row, or null when a detached join uses a custom comparator or a right or full join type
 */
export function detachExistenceJoins(
  primaryCubeName: string,
  joins: PlannedJoin[],
  usedCubes: Set<string>,
  filtersByCube: Map<string, Filter[]>
): { joins: JoinRef[]; existenceJoins: ExistenceJoin[]; rowLevelFilters: Filter[] } | null {
  const joinsFrom = new Map<string, PlannedJoin[]>()
  for (const join of joins) {
    joinsFrom.set(join.sourceCubeName, [...(joinsFrom.get(join.sourceCubeName) ?? []), join])
  }
  const reachesUsedCube = (join: PlannedJoin): boolean =>
    usedCubes.has(join.target.name) || (joinsFrom.get(join.target.name) ?? []).some(reachesUsedCube)
  const toExistenceJoin = (join: PlannedJoin): ExistenceJoin => ({
    cube: join.target.cube,
    joinDef: join.joinDef,
    reversed: join.reversed,
    joinType: join.joinType,
    filters: filtersByCube.get(join.target.name) ?? [],
    joins: (joinsFrom.get(join.target.name) ?? []).map(toExistenceJoin)
  })

  const keptJoins = joins.filter(reachesUsedCube)
  const keptCubes = new Set([primaryCubeName, ...keptJoins.map(join => join.target.name)])
  const existenceJoins = joins
    .filter(join => keptCubes.has(join.sourceCubeName) && !reachesUsedCube(join))
    .map(toExistenceJoin)

  if (listExistenceJoins(existenceJoins).some(needsRowLevelJoin)) {
    return null
  }
  const rowLevelFilters = keptJoins.flatMap(join => filtersByCube.get(join.target.name) ?? [])
  return { joins: keptJoins, existenceJoins, rowLevelFilters }
}

/** Operators whose filter matches the NULL values that a missing related row gives a row-level join. */
const MISSING_ROW_OPERATORS = new Set<FilterOperator>(['notSet', 'isEmpty'])

/**
 * Whether a filter keeps the row-level join: it matches a missing related row,
 * or it has no values. A filter with no values builds no SQL, or FALSE for
 * `equals`, so an existence test would have nothing to compare, while the
 * row-level join still keeps or drops records through its join type, a
 * junction table's security condition and the joined cube's own joins.
 */
function staysRowLevel(filter: FilterCondition): boolean {
  const hasNoValues = !NO_VALUE_FILTER_OPERATORS.has(filter.operator) && !filter.dateRange &&
    (filter.values ?? []).every(isDiscardedFilterValue)
  return MISSING_ROW_OPERATORS.has(filter.operator) || hasNoValues
}

/**
 * Whether a condition filters a dimension that is not a plain column: its
 * `sql` is an expression, or a function of the query context that returns
 * one. A column of the cube's table, or of a table the cube joins inside
 * itself, is NULL on a missing related row, so no filter that moves matches
 * that row. An expression can turn the NULL into a value that a filter
 * matches, as `COALESCE` does, and the row-level join then keeps a record
 * that has no related row.
 *
 * The SQL builders can take a filter's SQL from the query's filter cache
 * without calling the dimension's function again, so a function that fails
 * here proves nothing about the query and counts as computed.
 *
 * @param condition - Filter condition
 * @param cubes - Every registered cube
 * @param ctx - Query context, for dimensions that are functions of it
 * @returns True for a dimension whose `sql` is not a column or whose function throws; false for a column, a measure and an unknown member
 */
function filtersComputedDimension(condition: FilterCondition, cubes: Map<string, Cube>, ctx: QueryContext): boolean {
  const [cubeName, field] = condition.member.split('.')
  const dimension = cubes.get(cubeName)?.dimensions?.[field]
  if (!dimension) {
    return false
  }
  try {
    return !is(typeof dimension.sql === 'function' ? dimension.sql(ctx) : dimension.sql, Column)
  } catch {
    return true
  }
}

function measureDependencies(cubes: Map<string, Cube>, measures: string[]): Set<string> {
  const members = new Set<string>()
  const visit = (member: string) => {
    if (members.has(member)) return
    members.add(member)
    const [cubeName, field] = member.split('.')
    const measure = cubes.get(cubeName)?.measures?.[field]
    if (!measure) return
    if (measure.calculatedSql) getMemberReferences(measure.calculatedSql, cubeName).forEach(visit)
    const windowBase = getWindowBaseMeasure(measure, cubeName)
    if (windowBase) visit(windowBase)
  }
  measures.forEach(visit)
  return members
}

/** Pre-aggregations of a physical plan. */
type PreAggregations = NonNullable<PhysicalQueryPlan['preAggregationCTEs']>

/**
 * Keep the restrictions that the row-level plan's pre-aggregations put on a
 * joined measure cube.
 *
 * The row-level plan pre-aggregates a joined cube that holds measures when a
 * join multiplies its rows, and the join of a filter-only cube can be that
 * join. A pre-aggregation follows the joins that the measure cube and other
 * cubes of the query declare to one another, not the planned join path: the
 * filters of a cube that declares a `hasMany` join to the measure cube are
 * pushed into it, and a cube that the measure cube declares a join to is
 * joined on its rows by that join, compared for equality. The plan without the
 * filter-only cubes may not pre-aggregate, and every cube is then joined or
 * tested along the planned path.
 *
 * The two agree when each pushed-in filter comes over the measure cube's
 * planned join, and each cube joined on the pre-aggregated rows is a detached
 * cube that hangs from a joined cube and is tested from the measure cube
 * through the declared join, so each one is moved to that join. Its keys are
 * compared for equality there, as on the pre-aggregated rows.
 *
 * @param cubes - Registered cubes
 * @param joins - Join plan over the used cubes and the filter-only cubes
 * @param existenceJoins - Detached joins, from `detachExistenceJoins`
 * @param preAggregations - Pre-aggregations of the row-level plan over `joins`
 * @returns The detached joins, each hanging where the row-level plan joins its cube, or null when the plan without the filter-only cubes would lose a restriction of a pre-aggregation: a filter pushed in over another join than the planned one, or a cube joined on the pre-aggregated rows that stays joined, hangs from a detached cube, or is joined there by several joins or through a junction table
 */
export function followPreAggregations(
  cubes: Map<string, Cube>,
  joins: PlannedJoin[],
  existenceJoins: ExistenceJoin[],
  preAggregations: PreAggregations
): ExistenceJoin[] | null {
  const plannedJoin = (cubeName: string) => joins.find(join => join.target.name === cubeName)
  const declaredJoins = (from: Cube, toCubeName: string) => Object.values(from.joins ?? {})
    .filter(joinDef => resolveCubeReference(joinDef.targetCube, cubes)?.name === toCubeName)

  const joinedOnRows = new Map<string, CubeJoin[]>()
  for (const { cube, propagatingFilters = [], downstreamJoinKeys = [] } of preAggregations) {
    const measureJoin = plannedJoin(cube.name)
    const pushedOverAnotherJoin = propagatingFilters.some(filter => declaredJoins(filter.sourceCube, cube.name)
      .some(joinDef => joinDef.relationship === 'hasMany' && joinDef !== measureJoin?.joinDef))
    if (pushedOverAnotherJoin) {
      return null
    }
    for (const cubeName of new Set(downstreamJoinKeys.map(key => key.targetCubeName))) {
      joinedOnRows.set(cubeName, [...(joinedOnRows.get(cubeName) ?? []), ...declaredJoins(cube, cubeName)])
    }
  }

  const followed = [...existenceJoins]
  for (const [cubeName, [joinDef, ...otherJoins]] of joinedOnRows) {
    if (!plannedJoin(cubeName)) continue
    const root = followed.findIndex(existenceJoin => existenceJoin.cube.name === cubeName)
    if (root < 0 || otherJoins.length > 0 || joinDef.through) return null
    followed[root] = { ...followed[root], joinDef, reversed: false }
  }
  return followed
}

export function listExistenceJoins(joins: ExistenceJoin[]): ExistenceJoin[] {
  return joins.flatMap(join => [join, ...listExistenceJoins(join.joins)])
}

function needsRowLevelJoin(join: ExistenceJoin): boolean {
  const keys: CubeJoin['on'] = [
    ...join.joinDef.on,
    ...(join.joinDef.through?.sourceKey ?? []),
    ...(join.joinDef.through?.targetKey ?? [])
  ]
  return keys.some(key => key.as) || join.joinType === 'right' || join.joinType === 'full'
}
