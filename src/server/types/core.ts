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
    /** Period comparison metadata (present when compareDateRange is used) */
    periods?: PeriodComparisonMetadata
  }
  /** Cache metadata (present when result served from cache) */
  cache?: {
    /** Always true when this object is present */
    hit: true
    /** ISO timestamp when the result was cached */
    cachedAt: string
    /** Original TTL in milliseconds */
    ttlMs: number
    /** Remaining TTL in milliseconds */
    ttlRemainingMs: number
  }
}

/**
 * Period comparison metadata for compareDateRange queries
 * Provides information about the periods being compared
 */
export interface PeriodComparisonMetadata {
  /** The date ranges being compared */
  ranges: [string, string][]
  /** Human-readable labels for each period */
  labels: string[]
  /** The time dimension used for comparison */
  timeDimension: string
  /** Granularity used for the comparison */
  granularity?: TimeGranularity
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
  // Statistical functions (Phase 1)
  | 'stddev'         // Standard deviation (population)
  | 'stddevSamp'     // Standard deviation (sample)
  | 'variance'       // Variance (population)
  | 'varianceSamp'   // Variance (sample)
  | 'percentile'     // Configurable percentile (0-100)
  | 'median'         // Shorthand for P50
  | 'p95'            // 95th percentile
  | 'p99'            // 99th percentile
  // Window functions (Phase 2)
  | 'lag'
  | 'lead'
  | 'rank'
  | 'denseRank'
  | 'rowNumber'
  | 'ntile'
  | 'firstValue'
  | 'lastValue'
  | 'movingAvg'
  | 'movingSum'

export type MeasureFormat = 'currency' | 'percent' | 'number' | 'integer'
export type DimensionFormat = 'currency' | 'percent' | 'number' | 'date' | 'datetime' | 'id' | 'link'
export type DimensionType = 'string' | 'number' | 'time' | 'boolean'
export type JoinType = 'left' | 'right' | 'inner' | 'full'
export type TimeGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'