/**
 * Perf database lifecycle: a dedicated `drizzle_cube_perf_test` database on the
 * same Postgres instance as the functional test DB, so the large benchmark
 * dataset never interferes with functional test seeding/expectations.
 *
 * Must run from the repo root: migrations resolve relative to the cwd.
 */

import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import {
  createPostgresConnection,
  runPostgresMigrations
} from '../tests/helpers/databases/postgres/setup'
import { seedPerfData, PERF_DATA_VERSION } from './perf-data'

const DEFAULT_BASE_URL = 'postgresql://test:test@localhost:54333/drizzle_cube_test'
const DEFAULT_PERF_DB_NAME = 'drizzle_cube_perf_test'

export function getBaseUrl(): string {
  return process.env.TEST_DATABASE_URL || DEFAULT_BASE_URL
}

export function derivePerfUrl(): string {
  const url = process.env.PERF_DATABASE_URL || replaceDbName(getBaseUrl(), DEFAULT_PERF_DB_NAME)
  const dbName = extractDbName(url)
  if (!dbName.includes('test')) {
    throw new Error(`Safety check failed: perf database name "${dbName}" must contain "test"`)
  }
  return url
}

function replaceDbName(url: string, dbName: string): string {
  return url.replace(/\/[^/?]+(\?.*)?$/, `/${dbName}$1`)
}

function extractDbName(url: string): string {
  const match = url.match(/\/([^/?]+)(\?.*)?$/)
  if (!match) {
    throw new Error(`Cannot extract database name from URL: ${url}`)
  }
  return match[1]
}

/**
 * Create the perf database if it does not exist, via a maintenance connection
 * to the regular test database (the `test` user is superuser in docker/CI).
 */
export async function ensurePerfDatabase(): Promise<void> {
  const perfDbName = extractDbName(derivePerfUrl())
  if (!/^[a-z0-9_]+$/.test(perfDbName)) {
    throw new Error(`Invalid perf database name: ${perfDbName}`)
  }
  const client = postgres(getBaseUrl(), { onnotice: () => {}, max: 1 })
  try {
    const existing = await client`SELECT 1 FROM pg_database WHERE datname = ${perfDbName}`
    if (existing.length === 0) {
      console.log(`Creating perf database "${perfDbName}"...`)
      // CREATE DATABASE cannot be parameterized; name is validated above
      await client.unsafe(`CREATE DATABASE ${perfDbName}`)
    }
  } finally {
    await client.end()
  }
}

export type PerfConnection = ReturnType<typeof createPostgresConnection>

/**
 * Point the shared test helpers at the perf database and connect + migrate.
 * Must be called before any helper that reads TEST_DATABASE_URL.
 */
export async function connectPerf(): Promise<PerfConnection> {
  process.env.TEST_DB_TYPE = 'postgres'
  process.env.TEST_DATABASE_URL = derivePerfUrl()
  const connection = createPostgresConnection()
  await runPostgresMigrations(connection.db)
  return connection
}

const SEEDED_TABLES = [
  'time_entries',
  'productivity',
  'employee_teams',
  'employees',
  'teams',
  'departments'
]

/**
 * The functional-test migrations create no index beyond the primary keys. The
 * flow/funnel/retention analysis modes run over the productivity table per
 * entity ordered by time — the flow builder's LATERAL steps issue one
 * `WHERE employee_id = ? AND date < ? ORDER BY date DESC LIMIT 1` per entity
 * per step. Without a composite (employee_id, date) index each becomes a full
 * seq scan, turning the flow benchmark from ~20ms into ~37s (and forcing the
 * funnel/retention window sorts to spill). This is the only index the planner
 * actually uses in the suite — every other benchmark is a full-table
 * aggregation or hash join where a seq scan is already optimal, so we add
 * nothing else. Idempotent so pre-seeded perf DBs get backfilled without a reseed.
 */
async function ensurePerfIndexes(db: PerfConnection['db']): Promise<void> {
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_perf_productivity_emp_date ON productivity (employee_id, date)`)
}

/**
 * Seed the perf dataset unless the stored data version already matches.
 * A `perf_meta` key/value table stamps the seeded version and row counts,
 * so generator/schema changes (bump PERF_DATA_VERSION) trigger a reseed.
 */
export async function ensureSeeded(
  db: PerfConnection['db'],
  options: { force?: boolean } = {}
): Promise<Record<string, number>> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS perf_meta (key text PRIMARY KEY, value text NOT NULL)`)

  const versionRows = await db.execute(sql`SELECT value FROM perf_meta WHERE key = 'data_version'`)
  const storedVersion = versionRows.length > 0 ? Number((versionRows[0] as { value: string }).value) : null

  if (!options.force && storedVersion === PERF_DATA_VERSION) {
    const countRows = await db.execute(sql`SELECT value FROM perf_meta WHERE key = 'row_counts'`)
    const rowCounts = countRows.length > 0
      ? JSON.parse((countRows[0] as { value: string }).value) as Record<string, number>
      : {}
    // Backfill perf indexes for DBs seeded before they were introduced.
    await ensurePerfIndexes(db)
    console.log(`Perf data version ${PERF_DATA_VERSION} already seeded — skipping (use --force-reseed to rebuild)`)
    return rowCounts
  }

  console.log(
    storedVersion === null
      ? 'No perf data found — seeding...'
      : `Perf data version ${storedVersion} != ${PERF_DATA_VERSION} — reseeding...`
  )
  await db.execute(sql.raw(`TRUNCATE ${SEEDED_TABLES.join(', ')} RESTART IDENTITY CASCADE`))

  const rowCounts = await seedPerfData(db)

  // Build indexes after the bulk insert so the load isn't slowed by index maintenance.
  await ensurePerfIndexes(db)

  await db.execute(sql`
    INSERT INTO perf_meta (key, value) VALUES ('data_version', ${String(PERF_DATA_VERSION)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `)
  await db.execute(sql`
    INSERT INTO perf_meta (key, value) VALUES ('row_counts', ${JSON.stringify(rowCounts)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `)
  return rowCounts
}
