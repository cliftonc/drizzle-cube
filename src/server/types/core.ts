/**
 * Core types for Drizzle Cube semantic layer
 * Fundamental interfaces used throughout the system
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'

/**
 * Security context passed to cube SQL functions
 * Contains user/tenant-specific data for filtering
 */
export interface SecurityContext {
  [key: string]: unknown
}

/**
 * Query execution result
 */
export interface QueryResult {
  data: Record<string, unknown>[]
  annotation: {
    measures: Record<string, MeasureAnnotation>
    dimensions: Record<string, DimensionAnnotation>
    segments: Record<string, unknown>
    timeDimensions: Record<string, TimeDimensionAnnotation>
  }
}

/**
 * SQL generation result
 */
export interface SqlResult {
  sql: string
  params?: unknown[]
}

/**
 * Core database interface that supports all Drizzle instances
 * Uses flexible typing for maximum compatibility across different database drivers
 */
export interface DrizzleDatabase {
  select: (fields?: any) => any
  insert: (table: any) => any
  update: (table: any) => any
  delete: (table: any) => any
  execute?: (query: SQL) => Promise<unknown[]>  // PostgreSQL/MySQL async
  run?: (query: SQL) => unknown              // SQLite sync
  all?: (query: SQL) => unknown[]            // SQLite sync
  get?: (query: SQL) => unknown              // SQLite sync
  $with: (alias: string) => { as: (query: any) => any }
  with: (...args: any[]) => any
  schema?: unknown
}

/**
 * Type helpers for specific database types
 */
export type PostgresDatabase = PostgresJsDatabase<any>
export type MySQLDatabase = MySql2Database<any>
export type SQLiteDatabase = BetterSQLite3Database<any>

/**
 * Drizzle column reference type
 * Use native Drizzle AnyColumn type for better type safety
 */
export type DrizzleColumn = AnyColumn

/**
 * Annotation interfaces for UI metadata
 */
export interface MeasureAnnotation {
  title: string
  shortTitle: string
  type: MeasureType
  format?: MeasureFormat
}

export interface DimensionAnnotation {
  title: string
  shortTitle: string
  type: string
  format?: DimensionFormat
}

export interface TimeDimensionAnnotation {
  title: string
  shortTitle: string
  type: string
  granularity?: TimeGranularity
}

/**
 * Type enums and constants
 */
export type MeasureType =
  | 'count'
  | 'countDistinct'
  | 'countDistinctApprox'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'runningTotal'
  | 'number'
  | 'calculated'

export type MeasureFormat = 'currency' | 'percent' | 'number' | 'integer'
export type DimensionFormat = 'currency' | 'percent' | 'number' | 'date' | 'datetime' | 'id' | 'link'
export type DimensionType = 'string' | 'number' | 'time' | 'boolean'
export type JoinType = 'left' | 'right' | 'inner' | 'full'
export type TimeGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'