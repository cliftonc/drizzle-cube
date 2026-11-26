/**
 * Tenant-isolation matrix (GHSA-xv8c-hc26-6cq8 and friends).
 *
 * Oracle: org 1 cannot see org 2's rows, so adding org 2 rows to the database
 * must not change ANY org 1 result. Every case runs the same org 1 query on
 *
 *   A — only the rows org 1 may see (its own + shared rows), and
 *   B — A plus org 2 rows attached to every join key,
 *
 * and the two results must be identical. A difference means hidden rows
 * leaked into the output or changed it (e.g. a visible row vanished because
 * its only join partner was hidden). A is exactly what a filter-first engine
 * returns, so no expected values are written by hand.
 *
 * Axes: cube join type × relationship (incl. belongsToMany with and without
 * junction security) × primary cube filter (none / strict / NULL-passing) ×
 * joined cube filter (strict / NULL-passing) × the joined cube's internal
 * join type × query shape × which cube the planner picks as primary.
 *
 * Two kinds of difference are classified `cube-definition` rather than counted
 * as a join leak, because the cube definition itself lets hidden rows in and
 * nothing a join does can fix it:
 * - the joined cube already differs between A and B when queried ALONE (an
 *   internal RIGHT/FULL join under a NULL-passing filter keeps the internal
 *   table's rows whatever their tenant);
 * - a belongsToMany whose junction table holds tenant rows but has no
 *   `securitySql`.
 *
 * Runs on its own in-process SQLite database, so it runs once, in the sqlite
 * pass. Set MATRIX_VERBOSE=1 to print every differing case.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sqliteTable, integer, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { eq, and, or, isNull, type SQL } from 'drizzle-orm'
import { QueryExecutor } from '../src/server/executor'
import { createSQLiteExecutor } from '../src/server/executors/sqlite-executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, CubeJoin, QueryContext, BaseQueryDefinition, SemanticQuery } from '../src/server/types'
import { getTestDatabaseType } from './helpers/test-database'

// ---------------------------------------------------------------------------
// Schema and data
// ---------------------------------------------------------------------------

const plans = sqliteTable('plans', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id')
})

const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey(),
  customer: text('customer').notNull(),
  planId: integer('plan_id'),
  organisationId: integer('organisation_id'),
  mrr: integer('mrr').notNull()
})

const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey(),
  subscriptionId: integer('subscription_id'),
  amount: integer('amount').notNull(),
  organisationId: integer('organisation_id')
})

const planLinks = sqliteTable('plan_links', {
  id: integer('id').primaryKey(),
  planId: integer('plan_id').notNull(),
  subscriptionId: integer('subscription_id').notNull(),
  organisationId: integer('organisation_id')
})

const DDL = `
  CREATE TABLE plans (id INTEGER PRIMARY KEY, name TEXT NOT NULL, organisation_id INTEGER);
  CREATE TABLE subscriptions (id INTEGER PRIMARY KEY, customer TEXT NOT NULL, plan_id INTEGER, organisation_id INTEGER, mrr INTEGER NOT NULL);
  CREATE TABLE invoices (id INTEGER PRIMARY KEY, subscription_id INTEGER, amount INTEGER NOT NULL, organisation_id INTEGER);
  CREATE TABLE plan_links (id INTEGER PRIMARY KEY, plan_id INTEGER NOT NULL, subscription_id INTEGER NOT NULL, organisation_id INTEGER);
`

// Rows org 1 may see: its own and shared (organisation_id NULL). Whether a
// shared row is actually visible depends on the cube's filter, but it is in
// both datasets either way, so it never causes a difference.
const visible = {
  plans: [
    { id: 1, name: 'Free', organisationId: null },
    { id: 2, name: 'Pro', organisationId: null },
    { id: 3, name: 'Org1 Custom', organisationId: 1 },
    { id: 4, name: 'Unused', organisationId: null }
  ],
  subscriptions: [
    { id: 1, customer: 'org1 Alpha', planId: 1, organisationId: 1, mrr: 100 },
    { id: 2, customer: 'org1 Beta', planId: 2, organisationId: 1, mrr: 200 },
    { id: 3, customer: 'org1 NoPlan', planId: null, organisationId: 1, mrr: 50 },
    { id: 4, customer: 'org1 Custom', planId: 3, organisationId: 1, mrr: 75 },
    { id: 5, customer: 'shared Gamma', planId: 1, organisationId: null, mrr: 10 }
  ],
  invoices: [
    { id: 1, subscriptionId: 1, amount: 10, organisationId: 1 },
    { id: 2, subscriptionId: 2, amount: 20, organisationId: 1 },
    { id: 3, subscriptionId: null, amount: 5, organisationId: 1 }
  ],
  planLinks: [
    { id: 1, planId: 1, subscriptionId: 1, organisationId: 1 },
    { id: 2, planId: 2, subscriptionId: 2, organisationId: 1 },
    { id: 3, planId: 3, subscriptionId: 4, organisationId: 1 }
  ]
}

// Org 2 rows, attached to every kind of join key: org 2 keys, shared and org 1
// keys (cross-tenant references), and no key at all. Several are the ONLY
// match for a visible row (plan 4, the plan 4 → sub 1 link), which catches a
// visible row vanishing, not just hidden rows appearing.
const hidden = {
  plans: [
    { id: 201, name: 'Org2 Plan', organisationId: 2 },
    { id: 202, name: 'Org2 Lonely', organisationId: 2 }
  ],
  subscriptions: [
    { id: 101, customer: 'org2 Secret', planId: 2, organisationId: 2, mrr: 9000 },
    { id: 102, customer: 'org2 NoPlan', planId: null, organisationId: 2, mrr: 7000 },
    { id: 103, customer: 'org2 OnUnused', planId: 4, organisationId: 2, mrr: 500 },
    { id: 104, customer: 'org2 OnOrg2Plan', planId: 201, organisationId: 2, mrr: 1 }
  ],
  invoices: [
    { id: 101, subscriptionId: 1, amount: 999, organisationId: 2 },
    { id: 102, subscriptionId: 101, amount: 888, organisationId: 2 },
    { id: 103, subscriptionId: null, amount: 777, organisationId: 2 }
  ],
  planLinks: [
    { id: 101, planId: 1, subscriptionId: 101, organisationId: 2 },
    { id: 102, planId: 4, subscriptionId: 1, organisationId: 2 },
    { id: 103, planId: 201, subscriptionId: 104, organisationId: 2 }
  ]
}

interface MatrixDb {
  executor: QueryExecutor
  close: () => void
}

function createDb(withHidden: boolean, withHiddenPlans: boolean): MatrixDb {
  const client = new Database(':memory:')
  client.exec(DDL)
  const db = drizzle(client)
  const add = <T>(own: T[], other: T[], include: boolean): T[] => (include ? [...own, ...other] : own)
  db.insert(plans).values(add(visible.plans, hidden.plans, withHidden && withHiddenPlans)).run()
  db.insert(subscriptions).values(add(visible.subscriptions, hidden.subscriptions, withHidden)).run()
  db.insert(invoices).values(add(visible.invoices, hidden.invoices, withHidden)).run()
  db.insert(planLinks).values(add(visible.planLinks, hidden.planLinks, withHidden)).run()
  return {
    executor: new QueryExecutor(createSQLiteExecutor(db)),
    close: () => client.close()
  }
}

// ---------------------------------------------------------------------------
// Matrix axes
// ---------------------------------------------------------------------------

type JoinType = 'inner' | 'left' | 'right' | 'full'
type Relationship = 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany' | 'belongsToManyNoJunctionSecurity'
type FilterKind = 'none' | 'strict' | 'nullPassing'
type InternalJoin = 'none' | 'left' | 'right' | 'full'
type Steer = 'primary' | 'joined'

const joinTypes: JoinType[] = ['inner', 'left', 'right', 'full']
const relationships: Relationship[] = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToManyNoJunctionSecurity']
const primaryFilters: FilterKind[] = ['none', 'strict', 'nullPassing']
const joinedFilters: FilterKind[] = ['strict', 'nullPassing']
const internalJoins: InternalJoin[] = ['none', 'left', 'right', 'full']
const steers: Steer[] = ['primary', 'joined']

interface Shape {
  name: string
  needsInternal?: boolean
  query: SemanticQuery
}

const shapes: Shape[] = [
  { name: 'dims', query: { dimensions: ['Plans.name', 'Subscriptions.customer'] } },
  { name: 'joinedMeasures', query: { measures: ['Subscriptions.count', 'Subscriptions.totalMrr'], dimensions: ['Plans.name'] } },
  { name: 'primaryMeasure', query: { measures: ['Plans.count'], dimensions: ['Subscriptions.customer'] } },
  { name: 'bothMeasures', query: { measures: ['Plans.count', 'Subscriptions.totalMrr'], dimensions: ['Plans.name'] } },
  { name: 'internalDims', needsInternal: true, query: { dimensions: ['Plans.name', 'Subscriptions.invoiceId'] } },
  { name: 'internalMeasure', needsInternal: true, query: { measures: ['Subscriptions.invoiceTotal'], dimensions: ['Plans.name'] } }
]

/** Extra dimensions so the planner picks the wanted cube as primary. */
function steerQuery(query: SemanticQuery, steer: Steer): SemanticQuery {
  const extra = steer === 'primary' ? ['Plans.id', 'Plans.name'] : ['Subscriptions.id', 'Subscriptions.customer']
  return { ...query, dimensions: [...new Set([...(query.dimensions ?? []), ...extra])] }
}

function tenantFilter(kind: FilterKind, column: AnySQLiteColumn, org: number): SQL | undefined {
  if (kind === 'none') return undefined
  if (kind === 'strict') return eq(column, org)
  return or(eq(column, org), isNull(column))
}

interface Case {
  joinType: JoinType
  relationship: Relationship
  primaryFilter: FilterKind
  joinedFilter: FilterKind
  internal: InternalJoin
  shape: Shape
  steer: Steer
}

function caseName(c: Case): string {
  return `${c.relationship}/${c.joinType} primary=${c.primaryFilter} joined=${c.joinedFilter} internal=${c.internal} ${c.shape.name} steer=${c.steer}`
}

function buildCubes(c: Pick<Case, 'joinType' | 'relationship' | 'primaryFilter' | 'joinedFilter' | 'internal'>): Map<string, Cube> {
  const subscriptionsCube: Cube = defineCube('Subscriptions', {
    sql: (ctx: QueryContext): BaseQueryDefinition => {
      const org = ctx.securityContext.organisationId as number
      return {
        from: subscriptions,
        ...(c.internal !== 'none' && {
          joins: [{
            table: invoices,
            // The author filters the internal table in ON, as they should.
            on: and(eq(invoices.subscriptionId, subscriptions.id), eq(invoices.organisationId, org))!,
            type: c.internal
          }]
        }),
        where: tenantFilter(c.joinedFilter, subscriptions.organisationId, org)
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: subscriptions.id, primaryKey: true },
      customer: { name: 'customer', type: 'string', sql: subscriptions.customer },
      ...(c.internal !== 'none' && {
        invoiceId: { name: 'invoiceId', type: 'number', sql: invoices.id }
      })
    },
    measures: {
      count: { name: 'count', type: 'count', sql: subscriptions.id },
      totalMrr: { name: 'totalMrr', type: 'sum', sql: subscriptions.mrr },
      ...(c.internal !== 'none' && {
        invoiceTotal: { name: 'invoiceTotal', type: 'sum', sql: invoices.amount }
      })
    }
  })

  const isManyToMany = c.relationship === 'belongsToMany' || c.relationship === 'belongsToManyNoJunctionSecurity'
  const join: CubeJoin = isManyToMany
    ? {
        targetCube: () => subscriptionsCube,
        relationship: 'belongsToMany',
        sqlJoinType: c.joinType,
        on: [],
        through: {
          table: planLinks,
          sourceKey: [{ source: plans.id, target: planLinks.planId }],
          targetKey: [{ source: planLinks.subscriptionId, target: subscriptions.id }],
          ...(c.relationship === 'belongsToMany' && {
            securitySql: (ctx) => eq(planLinks.organisationId, ctx.organisationId as number)
          })
        }
      }
    : {
        targetCube: () => subscriptionsCube,
        relationship: c.relationship as 'belongsTo' | 'hasOne' | 'hasMany',
        sqlJoinType: c.joinType,
        on: [{ source: plans.id, target: subscriptions.planId }]
      }

  const plansCube: Cube = defineCube('Plans', {
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: plans,
      where: tenantFilter(c.primaryFilter, plans.organisationId, ctx.securityContext.organisationId as number)
    }),
    joins: { Subscriptions: join },
    dimensions: {
      id: { name: 'id', type: 'number', sql: plans.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: plans.name }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: plans.id }
    }
  })

  return new Map([['Plans', plansCube], ['Subscriptions', subscriptionsCube]])
}

// ---------------------------------------------------------------------------
// Running and comparing
// ---------------------------------------------------------------------------

const ORG1 = { organisationId: 1 }

type Outcome = { ok: true; rows: string[] } | { ok: false; error: string }

async function run(db: MatrixDb, cubes: Map<string, Cube>, query: SemanticQuery): Promise<Outcome> {
  try {
    const result = await db.executor.execute(cubes, query, ORG1)
    const rows = result.data.map(row =>
      JSON.stringify(
        Object.keys(row).sort().map(k => [k, row[k] === null || row[k] === undefined ? null : typeof row[k] === 'string' ? row[k] : Number(row[k])])
      )
    )
    return { ok: true, rows: rows.sort() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function sameOutcome(a: Outcome, b: Outcome): boolean {
  if (a.ok !== b.ok) return false
  if (!a.ok || !b.ok) return true // both errored the same way: not a leak
  return a.rows.length === b.rows.length && a.rows.every((r, i) => r === b.rows[i])
}

type Category = 'pass' | 'leak' | 'cube-definition' | 'error'

interface CaseResult {
  c: Case
  category: Category
  detail?: string
}

function diff(a: Outcome, b: Outcome): string {
  if (!a.ok || !b.ok) return `A ${a.ok ? 'ok' : `error: ${a.error}`} / B ${b.ok ? 'ok' : `error: ${b.error}`}`
  const onlyB = b.rows.filter(r => !a.rows.includes(r))
  const onlyA = a.rows.filter(r => !b.rows.includes(r))
  return [
    ...onlyB.slice(0, 3).map(r => `  + ${r}`),
    ...onlyA.slice(0, 3).map(r => `  - ${r}`)
  ].join('\n')
}

describe.skipIf(getTestDatabaseType() !== 'sqlite')('Tenant-isolation matrix', () => {
  let dbA: MatrixDb
  let dbB: MatrixDb
  let dbBSharedPlans: MatrixDb
  const results: CaseResult[] = []

  beforeAll(async () => {
    dbA = createDb(false, false)
    dbB = createDb(true, true)
    // When Plans has no filter it is shared reference data by definition, so
    // org 2 plans are legitimately visible: leave them out of B.
    dbBSharedPlans = createDb(true, false)

    // Does the joined cube's own sql already leak when queried alone?
    const standaloneLeaks = new Set<string>()
    for (const joinedFilter of joinedFilters) {
      for (const internal of internalJoins) {
        const cubes = buildCubes({ joinType: 'left', relationship: 'hasMany', primaryFilter: 'strict', joinedFilter, internal })
        const dims = ['Subscriptions.customer', ...(internal !== 'none' ? ['Subscriptions.invoiceId'] : [])]
        const measures = internal !== 'none' ? ['Subscriptions.invoiceTotal'] : ['Subscriptions.totalMrr']
        for (const query of [{ dimensions: dims }, { measures }, { measures, dimensions: ['Subscriptions.customer'] }]) {
          if (!sameOutcome(await run(dbA, cubes, query), await run(dbB, cubes, query))) {
            standaloneLeaks.add(`${joinedFilter}/${internal}`)
          }
        }
      }
    }

    for (const joinType of joinTypes) {
      for (const relationship of relationships) {
        for (const primaryFilter of primaryFilters) {
          for (const joinedFilter of joinedFilters) {
            for (const internal of internalJoins) {
              const cubes = buildCubes({ joinType, relationship, primaryFilter, joinedFilter, internal })
              const b = primaryFilter === 'none' ? dbBSharedPlans : dbB
              for (const shape of shapes) {
                if (shape.needsInternal && internal === 'none') continue
                for (const steer of steers) {
                  const c: Case = { joinType, relationship, primaryFilter, joinedFilter, internal, shape, steer }
                  const query = steerQuery(shape.query, steer)
                  const outA = await run(dbA, cubes, query)
                  const outB = await run(b, cubes, query)
                  if (sameOutcome(outA, outB)) {
                    results.push({ c, category: outA.ok ? 'pass' : 'error', detail: outA.ok ? undefined : outA.error })
                  } else {
                    const definitionLeak =
                      standaloneLeaks.has(`${joinedFilter}/${internal}`) ||
                      relationship === 'belongsToManyNoJunctionSecurity'
                    results.push({
                      c,
                      category: definitionLeak ? 'cube-definition' : 'leak',
                      detail: diff(outA, outB)
                    })
                  }
                }
              }
            }
          }
        }
      }
    }

    const count = (cat: Category) => results.filter(r => r.category === cat).length
    const summary = [
      `Tenant-isolation matrix: ${results.length} cases`,
      `  pass ${count('pass')}  leak ${count('leak')}  cube-definition ${count('cube-definition')}  error ${count('error')}`,
      `  standalone cube leaks (cube-definition): ${[...standaloneLeaks].join(', ') || 'none'}`
    ]
    const leaks = results.filter(r => r.category === 'leak')
    const byGroup = new Map<string, number>()
    for (const r of leaks) {
      const key = `${r.c.relationship}/${r.c.joinType} internal=${r.c.internal}`
      byGroup.set(key, (byGroup.get(key) ?? 0) + 1)
    }
    for (const [key, n] of [...byGroup].sort()) summary.push(`  leak group ${key}: ${n}`)
    const errors = new Map<string, number>()
    for (const r of results.filter(r => r.category === 'error')) {
      const key = (r.detail ?? '').slice(0, 120)
      errors.set(key, (errors.get(key) ?? 0) + 1)
    }
    for (const [key, n] of errors) summary.push(`  error (${n}): ${key}`)
    console.log(summary.join('\n'))
    if (process.env.MATRIX_VERBOSE) {
      for (const r of leaks) console.log(`LEAK ${caseName(r.c)}\n${r.detail}`)
    }
    // MATRIX_VERBOSE=all also prints the cases classified cube-definition.
    if (process.env.MATRIX_VERBOSE === 'all') {
      for (const r of results.filter(r => r.category === 'cube-definition')) {
        console.log(`CUBE-DEFINITION ${caseName(r.c)}\n${r.detail}`)
      }
    }
  }, 600_000)

  afterAll(() => {
    dbA?.close()
    dbB?.close()
    dbBSharedPlans?.close()
  })

  it('ran the whole matrix', () => {
    expect(results.length).toBeGreaterThan(1000)
  })

  it('no org 1 result changes when org 2 rows are added', () => {
    const leaks = results.filter(r => r.category === 'leak').map(r => caseName(r.c))
    expect(leaks).toEqual([])
  })
})
