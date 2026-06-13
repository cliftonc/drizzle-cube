/**
 * Cubes used by the benchmark catalog: the shared functional-test cubes plus
 * an Events cube over the productivity table for analysis-mode benchmarks
 * (same pattern as tests/funnel-query.test.ts / flow-query.test.ts).
 */

import { eq, sql } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext } from '../src/server/types'
import { getTestCubes } from '../tests/helpers/test-cubes'
import { productivity } from '../tests/helpers/databases/postgres/schema'

export async function getPerfCubes(): Promise<Map<string, Cube>> {
  const cubes = await getTestCubes()

  const eventsCube = defineCube('Events', {
    sql: (ctx: QueryContext) => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId as number)
    }),

    measures: {
      count: {
        name: 'count',
        type: 'count',
        sql: productivity.id
      },
      uniqueUsers: {
        name: 'uniqueUsers',
        type: 'countDistinct',
        sql: productivity.employeeId
      }
    },

    dimensions: {
      id: {
        name: 'id',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      },
      userId: {
        name: 'userId',
        type: 'number',
        sql: productivity.employeeId
      },
      timestamp: {
        name: 'timestamp',
        type: 'time',
        sql: productivity.date
      },
      linesOfCode: {
        name: 'linesOfCode',
        type: 'number',
        sql: productivity.linesOfCode
      },
      pullRequests: {
        name: 'pullRequests',
        type: 'number',
        sql: productivity.pullRequests
      },
      eventType: {
        name: 'eventType',
        type: 'string',
        sql: sql`CASE
          WHEN ${productivity.happinessIndex} <= 3 THEN 'low'
          WHEN ${productivity.happinessIndex} <= 6 THEN 'medium'
          WHEN ${productivity.happinessIndex} <= 8 THEN 'high'
          ELSE 'very_high'
        END`
      }
    }
  })

  cubes.set('Events', eventsCube)
  return cubes
}
