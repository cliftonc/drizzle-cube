/**
 * Cube filters across cube joins
 *
 * Every table in the test database holds rows of several organisations. Each
 * cube here exposes two members that attribute a result to an organisation:
 *   - `organisationId`, the organisation of the row a dimension value came from
 *   - `otherOrganisationRows`, a sum that counts the aggregated rows of any
 *     organisation other than the caller's
 *
 * A query run for one organisation must return neither another organisation's
 * id nor a non-zero count from a cube that filters by organisation. The matrix
 * checks that for every SQL join type, relationship, primary-cube filter and
 * planner path that joins cubes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, getTableColumns, getTableName, isNull, ne, or, sql } from 'drizzle-orm'
import type { AnyColumn, SQL, Table } from 'drizzle-orm'
import { int, mysqlTable } from 'drizzle-orm/mysql-core'
import { integer as pgInteger, pgTable } from 'drizzle-orm/pg-core'
import { integer as sqliteInteger, sqliteTable } from 'drizzle-orm/sqlite-core'
import { defineCube } from '../src/server/cube-utils'
import type {
  BaseQueryDefinition,
  Cube,
  CubeJoin,
  DatabaseExecutor,
  QueryableRelation,
  QueryContext,
  SemanticQuery
} from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createDuckDBExecutor } from '../src/server/executors/duckdb-executor'
import { createTestDatabaseExecutor, getTestDatabaseType, getTestSchema } from './helpers/test-database'
import { createDuckDBConnection } from './helpers/databases/duckdb/setup'
import { testSecurityContexts } from './helpers/enhanced-test-data'

type JoinType = 'inner' | 'left' | 'right' | 'full'
type CubeFilter = 'tenant filter' | 'no filter' | 'null-passing filter'
type TenantTable = QueryableRelation & { id: AnyColumn; organisationId: AnyColumn }
type TestTables = Awaited<ReturnType<typeof getTestSchema>>

interface Cell {
  name: string
  /** A cube join or an internal join of the cell is a full join, which MySQL lacks. */
  fullJoin: boolean
  cubes: Cube[]
  query: SemanticQuery
  /** Cubes that filter by organisation: none of their rows may come from another one. */
  isolated: string[]
}

const JOIN_TYPES: JoinType[] = ['inner', 'left', 'right', 'full']
const PRIMARY_FILTERS: CubeFilter[] = ['tenant filter', 'no filter', 'null-passing filter']
const supportsFullJoin = getTestDatabaseType() !== 'mysql'
/** In-process databases are created for the run, so their ids start at 1 in every table. */
const seededFromEmpty = ['sqlite', 'duckdb'].includes(getTestDatabaseType())
const caller = testSecurityContexts.org1

function organisationFilter(table: TenantTable, filter: CubeFilter, ctx: QueryContext): SQL | undefined {
  const own = eq(table.organisationId, ctx.securityContext.organisationId)
  if (filter === 'no filter') return undefined
  return filter === 'tenant filter' ? own : or(own, isNull(table.organisationId))
}

/**
 * The caller's rows of `table` as a subquery under the table's name, for a cube
 * that filters its own relation. DuckDB's driver aliases the fields of a bare
 * `select()`, so its fields are keyed by column name.
 */
function ownRows(table: TenantTable & Table, ctx: QueryContext): QueryableRelation {
  const columns = Object.fromEntries(Object.values(getTableColumns(table)).map(column => [column.name, column]))
  const selection = getTestDatabaseType() === 'duckdb' ? ctx.db.select(columns) : ctx.db.select()
  return selection
    .from(table)
    .where(eq(table.organisationId, ctx.securityContext.organisationId))
    .as(getTableName(table))
}

/** A cube over one table with the two attribution members and the given filter. */
function tenantCube(
  name: string,
  table: TenantTable,
  filter: CubeFilter,
  options: {
    joins?: Record<string, CubeJoin>
    internalJoins?: BaseQueryDefinition['joins']
    dimensions?: Cube['dimensions']
    from?: (ctx: QueryContext) => QueryableRelation
  } = {}
): Cube {
  return defineCube(name, {
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: options.from?.(ctx) ?? table,
      joins: options.internalJoins,
      where: organisationFilter(table, filter, ctx)
    }),
    joins: options.joins,
    dimensions: {
      id: { name: 'id', type: 'number', sql: table.id, primaryKey: true },
      organisationId: { name: 'organisationId', type: 'number', sql: table.organisationId },
      ...options.dimensions
    },
    measures: {
      count: { name: 'count', type: 'count', sql: table.id },
      otherOrganisationRows: {
        name: 'otherOrganisationRows',
        type: 'sum',
        sql: (ctx: QueryContext) =>
          sql`case when ${table.organisationId} <> ${ctx.securityContext.organisationId} then 1 else 0 end`
      }
    }
  })
}

function isolatedWhen(cubeName: string, filter: CubeFilter): string[] {
  return filter === 'no filter' ? [] : [cubeName]
}

/** Rows that carry another organisation's id, or count its rows, in an isolated cube's members. */
function otherOrganisationRows(rows: Record<string, unknown>[], isolated: string[]): Record<string, unknown>[] {
  return rows.filter(row =>
    Object.entries(row).some(([member, value]) => {
      const [cubeName, field] = member.split('.')
      if (!isolated.includes(cubeName) || value === null || value === undefined) return false
      if (field === 'otherOrganisationRows') return Number(value) !== 0
      return field.endsWith('rganisationId') && Number(value) !== caller.organisationId
    })
  )
}

interface SeedRow {
  id: number
  organisationId: number | null
  departmentId?: number | null
  employeeId?: number | null
  teamId?: number | null
  role?: string | null
}

/** The rows a cube over `rows` with `filter` returns to the caller. */
function visibleTo(rows: SeedRow[], filter: CubeFilter): SeedRow[] {
  if (filter === 'no filter') return rows
  return rows.filter(
    row =>
      row.organisationId === caller.organisationId ||
      (filter === 'null-passing filter' && row.organisationId === null)
  )
}

/** The SQL join of two row sets, as pairs with null for the missing side. */
function joinRows<L, R>(
  left: L[],
  right: R[],
  joinType: JoinType,
  matches: (left: L, right: R) => boolean
): Array<[L | null, R | null]> {
  const rows: Array<[L | null, R | null]> = []
  const matched = new Set<R>()
  for (const leftRow of left) {
    const partners = right.filter(rightRow => matches(leftRow, rightRow))
    for (const partner of partners) {
      matched.add(partner)
      rows.push([leftRow, partner])
    }
    if (partners.length === 0 && (joinType === 'left' || joinType === 'full')) rows.push([leftRow, null])
  }
  if (joinType === 'right' || joinType === 'full') {
    rows.push(...right.filter(rightRow => !matched.has(rightRow)).map((rightRow): [null, R] => [null, rightRow]))
  }
  return rows
}

const sameId = (left: SeedRow, right: SeedRow) => left.id === right.id
const idOf = (row: SeedRow | null) => row?.id ?? null
const distinctSorted = (values: string[]) => [...new Set(values)].sort()

const staffMembers = ['Staff.id', 'Staff.organisationId', 'Staff.departmentId', 'Staff.departmentOrganisationId']
const staffRows = (rows: Record<string, unknown>[]) =>
  distinctSorted(
    rows
      .filter(row => row['Staff.id'] !== null || row['Staff.departmentId'] !== null)
      .map(row => `${row['Staff.id']}:${row['Staff.departmentId']}`)
  )

function narrowEmployees(): TenantTable & Table & { departmentId: AnyColumn } {
  switch (getTestDatabaseType()) {
    case 'mysql':
      return mysqlTable('employees', { id: int('id'), organisationId: int('organisation_id'), departmentId: int('department_id') })
    case 'sqlite':
      return sqliteTable('employees', {
        id: sqliteInteger('id'),
        organisationId: sqliteInteger('organisation_id'),
        departmentId: sqliteInteger('department_id')
      })
    default:
      return pgTable('employees', {
        id: pgInteger('id'),
        organisationId: pgInteger('organisation_id'),
        departmentId: pgInteger('department_id')
      })
  }
}

/** Dimensions only, measures on the joined cube, and measures on both cubes. */
function queryShapes(primary: string, joined: string): Array<{ shape: string; query: SemanticQuery }> {
  const attribution = (cubeName: string) => [`${cubeName}.count`, `${cubeName}.otherOrganisationRows`]
  return [
    {
      shape: 'dimensions only',
      query: { dimensions: [`${primary}.id`, `${primary}.organisationId`, `${joined}.organisationId`] }
    },
    {
      shape: 'measures on the joined cube',
      query: { dimensions: [`${primary}.organisationId`], measures: attribution(joined) }
    },
    {
      shape: 'measures on both cubes',
      query: { dimensions: [`${primary}.organisationId`], measures: [...attribution(primary), ...attribution(joined)] }
    }
  ]
}

/** Two cubes joined by each relationship and join type, for each filter on the cube that declares the join. */
function twoCubeCells(tables: TestTables): Cell[] {
  const { employees, departments, teams, employeeTeams } = tables
  const employeeTeamsThrough = {
    table: employeeTeams,
    sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
    targetKey: [{ source: employeeTeams.teamId, target: teams.id }]
  }
  const relationships: Array<{
    label: string
    source: [string, TenantTable]
    target: [string, TenantTable]
    join: Pick<CubeJoin, 'relationship' | 'on' | 'through'>
  }> = [
    {
      label: 'belongsTo',
      source: ['Employees', employees],
      target: ['Departments', departments],
      join: { relationship: 'belongsTo', on: [{ source: employees.departmentId, target: departments.id }] }
    },
    {
      label: 'hasOne',
      source: ['Departments', departments],
      target: ['Employees', employees],
      join: { relationship: 'hasOne', on: [{ source: departments.id, target: employees.departmentId }] }
    },
    {
      label: 'hasMany',
      source: ['Departments', departments],
      target: ['Employees', employees],
      join: { relationship: 'hasMany', on: [{ source: departments.id, target: employees.departmentId }] }
    },
    {
      label: 'belongsToMany with a junction filter',
      source: ['Employees', employees],
      target: ['Teams', teams],
      join: {
        relationship: 'belongsToMany',
        on: [],
        through: {
          ...employeeTeamsThrough,
          securitySql: securityContext => eq(employeeTeams.organisationId, securityContext.organisationId)
        }
      }
    },
    {
      label: 'belongsToMany without a junction filter',
      source: ['Employees', employees],
      target: ['Teams', teams],
      join: { relationship: 'belongsToMany', on: [], through: employeeTeamsThrough }
    }
  ]

  const cells: Cell[] = []
  for (const { label, source, target, join } of relationships) {
    for (const joinType of JOIN_TYPES) {
      for (const primaryFilter of PRIMARY_FILTERS) {
        const targetCube = tenantCube(target[0], target[1], 'tenant filter')
        const sourceCube = tenantCube(source[0], source[1], primaryFilter, {
          joins: { [target[0]]: { ...join, targetCube: () => targetCube, sqlJoinType: joinType } }
        })
        for (const { shape, query } of queryShapes(source[0], target[0])) {
          cells.push({
            name: `${label}, ${joinType} join, ${source[0]} with ${primaryFilter}, ${shape}`,
            fullJoin: joinType === 'full',
            cubes: [sourceCube, targetCube],
            query,
            isolated: [target[0], ...isolatedWhen(source[0], primaryFilter)]
          })
        }
      }
    }
  }
  return cells
}

/** Two fact cubes that each join a shared dimension cube: the second fact is reached over a reversed join. */
function reversedPathCells(tables: TestTables): Cell[] {
  const { products, sales, inventory } = tables
  const cells: Cell[] = []
  for (const joinType of JOIN_TYPES) {
    for (const primaryFilter of PRIMARY_FILTERS) {
      const productsCube = tenantCube('Products', products, 'tenant filter')
      const toProducts = (productId: AnyColumn): Record<string, CubeJoin> => ({
        Products: {
          targetCube: () => productsCube,
          relationship: 'belongsTo',
          sqlJoinType: joinType,
          on: [{ source: productId, target: products.id }]
        }
      })
      cells.push({
        name: `reversed path, ${joinType} joins, Inventory with ${primaryFilter}`,
        fullJoin: joinType === 'full',
        cubes: [
          tenantCube('Inventory', inventory, primaryFilter, { joins: toProducts(inventory.productId) }),
          productsCube,
          tenantCube('Sales', sales, 'tenant filter', { joins: toProducts(sales.productId) })
        ],
        query: {
          dimensions: ['Inventory.id', 'Inventory.organisationId', 'Products.organisationId', 'Sales.organisationId']
        },
        isolated: ['Products', 'Sales', ...isolatedWhen('Inventory', primaryFilter)]
      })
    }
  }
  return cells
}

/** Departments -> Employees -> Productivity, where the last hop is pre-aggregated through the middle cube. */
function multiHopCells(tables: TestTables): Cell[] {
  const { employees, departments, productivity } = tables
  const cells: Cell[] = []
  for (const joinType of JOIN_TYPES) {
    for (const primaryFilter of PRIMARY_FILTERS) {
      const productivityCube = tenantCube('Productivity', productivity, 'tenant filter')
      const employeesCube = tenantCube('Employees', employees, 'tenant filter', {
        joins: {
          Productivity: {
            targetCube: () => productivityCube,
            relationship: 'hasMany',
            sqlJoinType: joinType,
            on: [{ source: employees.id, target: productivity.employeeId }]
          }
        }
      })
      const departmentsCube = tenantCube('Departments', departments, primaryFilter, {
        joins: {
          Employees: {
            targetCube: () => employeesCube,
            relationship: 'hasMany',
            sqlJoinType: joinType,
            on: [{ source: departments.id, target: employees.departmentId }]
          }
        }
      })
      cells.push({
        name: `multi-hop, ${joinType} joins, Departments with ${primaryFilter}`,
        fullJoin: joinType === 'full',
        cubes: [departmentsCube, employeesCube, productivityCube],
        query: {
          dimensions: ['Departments.organisationId'],
          measures: ['Productivity.count', 'Productivity.otherOrganisationRows']
        },
        isolated: ['Employees', 'Productivity', ...isolatedWhen('Departments', primaryFilter)]
      })
    }
  }
  return cells
}

/** Departments -> TimeEntries -> Employees, where Employees joins the pre-aggregated TimeEntries. */
function joinThroughPreAggregationCells(tables: TestTables): Cell[] {
  const { employees, departments, timeEntries } = tables
  const cells: Cell[] = []
  for (const joinType of JOIN_TYPES) {
    for (const primaryFilter of PRIMARY_FILTERS) {
      const employeesCube = tenantCube('Employees', employees, 'tenant filter')
      const timeEntriesCube = tenantCube('TimeEntries', timeEntries, 'tenant filter', {
        joins: {
          Employees: {
            targetCube: () => employeesCube,
            relationship: 'belongsTo',
            sqlJoinType: joinType,
            on: [{ source: timeEntries.employeeId, target: employees.id }]
          }
        }
      })
      const departmentsCube = tenantCube('Departments', departments, primaryFilter, {
        joins: {
          TimeEntries: {
            targetCube: () => timeEntriesCube,
            relationship: 'hasMany',
            sqlJoinType: joinType,
            on: [{ source: departments.id, target: timeEntries.departmentId }]
          }
        }
      })
      cells.push({
        name: `join through a pre-aggregation, ${joinType} joins, Departments with ${primaryFilter}`,
        fullJoin: joinType === 'full',
        cubes: [departmentsCube, timeEntriesCube, employeesCube],
        query: {
          dimensions: ['Departments.id', 'Departments.organisationId', 'Employees.organisationId'],
          measures: ['TimeEntries.count', 'TimeEntries.otherOrganisationRows']
        },
        isolated: ['TimeEntries', 'Employees', ...isolatedWhen('Departments', primaryFilter)]
      })
    }
  }
  return cells
}

/** Filters evaluated in a subquery: one that propagates into a pre-aggregation, and an OR group across it. */
function filterSubqueryCells(tables: TestTables): Cell[] {
  const { employees, productivity } = tables
  const anyOrganisation = (cubeName: string) => ({
    member: `${cubeName}.organisationId`,
    operator: 'gt' as const,
    values: [0]
  })
  const cells: Cell[] = []
  for (const joinType of JOIN_TYPES) {
    for (const primaryFilter of PRIMARY_FILTERS) {
      const productivityCube = tenantCube('Productivity', productivity, 'tenant filter')
      const employeesCube = tenantCube('Employees', employees, primaryFilter, {
        joins: {
          Productivity: {
            targetCube: () => productivityCube,
            relationship: 'hasMany',
            sqlJoinType: joinType,
            on: [{ source: employees.id, target: productivity.employeeId }]
          }
        }
      })
      const shapes: Array<[string, SemanticQuery['filters']]> = [
        ['propagated filter', [anyOrganisation('Employees')]],
        ['OR group across cubes', [{ or: [anyOrganisation('Employees'), anyOrganisation('Productivity')] }]]
      ]
      for (const [shape, filters] of shapes) {
        cells.push({
          name: `${shape}, ${joinType} join, Employees with ${primaryFilter}`,
          fullJoin: joinType === 'full',
          cubes: [employeesCube, productivityCube],
          query: {
            dimensions: ['Employees.organisationId'],
            measures: ['Productivity.count', 'Productivity.otherOrganisationRows'],
            filters
          },
          isolated: ['Productivity', ...isolatedWhen('Employees', primaryFilter)]
        })
      }
    }
  }
  return cells
}

/** Period-over-period comparison of a joined cube's measures, planned once per period. */
function comparisonCells(tables: TestTables): Cell[] {
  const { employees, departments } = tables
  const cells: Cell[] = []
  for (const joinType of JOIN_TYPES) {
    for (const primaryFilter of PRIMARY_FILTERS) {
      const departmentsCube = tenantCube('Departments', departments, 'tenant filter')
      const employeesCube = tenantCube('Employees', employees, primaryFilter, {
        joins: {
          Departments: {
            targetCube: () => departmentsCube,
            relationship: 'hasOne',
            sqlJoinType: joinType,
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        dimensions: { createdAt: { name: 'createdAt', type: 'time', sql: employees.createdAt } }
      })
      cells.push({
        name: `comparison, ${joinType} join, Employees with ${primaryFilter}`,
        fullJoin: joinType === 'full',
        cubes: [employeesCube, departmentsCube],
        query: {
          measures: ['Departments.count', 'Departments.otherOrganisationRows'],
          timeDimensions: [
            {
              dimension: 'Employees.createdAt',
              granularity: 'year',
              compareDateRange: [
                ['2020-01-01', '2021-12-31'],
                ['2022-01-01', '2023-12-31']
              ]
            }
          ]
        },
        isolated: ['Departments', ...isolatedWhen('Employees', primaryFilter)]
      })
    }
  }
  return cells
}

/** Two fact cubes merged on a shared dimension cube (the planner's own full join between measure groups). */
function multiFactCells(tables: TestTables): Cell[] {
  const { products, sales, inventory } = tables
  const cells: Cell[] = []
  for (const joinType of JOIN_TYPES) {
    for (const dimensionFilter of PRIMARY_FILTERS) {
      for (const backReferences of [false, true]) {
        const factCubes: Cube[] = []
        const productsCube = tenantCube('Products', products, dimensionFilter, {
          joins: backReferences
            ? {
                Sales: {
                  targetCube: () => factCubes[0],
                  relationship: 'hasMany',
                  sqlJoinType: joinType,
                  on: [{ source: products.id, target: sales.productId }]
                },
                Inventory: {
                  targetCube: () => factCubes[1],
                  relationship: 'hasMany',
                  sqlJoinType: joinType,
                  on: [{ source: products.id, target: inventory.productId }]
                }
              }
            : undefined
        })
        const toProducts = (productId: AnyColumn): Record<string, CubeJoin> => ({
          Products: {
            targetCube: () => productsCube,
            relationship: 'belongsTo',
            sqlJoinType: joinType,
            on: [{ source: productId, target: products.id }]
          }
        })
        factCubes.push(
          tenantCube('Sales', sales, 'tenant filter', { joins: toProducts(sales.productId) }),
          tenantCube('Inventory', inventory, 'tenant filter', { joins: toProducts(inventory.productId) })
        )
        cells.push({
          name: `multi-fact merge, ${joinType} joins, Products with ${dimensionFilter}${backReferences ? ' and joins back to the facts' : ''}`,
          fullJoin: joinType === 'full',
          cubes: [productsCube, ...factCubes],
          query: {
            dimensions: ['Products.organisationId'],
            measures: ['Sales.count', 'Sales.otherOrganisationRows', 'Inventory.count', 'Inventory.otherOrganisationRows']
          },
          isolated: ['Sales', 'Inventory', ...isolatedWhen('Products', dimensionFilter)]
        })
      }
    }
  }
  return cells
}

/** A cube whose own `sql` joins a second table, as the joined cube and as the primary cube. */
function internalJoinCells(tables: TestTables): Cell[] {
  const { employees, departments, productivity } = tables
  const cells: Cell[] = []
  for (const internalJoinType of JOIN_TYPES) {
    const staffCube = (filter: CubeFilter) =>
      tenantCube('Staff', employees, filter, {
        internalJoins: [{ table: departments, on: eq(employees.departmentId, departments.id), type: internalJoinType }],
        dimensions: {
          departmentOrganisationId: { name: 'departmentOrganisationId', type: 'number', sql: departments.organisationId }
        }
      })
    cells.push({
      name: `internal ${internalJoinType} join, Staff alone`,
      fullJoin: internalJoinType === 'full',
      cubes: [staffCube('tenant filter')],
      query: { dimensions: ['Staff.id', 'Staff.organisationId', 'Staff.departmentOrganisationId'] },
      isolated: ['Staff']
    })
    for (const joinType of JOIN_TYPES) {
      for (const primaryFilter of PRIMARY_FILTERS) {
        const staff = staffCube('tenant filter')
        const productivityCube = tenantCube('Productivity', productivity, primaryFilter, {
          joins: {
            Staff: {
              targetCube: () => staff,
              relationship: 'belongsTo',
              sqlJoinType: joinType,
              on: [{ source: productivity.employeeId, target: employees.id }]
            }
          }
        })
        cells.push({
          name: `internal ${internalJoinType} join, ${joinType} join to Staff, Productivity with ${primaryFilter}`,
          fullJoin: internalJoinType === 'full' || joinType === 'full',
          cubes: [productivityCube, staff],
          query: {
            dimensions: [
              'Productivity.id',
              'Productivity.organisationId',
              'Staff.organisationId',
              'Staff.departmentOrganisationId'
            ]
          },
          isolated: ['Staff', ...isolatedWhen('Productivity', primaryFilter)]
        })
      }
    }
  }
  return cells
}

const tables = await getTestSchema()
const matrix: Record<string, Cell[]> = {
  'two cubes': twoCubeCells(tables),
  'reversed join path': reversedPathCells(tables),
  'multi-hop pre-aggregation': multiHopCells(tables),
  'join through a pre-aggregation': joinThroughPreAggregationCells(tables),
  'multi-fact merge': multiFactCells(tables),
  'filter subqueries': filterSubqueryCells(tables),
  'comparison': comparisonCells(tables),
  "a cube's internal joins": internalJoinCells(tables)
}

describe('Cube filters across cube joins', () => {
  let executor: QueryExecutor
  let db: DatabaseExecutor['db']
  let close: () => void
  let seed: Record<'departments' | 'teams' | 'employees' | 'employeeTeams', SeedRow[]>

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    close = created.close
    db = created.executor.db
    executor = new QueryExecutor(created.executor)

    const { departments, teams, employees, employeeTeams } = tables
    const load = async (table: TenantTable, columns: Record<string, AnyColumn> = {}): Promise<SeedRow[]> => {
      const rows: Array<Record<string, unknown>> = await db
        .select({ id: table.id, organisationId: table.organisationId, ...columns })
        .from(table)
      return rows.map(row => ({
        ...Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, value === null || key === 'role' ? value : Number(value)])
        ),
        id: Number(row.id),
        organisationId: row.organisationId === null ? null : Number(row.organisationId)
      }))
    }
    seed = {
      departments: await load(departments),
      teams: await load(teams),
      employees: await load(employees, { departmentId: employees.departmentId }),
      employeeTeams: await load(employeeTeams, {
        employeeId: employeeTeams.employeeId,
        teamId: employeeTeams.teamId,
        role: employeeTeams.role
      })
    }
  })

  afterAll(() => {
    close?.()
  })

  it('has rows of other organisations in every table the matrix joins', async () => {
    const { employees, departments, teams, employeeTeams, productivity, products, sales, inventory } = tables
    for (const table of [employees, departments, teams, employeeTeams, productivity, products, sales, inventory]) {
      const [row] = await db
        .select({ rows: sql<number>`count(*)` })
        .from(table)
        .where(ne(table.organisationId, caller.organisationId))
      expect(Number(row.rows)).toBeGreaterThan(0)
    }
  })

  for (const [group, cells] of Object.entries(matrix)) {
    describe(group, () => {
      for (const cell of cells) {
        it.skipIf(cell.fullJoin && !supportsFullJoin)(cell.name, async () => {
          const result = await executor.execute(
            new Map(cell.cubes.map(cube => [cube.name, cube])),
            cell.query,
            caller
          )
          expect(otherOrganisationRows(result.data, cell.isolated)).toEqual([])
        })
      }
    })
  }

  describe("right and full joins keep each side's unmatched rows", () => {
    for (const joinType of ['right', 'full'] as const) {
      for (const relation of ['its table', 'a subquery of its own rows'] as const) {
        const name = `${joinType} join from a cube without a filter to a cube over ${relation}`
        it.skipIf(joinType === 'full' && !supportsFullJoin)(name, async () => {
          const { employees, departments } = tables
          const employeesCube = tenantCube('Employees', employees, 'tenant filter', {
            from: relation === 'its table' ? undefined : ctx => ownRows(employees, ctx)
          })
          const departmentsCube = tenantCube('Departments', departments, 'no filter', {
            joins: {
              Employees: {
                targetCube: () => employeesCube,
                relationship: 'hasMany',
                sqlJoinType: joinType,
                on: [{ source: departments.id, target: employees.departmentId }]
              }
            }
          })
          const result = await executor.execute(
            new Map([
              ['Departments', departmentsCube],
              ['Employees', employeesCube]
            ]),
            { dimensions: ['Departments.id', 'Employees.id'] },
            caller
          )

          const departmentIds: number[] = (await db.select({ id: departments.id }).from(departments)).map(
            (row: { id: number }) => Number(row.id)
          )
          const ownEmployees: Array<{ id: number; departmentId: number | null }> = await db
            .select({ id: employees.id, departmentId: employees.departmentId })
            .from(employees)
            .where(eq(employees.organisationId, caller.organisationId))
          const staffed = new Set(ownEmployees.map(employee => employee.departmentId))
          const expected = [
            ...ownEmployees.map(employee => `${employee.departmentId ?? null}:${employee.id}`),
            ...(joinType === 'full' ? departmentIds.filter(id => !staffed.has(id)).map(id => `${id}:null`) : [])
          ]
          expect(ownEmployees.some(employee => employee.departmentId === null)).toBe(true)
          expect(result.data.map(row => `${row['Departments.id']}:${row['Employees.id']}`).sort()).toEqual(
            expected.sort()
          )
        })
      }
    }
  })

  describe('a cube with an internal join over subqueries of its own rows', () => {
    for (const internalJoin of ['right', 'full'] as const) {
      for (const joinType of ['left', 'right', 'full'] as const) {
        const name = `internal ${internalJoin} join, ${joinType} join to Staff, returns the rows Staff returns alone`
        it.skipIf((internalJoin === 'full' || joinType === 'full') && !supportsFullJoin)(name, async () => {
          const { employees, departments, productivity } = tables
          const staffCube = defineCube('Staff', {
            sql: (ctx: QueryContext): BaseQueryDefinition => ({
              from: ownRows(employees, ctx),
              joins: [
                {
                  table: ownRows(departments, ctx),
                  on: eq(employees.departmentId, departments.id),
                  type: internalJoin
                }
              ],
              where: eq(employees.organisationId, ctx.securityContext.organisationId)
            }),
            dimensions: {
              id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
              organisationId: { name: 'organisationId', type: 'number', sql: employees.organisationId },
              departmentId: { name: 'departmentId', type: 'number', sql: departments.id },
              departmentOrganisationId: {
                name: 'departmentOrganisationId',
                type: 'number',
                sql: departments.organisationId
              }
            },
            measures: { count: { name: 'count', type: 'count', sql: employees.id } }
          })
          const productivityCube = tenantCube('Productivity', productivity, 'no filter', {
            joins: {
              Staff: {
                targetCube: () => staffCube,
                relationship: 'belongsTo',
                sqlJoinType: joinType,
                on: [{ source: productivity.employeeId, target: employees.id }]
              }
            }
          })

          const alone = await executor.execute(new Map([['Staff', staffCube]]), { dimensions: staffMembers }, caller)
          const joined = await executor.execute(
            new Map([
              ['Productivity', productivityCube],
              ['Staff', staffCube]
            ]),
            { dimensions: ['Productivity.id', ...staffMembers] },
            caller
          )

          expect(otherOrganisationRows(joined.data, ['Staff'])).toEqual([])
          expect(staffRows(alone.data).length).toBeGreaterThan(0)
          if (joinType === 'left') {
            expect(staffRows(alone.data)).toEqual(expect.arrayContaining(staffRows(joined.data)))
          } else {
            expect(staffRows(joined.data)).toEqual(staffRows(alone.data))
          }
        })
      }
    }
  })

  describe('two cubes joined on a key that organisations share return the join of their own rows', () => {
    const shapes = [
      { shape: 'dimensions only', relationship: 'hasMany', counts: false },
      { shape: 'a count through a pre-aggregation', relationship: 'hasMany', counts: true },
      { shape: 'a count through keys deduplication', relationship: 'belongsTo', counts: true },
      { shape: 'a count on a plain join', relationship: 'hasOne', counts: true }
    ] as const
    const pairs = [
      { primary: 'Departments', primaryRows: 'departments', joined: 'Teams', joinedRows: 'teams' },
      { primary: 'Teams', primaryRows: 'teams', joined: 'Employees', joinedRows: 'employees' }
    ] as const

    it.runIf(seededFromEmpty)('has rows whose id only a row of another organisation shares, on each side of a join', () => {
      const hiddenTeamIds = seed.teams.filter(team => team.organisationId !== caller.organisationId).map(idOf)
      const ownTeamIds = visibleTo(seed.teams, 'tenant filter').map(idOf)
      const matchedOnlyByHidden = (rows: SeedRow[]) =>
        rows.filter(row => hiddenTeamIds.includes(row.id) && !ownTeamIds.includes(row.id))
      expect(matchedOnlyByHidden(seed.departments).length).toBeGreaterThan(0)
      expect(matchedOnlyByHidden(visibleTo(seed.employees, 'tenant filter')).length).toBeGreaterThan(0)
    })

    for (const { primary, primaryRows, joined, joinedRows } of pairs) {
      for (const joinType of JOIN_TYPES) {
        for (const primaryFilter of PRIMARY_FILTERS) {
          for (const joinedFilter of ['tenant filter', 'null-passing filter'] as const) {
            for (const { shape, relationship, counts } of shapes) {
              const name = `${joinType} join, ${primary} with ${primaryFilter}, ${joined} with ${joinedFilter}, ${shape}`
              if (relationship === 'belongsTo' && joinType === 'left') {
                it.todo(`${name}: keys deduplication applies ${joined}'s filter in WHERE under a left join`)
                continue
              }
              it.skipIf(joinType === 'full' && !supportsFullJoin)(name, async () => {
                const primaryTable = tables[primaryRows]
                const joinedTable = tables[joinedRows]
                const joinedCube = tenantCube(joined, joinedTable, joinedFilter)
                const primaryCube = tenantCube(primary, primaryTable, primaryFilter, {
                  joins: {
                    [joined]: {
                      targetCube: () => joinedCube,
                      relationship,
                      sqlJoinType: joinType,
                      on: [{ source: primaryTable.id, target: joinedTable.id }]
                    }
                  }
                })
                const result = await executor.execute(
                  new Map([
                    [primary, primaryCube],
                    [joined, joinedCube]
                  ]),
                  counts
                    ? { dimensions: [`${primary}.organisationId`], measures: [`${joined}.count`] }
                    : { dimensions: [`${primary}.id`, `${joined}.id`] },
                  caller
                )

                const rows = joinRows(
                  visibleTo(seed[primaryRows], primaryFilter),
                  visibleTo(seed[joinedRows], joinedFilter),
                  joinType,
                  sameId
                )
                const organisationOf = (row: SeedRow | null) => row?.organisationId ?? null
                const expected = counts
                  ? [...new Set(rows.map(([left]) => organisationOf(left)))].map(
                      id => `${id}:${rows.filter(([left, right]) => organisationOf(left) === id && right).length}`
                    )
                  : rows.map(([left, right]) => `${idOf(left)}:${idOf(right)}`)
                const returned = result.data.map(row =>
                  counts
                    ? `${row[`${primary}.organisationId`]}:${Number(row[`${joined}.count`] ?? 0)}`
                    : `${row[`${primary}.id`]}:${row[`${joined}.id`]}`
                )
                expect(returned.sort()).toEqual(expected.sort())
              })
            }
          }
        }
      }
    }
  })

  describe('three cubes joined on a shared key return the join of their own rows', () => {
    for (const first of ['inner', 'left', 'right'] as const) {
      for (const second of ['right', 'full'] as const) {
        for (const middleFilter of ['tenant filter', 'null-passing filter'] as const) {
          const name = `Departments ${first} join Teams with ${middleFilter}, ${second} join Employees`
          it.skipIf(second === 'full' && !supportsFullJoin)(name, async () => {
            const { departments, teams, employees } = tables
            const employeesCube = tenantCube('Employees', employees, 'tenant filter')
            const teamsCube = tenantCube('Teams', teams, middleFilter, {
              joins: {
                Employees: {
                  targetCube: () => employeesCube,
                  relationship: 'hasMany',
                  sqlJoinType: second,
                  on: [{ source: teams.id, target: employees.id }]
                }
              }
            })
            const departmentsCube = tenantCube('Departments', departments, 'no filter', {
              joins: {
                Teams: {
                  targetCube: () => teamsCube,
                  relationship: 'hasMany',
                  sqlJoinType: first,
                  on: [{ source: departments.id, target: teams.id }]
                }
              }
            })
            const result = await executor.execute(
              new Map([
                ['Departments', departmentsCube],
                ['Teams', teamsCube],
                ['Employees', employeesCube]
              ]),
              { dimensions: ['Departments.id', 'Teams.id', 'Employees.id'] },
              caller
            )

            const expected = joinRows(
              joinRows(seed.departments, visibleTo(seed.teams, middleFilter), first, sameId),
              visibleTo(seed.employees, 'tenant filter'),
              second,
              ([, team], employee) => team?.id === employee.id
            ).map(([pair, employee]) => `${idOf(pair?.[0] ?? null)}:${idOf(pair?.[1] ?? null)}:${idOf(employee)}`)
            expect(
              result.data.map(row => `${row['Departments.id']}:${row['Teams.id']}:${row['Employees.id']}`).sort()
            ).toEqual(expected.sort())
          })
        }
      }
    }
  })

  describe('a junction filter that passes NULL under right and full joins', () => {
    for (const joinType of ['inner', 'right', 'full'] as const) {
      const name = `${joinType} join through employee_teams filtered to lead rows`
      it.skipIf(joinType === 'full' && !supportsFullJoin)(name, async () => {
        const { employees, teams, employeeTeams } = tables
        const teamsCube = tenantCube('Teams', teams, 'tenant filter')
        const employeesCube = tenantCube('Employees', employees, 'tenant filter', {
          joins: {
            Teams: {
              targetCube: () => teamsCube,
              relationship: 'belongsToMany',
              sqlJoinType: joinType,
              on: [],
              through: {
                table: employeeTeams,
                sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
                targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
                securitySql: () => or(isNull(employeeTeams.id), eq(employeeTeams.role, 'lead'))!
              }
            }
          }
        })
        const result = await executor.execute(
          new Map([
            ['Employees', employeesCube],
            ['Teams', teamsCube]
          ]),
          { dimensions: ['Employees.id', 'Teams.id'] },
          caller
        )

        const expected = joinRows(
          joinRows(
            visibleTo(seed.employees, 'tenant filter'),
            seed.employeeTeams.filter(membership => membership.role === 'lead'),
            joinType,
            (employee, membership) => employee.id === membership.employeeId
          ),
          visibleTo(seed.teams, 'tenant filter'),
          joinType,
          ([, membership], team) => membership?.teamId === team.id
        ).map(([pair, team]) => `${idOf(pair?.[0] ?? null)}:${idOf(team)}`)
        expect(result.data.map(row => `${row['Employees.id']}:${row['Teams.id']}`).sort()).toEqual(
          distinctSorted(expected)
        )
      })
    }
  })

  describe('a Departments count by Teams through Employees and a junction under right and full joins', () => {
    for (const joinType of ['right', 'full'] as const) {
      it.skipIf(joinType === 'full' && !supportsFullJoin)(`${joinType} joins`, async () => {
        const { employees, departments, teams, employeeTeams } = tables
        const departmentsCube = tenantCube('Departments', departments, 'tenant filter')
        const teamsCube = tenantCube('Teams', teams, 'tenant filter')
        const employeesCube = tenantCube('Employees', employees, 'tenant filter', {
          joins: {
            Departments: {
              targetCube: () => departmentsCube,
              relationship: 'belongsTo',
              sqlJoinType: joinType,
              on: [{ source: employees.departmentId, target: departments.id }]
            },
            Teams: {
              targetCube: () => teamsCube,
              relationship: 'belongsToMany',
              sqlJoinType: joinType,
              on: [],
              through: {
                table: employeeTeams,
                sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
                targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
                securitySql: securityContext => eq(employeeTeams.organisationId, securityContext.organisationId)
              }
            }
          }
        })
        const result = await executor.execute(
          new Map([
            ['Employees', employeesCube],
            ['Departments', departmentsCube],
            ['Teams', teamsCube]
          ]),
          {
            dimensions: ['Teams.id'],
            measures: ['Departments.count'],
            filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
          },
          caller
        )

        const rows = joinRows(
          joinRows(
            joinRows(
              visibleTo(seed.employees, 'tenant filter'),
              visibleTo(seed.departments, 'tenant filter'),
              joinType,
              (employee, department) => employee.departmentId === department.id
            ),
            visibleTo(seed.employeeTeams, 'tenant filter'),
            joinType,
            ([employee], membership) => employee?.id === membership.employeeId
          ),
          visibleTo(seed.teams, 'tenant filter'),
          joinType,
          ([, membership], team) => membership?.teamId === team.id
        ).filter(([pair]) => pair?.[0]?.[0])
        const departmentsOf = (teamId: number | null) =>
          new Set(rows.filter(([, team]) => idOf(team) === teamId).flatMap(([pair]) => pair?.[0]?.[1]?.id ?? []))
        const expected = [...new Set(rows.map(([, team]) => idOf(team)))].map(
          teamId => `${teamId}:${departmentsOf(teamId).size}`
        )
        expect(result.data.map(row => `${row['Teams.id']}:${Number(row['Departments.count'])}`).sort()).toEqual(
          expected.sort()
        )
      })
    }
  })

  describe('a cube over raw SQL keeps its filter in WHERE under right and full joins', () => {
    for (const joinType of ['right', 'full'] as const) {
      it.skipIf(joinType === 'full' && !supportsFullJoin)(`${joinType} join`, async () => {
        const { employees, departments } = tables
        const employeesCube = tenantCube('Employees', employees, 'tenant filter', { from: () => sql`${employees}` })
        const departmentsCube = tenantCube('Departments', departments, 'no filter', {
          joins: {
            Employees: {
              targetCube: () => employeesCube,
              relationship: 'hasMany',
              sqlJoinType: joinType,
              on: [{ source: departments.id, target: employees.departmentId }]
            }
          }
        })
        const result = await executor.execute(
          new Map([
            ['Departments', departmentsCube],
            ['Employees', employeesCube]
          ]),
          { dimensions: ['Departments.id', 'Employees.id', 'Employees.organisationId'] },
          caller
        )

        expect(result.data.length).toBeGreaterThan(0)
        expect(otherOrganisationRows(result.data, ['Employees'])).toEqual([])
      })
    }
  })

  describe('right and full joins onto a cube whose Drizzle table declares only some of its columns', () => {
    for (const joinType of ['right', 'full'] as const) {
      const name = `${joinType} join, a dimension that reads an undeclared column`
      it.skipIf(joinType === 'full' && !supportsFullJoin)(name, async () => {
        const { employees, departments } = tables
        const staff = narrowEmployees()
        const employeesCube = tenantCube('Employees', staff, 'tenant filter', {
          dimensions: { name: { name: 'name', type: 'string', sql: sql`${staff}.${sql.identifier('name')}` } }
        })
        const departmentsCube = tenantCube('Departments', departments, 'no filter', {
          joins: {
            Employees: {
              targetCube: () => employeesCube,
              relationship: 'hasMany',
              sqlJoinType: joinType,
              on: [{ source: departments.id, target: staff.departmentId }]
            }
          }
        })
        const result = await executor.execute(
          new Map([
            ['Departments', departmentsCube],
            ['Employees', employeesCube]
          ]),
          { dimensions: ['Departments.id', 'Employees.id', 'Employees.name'] },
          caller
        )

        const ownEmployees: Array<{ id: number; name: string }> = await db
          .select({ id: employees.id, name: employees.name })
          .from(employees)
          .where(eq(employees.organisationId, caller.organisationId))
        expect(
          result.data
            .filter(row => row['Employees.id'] !== null)
            .map(row => `${Number(row['Employees.id'])}:${row['Employees.name']}`)
            .sort()
        ).toEqual(ownEmployees.map(employee => `${Number(employee.id)}:${employee.name}`).sort())
      })
    }

    for (const joinType of ['right', 'full'] as const) {
      const name = `${joinType} join on DuckDB with column names from Drizzle's snake_case casing`
      it.runIf(getTestDatabaseType() === 'duckdb')(name, async () => {
        const { drizzle } = await import('@leonardovida-md/drizzle-neo-duckdb')
        const connection = await createDuckDBConnection()
        try {
          const casedExecutor = new QueryExecutor(
            createDuckDBExecutor(drizzle({ client: connection.connection, casing: 'snake_case' }))
          )
          const employees = pgTable('employees', { id: pgInteger(), organisationId: pgInteger(), departmentId: pgInteger() })
          const departments = pgTable('departments', { id: pgInteger(), organisationId: pgInteger() })
          const employeesCube = tenantCube('Employees', employees, 'tenant filter')
          const departmentsCube = tenantCube('Departments', departments, 'no filter', {
            joins: {
              Employees: {
                targetCube: () => employeesCube,
                relationship: 'hasMany',
                sqlJoinType: joinType,
                on: [{ source: departments.id, target: employees.departmentId }]
              }
            }
          })
          const result = await casedExecutor.execute(
            new Map([
              ['Departments', departmentsCube],
              ['Employees', employeesCube]
            ]),
            { dimensions: ['Departments.id', 'Employees.id'] },
            caller
          )

          const expected = joinRows(
            seed.departments,
            visibleTo(seed.employees, 'tenant filter'),
            joinType,
            (department, employee) => employee.departmentId === department.id
          ).map(([department, employee]) => `${idOf(department)}:${idOf(employee)}`)
          expect(result.data.map(row => `${row['Departments.id']}:${row['Employees.id']}`).sort()).toEqual(
            expected.sort()
          )
        } finally {
          await connection.close()
        }
      })
    }
  })

  describe('a cube with an internal right or full join returns no row it does not return alone', () => {
    const staffCube = (filter: CubeFilter, internalJoin: JoinType) => {
      const { employees, departments } = tables
      return tenantCube('Staff', employees, filter, {
        internalJoins: [{ table: departments, on: eq(employees.departmentId, departments.id), type: internalJoin }],
        dimensions: {
          departmentId: { name: 'departmentId', type: 'number', sql: departments.id },
          departmentOrganisationId: { name: 'departmentOrganisationId', type: 'number', sql: departments.organisationId }
        }
      })
    }

    for (const internalJoin of ['right', 'full'] as const) {
      for (const joinType of JOIN_TYPES) {
        for (const primaryFilter of PRIMARY_FILTERS) {
          for (const staffFilter of ['tenant filter', 'null-passing filter'] as const) {
            const name = `internal ${internalJoin} join, ${joinType} join to Staff with ${staffFilter}, Teams with ${primaryFilter}`
            it.skipIf((internalJoin === 'full' || joinType === 'full') && !supportsFullJoin)(name, async () => {
              const { employees, teams } = tables
              const staff = staffCube(staffFilter, internalJoin)
              const teamsCube = tenantCube('Teams', teams, primaryFilter, {
                joins: {
                  Staff: {
                    targetCube: () => staff,
                    relationship: 'hasOne',
                    sqlJoinType: joinType,
                    on: [{ source: teams.id, target: employees.id }]
                  }
                }
              })
              const alone = await executor.execute(new Map([['Staff', staff]]), { dimensions: staffMembers }, caller)
              const joined = await executor.execute(
                new Map([
                  ['Teams', teamsCube],
                  ['Staff', staff]
                ]),
                { dimensions: ['Teams.id', ...staffMembers] },
                caller
              )

              expect(staffRows(alone.data).length).toBeGreaterThan(0)
              if (joinType === 'right' || joinType === 'full') {
                expect(staffRows(joined.data)).toEqual(staffRows(alone.data))
              } else {
                expect(staffRows(alone.data)).toEqual(expect.arrayContaining(staffRows(joined.data)))
              }
            })
          }
        }
      }
    }

    for (const internalJoin of ['right', 'full'] as const) {
      for (const joinType of ['left', 'inner'] as const) {
        for (const primaryFilter of PRIMARY_FILTERS) {
          for (const staffFilter of ['tenant filter', 'null-passing filter'] as const) {
            const name = `internal ${internalJoin} join, ${joinType} join to Staff with ${staffFilter}, Teams with ${primaryFilter}, a count through keys deduplication has a team on every row`
            it.skipIf(internalJoin === 'full' && !supportsFullJoin)(name, async () => {
              const { employees, teams } = tables
              const staff = staffCube(staffFilter, internalJoin)
              const teamsCube = tenantCube('Teams', teams, primaryFilter, {
                joins: {
                  Staff: {
                    targetCube: () => staff,
                    relationship: 'belongsTo',
                    sqlJoinType: joinType,
                    on: [{ source: teams.id, target: employees.id }]
                  }
                }
              })
              const result = await executor.execute(
                new Map([
                  ['Teams', teamsCube],
                  ['Staff', staff]
                ]),
                { measures: ['Staff.count'], dimensions: ['Teams.id'] },
                caller
              )

              expect(result.data.filter(row => row['Teams.id'] === null)).toEqual([])
            })
          }
        }
      }
    }

    for (const internalJoin of ['right', 'full'] as const) {
      for (const joinType of ['left', 'inner'] as const) {
        for (const staffFilter of ['tenant filter', 'null-passing filter'] as const) {
          const name = `internal ${internalJoin} join, a ${joinType} join keyed on the internal table of Staff with ${staffFilter} returns only rows of Staff alone`
          it.runIf(seededFromEmpty)(name, async () => {
            const { departments, teams } = tables
            const staff = staffCube(staffFilter, internalJoin)
            const teamsCube = tenantCube('Teams', teams, 'no filter', {
              joins: {
                Staff: {
                  targetCube: () => staff,
                  relationship: 'hasOne',
                  sqlJoinType: joinType,
                  on: [{ source: teams.id, target: departments.id }]
                }
              }
            })
            const alone = await executor.execute(new Map([['Staff', staff]]), { dimensions: staffMembers }, caller)
            const joined = await executor.execute(
              new Map([
                ['Teams', teamsCube],
                ['Staff', staff]
              ]),
              { dimensions: ['Teams.id', ...staffMembers] },
              caller
            )

            expect(staffRows(joined.data).length).toBeGreaterThan(0)
            expect(staffRows(alone.data)).toEqual(expect.arrayContaining(staffRows(joined.data)))
          })
        }
      }
    }
  })

  describe('a full join onto a cube with an internal left or inner join keeps the rows of both cubes', () => {
    const cubes = (
      internalJoin: 'left' | 'inner',
      squadsFilter: CubeFilter,
      primaryFilter: CubeFilter,
      relationship: 'hasOne' | 'belongsTo',
      squadsSql?: (ctx: QueryContext) => SQL
    ) => {
      const { departments, employeeTeams, teams } = tables
      const squads = defineCube('Squads', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: teams,
          joins: [{ table: employeeTeams, on: eq(employeeTeams.teamId, teams.id), type: internalJoin }],
          where: squadsSql?.(ctx) ?? organisationFilter(teams, squadsFilter, ctx)
        }),
        dimensions: { id: { name: 'id', type: 'number', sql: teams.id, primaryKey: true } },
        measures: { count: { name: 'count', type: 'count', sql: teams.id } }
      })
      const departmentsCube = tenantCube('Departments', departments, primaryFilter, {
        joins: {
          Squads: {
            targetCube: () => squads,
            relationship,
            sqlJoinType: 'full',
            on: [{ source: departments.id, target: teams.id }]
          }
        }
      })
      return new Map([
        ['Departments', departmentsCube],
        ['Squads', squads]
      ])
    }
    const ids = (rows: Record<string, unknown>[], member: string) =>
      distinctSorted(rows.filter(row => row[member] !== null).map(row => String(row[member])))
    const departmentIds = (primaryFilter: CubeFilter) =>
      distinctSorted(visibleTo(seed.departments, primaryFilter).map(department => String(department.id)))
    const squadsAlone = (joinedCubes: Map<string, Cube>) =>
      executor.execute(new Map([['Squads', joinedCubes.get('Squads')!]]), { dimensions: ['Squads.id'] }, caller)

    for (const internalJoin of ['left', 'inner'] as const) {
      for (const primaryFilter of PRIMARY_FILTERS) {
        for (const squadsFilter of ['tenant filter', 'null-passing filter'] as const) {
          const name = `internal ${internalJoin} join, Squads with ${squadsFilter}, Departments with ${primaryFilter}`
          it.skipIf(!supportsFullJoin)(name, async () => {
            const joinedCubes = cubes(internalJoin, squadsFilter, primaryFilter, 'hasOne')
            const alone = await squadsAlone(joinedCubes)
            const joined = await executor.execute(
              joinedCubes,
              { dimensions: ['Departments.id', 'Squads.id'] },
              caller
            )

            expect(ids(joined.data, 'Departments.id')).toEqual(departmentIds(primaryFilter))
            expect(ids(joined.data, 'Squads.id')).toEqual(ids(alone.data, 'Squads.id'))
          })
        }
        it.skipIf(!supportsFullJoin)(
          `internal ${internalJoin} join, Departments with ${primaryFilter}, a filter that reads the internal table`,
          async () => {
            const { employeeTeams } = tables
            const joinedCubes = cubes(internalJoin, 'tenant filter', primaryFilter, 'hasOne', ctx =>
              eq(employeeTeams.organisationId, ctx.securityContext.organisationId)
            )
            const alone = await squadsAlone(joinedCubes)
            const joined = await executor.execute(
              joinedCubes,
              { dimensions: ['Departments.id', 'Squads.id'] },
              caller
            )

            expect(ids(alone.data, 'Squads.id').length).toBeGreaterThan(0)
            expect(ids(joined.data, 'Squads.id')).toEqual(ids(alone.data, 'Squads.id'))
          }
        )
      }
    }

    for (const primaryFilter of PRIMARY_FILTERS) {
      for (const squadsFilter of ['tenant filter', 'null-passing filter'] as const) {
        const name = `internal left join, Squads with ${squadsFilter}, Departments with ${primaryFilter}, a count through keys deduplication`
        it.skipIf(!supportsFullJoin)(name, async () => {
          const result = await executor.execute(
            cubes('left', squadsFilter, primaryFilter, 'belongsTo'),
            { measures: ['Squads.count'], dimensions: ['Departments.id'] },
            caller
          )

          expect(ids(result.data, 'Departments.id')).toEqual(departmentIds(primaryFilter))
        })
      }
    }
  })

  describe('funnel steps filtered on a joined cube', () => {
    for (const joinType of JOIN_TYPES) {
      for (const primaryFilter of PRIMARY_FILTERS) {
        const name = `${joinType} join, Productivity with ${primaryFilter}`
        it.skipIf(joinType === 'full' && !supportsFullJoin)(name, async () => {
          const { employees, productivity } = tables
          const employeesCube = tenantCube('Employees', employees, 'tenant filter')
          const productivityCube = tenantCube('Productivity', productivity, primaryFilter, {
            joins: {
              Employees: {
                targetCube: () => employeesCube,
                relationship: 'belongsTo',
                sqlJoinType: joinType,
                on: [{ source: productivity.employeeId, target: employees.id }]
              }
            },
            dimensions: {
              employeeId: { name: 'employeeId', type: 'number', sql: productivity.employeeId },
              date: { name: 'date', type: 'time', sql: productivity.date }
            }
          })
          const otherOrganisations = {
            member: 'Employees.organisationId',
            operator: 'notEquals' as const,
            values: [caller.organisationId]
          }
          const result = await executor.execute(
            new Map([
              ['Productivity', productivityCube],
              ['Employees', employeesCube]
            ]),
            {
              funnel: {
                bindingKey: 'Productivity.employeeId',
                timeDimension: 'Productivity.date',
                steps: [
                  { name: 'first', filter: otherOrganisations },
                  { name: 'second', filter: otherOrganisations }
                ]
              }
            },
            caller
          )
          expect(result.data.map(row => Number(row.count))).toEqual([0, 0])
        })
      }
    }
  })
})
