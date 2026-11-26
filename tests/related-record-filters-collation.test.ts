import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { SemanticLayerCompiler } from '../src/server/compiler'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, Filter, SemanticQuery } from '../src/server/types'
import { onRowLevelJoin } from './helpers/row-level-filter'

type KeyCount = 'one key' | 'two keys'

it('should aggregate a reversed child join with the parent key collation on SQLite', async () => {
  const parents = sqliteTable('parents', { code: text('code').primaryKey() })
  const children = sqliteTable('children', { id: integer('id').primaryKey(), parentCode: text('parent_code').notNull() })
  const client = new Database(':memory:')
  try {
    client.exec(`
      CREATE TABLE parents (code TEXT PRIMARY KEY);
      CREATE TABLE children (id INTEGER PRIMARY KEY, parent_code TEXT COLLATE NOCASE NOT NULL);
      INSERT INTO parents VALUES ('A'), ('a');
      INSERT INTO children VALUES (1, 'A');
    `)
    const parent = defineCube('Parents', {
      sql: () => ({ from: parents }),
      joins: {
        Children: { targetCube: () => child, relationship: 'hasMany', on: [{ source: parents.code, target: children.parentCode }] }
      },
      dimensions: { code: { name: 'code', type: 'string', sql: parents.code, primaryKey: true } },
      measures: {}
    })
    const child = defineCube('Children', {
      sql: () => ({ from: children }),
      joins: {
        Parents: {
          targetCube: () => parent,
          relationship: 'belongsTo',
          on: [{ source: children.parentCode, target: parents.code }],
          preferredFor: ['Parents']
        }
      },
      dimensions: {},
      measures: { count: { name: 'count', type: 'count', sql: children.id } }
    })
    const layer = new SemanticLayerCompiler({ drizzle: drizzle(client), engineType: 'sqlite' })
    layer.registerCube(parent)
    layer.registerCube(child)

    const query: SemanticQuery = {
      dimensions: ['Parents.code'],
      measures: ['Children.count'],
      order: { 'Parents.code': 'asc' }
    }
    const security = { organisationId: 1 }
    const plan = layer.analyzeQuery(query, security)
    expect(plan.primaryCube.selectedCube).toBe('Parents')
    expect(plan.joinPaths[0].path?.[0].reversed).toBe(true)
    const { data } = await layer.execute(query, security)

    expect(data).toEqual([
      { 'Parents.code': 'A', 'Children.count': 1 },
      { 'Parents.code': 'a', 'Children.count': 0 }
    ])
  } finally {
    client.close()
  }
})

describe('Filters on cubes used only for filtering, joined on keys with different collations (SQLite)', () => {
  const parents = sqliteTable('collation_parents', {
    organisationId: integer('organisation_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull()
  })
  const children = sqliteTable('collation_children', {
    organisationId: integer('organisation_id').notNull(),
    parentCode: text('parent_code').notNull(),
    flag: integer('flag').notNull()
  })
  const client = new Database(':memory:')
  const db = drizzle(client)
  const securityContext = { organisationId: 1 }
  const flagged: Filter = { member: 'Children.flag', operator: 'equals', values: [1] }

  beforeAll(() => {
    client.exec(`CREATE TABLE collation_parents (
      organisation_id INTEGER NOT NULL, code TEXT COLLATE NOCASE NOT NULL, name TEXT NOT NULL
    )`)
    client.exec(`CREATE TABLE collation_children (
      organisation_id INTEGER NOT NULL, parent_code TEXT NOT NULL, flag INTEGER NOT NULL
    )`)
    db.insert(parents).values([
      { organisationId: 1, code: 'abc', name: 'Lower' },
      { organisationId: 1, code: 'XYZ', name: 'Upper' }
    ]).run()
    db.insert(children).values([
      { organisationId: 1, parentCode: 'ABC', flag: 1 },
      { organisationId: 1, parentCode: 'XYZ', flag: 1 }
    ]).run()
  })

  afterAll(() => client.close())

  const keyCounts: KeyCount[] = ['one key', 'two keys']

  function layerWithJoinDeclaredOn(cubeName: 'Parents' | 'Children', keyCount: KeyCount): SemanticLayerCompiler {
    const withOrganisation = keyCount === 'two keys'
    const parentCube: Cube = defineCube('Parents', {
      sql: ctx => ({ from: parents, where: eq(parents.organisationId, ctx.securityContext.organisationId as number) }),
      joins: cubeName === 'Parents'
        ? {
            Children: {
              targetCube: () => childCube,
              relationship: 'hasMany',
              on: [
                ...(withOrganisation ? [{ source: parents.organisationId, target: children.organisationId }] : []),
                { source: parents.code, target: children.parentCode }
              ]
            }
          }
        : {},
      dimensions: { name: { name: 'name', type: 'string', sql: parents.name } },
      measures: {}
    })
    const childCube: Cube = defineCube('Children', {
      sql: ctx => ({ from: children, where: eq(children.organisationId, ctx.securityContext.organisationId as number) }),
      joins: cubeName === 'Children'
        ? {
            Parents: {
              targetCube: () => parentCube,
              relationship: 'belongsTo',
              on: [
                ...(withOrganisation ? [{ source: children.organisationId, target: parents.organisationId }] : []),
                { source: children.parentCode, target: parents.code }
              ]
            }
          }
        : {},
      dimensions: { flag: { name: 'flag', type: 'number', sql: children.flag } },
      measures: {}
    })
    const layer = new SemanticLayerCompiler({ drizzle: db, engineType: 'sqlite' })
    layer.registerCube(parentCube)
    layer.registerCube(childCube)
    return layer
  }

  async function parentNames(layer: SemanticLayerCompiler, filters: Filter[]): Promise<unknown[]> {
    const result = await layer.execute({ dimensions: ['Parents.name'], filters, order: { 'Parents.name': 'asc' } }, securityContext)
    return result.data.map(row => row['Parents.name'])
  }

  it.each(keyCounts)('should match the parents that the row-level join matches when the parent cube declares the join on %s', async keyCount => {
    const layer = layerWithJoinDeclaredOn('Parents', keyCount)
    const joined = await parentNames(layer, [onRowLevelJoin(flagged)])

    expect(joined).toEqual(['Lower', 'Upper'])
    expect(await parentNames(layer, [flagged])).toEqual(joined)
  })

  it.each(keyCounts)('should match the parents that the row-level join matches when the child cube declares the join on %s', async keyCount => {
    const layer = layerWithJoinDeclaredOn('Children', keyCount)
    const joined = await parentNames(layer, [onRowLevelJoin(flagged)])

    expect(joined).toEqual(['Upper'])
    expect(await parentNames(layer, [flagged])).toEqual(joined)
  })
})

/**
 * A measure cube that joins another cube on a key with another collation than
 * the primary cube's key. The row-level plan pre-aggregates the measure cube
 * and joins that cube on its rows, compared in the collation of its key.
 *
 * Topology:
 *   Owners (primary, BINARY code) ──hasMany──→ Records (measures, NOCASE code) ──belongsTo──→ Labels (BINARY code)
 *   Owners ──belongsTo or hasMany──→ Labels ──hasMany──→ Marks
 */
describe('Filters on cubes used only for filtering beside a measure cube joined on keys with different collations (SQLite)', () => {
  const owners = sqliteTable('collation_owners', {
    organisationId: integer('organisation_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull()
  })
  const records = sqliteTable('collation_records', {
    organisationId: integer('organisation_id').notNull(),
    id: integer('id').notNull(),
    ownerCode: text('owner_code').notNull()
  })
  const labels = sqliteTable('collation_labels', {
    organisationId: integer('organisation_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    flag: integer('flag').notNull()
  })
  const marks = sqliteTable('collation_marks', {
    organisationId: integer('organisation_id').notNull(),
    labelName: text('label_name').notNull(),
    flag: integer('flag').notNull()
  })
  const client = new Database(':memory:')
  const db = drizzle(client)
  const securityContext = { organisationId: 1 }
  const flagged: Filter = { member: 'Labels.flag', operator: 'equals', values: [1] }
  const marked: Filter = { member: 'Marks.flag', operator: 'equals', values: [1] }

  beforeAll(() => {
    client.exec(`CREATE TABLE collation_owners (
      organisation_id INTEGER NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL
    )`)
    client.exec(`CREATE TABLE collation_records (
      organisation_id INTEGER NOT NULL, id INTEGER NOT NULL, owner_code TEXT COLLATE NOCASE NOT NULL
    )`)
    client.exec(`CREATE TABLE collation_labels (
      organisation_id INTEGER NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, flag INTEGER NOT NULL
    )`)
    client.exec(`CREATE TABLE collation_marks (
      organisation_id INTEGER NOT NULL, label_name TEXT NOT NULL, flag INTEGER NOT NULL
    )`)
    db.insert(owners).values({ organisationId: 1, code: 'A', name: 'Owner' }).run()
    db.insert(records).values({ organisationId: 1, id: 1, ownerCode: 'A' }).run()
    db.insert(labels).values({ organisationId: 1, code: 'a', name: 'Label', flag: 1 }).run()
    db.insert(marks).values({ organisationId: 1, labelName: 'Label', flag: 1 }).run()
  })

  afterAll(() => client.close())

  function layerWhere(options: { ownersJoinLabels?: 'belongsTo' | 'hasMany'; labelsComparedFirst?: boolean }): SemanticLayerCompiler {
    const ownerCube: Cube = defineCube('Owners', {
      sql: ctx => ({ from: owners, where: eq(owners.organisationId, ctx.securityContext.organisationId as number) }),
      joins: {
        Records: {
          targetCube: () => recordCube,
          relationship: 'hasMany',
          on: [{ source: owners.code, target: records.ownerCode }]
        },
        ...(options.ownersJoinLabels && {
          Labels: {
            targetCube: () => labelCube,
            relationship: options.ownersJoinLabels,
            on: [{ source: owners.code, target: labels.code }]
          }
        })
      },
      dimensions: { name: { name: 'name', type: 'string', sql: owners.name } },
      measures: {}
    })
    const recordCube: Cube = defineCube('Records', {
      sql: ctx => ({ from: records, where: eq(records.organisationId, ctx.securityContext.organisationId as number) }),
      joins: {
        Labels: {
          targetCube: () => labelCube,
          relationship: 'belongsTo',
          on: [{
            source: records.ownerCode,
            target: labels.code,
            ...(options.labelsComparedFirst && { as: (source, target) => sql`${target} = ${source}` })
          }]
        }
      },
      dimensions: {},
      measures: { count: { name: 'count', type: 'count', sql: records.id } }
    })
    const labelCube: Cube = defineCube('Labels', {
      sql: ctx => ({ from: labels, where: eq(labels.organisationId, ctx.securityContext.organisationId as number) }),
      joins: {
        Marks: {
          targetCube: () => markCube,
          relationship: 'hasMany',
          on: [{ source: labels.name, target: marks.labelName }]
        }
      },
      dimensions: {
        name: { name: 'name', type: 'string', sql: labels.name },
        flag: { name: 'flag', type: 'number', sql: labels.flag }
      },
      measures: {}
    })
    const markCube: Cube = defineCube('Marks', {
      sql: ctx => ({ from: marks, where: eq(marks.organisationId, ctx.securityContext.organisationId as number) }),
      dimensions: { flag: { name: 'flag', type: 'number', sql: marks.flag } },
      measures: {}
    })
    const layer = new SemanticLayerCompiler({ drizzle: db, engineType: 'sqlite' })
    for (const cube of [ownerCube, recordCube, labelCube, markCube]) {
      layer.registerCube(cube)
    }
    return layer
  }

  async function recordCounts(layer: SemanticLayerCompiler, dimensions: string[], filters: Filter[]): Promise<unknown[][]> {
    const query: SemanticQuery = { measures: ['Records.count'], dimensions, filters }
    const result = await layer.execute(query, securityContext)
    return result.data.map(row => [...dimensions.map(dimension => row[dimension]), Number(row['Records.count'])])
  }

  it('should join a grouping cube on the measure cube rows, compared in the collation of the measure cube key', async () => {
    const layer = layerWhere({ ownersJoinLabels: 'belongsTo' })
    const joined = await recordCounts(layer, ['Owners.name', 'Labels.name'], [onRowLevelJoin(marked)])

    expect(joined).toEqual([['Owner', 'Label', 1]])
    expect(await recordCounts(layer, ['Owners.name', 'Labels.name'], [marked])).toEqual(joined)
  })

  it('should test the filter cube from the measure cube, compared in the collation of the measure cube key', async () => {
    const layer = layerWhere({ ownersJoinLabels: 'hasMany' })
    const joined = await recordCounts(layer, ['Owners.name'], [onRowLevelJoin(flagged)])

    expect(joined).toEqual([['Owner', 1]])
    expect(await recordCounts(layer, ['Owners.name'], [flagged])).toEqual(joined)
  })

  it('should match the grouping cube rows that the row-level plan matches when the measure cube joins it with a custom comparator', async () => {
    const layer = layerWhere({ labelsComparedFirst: true })
    const joined = await recordCounts(layer, ['Owners.name', 'Labels.name'], [onRowLevelJoin(marked)])

    expect(joined).toEqual([['Owner', 'Label', 1]])
    expect(await recordCounts(layer, ['Owners.name', 'Labels.name'], [marked])).toEqual(joined)
  })

  it('should match the filter cube rows that the row-level plan matches when the measure cube joins it with a custom comparator', async () => {
    const layer = layerWhere({ ownersJoinLabels: 'hasMany', labelsComparedFirst: true })
    const joined = await recordCounts(layer, ['Owners.name'], [onRowLevelJoin(flagged)])

    expect(joined).toEqual([['Owner', 1]])
    expect(await recordCounts(layer, ['Owners.name'], [flagged])).toEqual(joined)
  })
})
