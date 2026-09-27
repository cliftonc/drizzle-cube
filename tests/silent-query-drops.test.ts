/**
 * Silent query drops — regression tests.
 *
 * Every query in this file PASSED validation in 0.9.6 but silently returned the
 * wrong rows (a filter was dropped, a condition was pushed to the wrong place,
 * or a time dimension changed the grain). Each case must now either return the
 * rows the user asked for, or be rejected by validation with an actionable
 * error — never silently widened or narrowed.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { validateQueryAgainstCubes } from '../src/server/query-validator'
import type { Cube, SemanticQuery, Filter } from '../src/server/types'

describe('Silent query drops', () => {
  let executor: QueryExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])
  })

  afterAll(() => {
    close?.()
  })

  const run = (query: SemanticQuery) => executor.execute(cubes, query, testSecurityContexts.org1)
  const dryRun = (query: SemanticQuery) => executor.dryRunSQL(cubes, query, testSecurityContexts.org1)
  const validate = (query: SemanticQuery) => validateQueryAgainstCubes(cubes, query)
  const countOf = async (query: SemanticQuery, measure: string) => {
    const result = await run(query)
    return Number(result.data[0]?.[measure] ?? 0)
  }

  describe('bug 1: inDateRange with a single relative string in values', () => {
    it('resolves values: ["last 90 days"] exactly like dateRange: "last 90 days"', async () => {
      const viaValues: SemanticQuery = {
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: ['last 90 days'] }]
      }
      const viaDateRange: SemanticQuery = {
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: [], dateRange: 'last 90 days' }]
      }

      expect(validate(viaValues).isValid).toBe(true)
      expect(await countOf(viaValues, 'Productivity.recordCount'))
        .toBe(await countOf(viaDateRange, 'Productivity.recordCount'))

      // The filter must actually reach the SQL (it used to be dropped entirely)
      const { sql: generated } = await dryRun(viaValues)
      expect(generated).toMatch(/>=/)
      expect(generated).toMatch(/<=/)
    })

    it('resolves a single absolute date in values to that whole day', async () => {
      const total = await countOf({ measures: ['Productivity.recordCount'] }, 'Productivity.recordCount')
      const oneDay = await countOf({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-15'] }]
      }, 'Productivity.recordCount')
      const oneDayViaDateRange = await countOf({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: [], dateRange: '2024-01-15' }]
      }, 'Productivity.recordCount')

      expect(oneDay).toBeGreaterThan(0)
      expect(oneDay).toBeLessThan(total)
      expect(oneDay).toBe(oneDayViaDateRange)
    })

    it('applies a single relative string when the date cube is pre-aggregated in a CTE', async () => {
      const allTime = await run({
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Employees.name'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-15'] }]
      })
      const total = allTime.data.reduce((sum, row) => sum + Number(row['Productivity.recordCount'] ?? 0), 0)
      const expected = await countOf({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-15'] }]
      }, 'Productivity.recordCount')
      const unfiltered = await countOf({ measures: ['Productivity.recordCount'] }, 'Productivity.recordCount')
      expect(expected).toBeGreaterThan(0)
      expect(expected).toBeLessThan(unfiltered)
      expect(total).toBe(expected)
    })

    it('still accepts values: [] + dateRange', () => {
      expect(validate({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: [], dateRange: 'last month' }]
      }).isValid).toBe(true)
    })

    it('accepts the "next ..." relative ranges advertised in the AI guidance', () => {
      for (const range of ['next week', 'next month', 'next quarter', 'next year', 'tomorrow']) {
        const result = validate({
          measures: ['Productivity.recordCount'],
          filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: [range] }]
        })
        expect(result.errors, range).toEqual([])
      }
    })

    it('rejects an unparseable relative string in filter values', () => {
      const result = validate({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: ['last 90 dayz'] }]
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.join(' ')).toContain('last 90 dayz')
    })

    it('rejects an unparseable relative string in filter dateRange', () => {
      const result = validate({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: [], dateRange: 'the other week' }]
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.join(' ')).toContain('the other week')
    })

    it('rejects inDateRange with neither values nor dateRange', () => {
      const result = validate({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: [] }]
      })
      expect(result.isValid).toBe(false)
    })

    it('rejects an unparseable timeDimension dateRange', () => {
      const result = validate({
        measures: ['Productivity.recordCount'],
        timeDimensions: [{ dimension: 'Productivity.date', granularity: 'month', dateRange: 'past quarter-ish' }]
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.join(' ')).toContain('past quarter-ish')
    })

    it('rejects an unparseable compareDateRange entry', () => {
      const result = validate({
        measures: ['Productivity.recordCount'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day',
          compareDateRange: ['this month', 'the month before']
        }]
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.join(' ')).toContain('the month before')
    })
  })

  describe('bug 2: timeDimension with dateRange but no granularity is a filter only', () => {
    const range: [string, string] = ['2024-01-01', '2024-03-31']

    it('returns a single total instead of one row per timestamp', async () => {
      const result = await run({
        measures: ['Productivity.recordCount'],
        timeDimensions: [{ dimension: 'Productivity.date', dateRange: range }]
      })
      const filtered = await countOf({
        measures: ['Productivity.recordCount'],
        filters: [{ member: 'Productivity.date', operator: 'inDateRange', values: range }]
      }, 'Productivity.recordCount')

      expect(result.data).toHaveLength(1)
      expect(Number(result.data[0]['Productivity.recordCount'])).toBe(filtered)
      expect(result.data[0]).not.toHaveProperty('Productivity.date')
      expect(result.annotation.timeDimensions).not.toHaveProperty('Productivity.date')
    })

    it('groups only by the requested dimensions', async () => {
      const result = await run({
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentId'],
        timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: ['2000-01-01', '2100-01-01'] }]
      })
      const plain = await run({
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentId']
      })
      expect(result.data.length).toBe(plain.data.length)
      for (const row of result.data) {
        expect(row).not.toHaveProperty('Employees.createdAt')
      }
    })

    it('still groups by the bucket when a granularity is given', async () => {
      const result = await run({
        measures: ['Productivity.recordCount'],
        timeDimensions: [{ dimension: 'Productivity.date', dateRange: range, granularity: 'month' }]
      })
      expect(result.data).toHaveLength(3)
      expect(result.data[0]).toHaveProperty('Productivity.date')
    })

    it('returns one total per period for compareDateRange without granularity', async () => {
      const result = await run({
        measures: ['Productivity.recordCount'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          compareDateRange: [['2024-01-01', '2024-01-31'], ['2024-02-01', '2024-02-29']]
        }]
      })
      expect(result.data).toHaveLength(2)
      expect(result.data.map(r => r.__periodIndex)).toEqual([0, 1])
    })

    it('keeps the raw column for ungrouped queries', async () => {
      const result = await run({
        ungrouped: true,
        dimensions: ['Productivity.id'],
        timeDimensions: [{ dimension: 'Productivity.date', dateRange: ['2024-01-01', '2024-01-01'] }],
        limit: 5
      })
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('Productivity.date')
    })

    it('rejects a query whose only member is a granularity-less timeDimension', () => {
      const result = validate({
        timeDimensions: [{ dimension: 'Productivity.date', dateRange: range }]
      })
      expect(result.isValid).toBe(false)
    })
  })

  describe('bug 3: set/notSet/isEmpty/isNotEmpty take no values', () => {
    const total = () => countOf({ measures: ['Employees.count'] }, 'Employees.count')

    for (const values of [[], undefined] as const) {
      const label = values === undefined ? 'no values' : 'values: []'

      it(`set + notSet partition the rows (${label})`, async () => {
        const filter = (operator: 'set' | 'notSet'): Filter =>
          (values === undefined
            ? { member: 'Employees.salary', operator }
            : { member: 'Employees.salary', operator, values: [...values] }) as Filter
        const set = await countOf({ measures: ['Employees.count'], filters: [filter('set')] }, 'Employees.count')
        const notSet = await countOf({ measures: ['Employees.count'], filters: [filter('notSet')] }, 'Employees.count')
        expect(set + notSet).toBe(await total())
        expect(set).toBeLessThan(await total())
      })

      it(`isEmpty + isNotEmpty partition the rows (${label})`, async () => {
        const filter = (operator: 'isEmpty' | 'isNotEmpty'): Filter =>
          (values === undefined
            ? { member: 'Employees.email', operator }
            : { member: 'Employees.email', operator, values: [...values] }) as Filter
        const empty = await countOf({ measures: ['Employees.count'], filters: [filter('isEmpty')] }, 'Employees.count')
        const notEmpty = await countOf({ measures: ['Employees.count'], filters: [filter('isNotEmpty')] }, 'Employees.count')
        expect(empty + notEmpty).toBe(await total())
        const { sql: generated } = await dryRun({ measures: ['Employees.count'], filters: [filter('isNotEmpty')] })
        expect(generated.toLowerCase()).toContain('is not null')
      })
    }
  })

  describe('bug 4: notStartsWith / notEndsWith and unknown operators', () => {
    it('notStartsWith is the complement of startsWith', async () => {
      const total = await countOf({ measures: ['Employees.count'] }, 'Employees.count')
      const starts = await countOf({
        measures: ['Employees.count'],
        filters: [{ member: 'Employees.name', operator: 'startsWith', values: ['a'] }]
      }, 'Employees.count')
      const notStarts = await countOf({
        measures: ['Employees.count'],
        filters: [{ member: 'Employees.name', operator: 'notStartsWith', values: ['a'] }]
      }, 'Employees.count')
      expect(starts).toBeGreaterThan(0)
      expect(starts + notStarts).toBe(total)
    })

    it('notEndsWith is the complement of endsWith', async () => {
      const total = await countOf({ measures: ['Employees.count'] }, 'Employees.count')
      const ends = await countOf({
        measures: ['Employees.count'],
        filters: [{ member: 'Employees.name', operator: 'endsWith', values: ['N'] }]
      }, 'Employees.count')
      const notEnds = await countOf({
        measures: ['Employees.count'],
        filters: [{ member: 'Employees.name', operator: 'notEndsWith', values: ['N'] }]
      }, 'Employees.count')
      expect(ends).toBeGreaterThan(0)
      expect(ends + notEnds).toBe(total)
    })

    it('rejects an unknown operator and lists the valid ones', () => {
      const result = validate({
        measures: ['Employees.count'],
        filters: [{ member: 'Employees.createdAt', operator: 'notInDateRange', values: ['last week'] } as unknown as Filter]
      })
      expect(result.isValid).toBe(false)
      const message = result.errors.join(' ')
      expect(message).toContain('notInDateRange')
      expect(message).toContain('inDateRange')
      expect(message).toContain('notStartsWith')
    })

    it('rejects an unknown operator nested inside a logical group', () => {
      const result = validate({
        measures: ['Employees.count'],
        filters: [{ or: [
          { member: 'Employees.name', operator: 'equals', values: ['x'] },
          { member: 'Employees.name', operator: 'fuzzyMatch', values: ['y'] } as unknown as Filter
        ] }]
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.join(' ')).toContain('fuzzyMatch')
    })
  })

  describe('bug 5: cross-cube OR groups with a pre-aggregated (CTE) cube', () => {
    it('returns exactly the rows the OR describes', async () => {
      // Amanda White is in department 5 (and writes no code), so the two OR
      // branches are disjoint: all of Amanda's rows, plus department-1 rows with
      // linesOfCode >= 1000.
      const mixed = await run({
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Employees.name'],
        filters: [{
          or: [
            { member: 'Employees.name', operator: 'equals', values: ['Amanda White'] },
            {
              and: [
                { member: 'Employees.departmentId', operator: 'equals', values: [1] },
                { member: 'Productivity.linesOfCode', operator: 'gte', values: [1000] }
              ]
            }
          ]
        }],
        order: { 'Employees.name': 'asc' }
      })

      // Branch 1: every productivity row for Amanda (no linesOfCode restriction)
      const branch1 = await run({
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Employees.name'],
        filters: [{ member: 'Employees.name', operator: 'equals', values: ['Amanda White'] }]
      })
      // Branch 2: department 1 employees, only their rows with linesOfCode >= 1000
      const branch2 = await run({
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Employees.name'],
        filters: [
          { member: 'Employees.departmentId', operator: 'equals', values: [1] },
          { member: 'Productivity.linesOfCode', operator: 'gte', values: [1000] }
        ]
      })
      // Sanity: some department-1 employees have no qualifying rows and must be excluded
      expect(branch2.data.some(r => !Number(r['Productivity.recordCount'] ?? 0))).toBe(true)

      const normalise = (rows: Record<string, unknown>[]) => rows
        .map(r => ({
          name: String(r['Employees.name']),
          employees: Number(r['Employees.count']),
          records: Number(r['Productivity.recordCount'] ?? 0)
        }))
        .filter(r => r.records > 0)
        .sort((a, b) => a.name.localeCompare(b.name))

      const expected = normalise([...branch1.data, ...branch2.data])
      expect(expected.length).toBeGreaterThan(1) // both branches contribute
      expect(expected.find(r => r.name === 'Amanda White')?.records).toBeGreaterThan(0)
      expect(normalise(mixed.data)).toEqual(expected)
      // No row may appear that satisfies neither branch
      expect(mixed.data.map(r => r['Employees.name']).sort()).toEqual(expected.map(r => r.name))
    })

    it('links an OR branch through an intermediate cube (Departments → Employees → Productivity)', async () => {
      const recordsByDepartment = (rows: Record<string, unknown>[]) => rows
        .map(r => ({ department: String(r['Departments.name']), records: Number(r['Productivity.recordCount'] ?? 0) }))
        .filter(r => r.records > 0)
        .sort((a, b) => a.department.localeCompare(b.department))

      const mixed = await run({
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Departments.name'],
        filters: [{
          or: [
            { member: 'Departments.name', operator: 'equals', values: ['Engineering'] },
            { member: 'Productivity.linesOfCode', operator: 'gte', values: [50] }
          ]
        }]
      })
      const engineering = await run({
        measures: ['Productivity.recordCount'],
        dimensions: ['Departments.name'],
        filters: [{ member: 'Departments.name', operator: 'equals', values: ['Engineering'] }]
      })
      const others = await run({
        measures: ['Productivity.recordCount'],
        dimensions: ['Departments.name'],
        filters: [
          { member: 'Departments.name', operator: 'notEquals', values: ['Engineering'] },
          { member: 'Productivity.linesOfCode', operator: 'gte', values: [50] }
        ]
      })

      const expected = recordsByDepartment([...engineering.data, ...others.data])
      expect(expected.length).toBeGreaterThan(1)
      expect(recordsByDepartment(mixed.data)).toEqual(expected)
      expect(mixed.data.map(r => String(r['Departments.name'])).sort()).toEqual(expected.map(r => r.department))
    })

    it('rejects an OR group that mixes measure and dimension filters', () => {
      const result = validate({
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [{
          or: [
            { member: 'Employees.name', operator: 'equals', values: ['Alex Chen'] },
            { member: 'Employees.count', operator: 'gt', values: [5] }
          ]
        }]
      })
      expect(result.isValid).toBe(false)
    })
  })

  describe('bug 6: ungrouped queries only check the join path actually used', () => {
    it('allows a belongsTo path even when the target declares hasMany back', async () => {
      // Productivity is primary (most dimensions); Productivity → Employees is belongsTo.
      // Employees also declares hasMany → Productivity, which must not matter.
      const query: SemanticQuery = {
        ungrouped: true,
        dimensions: ['Productivity.date', 'Productivity.linesOfCode', 'Employees.name'],
        limit: 5
      }
      expect(validate(query).errors).toEqual([])
      const result = await run(query)
      expect(result.data).toHaveLength(5)
      expect(result.data[0]).toHaveProperty('Employees.name')
    })

    it('still rejects a hasMany path from the primary cube', () => {
      // Employees is primary (most dimensions); Employees → Productivity is hasMany.
      const result = validate({
        ungrouped: true,
        dimensions: ['Employees.name', 'Employees.email', 'Productivity.date'],
        limit: 5
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.join(' ')).toContain('hasMany')
    })
  })
})
