/**
 * Database executor type definitions
 * Interfaces for database execution with different engines
 */

import type { SQL } from 'drizzle-orm'
import type { DrizzleDatabase } from './core'
import type { DatabaseAdapter } from '../adapters/base-adapter'

/**
 * Database executor interface that wraps Drizzle ORM
 * Provides type-safe SQL execution with engine-specific implementations
 */
export interface DatabaseExecutor {
  /** The Drizzle database instance */
  db: DrizzleDatabase
  /** Optional schema for type inference */
  schema?: any
  /** Database adapter for SQL dialect-specific operations */
  databaseAdapter: DatabaseAdapter
  /** Execute a Drizzle SQL query or query object */
  execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>
  /** Get the database engine type */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb'
  /** Execute EXPLAIN on a SQL query to get the execution plan */
  explainQuery(sqlString: string, params: unknown[], options?: ExplainOptions): Promise<ExplainResult>
  /** Get existing indexes for the specified tables */
  getTableIndexes(tableNames: string[]): Promise<IndexInfo[]>
}

/**
 * Options for EXPLAIN query execution
 */
export interface ExplainOptions {
  /** Use EXPLAIN ANALYZE to actually execute the query and get real timing (PostgreSQL, MySQL 8.0.18+) */
  analyze?: boolean
}

/**
 * A single operation/node in the query execution plan
 * Normalized structure across all databases
 */
export interface ExplainOperation {
  /** Operation type (e.g., 'Seq Scan', 'Index Scan', 'Hash Join', 'Sort') */
  type: string
  /** Table name if applicable */
  table?: string
  /** Index name if used */
  index?: string
  /** Estimated row count from planner */
  estimatedRows?: number
  /** Actual row count (if ANALYZE was used) */
  actualRows?: number
  /** Estimated cost (database-specific units) */
  estimatedCost?: number
  /** Filter condition if any */
  filter?: string
  /** Additional details specific to this operation */
  details?: string
  /** Nested/child operations */
  children?: ExplainOperation[]
}

/**
 * Result of an EXPLAIN query
 * Provides both normalized structure and raw output
 */
export interface ExplainResult {
  /** Normalized hierarchical plan as operations */
  operations: ExplainOperation[]
  /** Summary statistics */
  summary: ExplainSummary
  /** Raw EXPLAIN output as text (for display) */
  raw: string
  /** Original SQL query */
  sql: {
    sql: string
    params?: unknown[]
  }
}

/**
 * Summary statistics from the execution plan
 */
export interface ExplainSummary {
  /** Database engine type */
  database: 'postgres' | 'mysql' | 'sqlite' | 'duckdb'
  /** Planning time in milliseconds (if available) */
  planningTime?: number
  /** Execution time in milliseconds (if ANALYZE was used) */
  executionTime?: number
  /** Total estimated cost */
  totalCost?: number
  /** Quick flag: true if any sequential scans detected */
  hasSequentialScans: boolean
  /** List of indexes used in the plan */
  usedIndexes: string[]
}

/**
 * A recommendation from AI analysis of an execution plan
 */
export interface ExplainRecommendation {
  /** Type of recommendation */
  type: 'index' | 'table' | 'cube' | 'general'
  /** Severity/priority of the recommendation */
  severity: 'critical' | 'warning' | 'suggestion'
  /** Short actionable title */
  title: string
  /** Detailed explanation of why this helps */
  description: string
  /** Actionable SQL statement (e.g., CREATE INDEX) - for index/table recommendations */
  sql?: string
  /** TypeScript code snippet to add to cube definition - for cube recommendations */
  cubeCode?: string
  /** Which cube to modify - for cube recommendations */
  cubeName?: string
  /** Affected database table */
  table?: string
  /** Affected columns */
  columns?: string[]
  /** Expected performance improvement */
  estimatedImpact?: string
}

/**
 * Issue identified in the execution plan
 */
export interface ExplainIssue {
  /** Type of issue */
  type: 'sequential_scan' | 'missing_index' | 'high_cost' | 'sort_operation' | string
  /** Description of the issue */
  description: string
  /** Severity level */
  severity: 'high' | 'medium' | 'low'
}

/**
 * AI-generated analysis of an execution plan
 */
export interface AIExplainAnalysis {
  /** One-sentence description of what the query does */
  summary: string
  /** Overall performance assessment */
  assessment: 'good' | 'warning' | 'critical'
  /** Reason for the assessment */
  assessmentReason: string
  /** Detailed explanation of the query's purpose and structure */
  queryUnderstanding: string
  /** Issues identified in the execution plan */
  issues: ExplainIssue[]
  /** Actionable recommendations for improvement */
  recommendations: ExplainRecommendation[]
}

/**
 * Information about a database index
 */
export interface IndexInfo {
  /** Table the index belongs to */
  table_name: string
  /** Name of the index */
  index_name: string
  /** Columns included in the index (in order) */
  columns: string[]
  /** Whether the index enforces uniqueness */
  is_unique: boolean
  /** Whether this is the primary key index */
  is_primary: boolean
}