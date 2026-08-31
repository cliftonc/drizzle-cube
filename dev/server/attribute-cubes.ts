/**
 * Per-tenant cube sets from user-defined attributes (EAV).
 *
 * Each organisation defines its own attributes, so the set of dimensions on the
 * Employees cube differs per tenant. This is the boot loop described in
 * `docs/per-tenant-cube-sets.md`: load each organisation's attributes once at
 * startup, generate a dimension per attribute, and register the result as that
 * organisation's cube set.
 */

import { eq } from 'drizzle-orm'
import { buildAttributeDimensions } from '../../src/server/index.js'
import type { SemanticLayerCompiler, QueryContext, Cube } from '../../src/server/index.js'
import { attributes, employeeAttributeValues, employees } from './schema.js'
import { allCubes } from './cubes.js'

interface AttributeRow {
  id: number
  name: string
  valueType: string
  organisationId: number
}

/**
 * Load every organisation's attributes and register one cube set per
 * organisation. Call once, after the base cubes are registered.
 */
export async function registerAttributeCubeSets(
  semanticLayer: SemanticLayerCompiler,
  db: any
): Promise<void> {
  const employeesCube = allCubes.find((cube: Cube) => cube.name === 'Employees')
  if (!employeesCube) return

  const rows: AttributeRow[] = await db.select().from(attributes)
  if (rows.length === 0) {
    console.log('🏷️  No user-defined attributes found — every tenant gets the base cubes')
    return
  }

  const byOrganisation = new Map<number, AttributeRow[]>()
  for (const row of rows) {
    const existing = byOrganisation.get(row.organisationId)
    if (existing) existing.push(row)
    else byOrganisation.set(row.organisationId, [row])
  }

  for (const [organisationId, organisationAttributes] of byOrganisation) {
    const attributeDimensions = buildAttributeDimensions({
      attributes: organisationAttributes.map(row => ({
        id: row.id,
        name: row.name,
        valueType: row.valueType === 'number' ? 'number' : 'string'
      })),
      valueTable: employeeAttributeValues,
      recordKey: employees.id,
      foreignKey: employeeAttributeValues.employeeId,
      attributeKey: employeeAttributeValues.attributeId,
      valueColumn: employeeAttributeValues.value,
      // Scoped inside the subquery — without this a tenant reads every
      // tenant's attribute values.
      security: (ctx: QueryContext) =>
        eq(employeeAttributeValues.organisationId, ctx.securityContext.organisationId as number)
    })

    semanticLayer.registerCubeSet(String(organisationId), [
      {
        ...employeesCube,
        dimensions: { ...employeesCube.dimensions, ...attributeDimensions }
      }
    ])
  }

  const stats = semanticLayer.getCubeSetStats()
  console.log(
    `🏷️  Registered ${stats.setCount} cube set(s) from ${rows.length} attribute(s) ` +
    `in ${stats.totalRegistrationMs}ms — /cubejs-api/v1/meta now differs per organisation`
  )
}
