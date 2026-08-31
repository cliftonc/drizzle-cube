/**
 * Generated dimensions for user-defined attributes (EAV).
 *
 * The shape this solves: an admin defines extra "attributes" for their
 * organisation, and each record carries a value per attribute in a junction
 * table. Rendering those as ordinary dimensions — one per attribute, backed by
 * a correlated subquery — means filtering, sorting, projection, drill-down and
 * export all work through paths that already exist, with no new query-model
 * concept.
 *
 * Because attribute definitions are usually per-organisation, generate these at
 * boot and register them with `registerCubeSet(orgId, ...)` rather than
 * `registerCube` — see `docs/per-tenant-cube-sets.md`.
 */

import { sql } from 'drizzle-orm'
import type { AnyColumn, SQL } from 'drizzle-orm'
import type { Dimension, QueryContext } from './types/index.js'
import { t } from '../i18n/runtime.js'

/** The value types a generated attribute dimension can be cast to. */
export type AttributeValueType = 'string' | 'number' | 'time'

/** One admin-defined attribute, as loaded from the application's own table. */
export interface AttributeDefinition {
  /**
   * Stable identifier. The dimension's member name is derived from this, never
   * from the attribute's name — so renaming an attribute updates every table
   * header without breaking saved dashboards, drill state or share links.
   */
  id: string | number
  /** Display name. Becomes the dimension's `title`, which the client renders. */
  name: string
  /**
   * Value type, if the application's attribute table records one. Filtering and
   * sorting happen in SQL over the whole table before any row reaches the
   * browser, so this is not cosmetic — see {@link buildAttributeDimensions}.
   */
  valueType?: AttributeValueType
}

export interface BuildAttributeDimensionsOptions {
  /** The attributes to generate a dimension for. */
  attributes: AttributeDefinition[]
  /** The junction table holding one row per (record, attribute). */
  valueTable: unknown
  /** Primary key of the record being extended — e.g. `employees.id`. */
  recordKey: AnyColumn
  /** Column on the junction table pointing back at the record. */
  foreignKey: AnyColumn
  /** Column on the junction table identifying the attribute. */
  attributeKey: AnyColumn
  /** Column on the junction table holding the value. */
  valueColumn: AnyColumn
  /**
   * Row-level security for the junction table. **Required**: the subquery reads
   * the junction table directly, so without this a tenant sees every tenant's
   * attribute values. It is a parameter rather than an option so that omitting
   * it is impossible rather than merely inadvisable.
   */
  security: (ctx: QueryContext) => SQL
  /**
   * Per-attribute type overrides, keyed by attribute id. Wins over
   * `AttributeDefinition.valueType`.
   */
  types?: Record<string, AttributeValueType>
  /** Member-name prefix. Defaults to `attr_`. */
  namePrefix?: string
  /** Passed through to each generated dimension's `shown`. */
  shown?: boolean
}

/**
 * Build one dimension per attribute, each backed by a correlated scalar
 * subquery against the junction table.
 *
 * ```ts
 * dimensions: {
 *   ...baseDimensions,
 *   ...buildAttributeDimensions({
 *     attributes: attrs,
 *     valueTable: employeeAttributeValues,
 *     recordKey: employees.id,
 *     foreignKey: employeeAttributeValues.employeeId,
 *     attributeKey: employeeAttributeValues.attributeId,
 *     valueColumn: employeeAttributeValues.value,
 *     security: (ctx) => eq(employeeAttributeValues.organisationId, ctx.securityContext.organisationId)
 *   })
 * }
 * ```
 *
 * Three details that are easy to get wrong, and are handled here:
 *
 * - **Typing is mandatory, not cosmetic.** Sorting and filtering run in SQL
 *   over the whole table before a page reaches the browser, so client-side
 *   conversion cannot repair them: sorted as text, `100` sorts below `9`, and
 *   `> 50` admits `'9'` while rejecting `'100'`. A `number` attribute is cast
 *   in SQL — tolerantly, so one `n/a` yields NULL for that row instead of
 *   failing the whole query.
 * - **`LIMIT 1`.** EAV tables rarely carry a unique constraint on
 *   (record, attribute); without it a duplicate row raises "more than one row
 *   returned by a subquery" on Postgres.
 * - **Security inside the subquery**, not merely on the outer query.
 *
 * Performance: projection is cheap (a page of 25 rows is 25 indexed lookups per
 * attribute), but `ORDER BY (SELECT …)` and `WHERE (SELECT …) = …` are
 * proportional to the base table because no index serves them. At tens of
 * thousands of rows that is fine; beyond it, pivot the attributes into real
 * indexable columns via a view.
 */
export function buildAttributeDimensions(
  options: BuildAttributeDimensionsOptions
): Record<string, Dimension> {
  const {
    attributes,
    valueTable,
    recordKey,
    foreignKey,
    attributeKey,
    valueColumn,
    security,
    types = {},
    namePrefix = 'attr_',
    shown
  } = options

  const dimensions: Record<string, Dimension> = {}

  for (const attribute of attributes) {
    if (attribute.id === undefined || attribute.id === null || attribute.id === '') {
      throw new Error(t('server.errors.attributeIdRequired'))
    }

    const attributeId = String(attribute.id)
    const name = `${namePrefix}${attributeId}`
    const valueType = types[attributeId] ?? attribute.valueType ?? 'string'

    dimensions[name] = {
      name,
      // Identity comes from the id; only the label follows a rename.
      title: attribute.name,
      type: valueType,
      shown,
      sql: (ctx: QueryContext): SQL => {
        const value = valueType === 'string'
          ? sql`${valueColumn}`
          : ctx.tryCast(valueColumn, valueType === 'number' ? 'decimal' : 'timestamp')

        return sql`(SELECT ${value} FROM ${valueTable}
          WHERE ${foreignKey} = ${recordKey}
            AND ${attributeKey} = ${attribute.id}
            AND ${security(ctx)}
          LIMIT 1)`
      }
    }
  }

  return dimensions
}
