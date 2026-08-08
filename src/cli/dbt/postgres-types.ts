import { DbtGenerateError } from './errors.js'
import type { GeneratorConfig } from './types.js'

type SupportedDimensionType = 'string' | 'number' | 'time' | 'boolean'

export interface PostgresTypeMapping {
  drizzleImport: string
  builderExpression: (columnNameLiteral: string) => string
  dimensionType?: SupportedDimensionType
  supportsDimension: boolean
}

const builderImports = new Set(['bigint', 'boolean', 'date', 'doublePrecision', 'integer', 'jsonb', 'numeric', 'real', 'text', 'time', 'timestamp'])

function normalizeCatalogType(catalogType: string): string {
  return catalogType.trim().toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ')
}

function mapping(drizzleImport: string, dimensionType?: SupportedDimensionType): PostgresTypeMapping {
  return {
    drizzleImport,
    dimensionType,
    supportsDimension: Boolean(dimensionType),
    builderExpression: (columnNameLiteral: string) => {
      if (drizzleImport === 'bigint') return `bigint(${columnNameLiteral}, { mode: 'number' })`
      return `${drizzleImport}(${columnNameLiteral})`
    },
  }
}

export function mapPostgresCatalogType(catalogType: string, overrides: GeneratorConfig['typeOverrides'] = {}): PostgresTypeMapping {
  const normalized = normalizeCatalogType(catalogType)
  const override = overrides[normalized] ?? overrides[catalogType]
  if (override) {
    if (!builderImports.has(override.drizzleBuilder)) {
      throw new DbtGenerateError(`Unsupported drizzle builder override ${override.drizzleBuilder} for Postgres type ${catalogType}.`)
    }
    return mapping(override.drizzleBuilder, override.dimensionType)
  }

  if (['smallint', 'int2', 'integer', 'int', 'int4', 'serial', 'serial4'].includes(normalized)) return mapping('integer', 'number')
  if (['bigint', 'int8', 'bigserial', 'serial8'].includes(normalized)) return mapping('bigint', 'number')
  if (['numeric', 'decimal', 'money'].includes(normalized)) return mapping('numeric', 'number')
  if (['real', 'float4'].includes(normalized)) return mapping('real', 'number')
  if (['double precision', 'float8'].includes(normalized)) return mapping('doublePrecision', 'number')
  if (['text', 'varchar', 'character varying', 'character', 'char', 'uuid'].includes(normalized)) return mapping('text', 'string')
  if (['boolean', 'bool'].includes(normalized)) return mapping('boolean', 'boolean')
  if (['timestamp', 'timestamp without time zone', 'timestamp with time zone', 'timestamptz'].includes(normalized)) return mapping('timestamp', 'time')
  if (normalized === 'date') return mapping('date', 'time')
  if (['time', 'time without time zone', 'time with time zone', 'timetz'].includes(normalized)) return mapping('time', 'time')
  if (['json', 'jsonb'].includes(normalized)) return mapping('jsonb')

  throw new DbtGenerateError(`Unsupported Postgres catalog type ${catalogType}. Add a typeOverrides entry to configure it.`)
}
