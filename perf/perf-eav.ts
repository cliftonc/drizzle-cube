/**
 * EAV attributes for the perf dataset.
 *
 * `buildAttributeDimensions` backs each attribute with a correlated scalar
 * subquery. Projection is cheap — a page of 25 rows is 25 indexed lookups per
 * attribute — but `ORDER BY (SELECT …)` and `WHERE (SELECT …) = …` are
 * proportional to the *base* table, because no index can serve them. That
 * escalation ladder (correlated subquery → pivoted view → materialized view) is
 * documented in `docs/plans/1007-records-table.md`; these benchmarks are what
 * make it measured rather than asserted.
 *
 * The tables live here rather than in `tests/helpers/databases/postgres` on
 * purpose: that schema is mirrored across seven engines, and this is a
 * Postgres-only perf fixture. The harness already creates its own database with
 * raw DDL (`perf/database.ts`), so it creates these two tables the same way.
 */

import { sql } from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import type { PerfConnection } from './database'

/**
 * Records carrying attributes. Deliberately a slice of the ~335k-row
 * productivity table rather than the whole of it: 100k is the scale the spec
 * asks for, and it keeps the seed from doubling in size.
 */
export const EAV_RECORD_COUNT = 100_000

/** Fixed ids so the generated member names (`attr_1`, `attr_2`) are stable. */
export const PERF_ATTRIBUTES = [
  { id: 1, name: 'Health', valueType: 'string' as const },
  { id: 2, name: 'Completion', valueType: 'number' as const }
]

const HEALTH_STATES = ['On track', 'At risk', 'Blocked']

export const productivityAttributeValues = pgTable('productivity_attribute_values', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  productivityId: integer('productivity_id').notNull(),
  attributeId: integer('attribute_id').notNull(),
  value: text('value'),
  organisationId: integer('organisation_id').notNull()
})

/**
 * Create the junction table and the index the correlated subquery relies on.
 *
 * Raw DDL, like `ensurePerfDatabase`'s `CREATE DATABASE`: the no-manual-SQL rule
 * governs query generation, not the harness's own fixture setup.
 */
export async function createEavTables(db: PerfConnection['db']): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS productivity_attribute_values (
      id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      productivity_id integer NOT NULL,
      attribute_id integer NOT NULL,
      value text,
      organisation_id integer NOT NULL
    )
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_productivity_attribute_values_lookup
      ON productivity_attribute_values (productivity_id, attribute_id)
  `)
}

/**
 * One value per (record, attribute) for the first {@link EAV_RECORD_COUNT}
 * productivity rows of organisation 1.
 *
 * Every 11th `Completion` is unparseable, so the tolerant numeric cast is on
 * the measured path rather than assumed away.
 */
export async function seedEavData(
  db: PerfConnection['db'],
  batchSize: number
): Promise<number> {
  await db.execute(sql`TRUNCATE TABLE productivity_attribute_values RESTART IDENTITY`)

  const ids = await db.execute<{ id: number }>(sql`
    SELECT id FROM productivity
    WHERE organisation_id = 1
    ORDER BY id
    LIMIT ${EAV_RECORD_COUNT}
  `)
  const recordIds = extractIds(ids)

  type Row = typeof productivityAttributeValues.$inferInsert
  let buffer: Row[] = []
  let inserted = 0

  const flush = async () => {
    if (buffer.length === 0) return
    await db.insert(productivityAttributeValues).values(buffer)
    inserted += buffer.length
    buffer = []
  }

  for (let index = 0; index < recordIds.length; index++) {
    buffer.push({
      productivityId: recordIds[index],
      attributeId: PERF_ATTRIBUTES[0].id,
      value: HEALTH_STATES[index % HEALTH_STATES.length],
      organisationId: 1
    })
    buffer.push({
      productivityId: recordIds[index],
      attributeId: PERF_ATTRIBUTES[1].id,
      value: index % 11 === 0 ? 'n/a' : String((index * 7) % 101),
      organisationId: 1
    })
    if (buffer.length >= batchSize) await flush()
  }
  await flush()

  return inserted
}

/** Drivers differ on whether `execute` returns rows or `{ rows }`. */
function extractIds(result: unknown): number[] {
  const rows = Array.isArray(result)
    ? result
    : (result as { rows?: unknown[] })?.rows ?? []
  return (rows as Array<Record<string, unknown>>).map(row => Number(Object.values(row)[0]))
}
