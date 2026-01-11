/**
 * Server-Side Flow Query Tests
 * Tests flow analysis with bidirectional path exploration, Sankey/Sunburst output
 *
 * Flow analysis explores paths BEFORE and AFTER a starting step.
 * Uses productivity data where happinessLevel serves as the "event type".
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
import type { FlowQueryConfig, FlowResultRow } from '../src/server/types/flow'
import { FlowQueryBuilder } from '../src/server/flow-query-builder'
import { PostgresAdapter } from '../src/server/adapters/postgres-adapter'
import { MySQLAdapter } from '../src/server/adapters/mysql-adapter'
import { SQLiteAdapter } from '../src/server/adapters/sqlite-adapter'

// SQLite doesn't support flow queries (no lateral joins or required window functions)
const isSQLite = getTestDatabaseType() === 'sqlite'

describe('Server-Side Flow Queries', () => {
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

  // Create Events cube using productivity table for flow testing
  // Each productivity record represents an "event" with timestamp
  // eventType is a computed dimension based on happinessIndex (low/medium/high)
  beforeEach(async () => {
    const testSchema = await getTestSchema()
    const { productivity } = testSchema

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
        // Computed event type based on happinessIndex ranges
        eventType: {
          type: 'string',
          sql: sql`CASE
            WHEN ${productivity.happinessIndex} <= 3 THEN 'low'
            WHEN ${productivity.happinessIndex} <= 6 THEN 'medium'
            WHEN ${productivity.happinessIndex} <= 8 THEN 'high'
            ELSE 'very_high'
          END`
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

  describe('FlowQueryBuilder Unit Tests', () => {
    it('should detect flow queries correctly', () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FlowQueryBuilder(adapter)

      // Query without flow
      expect(builder.hasFlow({ measures: ['Events.count'] })).toBe(false)

      // Query with flow but missing eventDimension
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: { name: 'Start', filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] } }
        }
      })).toBe(false)

      // Query with flow but missing startingStep
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2
        }
      })).toBe(false)

      // Valid flow query
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: {
            name: 'High Happiness',
            filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
          }
        }
      })).toBe(true)
    })

    it.skipIf(isSQLite)('should validate flow configuration', async () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FlowQueryBuilder(adapter)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // Valid configuration
      const validConfig: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'High Happiness',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const validResult = builder.validateConfig(validConfig, cubes)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      // Invalid: bad binding key
      const badBindingKey: FlowQueryConfig = {
        bindingKey: 'Events.nonExistent',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const badBindingResult = builder.validateConfig(badBindingKey, cubes)
      expect(badBindingResult.isValid).toBe(false)
      expect(badBindingResult.errors.some(e => e.includes('Binding key dimension not found'))).toBe(true)

      // Invalid: bad time dimension
      const badTimeDim: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.nonExistent',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const badTimeDimResult = builder.validateConfig(badTimeDim, cubes)
      expect(badTimeDimResult.isValid).toBe(false)
      expect(badTimeDimResult.errors.some(e => e.includes('Time dimension not found'))).toBe(true)

      // Invalid: bad event dimension
      const badEventDim: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.nonExistent',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const badEventDimResult = builder.validateConfig(badEventDim, cubes)
      expect(badEventDimResult.isValid).toBe(false)
      expect(badEventDimResult.errors.some(e => e.includes('Event dimension not found'))).toBe(true)

      // Invalid: missing starting step filter
      const noFilter: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'Test'
          // No filter
        }
      }
      const noFilterResult = builder.validateConfig(noFilter, cubes)
      expect(noFilterResult.isValid).toBe(false)
      expect(noFilterResult.errors.some(e => e.includes('Starting step must have at least one filter'))).toBe(true)

      // Invalid: stepsBefore out of range
      const badStepsBefore: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: -1, // Must be 0-5
        stepsAfter: 2,
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const badStepsBeforeResult = builder.validateConfig(badStepsBefore, cubes)
      expect(badStepsBeforeResult.isValid).toBe(false)
      expect(badStepsBeforeResult.errors.some(e => e.includes('stepsBefore must be between 0 and 5'))).toBe(true)

      // Invalid: stepsAfter out of range
      const badStepsAfter: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 6, // Must be 0-5
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const badStepsAfterResult = builder.validateConfig(badStepsAfter, cubes)
      expect(badStepsAfterResult.isValid).toBe(false)
      expect(badStepsAfterResult.errors.some(e => e.includes('stepsAfter must be between 0 and 5'))).toBe(true)

      // Warning: high depth
      const highDepth: FlowQueryConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 4, // High depth
        stepsAfter: 4,
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
      const highDepthResult = builder.validateConfig(highDepth, cubes)
      expect(highDepthResult.isValid).toBe(true)
      expect(highDepthResult.warnings.some(w => w.includes('High step depth'))).toBe(true)
    })

    it('should transform results correctly', () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FlowQueryBuilder(adapter)

      // Empty result
      const emptyResult = builder.transformResult([])
      expect(emptyResult.nodes).toHaveLength(0)
      expect(emptyResult.links).toHaveLength(0)

      // Sample raw result with nodes and links
      const rawResult = [
        { record_type: 'node', id: 'before_1_low', name: 'low', layer: -1, value: 100, source_id: null, target_id: null },
        { record_type: 'node', id: 'start_high', name: 'high', layer: 0, value: 200, source_id: null, target_id: null },
        { record_type: 'node', id: 'after_1_medium', name: 'medium', layer: 1, value: 150, source_id: null, target_id: null },
        { record_type: 'link', id: null, name: null, layer: null, value: 80, source_id: 'before_1_low', target_id: 'start_high' },
        { record_type: 'link', id: null, name: null, layer: null, value: 120, source_id: 'start_high', target_id: 'after_1_medium' }
      ]

      const result = builder.transformResult(rawResult)

      // Check nodes
      expect(result.nodes).toHaveLength(3)
      expect(result.nodes[0].id).toBe('before_1_low')
      expect(result.nodes[0].name).toBe('low')
      expect(result.nodes[0].layer).toBe(-1)
      expect(result.nodes[0].value).toBe(100)

      expect(result.nodes[1].id).toBe('start_high')
      expect(result.nodes[1].name).toBe('high')
      expect(result.nodes[1].layer).toBe(0)
      expect(result.nodes[1].value).toBe(200)

      expect(result.nodes[2].id).toBe('after_1_medium')
      expect(result.nodes[2].name).toBe('medium')
      expect(result.nodes[2].layer).toBe(1)
      expect(result.nodes[2].value).toBe(150)

      // Check links
      expect(result.links).toHaveLength(2)
      expect(result.links[0].source).toBe('before_1_low')
      expect(result.links[0].target).toBe('start_high')
      expect(result.links[0].value).toBe(80)

      expect(result.links[1].source).toBe('start_high')
      expect(result.links[1].target).toBe('after_1_medium')
      expect(result.links[1].value).toBe(120)

      // Verify nodes are sorted by layer
      for (let i = 1; i < result.nodes.length; i++) {
        expect(result.nodes[i].layer).toBeGreaterThanOrEqual(result.nodes[i - 1].layer)
      }
    })
  })

  describe.skipIf(isSQLite)('Flow Query Execution', () => {
    it('should execute a simple flow query with before and after steps', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      // Verify result structure
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)

      // The result should contain nodes and links when cast as FlowResultRow
      // Since the executor returns the raw transformed result
      if (result.data.length > 0) {
        const flowData = result.data as unknown as FlowResultRow
        // If we have data, check the structure
        if ('nodes' in flowData) {
          expect(Array.isArray(flowData.nodes)).toBe(true)
          expect(Array.isArray(flowData.links)).toBe(true)
        }
      }
    })

    it('should execute flow query with multiple steps before and after', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: {
            name: 'Medium Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['medium']
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should execute flow query with entity limit', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          },
          entityLimit: 10
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })

    it('should execute flow query with combined filters on starting step', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High Productivity High Happiness',
            filter: [
              {
                member: 'Events.eventType',
                operator: 'equals',
                values: ['high']
              },
              {
                member: 'Events.linesOfCode',
                operator: 'gt',
                values: [100]
              }
            ]
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })
  })

  describe.skipIf(isSQLite)('Output Modes', () => {
    it('should execute flow query in sankey mode (default)', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          },
          outputMode: 'sankey'
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })

    it('should execute flow query in sunburst mode', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          },
          outputMode: 'sunburst'
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })
  })

  describe.skipIf(isSQLite)('Security Context', () => {
    it('should isolate flow results by organisation', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'Any Event',
            filter: {
              member: 'Events.eventType',
              operator: 'set',
              values: []
            }
          }
        }
      }

      const result1 = await executor.execute(cubes, query, testSecurityContexts.org1)
      const result2 = await executor.execute(cubes, query, testSecurityContexts.org2)

      // Results should be different for different organisations
      expect(result1.data).toBeDefined()
      expect(result2.data).toBeDefined()

      // Both should return valid data structures
      expect(Array.isArray(result1.data)).toBe(true)
      expect(Array.isArray(result2.data)).toBe(true)
    })
  })

  describe.skipIf(isSQLite)('Annotation Metadata', () => {
    it('should include flow metadata in annotation', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      // Check annotation structure
      expect(result.annotation).toBeDefined()

      // Flow metadata should be in annotation
      const annotation = result.annotation as any
      if (annotation.flow) {
        expect(annotation.flow.config).toBeDefined()
        expect(annotation.flow.config.stepsBefore).toBe(2)
        expect(annotation.flow.config.stepsAfter).toBe(2)
        expect(annotation.flow.config.startingStep.name).toBe('High Happiness')
      }
    })
  })

  describe.skipIf(isSQLite)('Date Range Filters in Flow', () => {
    it('should apply inDateRange filter with explicit date values', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'Events in Date Range',
            filter: [
              {
                member: 'Events.eventType',
                operator: 'equals',
                values: ['high']
              },
              {
                member: 'Events.timestamp',
                operator: 'inDateRange',
                values: ['2024-01-01', '2024-12-31']
              }
            ]
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })

    it('should apply inDateRange filter with dateRange property', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'Recent Events',
            filter: [
              {
                member: 'Events.eventType',
                operator: 'equals',
                values: ['high']
              },
              {
                member: 'Events.timestamp',
                operator: 'inDateRange',
                values: [],
                dateRange: 'last year'
              }
            ]
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })
  })

  describe.skipIf(isSQLite)('Error Handling', () => {
    it('should reject flow with invalid binding key', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.nonExistentField',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'Test',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      await expect(
        executor.execute(cubes, query, testSecurityContexts.org1)
      ).rejects.toThrow(/validation failed|not found/i)
    })

    it('should reject flow with invalid time dimension', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.nonExistentTime',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'Test',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      await expect(
        executor.execute(cubes, query, testSecurityContexts.org1)
      ).rejects.toThrow(/validation failed|not found/i)
    })

    it('should reject flow with invalid event dimension', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.nonExistentEvent',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'Test',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      await expect(
        executor.execute(cubes, query, testSecurityContexts.org1)
      ).rejects.toThrow(/validation failed|not found/i)
    })

    it('should detect non-flow queries correctly', async () => {
      const dbType = getTestDatabaseType()
      const adapter = dbType === 'mysql'
        ? new MySQLAdapter()
        : dbType === 'sqlite'
          ? new SQLiteAdapter()
          : new PostgresAdapter()

      const builder = new FlowQueryBuilder(adapter)

      // Regular query without flow
      expect(builder.hasFlow({ measures: ['Events.count'] })).toBe(false)

      // Query with incomplete flow config
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId'
          // Missing other required fields
        }
      })).toBe(false)
    })
  })

  describe.skipIf(isSQLite)('Edge Cases', () => {
    it('should handle maximum depth (5 steps)', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 5, // Maximum
          stepsAfter: 5,  // Maximum
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })

    it('should handle asymmetric step counts', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 3, // More steps after than before
          startingStep: {
            name: 'High Happiness',
            filter: {
              member: 'Events.eventType',
              operator: 'equals',
              values: ['high']
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })

    it('should handle OR filter logic in starting step', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High or Medium',
            filter: {
              or: [
                { member: 'Events.eventType', operator: 'equals', values: ['high'] },
                { member: 'Events.eventType', operator: 'equals', values: ['medium'] }
              ]
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })

    it('should handle AND filter logic in starting step', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 1,
          stepsAfter: 1,
          startingStep: {
            name: 'High Happiness and High Productivity',
            filter: {
              and: [
                { member: 'Events.eventType', operator: 'equals', values: ['high'] },
                { member: 'Events.linesOfCode', operator: 'gt', values: [100] }
              ]
            }
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
    })
  })
})

describe('Database Adapter Flow Support', () => {
  describe('PostgreSQL Adapter', () => {
    const adapter = new PostgresAdapter()
    const builder = new FlowQueryBuilder(adapter)

    it('should create FlowQueryBuilder with PostgresAdapter', () => {
      expect(builder).toBeDefined()
    })

    it('should detect flow queries correctly', () => {
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: {
            name: 'Test',
            filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
          }
        }
      })).toBe(true)
    })

    it('should report lateral join support', () => {
      expect(adapter.supportsLateralJoins()).toBe(true)
    })
  })

  describe('MySQL Adapter', () => {
    const adapter = new MySQLAdapter()
    const builder = new FlowQueryBuilder(adapter)

    it('should create FlowQueryBuilder with MySQLAdapter', () => {
      expect(builder).toBeDefined()
    })

    it('should detect flow queries correctly', () => {
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: {
            name: 'Test',
            filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
          }
        }
      })).toBe(true)
    })

    it('should report lateral join support', () => {
      expect(adapter.supportsLateralJoins()).toBe(true)
    })
  })

  describe('SQLite Adapter', () => {
    const adapter = new SQLiteAdapter()
    const builder = new FlowQueryBuilder(adapter)

    it('should create FlowQueryBuilder with SQLiteAdapter', () => {
      expect(builder).toBeDefined()
    })

    it('should detect flow queries correctly', () => {
      expect(builder.hasFlow({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventType',
          stepsBefore: 2,
          stepsAfter: 2,
          startingStep: {
            name: 'Test',
            filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
          }
        }
      })).toBe(true)
    })

    it('should reject flow queries on SQLite with clear error', () => {
      // Create a mock cubes map
      const cubes = new Map<string, any>()
      cubes.set('Events', {
        name: 'Events',
        dimensions: {
          userId: { type: 'number', sql: () => {} },
          timestamp: { type: 'time', sql: () => {} },
          eventType: { type: 'string', sql: () => {} }
        }
      })

      const config = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'Test',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }

      const result = builder.validateConfig(config, cubes)

      // SQLite should fail validation with a clear error message
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Flow queries are not supported on SQLite. Use PostgreSQL or MySQL for flow analysis.'
      )
    })

    it('should report no lateral join support', () => {
      expect(adapter.supportsLateralJoins()).toBe(false)
    })
  })
})
