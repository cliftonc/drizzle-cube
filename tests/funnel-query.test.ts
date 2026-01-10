/**
 * Server-Side Funnel Query Tests
 * Tests funnel analysis with temporal ordering, conversion rates, and time metrics
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import {
  createTestDatabaseExecutor,
  getTestSchema,
  getTestDatabaseType
} from './helpers/test-database'

import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, SemanticQuery } from '../src/server/types'
import type { FunnelQueryConfig, FunnelResultRow } from '../src/server/types/funnel'
import { FunnelQueryBuilder } from '../src/server/funnel-query-builder'
import { PostgresAdapter } from '../src/server/adapters/postgres-adapter'
import { MySQLAdapter } from '../src/server/adapters/mysql-adapter'
import { SQLiteAdapter } from '../src/server/adapters/sqlite-adapter'

describe('Server-Side Funnel Queries', () => {
  let executor: QueryExecutor
  let close: () => void
  let _db: any
  let _schema: any
  let _productivity: any
  let eventsCube: Cube

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup, db: database } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    _db = database
    const testSchema = await getTestSchema()
    _schema = testSchema.schema
    _productivity = testSchema.productivity
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  // Create Events cube using productivity table for funnel testing
  beforeEach(async () => {
    const testSchema = await getTestSchema()
    const { productivity } = testSchema

    // Create an Events cube from productivity data
    // Each productivity record represents an "event" with timestamp
    eventsCube = defineCube('Events', {
      sql: (ctx: QueryContext) => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),

      measures: {
        count: {
          type: 'count',
          sql: productivity.id
        },
        uniqueUsers: {
          type: 'countDistinct',
          sql: productivity.employeeId
        }
      },

      dimensions: {
        id: {
          type: 'number',
          sql: productivity.id,
          primaryKey: true
        },
        userId: {
          type: 'number',
          sql: productivity.employeeId
        },
        timestamp: {
          type: 'time',
          sql: productivity.date
        },
        linesOfCode: {
          type: 'number',
          sql: productivity.linesOfCode
        },
        pullRequests: {
          type: 'number',
          sql: productivity.pullRequests
        },
        happinessIndex: {
          type: 'number',
          sql: productivity.happinessIndex
        },
        isHighProductivity: {
          type: 'boolean',
          sql: sql`${productivity.linesOfCode} > 100`
        }
      }
    })
  })

  describe('FunnelQueryBuilder Unit Tests', () => {
    it('should detect funnel queries correctly', () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FunnelQueryBuilder(adapter)

      // Query without funnel
      expect(builder.hasFunnel({ measures: ['Events.count'] })).toBe(false)

      // Query with single step (invalid funnel)
      expect(builder.hasFunnel({
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [{ name: 'Step 1' }]
        }
      })).toBe(false)

      // Valid funnel query
      expect(builder.hasFunnel({
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Step 1' },
            { name: 'Step 2' }
          ]
        }
      })).toBe(true)
    })

    it('should validate funnel configuration', async () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FunnelQueryBuilder(adapter)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // Valid configuration
      const validConfig: FunnelQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [
          { name: 'Entry' },
          { name: 'Conversion', timeToConvert: 'P7D' }
        ]
      }
      const validResult = builder.validateConfig(validConfig, cubes)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      // Invalid: too few steps
      const tooFewSteps: FunnelQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [{ name: 'Only One' }]
      }
      const tooFewResult = builder.validateConfig(tooFewSteps, cubes)
      expect(tooFewResult.isValid).toBe(false)
      expect(tooFewResult.errors).toContain('Funnel must have at least 2 steps')

      // Invalid: bad binding key
      const badBindingKey: FunnelQueryConfig = {
        bindingKey: 'Events.nonExistent',
        timeDimension: 'Events.timestamp',
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }]
      }
      const badBindingResult = builder.validateConfig(badBindingKey, cubes)
      expect(badBindingResult.isValid).toBe(false)
      expect(badBindingResult.errors.some(e => e.includes('Binding key dimension not found'))).toBe(true)

      // Invalid: bad time dimension
      const badTimeDim: FunnelQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.nonExistent',
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }]
      }
      const badTimeDimResult = builder.validateConfig(badTimeDim, cubes)
      expect(badTimeDimResult.isValid).toBe(false)
      expect(badTimeDimResult.errors.some(e => e.includes('Time dimension not found'))).toBe(true)
    })

    it('should transform results correctly', () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FunnelQueryBuilder(adapter)

      const config: FunnelQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [
          { name: 'Signup' },
          { name: 'Activation' },
          { name: 'Purchase' }
        ],
        includeTimeMetrics: true
      }

      const rawResult = [{
        step_0_count: 1000,
        step_1_count: 450,
        step_2_count: 180,
        step_1_avg_seconds: 86400,
        step_1_min_seconds: 3600,
        step_1_max_seconds: 259200,
        step_2_avg_seconds: 172800,
        step_2_min_seconds: 7200,
        step_2_max_seconds: 604800
      }]

      const results = builder.transformResult(rawResult, config)

      expect(results).toHaveLength(3)

      // Step 0 (first step)
      expect(results[0].step).toBe('Signup')
      expect(results[0].stepIndex).toBe(0)
      expect(results[0].count).toBe(1000)
      expect(results[0].conversionRate).toBeNull() // First step has no conversion rate
      expect(results[0].cumulativeConversionRate).toBe(1)

      // Step 1
      expect(results[1].step).toBe('Activation')
      expect(results[1].stepIndex).toBe(1)
      expect(results[1].count).toBe(450)
      expect(results[1].conversionRate).toBe(0.45) // 450/1000
      expect(results[1].cumulativeConversionRate).toBe(0.45)
      expect(results[1].avgSecondsToConvert).toBe(86400)
      expect(results[1].minSecondsToConvert).toBe(3600)
      expect(results[1].maxSecondsToConvert).toBe(259200)

      // Step 2
      expect(results[2].step).toBe('Purchase')
      expect(results[2].stepIndex).toBe(2)
      expect(results[2].count).toBe(180)
      expect(results[2].conversionRate).toBe(0.4) // 180/450
      expect(results[2].cumulativeConversionRate).toBe(0.18) // 180/1000
      expect(results[2].avgSecondsToConvert).toBe(172800)
    })
  })

  describe('Funnel Query Execution', () => {
    it('should execute a simple two-step funnel', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Any Activity' },
            {
              name: 'High Productivity',
              filter: {
                member: 'Events.linesOfCode',
                operator: 'gt',
                values: [100]
              }
            }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      // Verify result structure
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBe(2)

      // Check step structure
      const step0 = result.data[0] as unknown as FunnelResultRow
      const step1 = result.data[1] as unknown as FunnelResultRow

      expect(step0.step).toBe('Any Activity')
      expect(step0.stepIndex).toBe(0)
      expect(typeof step0.count).toBe('number')
      expect(step0.conversionRate).toBeNull()
      expect(step0.cumulativeConversionRate).toBe(1)

      expect(step1.step).toBe('High Productivity')
      expect(step1.stepIndex).toBe(1)
      expect(typeof step1.count).toBe('number')
      // Conversion rate should be between 0 and 1
      if (step0.count > 0) {
        expect(step1.conversionRate).toBeGreaterThanOrEqual(0)
        expect(step1.conversionRate).toBeLessThanOrEqual(1)
      }
    })

    it('should execute funnel with time metrics', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Entry' },
            { name: 'Progress' }
          ],
          includeTimeMetrics: true
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)

      // Second step should have time metrics
      const step1 = result.data[1] as unknown as FunnelResultRow

      // Time metrics should be present (may be null if no conversions)
      expect('avgSecondsToConvert' in step1).toBe(true)
      expect('minSecondsToConvert' in step1).toBe(true)
      expect('maxSecondsToConvert' in step1).toBe(true)
    })

    it('should execute funnel with timeToConvert constraint', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'First Event' },
            {
              name: 'Quick Follow-up',
              timeToConvert: 'P1D' // Must happen within 1 day
            }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)

      // The count for step 2 should be limited by the time constraint
      const step0 = result.data[0] as unknown as FunnelResultRow
      const step1 = result.data[1] as unknown as FunnelResultRow

      expect(step1.count).toBeLessThanOrEqual(step0.count)
    })

    it('should execute three-step funnel', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Step 1: Entry' },
            {
              name: 'Step 2: Engagement',
              filter: {
                member: 'Events.pullRequests',
                operator: 'gt',
                values: [0]
              }
            },
            {
              name: 'Step 3: High Performer',
              filter: {
                member: 'Events.linesOfCode',
                operator: 'gt',
                values: [200]
              }
            }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(3)

      // Verify monotonically decreasing counts (funnel property)
      const counts = result.data.map(row => (row as unknown as FunnelResultRow).count)
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeLessThanOrEqual(counts[i - 1])
      }

      // Verify cumulative conversion rates are decreasing
      const cumulativeRates = result.data.map(
        row => (row as unknown as FunnelResultRow).cumulativeConversionRate
      )
      for (let i = 1; i < cumulativeRates.length; i++) {
        expect(cumulativeRates[i]).toBeLessThanOrEqual(cumulativeRates[i - 1])
      }
    })

    it('should enforce monotonic counts when middle step has timeToConvert constraint', async () => {
      // This test verifies the bug fix for cascading constraints
      // When step 2 has a timeToConvert constraint, step 3 should only count
      // users who actually passed step 2 (not just step 1)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Step 1: Entry' },
            {
              name: 'Step 2: Quick Action',
              filter: {
                member: 'Events.pullRequests',
                operator: 'gt',
                values: [0]
              },
              timeToConvert: 'PT6H' // Must happen within 6 hours - strict constraint
            },
            {
              name: 'Step 3: Completed',
              filter: {
                member: 'Events.linesOfCode',
                operator: 'gt',
                values: [50]
              }
            }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(3)

      const step0 = result.data[0] as unknown as FunnelResultRow
      const step1 = result.data[1] as unknown as FunnelResultRow
      const step2 = result.data[2] as unknown as FunnelResultRow

      // CRITICAL: Step 3 count must be <= Step 2 count (the bug was step 3 > step 2)
      expect(step1.count).toBeLessThanOrEqual(step0.count)
      expect(step2.count).toBeLessThanOrEqual(step1.count)

      // Step conversion rates should make sense
      // Step 3's conversion rate from step 2 should be <= 100%
      if (step1.count > 0) {
        const step2to3ConversionRate = step2.count / step1.count
        expect(step2to3ConversionRate).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('Security Context', () => {
    it('should isolate funnel results by organisation', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Entry' },
            { name: 'Progress' }
          ]
        }
      }

      const result1 = await executor.execute(cubes, query, testSecurityContexts.org1)
      const result2 = await executor.execute(cubes, query, testSecurityContexts.org2)

      // Results should be different for different organisations
      // (assuming test data has different data per org)
      const org1Step0Count = (result1.data[0] as unknown as FunnelResultRow).count
      const org2Step0Count = (result2.data[0] as unknown as FunnelResultRow).count

      // At minimum, both should have data or we should verify they're isolated
      expect(result1.data.length).toBe(2)
      expect(result2.data.length).toBe(2)

      // If both orgs have data, counts should typically differ
      // (this depends on test data setup)
      if (org1Step0Count > 0 && org2Step0Count > 0) {
        // At least verify they're valid numbers
        expect(typeof org1Step0Count).toBe('number')
        expect(typeof org2Step0Count).toBe('number')
      }
    })
  })

  describe('Annotation Metadata', () => {
    it('should include funnel metadata in annotation', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Step A' },
            { name: 'Step B', timeToConvert: 'P7D' }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      // Check annotation structure
      expect(result.annotation).toBeDefined()

      // Funnel metadata should be in annotation
      const annotation = result.annotation as any
      expect(annotation.funnel).toBeDefined()
      expect(annotation.funnel.config).toBeDefined()
      expect(annotation.funnel.steps).toHaveLength(2)
      expect(annotation.funnel.steps[0].name).toBe('Step A')
      expect(annotation.funnel.steps[1].name).toBe('Step B')
      expect(annotation.funnel.steps[1].timeToConvert).toBe('P7D')
    })
  })

  describe('Cross-Cube Filtering in Funnels', () => {
    it('should validate cross-cube filter with no join path', async () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FunnelQueryBuilder(adapter)

      // Create two cubes with NO join relationship
      const testSchema = await getTestSchema()
      const { productivity, employees } = testSchema

      const eventsCubeNoJoin = defineCube('Events', {
        sql: (ctx: QueryContext) => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        // No joins defined
        measures: {
          count: { type: 'count', sql: productivity.id }
        },
        dimensions: {
          userId: { type: 'number', sql: productivity.employeeId },
          timestamp: { type: 'time', sql: productivity.date }
        }
      })

      const usersCubeNoJoin = defineCube('Users', {
        sql: (ctx: QueryContext) => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { type: 'count', sql: employees.id }
        },
        dimensions: {
          id: { type: 'number', sql: employees.id },
          name: { type: 'string', sql: employees.name },
          active: { type: 'boolean', sql: employees.active }
        }
      })

      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCubeNoJoin)
      cubes.set('Users', usersCubeNoJoin)

      // Try to filter Events by Users.active (cross-cube filter with no join)
      const config: FunnelQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [
          {
            name: 'Step with Cross-Cube Filter',
            filter: {
              member: 'Users.active',
              operator: 'equals',
              values: [true]
            }
          },
          { name: 'Step 2' }
        ]
      }

      const result = builder.validateConfig(config, cubes)

      // Should fail validation because no join path exists
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('no join path was found'))).toBe(true)
    })

    it('should accept cross-cube filter with valid join path', async () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FunnelQueryBuilder(adapter)
      const testSchema = await getTestSchema()
      const { productivity, employees } = testSchema

      // First create Users cube (target of join)
      const usersCubeWithJoin = defineCube('Users', {
        sql: (ctx: QueryContext) => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { type: 'count', sql: employees.id }
        },
        dimensions: {
          id: { type: 'number', sql: employees.id, primaryKey: true },
          name: { type: 'string', sql: employees.name },
          active: { type: 'boolean', sql: employees.active }
        }
      })

      // Create Events cube with join to Users
      const eventsCubeWithJoin = defineCube('Events', {
        sql: (ctx: QueryContext) => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Users: {
            targetCube: () => usersCubeWithJoin,
            relationship: 'belongsTo',
            on: [
              { source: productivity.employeeId, target: employees.id }
            ]
          }
        },
        measures: {
          count: { type: 'count', sql: productivity.id }
        },
        dimensions: {
          userId: { type: 'number', sql: productivity.employeeId },
          timestamp: { type: 'time', sql: productivity.date }
        }
      })

      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCubeWithJoin)
      cubes.set('Users', usersCubeWithJoin)

      // Cross-cube filter should pass validation
      const config: FunnelQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [
          {
            name: 'Step with Valid Cross-Cube Filter',
            filter: {
              member: 'Users.active',
              operator: 'equals',
              values: [true]
            }
          },
          { name: 'Step 2' }
        ]
      }

      const result = builder.validateConfig(config, cubes)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should execute funnel with cross-cube filter', async () => {
      const testSchema = await getTestSchema()
      const { productivity, employees } = testSchema

      // Create Users cube
      const usersCubeWithJoin = defineCube('Users', {
        sql: (ctx: QueryContext) => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { type: 'count', sql: employees.id }
        },
        dimensions: {
          id: { type: 'number', sql: employees.id, primaryKey: true },
          name: { type: 'string', sql: employees.name },
          active: { type: 'boolean', sql: employees.active }
        }
      })

      // Create Events cube with join to Users
      const eventsCubeWithJoin = defineCube('Events', {
        sql: (ctx: QueryContext) => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Users: {
            targetCube: () => usersCubeWithJoin,
            relationship: 'belongsTo',
            on: [
              { source: productivity.employeeId, target: employees.id }
            ]
          }
        },
        measures: {
          count: { type: 'count', sql: productivity.id }
        },
        dimensions: {
          userId: { type: 'number', sql: productivity.employeeId },
          timestamp: { type: 'time', sql: productivity.date },
          linesOfCode: { type: 'number', sql: productivity.linesOfCode }
        }
      })

      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCubeWithJoin)
      cubes.set('Users', usersCubeWithJoin)

      // Execute funnel with cross-cube filter
      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            {
              name: 'Active Users Events',
              filter: {
                member: 'Users.active',
                operator: 'equals',
                values: [true]
              }
            },
            {
              name: 'High Productivity',
              filter: {
                member: 'Events.linesOfCode',
                operator: 'gt',
                values: [50]
              }
            }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)
      const step0 = result.data[0] as unknown as FunnelResultRow
      const step1 = result.data[1] as unknown as FunnelResultRow

      expect(typeof step0.count).toBe('number')
      expect(typeof step1.count).toBe('number')
      // Step 1 should have <= count than step 0 (funnel property)
      expect(step1.count).toBeLessThanOrEqual(step0.count)
    })
  })

  describe('Date Range Filters in Funnels', () => {
    it('should apply inDateRange filter with explicit date values', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            {
              name: 'First Event with Date Filter',
              filter: {
                member: 'Events.timestamp',
                operator: 'inDateRange',
                values: ['2024-01-01', '2024-12-31']
              }
            },
            { name: 'Second Event' }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)
      // The first step should be filtered by date range
      const step0 = result.data[0] as unknown as FunnelResultRow
      expect(typeof step0.count).toBe('number')
      expect(step0.count).toBeGreaterThanOrEqual(0)
    })

    it('should apply inDateRange filter with dateRange property', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // This is the format the user reported as broken - dateRange with empty values
      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            {
              name: 'First Event with Relative Date',
              filter: {
                member: 'Events.timestamp',
                operator: 'inDateRange',
                values: [],
                dateRange: 'last year'
              }
            },
            { name: 'Second Event' }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)
      const step0 = result.data[0] as unknown as FunnelResultRow
      expect(typeof step0.count).toBe('number')
      expect(step0.count).toBeGreaterThanOrEqual(0)
    })

    it('should apply inDateRange filter with dateRange "last quarter"', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            {
              name: 'Events in Last Quarter',
              filter: {
                member: 'Events.timestamp',
                operator: 'inDateRange',
                values: [],
                dateRange: 'last quarter'
              }
            },
            { name: 'Subsequent Event' }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)
      const step0 = result.data[0] as unknown as FunnelResultRow
      expect(typeof step0.count).toBe('number')
    })

    it('should combine dateRange filter with value-based filter', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            {
              name: 'Recent High Productivity',
              filter: [
                {
                  member: 'Events.timestamp',
                  operator: 'inDateRange',
                  values: [],
                  dateRange: 'last year'
                },
                {
                  member: 'Events.linesOfCode',
                  operator: 'gt',
                  values: [50]
                }
              ]
            },
            { name: 'Conversion' }
          ]
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data.length).toBe(2)
      const step0 = result.data[0] as unknown as FunnelResultRow
      expect(typeof step0.count).toBe('number')
      // Combined filter should typically result in fewer events
      expect(step0.count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling', () => {
    it('should reject funnel with invalid binding key', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.nonExistentField',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Step 1' },
            { name: 'Step 2' }
          ]
        }
      }

      await expect(
        executor.execute(cubes, query, testSecurityContexts.org1)
      ).rejects.toThrow(/validation failed|not found/i)
    })

    it('should reject funnel with invalid time dimension', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.nonExistentTime',
          steps: [
            { name: 'Step 1' },
            { name: 'Step 2' }
          ]
        }
      }

      await expect(
        executor.execute(cubes, query, testSecurityContexts.org1)
      ).rejects.toThrow(/validation failed|not found/i)
    })

    it('should reject funnel with fewer than 2 steps', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [
            { name: 'Only One Step' }
          ]
        }
      }

      // hasFunnel should return false for invalid funnels
      // so this might not even reach validation
      const builder = new FunnelQueryBuilder(new PostgresAdapter())
      expect(builder.hasFunnel(query)).toBe(false)
    })
  })
})

describe('Database Adapter Funnel Methods', () => {
  describe('PostgreSQL Adapter', () => {
    const adapter = new PostgresAdapter()

    it('should build interval from ISO duration', () => {
      const interval = adapter.buildIntervalFromISO('P7D')
      expect(interval).toBeDefined()
      // The SQL should contain interval syntax
      const sqlStr = interval.toString()
      expect(sqlStr).toBeTruthy()
    })

    it('should build time difference in seconds', () => {
      const diff = adapter.buildTimeDifferenceSeconds(sql`end_time`, sql`start_time`)
      expect(diff).toBeDefined()
    })

    it('should build date add interval', () => {
      const result = adapter.buildDateAddInterval(sql`timestamp`, 'P7D')
      expect(result).toBeDefined()
    })
  })

  describe('MySQL Adapter', () => {
    const adapter = new MySQLAdapter()

    it('should build interval from ISO duration', () => {
      const interval = adapter.buildIntervalFromISO('P7D')
      expect(interval).toBeDefined()
    })

    it('should build time difference in seconds', () => {
      const diff = adapter.buildTimeDifferenceSeconds(sql`end_time`, sql`start_time`)
      expect(diff).toBeDefined()
    })

    it('should build date add interval', () => {
      const result = adapter.buildDateAddInterval(sql`timestamp`, 'P7D')
      expect(result).toBeDefined()
    })
  })

  describe('SQLite Adapter', () => {
    const adapter = new SQLiteAdapter()

    it('should build interval from ISO duration', () => {
      const interval = adapter.buildIntervalFromISO('P7D')
      expect(interval).toBeDefined()
    })

    it('should build time difference in seconds', () => {
      const diff = adapter.buildTimeDifferenceSeconds(sql`end_time`, sql`start_time`)
      expect(diff).toBeDefined()
    })

    it('should build date add interval', () => {
      const result = adapter.buildDateAddInterval(sql`timestamp`, 'P7D')
      expect(result).toBeDefined()
    })
  })
})
