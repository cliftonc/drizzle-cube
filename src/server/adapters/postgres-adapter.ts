/**
 * PostgreSQL Database Adapter
 * Implements PostgreSQL-specific SQL generation for time dimensions, string matching, and type casting
 * Extracted from hardcoded logic in executor.ts and multi-cube-builder.ts
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter } from './base-adapter'

export class PostgresAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'postgres' {
    return 'postgres'
  }

  /**
   * Build PostgreSQL time dimension using DATE_TRUNC function
   * Extracted from executor.ts:649-670 and multi-cube-builder.ts:306-320
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // PostgreSQL uses DATE_TRUNC with explicit timestamp casting
    switch (granularity) {
      case 'year':
        return sql`DATE_TRUNC('year', ${fieldExpr}::timestamp)`
      case 'quarter':
        return sql`DATE_TRUNC('quarter', ${fieldExpr}::timestamp)`
      case 'month':
        return sql`DATE_TRUNC('month', ${fieldExpr}::timestamp)`
      case 'week':
        return sql`DATE_TRUNC('week', ${fieldExpr}::timestamp)`
      case 'day':
        // Ensure we return the truncated date as a timestamp
        return sql`DATE_TRUNC('day', ${fieldExpr}::timestamp)::timestamp`
      case 'hour':
        return sql`DATE_TRUNC('hour', ${fieldExpr}::timestamp)`
      case 'minute':
        return sql`DATE_TRUNC('minute', ${fieldExpr}::timestamp)`
      case 'second':
        return sql`DATE_TRUNC('second', ${fieldExpr}::timestamp)`
      default:
        // Fallback to the original expression if granularity is not recognized
        return fieldExpr as SQL
    }
  }

  /**
   * Build PostgreSQL string matching conditions using ILIKE (case-insensitive)
   * Extracted from executor.ts:807-813 and multi-cube-builder.ts:468-474
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith', value: string): SQL {
    const pattern = this.buildPattern(operator, value)

    switch (operator) {
      case 'contains':
        return sql`${fieldExpr} ILIKE ${pattern}`
      case 'notContains':
        return sql`${fieldExpr} NOT ILIKE ${pattern}`
      case 'startsWith':
        return sql`${fieldExpr} ILIKE ${pattern}`
      case 'endsWith':
        return sql`${fieldExpr} ILIKE ${pattern}`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build PostgreSQL type casting using :: syntax
   * Extracted from various locations where ::timestamp was used
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL {
    switch (targetType) {
      case 'timestamp':
        return sql`${fieldExpr}::timestamp`
      case 'decimal':
        return sql`${fieldExpr}::decimal`
      case 'integer':
        return sql`${fieldExpr}::integer`
      default:
        throw new Error(`Unsupported cast type: ${targetType}`)
    }
  }

  /**
   * Build PostgreSQL COUNT aggregation
   * Extracted from multi-cube-builder.ts:278
   */
  buildCount(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COUNT(${fieldExpr})`
  }

  /**
   * Build PostgreSQL COUNT DISTINCT aggregation
   * Extracted from multi-cube-builder.ts:280
   */
  buildCountDistinct(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COUNT(DISTINCT ${fieldExpr})`
  }

  /**
   * Build PostgreSQL SUM aggregation
   * Extracted from multi-cube-builder.ts:282
   */
  buildSum(fieldExpr: AnyColumn | SQL): SQL {
    return sql`SUM(${fieldExpr})`
  }

  /**
   * Build PostgreSQL AVG aggregation with COALESCE for NULL handling
   * PostgreSQL AVG returns NULL for empty sets, so we use COALESCE for consistent behavior
   * Extracted from multi-cube-builder.ts:284
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`COALESCE(AVG(${fieldExpr}), 0)`
  }

  /**
   * Build PostgreSQL MIN aggregation
   * Extracted from multi-cube-builder.ts:286
   */
  buildMin(fieldExpr: AnyColumn | SQL): SQL {
    return sql`MIN(${fieldExpr})`
  }

  /**
   * Build PostgreSQL MAX aggregation
   * Extracted from multi-cube-builder.ts:288
   */
  buildMax(fieldExpr: AnyColumn | SQL): SQL {
    return sql`MAX(${fieldExpr})`
  }
}