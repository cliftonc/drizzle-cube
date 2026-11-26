/**
 * Organisation 1's result must not change when organisation 2's rows are
 * added, as in tenant-isolation-matrix.test.ts. Each case runs organisation 1's
 * query on the rows it may see, then again with organisation 2's rows added.
 */

import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sqliteTable, integer, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { eq, or, isNull, sql, type SQL } from 'drizzle-orm'
import { QueryExecutor } from '../src/server/executor'
import { createSQLiteExecutor } from '../src/server/executors/sqlite-executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, CubeJoin, QueryContext, SemanticQuery } from '../src/server/types'
import { getTestDatabaseType } from './helpers/test-database'

const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  code: text('code').notNull(),
  name: text('name').notNull()
})
const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  accountCode: text('account_code'),
  label: text('label').notNull()
})
const payments = sqliteTable('payments', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  invoiceId: integer('invoice_id'),
  label: text('label').notNull()
})
const departments = sqliteTable('departments', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  name: text('name').notNull()
})
const employees = sqliteTable('employees', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  departmentId: integer('department_id'),
  name: text('name').notNull()
})
const staff = sqliteTable('staff', {
  id: integer('id').primaryKey(),
  organisationId: integer('organisation_id'),
  name: text('name').notNull(),
  salary: integer('salary').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull()
})

const VISIBLE = `
  CREATE TABLE accounts (id INTEGER PRIMARY KEY, organisation_id INTEGER, code TEXT NOT NULL, name TEXT NOT NULL);
  CREATE TABLE invoices (id INTEGER PRIMARY KEY, organisation_id INTEGER, account_code TEXT, label TEXT NOT NULL);
  CREATE TABLE payments (id INTEGER PRIMARY KEY, organisation_id INTEGER, invoice_id INTEGER, label TEXT NOT NULL);
  CREATE TABLE departments (id INTEGER PRIMARY KEY, organisation_id INTEGER, name TEXT NOT NULL);
  CREATE TABLE employees (id INTEGER PRIMARY KEY, organisation_id INTEGER, department_id INTEGER, name TEXT NOT NULL);
  CREATE TABLE staff (id INTEGER PRIMARY KEY, organisation_id INTEGER, name TEXT NOT NULL, salary INTEGER NOT NULL, active INTEGER NOT NULL);
  INSERT INTO accounts VALUES (1, NULL, 'A', 'shared: A'), (2, 1, 'B', 'org1: B');
  INSERT INTO invoices VALUES (1, 1, 'A', 'org1: I-A'), (2, 1, 'X', 'org1: I-X');
  INSERT INTO payments VALUES (1, 1, 1, 'org1: P-1'), (2, 1, 77, 'org1: P-77');
  INSERT INTO departments VALUES (1, 1, 'org1: D1'), (3, NULL, 'shared: D3');
  INSERT INTO employees VALUES (1, 1, 1, 'org1: E1'), (2, 1, 3, 'org1: E2');
  INSERT INTO staff VALUES (1, 1, 'org1: low inactive', 50000, 0), (2, 1, 'org1: high inactive', 90000, 0), (3, 1, 'org1: low active', 50000, 1);
`

const ORG1: QueryContext['securityContext'] = { organisationId: 1 }

type Filter = 'strict' | 'nullPassing' | 'none'
type JoinType = NonNullable<CubeJoin['sqlJoinType']>

const organisation = (ctx: QueryContext) => Number(ctx.securityContext.organisationId)

function tenantFilter(column: AnySQLiteColumn, filter: Filter, organisationId: number): SQL | undefined {
  if (filter === 'none') return undefined
  return filter === 'strict' ? eq(column, organisationId) : or(eq(column, organisationId), isNull(column))
}

function paymentsCube(): Cube {
  return defineCube('Payments', {
    sql: (ctx: QueryContext) => ({ from: payments, where: eq(payments.organisationId, organisation(ctx)) }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: payments.id, primaryKey: true },
      label: { name: 'label', type: 'string', sql: payments.label }
    },
    measures: { count: { name: 'count', type: 'count', sql: payments.id } }
  })
}

function invoicesCube(
  filter: Filter,
  options: { internalJoin?: JoinType; payments?: { cube: Cube; joinType: JoinType } } = {}
): Cube {
  return defineCube('Invoices', {
    sql: (ctx: QueryContext) => ({
      from: invoices,
      joins: options.internalJoin
        ? [{ table: payments, on: eq(invoices.id, payments.invoiceId), type: options.internalJoin }]
        : undefined,
      where: tenantFilter(invoices.organisationId, filter, organisation(ctx))
    }),
    joins: options.payments
      ? {
          Payments: {
            targetCube: () => options.payments!.cube,
            relationship: 'hasMany',
            sqlJoinType: options.payments.joinType,
            on: [{ source: invoices.id, target: payments.invoiceId }]
          }
        }
      : undefined,
    dimensions: {
      id: { name: 'id', type: 'number', sql: invoices.id, primaryKey: true },
      label: { name: 'label', type: 'string', sql: invoices.label },
      paymentLabel: { name: 'paymentLabel', type: 'string', sql: payments.label }
    },
    measures: { count: { name: 'count', type: 'count', sql: invoices.id } }
  })
}

function accountsCube(filter: Filter, target: Cube, joinType: JoinType): Cube {
  return defineCube('Accounts', {
    sql: (ctx: QueryContext) => ({ from: accounts, where: tenantFilter(accounts.organisationId, filter, organisation(ctx)) }),
    joins: {
      Invoices: {
        targetCube: () => target,
        relationship: 'hasMany',
        sqlJoinType: joinType,
        on: [{ source: accounts.code, target: invoices.accountCode }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: accounts.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: accounts.name }
    },
    measures: { count: { name: 'count', type: 'count', sql: accounts.id } }
  })
}

function departmentsCube(): Cube {
  return defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: sql`${eq(departments.organisationId, organisation(ctx))} or ${isNull(departments.organisationId)}`
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: departments.name }
    },
    measures: { count: { name: 'count', type: 'count', sql: departments.id } }
  })
}

function employeesCube(target: Cube): Cube {
  return defineCube('Employees', {
    sql: (ctx: QueryContext) => ({ from: employees, where: eq(employees.organisationId, organisation(ctx)) }),
    joins: {
      Departments: {
        targetCube: () => target,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: employees.name }
    },
    measures: { count: { name: 'count', type: 'count', sql: employees.id } }
  })
}

function staffCube(): Cube {
  return defineCube('Staff', {
    sql: (ctx: QueryContext) => ({ from: staff, where: eq(staff.organisationId, organisation(ctx)) }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: staff.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: staff.name },
      bigOrActive: { name: 'bigOrActive', type: 'boolean', sql: sql`${staff.salary} > 80000 OR ${staff.active}` }
    },
    measures: { count: { name: 'count', type: 'count', sql: staff.id } }
  })
}

async function run(cubes: Cube[], query: SemanticQuery, hidden: string[]): Promise<string[]> {
  const client = new Database(':memory:')
  try {
    client.exec(VISIBLE + hidden.join('\n'))
    const executor = new QueryExecutor(createSQLiteExecutor(drizzle(client)))
    const result = await executor.execute(new Map(cubes.map(cube => [cube.name, cube])), query, ORG1)
    return result.data
      .map(row => JSON.stringify(Object.keys(row).sort().map(key => [key, typeof row[key] === 'number' || typeof row[key] === 'bigint' ? Number(row[key]) : row[key] ?? null])))
      .sort()
  } finally {
    client.close()
  }
}

interface Case {
  name: string
  cubes: () => Cube[]
  query: SemanticQuery
  /** Organisation 2's rows; organisation 1's result must not change when they are added. */
  hidden?: string[]
  /** Organisation 1's result on its own rows, for a case without organisation 2's rows. */
  expected?: string[]
}

const cases: Case[] = [
  ...(['left', 'inner'] as const).map(joinType => ({
    name: `${joinType} join onto a cube with an internal right join and a NULL-passing filter: a payment of an invoice that joins no account`,
    cubes: () => {
      const Invoices = invoicesCube('nullPassing', { internalJoin: 'right' })
      return [accountsCube('none', Invoices, joinType), Invoices]
    },
    query: { dimensions: ['Accounts.name', 'Invoices.label', 'Invoices.paymentLabel'] },
    hidden: [`INSERT INTO invoices VALUES (8, 2, 'Q', 'org2: I-Q');`, `INSERT INTO payments VALUES (8, 2, 8, 'org2: P-Q');`]
  })),
  ...(['right', 'full'] as const).map(joinType => ({
    name: `primary cube with a NULL-passing filter, ${joinType} join: a hidden account is the only match of a visible invoice`,
    cubes: () => {
      const Invoices = invoicesCube('strict')
      return [accountsCube('nullPassing', Invoices, joinType), Invoices]
    },
    query: { dimensions: ['Accounts.name', 'Invoices.label'] },
    hidden: [`INSERT INTO accounts VALUES (9, 2, 'X', 'org2: X');`]
  })),
  ...(['right', 'full'] as const).map(joinType => ({
    name: `three cubes, inner join then ${joinType} join: a hidden invoice is the only match of a visible payment`,
    cubes: () => {
      const Payments = paymentsCube()
      const Invoices = invoicesCube('nullPassing', { payments: { cube: Payments, joinType } })
      return [accountsCube('none', Invoices, 'inner'), Invoices, Payments]
    },
    query: { dimensions: ['Accounts.name', 'Invoices.label', 'Payments.label'] },
    hidden: [`INSERT INTO invoices VALUES (77, 2, 'A', 'org2: I-77');`]
  })),
  ...[
    { name: 'employees with their department', query: { dimensions: ['Employees.name', 'Departments.name'] } },
    { name: 'employees counted by department', query: { measures: ['Employees.count'], dimensions: ['Departments.name'] } }
  ].map(({ name, query }) => ({
    name: `a raw sql filter with a top-level OR on a joined cube: ${name}`,
    cubes: () => {
      const Departments = departmentsCube()
      return [employeesCube(Departments), Departments]
    },
    query,
    hidden: [`INSERT INTO departments VALUES (2, 2, 'org2: D2');`, `INSERT INTO employees VALUES (3, 2, 2, 'org2: E3'), (4, 2, 3, 'org2: E4');`]
  })),
  {
    name: 'a raw sql filter with a top-level OR on a single cube: a query filter that matches nothing returns no rows',
    cubes: () => [departmentsCube()],
    query: { dimensions: ['Departments.name'], filters: [{ member: 'Departments.name', operator: 'equals', values: ['nobody'] }] },
    expected: []
  },
  {
    name: 'a filter on a member whose sql is a compound OR: equals false',
    cubes: () => [staffCube()],
    query: { dimensions: ['Staff.name'], filters: [{ member: 'Staff.bigOrActive', operator: 'equals', values: [false] }] },
    hidden: [`INSERT INTO staff VALUES (4, 2, 'org2: low inactive', 50000, 0);`]
  },
  {
    name: 'a filter on a member whose sql is a compound OR: notSet returns no rows',
    cubes: () => [staffCube()],
    query: { dimensions: ['Staff.name'], filters: [{ member: 'Staff.bigOrActive', operator: 'notSet', values: [] }] },
    expected: []
  }
]

describe.skipIf(getTestDatabaseType() !== 'sqlite')('Tenant isolation cases', () => {
  for (const c of cases) {
    it(c.name, async () => {
      const visibleOnly = await run(c.cubes(), c.query, [])
      if (c.expected) {
        expect(visibleOnly).toEqual(c.expected)
        return
      }
      expect(visibleOnly.length).toBeGreaterThan(0)
      expect(await run(c.cubes(), c.query, c.hidden ?? [])).toEqual(visibleOnly)
    })
  }
})
