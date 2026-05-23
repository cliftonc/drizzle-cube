import { describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { pgTable, integer } from 'drizzle-orm/pg-core'

import { defineCube } from '../src/server/cube-utils'
import { SemanticLayerCompiler } from '../src/server/compiler'
import { evaluateDynamicMeasures, parseDynamicMeasureFormula } from '../src/server/dynamic-measures'
import { generateCacheKey } from '../src/server/cache-utils'

const rows = pgTable('rows', {
  id: integer('id'),
  organisationId: integer('organisation_id'),
  value: integer('value')
})

function createCompiler() {
  const compiler = new SemanticLayerCompiler()
  compiler.registerCube(defineCube('Rows', {
    sql: (ctx) => ({
      from: rows,
      where: eq(rows.organisationId, (ctx.securityContext as { organisationId: number }).organisationId)
    }),
    measures: {
      count: { name: 'count', type: 'count', sql: () => rows.id },
      total: { name: 'total', type: 'sum', sql: () => rows.value },
      constant: { name: 'constant', type: 'number', sql: () => sql`1` }
    },
    dimensions: {}
  }))
  return compiler
}

describe('dynamic query-time measures', () => {
  it('parses fully-qualified arithmetic references and rejects unsafe syntax', () => {
    const parsed = parseDynamicMeasureFormula('(Rows.total / Rows.count) + 2 * Rows.constant')

    expect(parsed.references).toEqual(['Rows.total', 'Rows.count', 'Rows.constant'])
    expect(parsed.evaluate({ 'Rows.total': 12, 'Rows.count': 3, 'Rows.constant': 4 })).toBe(12)
    expect(parseDynamicMeasureFormula('SUM(Rows.total)').isValid).toBe(false)
    expect(parseDynamicMeasureFormula('Rows.total; DROP TABLE rows').isValid).toBe(false)
    expect(parseDynamicMeasureFormula('total + 1').isValid).toBe(false)
  })

  it('evaluates row-local dynamic measures and returns null for invalid numeric results', () => {
    const [row] = evaluateDynamicMeasures([
      { 'Rows.total': 12, 'Rows.count': 3, dimensionName: 'original' },
      { 'Rows.total': 12, 'Rows.count': 0 }
    ], [
      'Rows.total',
      'Rows.count',
      { name: 'averageValue', formula: 'Rows.total / Rows.count', title: 'Average value', format: 'number' },
      { name: 'dimensionName', formula: 'Rows.total + 1' }
    ])

    expect(row.averageValue).toBe(4)
    expect(row.dimensionName).toBe(13)
    expect(evaluateDynamicMeasures([{ 'Rows.total': 12, 'Rows.count': 0 }], [
      'Rows.total',
      'Rows.count',
      { name: 'averageValue', formula: 'Rows.total / Rows.count' }
    ])[0].averageValue).toBeNull()
  })

  it('validates dynamic measure objects against selected static measures', () => {
    const compiler = createCompiler()

    expect(compiler.validateQuery({
      measures: [
        'Rows.total',
        'Rows.count',
        { name: 'averageValue', formula: 'Rows.total / Rows.count', title: 'Average value' }
      ]
    }).isValid).toBe(true)

    expect(compiler.validateQuery({
      measures: ['Rows.total', { name: 'Rows.averageValue', formula: 'Rows.total / Rows.count' }]
    }).isValid).toBe(false)

    expect(compiler.validateQuery({
      measures: ['Rows.total', { name: 'averageValue', formula: 'Rows.total / Rows.count' }]
    }).errors).toContain("Dynamic measure 'averageValue' references 'Rows.count' which must be selected as a static measure")

    expect(compiler.validateQuery({
      measures: ['Rows.total', 'Rows.count', { name: 'averageValue', formula: 'Rows.missing / Rows.count' }]
    }).errors).toContain("Dynamic measure 'averageValue' references unknown measure 'Rows.missing'")
  })

  it('keeps different dynamic definitions in separate cache keys regardless of object key order', () => {
    const securityContext = { organisationId: 1 }
    const first = generateCacheKey({
      measures: ['Rows.total', 'Rows.count', { name: 'averageValue', formula: 'Rows.total / Rows.count', title: 'Average value' }]
    }, securityContext)
    const reordered = generateCacheKey({
      measures: ['Rows.count', 'Rows.total', { formula: 'Rows.total / Rows.count', title: 'Average value', name: 'averageValue' }]
    }, securityContext)
    const differentFormula = generateCacheKey({
      measures: ['Rows.total', 'Rows.count', { name: 'averageValue', formula: 'Rows.total + Rows.count', title: 'Average value' }]
    }, securityContext)

    expect(first).toBe(reordered)
    expect(first).not.toBe(differentFormula)
  })
})
