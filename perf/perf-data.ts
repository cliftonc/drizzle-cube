/**
 * Deterministic large-scale synthetic dataset for performance benchmarks.
 *
 * Scale (org 1 is the benchmarked organisation):
 *   departments    ~40      (org1: 25)
 *   teams          ~60      (org1: 40)
 *   employees      1,000    (org1: 700, org2: 180, org3: 120)
 *   employeeTeams  ~2,500   (1-4 teams per employee)
 *   productivity   ~335k    (org1 employees x Sep 2023 - Dec 2024, ~2% day gaps)
 *   timeEntries    ~1M      (all employees x 2024 workdays x 2-6 entries/day)
 *
 * All randomness flows from a fixed-seed mulberry32 RNG so the dataset is
 * byte-identical across reseeds — benchmark results stay comparable over time.
 * Bump PERF_DATA_VERSION whenever the generator or schema changes.
 */

import {
  departments,
  employees,
  employeeTeams,
  productivity,
  teams,
  timeEntries
} from '../tests/helpers/databases/postgres/schema'
import type { PerfConnection } from './database'

export const PERF_DATA_VERSION = 1

const RNG_SEED = 0xDC2026
const BATCH_SIZE = 5000 // ~10 cols x 5000 rows = 50k bound params, under postgres-js 65,534 limit

const ORGS = [
  { id: 1, departments: 25, teams: 40, employees: 700 },
  { id: 2, departments: 8, teams: 12, employees: 180 },
  { id: 3, departments: 7, teams: 8, employees: 120 }
]

const PRODUCTIVITY_START = Date.UTC(2023, 8, 1)
const PRODUCTIVITY_END = Date.UTC(2024, 11, 31)
const TIME_ENTRIES_START = Date.UTC(2024, 0, 1)
const TIME_ENTRIES_END = Date.UTC(2024, 11, 31)
const DAY_MS = 24 * 60 * 60 * 1000

const ALLOCATION_TYPES = ['development', 'maintenance', 'meetings', 'research', 'documentation', 'testing']
// Cumulative probability weights mirroring the functional seed's distribution
const ALLOCATION_WEIGHTS = [0.4, 0.55, 0.75, 0.85, 0.93, 1.0]
const BILLABLE_RATES: Record<string, number> = {
  development: 0.9,
  maintenance: 0.7,
  meetings: 0.3,
  research: 0.5,
  documentation: 0.6,
  testing: 0.8
}

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carmen', 'David', 'Elena', 'Frank', 'Grace', 'Hugo', 'Imani', 'Jonas',
  'Kira', 'Liam', 'Maya', 'Noah', 'Olga', 'Pedro', 'Quinn', 'Rosa', 'Sam', 'Tara',
  'Umar', 'Vera', 'Wim', 'Xena', 'Yusuf', 'Zara'
]
const LAST_NAMES = [
  'Anderson', 'Brown', 'Chen', 'Dijkstra', 'Evans', 'Fischer', 'Garcia', 'Hansen', 'Ito', 'Jansen',
  'Kowalski', 'Lopez', 'Murphy', 'Nakamura', 'Okafor', 'Patel', 'Quist', 'Rossi', 'Smith', 'Tanaka'
]
const TAG_POOL = ['senior', 'junior', 'backend', 'frontend', 'fullstack', 'devops', 'lead', 'remote']

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function pickAllocationType(rng: () => number): string {
  const r = rng()
  for (let i = 0; i < ALLOCATION_WEIGHTS.length; i++) {
    if (r <= ALLOCATION_WEIGHTS[i]) return ALLOCATION_TYPES[i]
  }
  return ALLOCATION_TYPES[0]
}

function isWeekend(dayMs: number): boolean {
  const day = new Date(dayMs).getUTCDay()
  return day === 0 || day === 6
}

/** Buffers rows and flushes batched inserts so ~1M rows never sit in memory at once */
async function batchInsert<TRow>(
  insert: (rows: TRow[]) => Promise<unknown>,
  rows: TRow[],
  buffer: TRow[],
  flushAll = false
): Promise<number> {
  buffer.push(...rows)
  let inserted = 0
  while (buffer.length >= BATCH_SIZE || (flushAll && buffer.length > 0)) {
    const batch = buffer.splice(0, BATCH_SIZE)
    await insert(batch)
    inserted += batch.length
  }
  return inserted
}

export async function seedPerfData(db: PerfConnection['db']): Promise<Record<string, number>> {
  const rng = mulberry32(RNG_SEED)
  const startedAt = Date.now()
  const counts: Record<string, number> = {}

  // --- departments ---
  const departmentRows = ORGS.flatMap(org =>
    Array.from({ length: org.departments }, (_, i) => ({
      name: `Department ${org.id}-${i + 1}`,
      organisationId: org.id,
      budget: Math.round((200_000 + rng() * 1_800_000) / 1000) * 1000
    }))
  )
  const insertedDepartments = await db.insert(departments).values(departmentRows)
    .returning({ id: departments.id, organisationId: departments.organisationId })
  counts.departments = insertedDepartments.length

  // --- teams ---
  const teamRows = ORGS.flatMap(org =>
    Array.from({ length: org.teams }, (_, i) => ({
      name: `Team ${org.id}-${i + 1}`,
      description: `Performance test team ${i + 1} for org ${org.id}`,
      organisationId: org.id
    }))
  )
  const insertedTeams = await db.insert(teams).values(teamRows)
    .returning({ id: teams.id, organisationId: teams.organisationId })
  counts.teams = insertedTeams.length

  // --- employees ---
  const employeeRows = ORGS.flatMap(org => {
    const orgDepartments = insertedDepartments.filter(d => d.organisationId === org.id)
    return Array.from({ length: org.employees }, (_, i) => {
      const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)} ${i + 1}`
      const hasTags = rng() < 0.3
      return {
        name,
        email: rng() < 0.03 ? null : `${name.toLowerCase().replace(/\s+/g, '.')}@org${org.id}.example.com`,
        active: rng() < 0.95,
        departmentId: rng() < 0.02 ? null : pick(rng, orgDepartments).id,
        organisationId: org.id,
        salary: rng() < 0.03 ? null : Math.round(40_000 + rng() * 120_000),
        tags: hasTags ? [pick(rng, TAG_POOL), pick(rng, TAG_POOL)] : null,
        createdAt: new Date(Date.UTC(2020 + Math.floor(rng() * 5), Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)))
      }
    })
  })
  const insertedEmployees: Array<{ id: number; organisationId: number; departmentId: number | null }> = []
  for (let i = 0; i < employeeRows.length; i += BATCH_SIZE) {
    const batch = await db.insert(employees).values(employeeRows.slice(i, i + BATCH_SIZE))
      .returning({ id: employees.id, organisationId: employees.organisationId, departmentId: employees.departmentId })
    insertedEmployees.push(...batch)
  }
  counts.employees = insertedEmployees.length

  // --- employeeTeams ---
  const employeeTeamRows = insertedEmployees.flatMap(emp => {
    const orgTeams = insertedTeams.filter(t => t.organisationId === emp.organisationId)
    const teamCount = 1 + Math.floor(rng() * 4)
    const chosen = new Set<number>()
    while (chosen.size < Math.min(teamCount, orgTeams.length)) {
      chosen.add(pick(rng, orgTeams).id)
    }
    return [...chosen].map(teamId => ({
      employeeId: emp.id,
      teamId,
      role: pick(rng, ['member', 'member', 'member', 'lead', 'contributor']),
      organisationId: emp.organisationId
    }))
  })
  for (let i = 0; i < employeeTeamRows.length; i += BATCH_SIZE) {
    await db.insert(employeeTeams).values(employeeTeamRows.slice(i, i + BATCH_SIZE))
  }
  counts.employeeTeams = employeeTeamRows.length

  // --- productivity (org1 only) ---
  const org1Employees = insertedEmployees.filter(e => e.organisationId === 1)
  let productivityCount = 0
  {
    type ProductivityRow = typeof productivity.$inferInsert
    const buffer: ProductivityRow[] = []
    const insert = (rows: ProductivityRow[]) => db.insert(productivity).values(rows)
    let nextMilestone = 100_000
    for (const emp of org1Employees) {
      const rows: ProductivityRow[] = []
      for (let dayMs = PRODUCTIVITY_START; dayMs <= PRODUCTIVITY_END; dayMs += DAY_MS) {
        if (rng() < 0.02) continue // real gaps for fillMissingDates benchmarks
        const weekend = isWeekend(dayMs)
        const dayOff = weekend || rng() < 0.06
        rows.push({
          employeeId: emp.id,
          date: new Date(dayMs),
          linesOfCode: dayOff ? 0 : Math.floor(rng() * 450),
          pullRequests: dayOff ? 0 : Math.floor(rng() * 8),
          liveDeployments: dayOff ? 0 : Math.floor(rng() * 3),
          daysOff: dayOff,
          happinessIndex: 1 + Math.floor(rng() * 10),
          organisationId: 1
        })
      }
      productivityCount += await batchInsert(insert, rows, buffer)
      if (productivityCount >= nextMilestone) {
        console.log(`  productivity: ${productivityCount.toLocaleString()} rows...`)
        nextMilestone += 100_000
      }
    }
    productivityCount += await batchInsert(insert, [], buffer, true)
  }
  counts.productivity = productivityCount

  // --- timeEntries (all orgs) ---
  let timeEntryCount = 0
  {
    type TimeEntryRow = typeof timeEntries.$inferInsert
    const buffer: TimeEntryRow[] = []
    const insert = (rows: TimeEntryRow[]) => db.insert(timeEntries).values(rows)
    let nextMilestone = 100_000
    for (const emp of insertedEmployees) {
      const orgDepartments = insertedDepartments.filter(d => d.organisationId === emp.organisationId)
      const homeDepartmentId = emp.departmentId ?? pick(rng, orgDepartments).id
      const rows: TimeEntryRow[] = []
      for (let dayMs = TIME_ENTRIES_START; dayMs <= TIME_ENTRIES_END; dayMs += DAY_MS) {
        if (isWeekend(dayMs)) continue
        const entryCount = 2 + Math.floor(rng() * 5)
        for (let e = 0; e < entryCount; e++) {
          const allocationType = pickAllocationType(rng)
          const hours = Math.round((0.5 + rng() * 3.5) * 4) / 4
          // 5% cross-department collaboration
          const departmentId = rng() < 0.05 ? pick(rng, orgDepartments).id : homeDepartmentId
          rows.push({
            employeeId: emp.id,
            departmentId,
            date: new Date(dayMs),
            allocationType,
            hours,
            description: `${allocationType} work`,
            billableHours: Math.round(hours * BILLABLE_RATES[allocationType] * 4) / 4,
            organisationId: emp.organisationId
          })
        }
      }
      timeEntryCount += await batchInsert(insert, rows, buffer)
      if (timeEntryCount >= nextMilestone) {
        console.log(`  timeEntries: ${timeEntryCount.toLocaleString()} rows...`)
        nextMilestone += 100_000
      }
    }
    timeEntryCount += await batchInsert(insert, [], buffer, true)
  }
  counts.timeEntries = timeEntryCount

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`Perf seed complete in ${seconds}s:`, counts)
  return counts
}
