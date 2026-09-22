import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { SemanticLayerCompiler } from '../src/server/compiler'
import { defineCube } from '../src/server/cube-utils'
import { handleLoad } from '../src/server/query-handlers'
import { buildDrillQuery } from '../src/client/utils/drillQueryBuilder'
import { cleanQueryForServer } from '../src/client/shared/utils'
import type { CubeMeta, CubeQuery } from '../src/client/types'
import type { DrillOption } from '../src/client/types/drill'

describe('Details drilling into a time bucket (SQLite execution)', () => {
  const documents = sqliteTable('drill_documents', {
    name: text('name').primaryKey(),
    uploadedAt: integer('uploaded_at').notNull(),
    status: text('status').notNull(),
    organisationId: integer('organisation_id').notNull()
  })
  const client = new Database(':memory:')
  const db = drizzle(client)
  const securityContext = { organisationId: 1 }
  const semanticLayer = new SemanticLayerCompiler({ drizzle: db, engineType: 'sqlite' })
  const option: DrillOption = {
    id: 'details-count-Documents.name',
    label: 'Show by Name',
    type: 'details',
    scope: 'portlet',
    measure: 'Documents.count',
    targetDimension: 'Documents.name'
  }
  let metadata: CubeMeta

  beforeAll(() => {
    client.exec(`CREATE TABLE drill_documents (
      name TEXT PRIMARY KEY, uploaded_at INTEGER NOT NULL,
      status TEXT NOT NULL, organisation_id INTEGER NOT NULL
    )`)
    const records: Array<[string, string, string, number]> = [
      ['Before April', '2026-03-31T23:59:59Z', 'reviewed', 1],
      ['April start', '2026-04-01T00:00:00Z', 'reviewed', 1],
      ['Document A', '2026-04-02T12:00:00Z', 'reviewed', 1],
      ['Document B', '2026-04-15T15:30:00Z', 'reviewed', 1],
      ['April end', '2026-04-30T23:59:59Z', 'reviewed', 1],
      ['May start', '2026-05-01T00:00:00Z', 'reviewed', 1],
      ['Unreviewed', '2026-04-15T15:30:00Z', 'pending', 1],
      ['Other organisation', '2026-04-15T15:30:00Z', 'reviewed', 2]
    ]
    db.insert(documents).values(records.map(([name, uploadedAt, status, organisationId]) => ({
      name, uploadedAt: new Date(uploadedAt).getTime() / 1000, status, organisationId
    }))).run()
    semanticLayer.registerCube(defineCube('Documents', {
      sql: ctx => {
        const organisationId = ctx.securityContext.organisationId
        if (typeof organisationId !== 'number') throw new Error('Missing organisation ID')
        return { from: documents, where: eq(documents.organisationId, organisationId) }
      },
      measures: {
        count: { name: 'count', type: 'count', sql: () => sql`${documents.name}`, drillMembers: ['Documents.name'] }
      },
      dimensions: {
        name: { name: 'name', type: 'string', sql: () => sql`${documents.name}` },
        uploadedAt: { name: 'uploadedAt', type: 'time', sql: () => sql`${documents.uploadedAt}` },
        status: { name: 'status', type: 'string', sql: () => sql`${documents.status}` }
      }
    }))
    metadata = { cubes: semanticLayer.getMetadata(securityContext) }
  })

  afterAll(() => client.close())

  it.each([
    { dateRange: undefined, names: ['April end', 'April start', 'Document A', 'Document B'] },
    { dateRange: ['2026-04-10', '2026-04-20'], names: ['Document B'] }
  ])('should return only April contributors within the original date range $dateRange', async ({ dateRange, names }) => {
    const query: CubeQuery = {
      measures: ['Documents.count'],
      timeDimensions: [{ dimension: 'Documents.uploadedAt', granularity: 'month', dateRange }],
      filters: [{ member: 'Documents.status', operator: 'equals', values: ['reviewed'] }]
    }
    const result = buildDrillQuery(option, {
      clickedField: 'Documents.count',
      xValue: '2026-04',
      dataPoint: { name: '2026-04', 'Documents.count': 4 },
      position: { x: 0, y: 0 }
    }, query, metadata)
    const response = await handleLoad(semanticLayer, securityContext, {
      query: JSON.parse(JSON.stringify(cleanQueryForServer(result.query)))
    })

    expect(response.data.map(row => row['Documents.name']).sort()).toEqual(names)
    for (const row of response.data) {
      expect(row['Documents.count']).toBe(1)
    }
  })
})
