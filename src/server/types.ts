/**
 * Core types for Drizzle Cube semantic layer
 * Drizzle ORM-first definitions with full type safety
 */

// Import Drizzle ORM types
import type { SQL } from 'drizzle-orm'

// Re-export Drizzle-first types

/**
 * Security context passed to cube SQL functions
 * Contains user/tenant-specific data for filtering
 */
export interface SecurityContext {
  [key: string]: any
}

/**
 * Database executor that wraps Drizzle ORM
 * Provides type-safe SQL execution with engine-specific implementations
 */
export interface DatabaseExecutor<TSchema extends Record<string, any> = Record<string, any>> {
  /** The Drizzle database instance */
  db: DrizzleDatabase<TSchema>
  /** Optional schema for type inference */
  schema?: TSchema
  /** Execute a Drizzle SQL query or query object */
  execute<T = any[]>(query: SQL | any): Promise<T>
  /** Get the database engine type */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite'
}

/**
 * Generic Drizzle database type
 * Supports any Drizzle client (PostgreSQL, MySQL, SQLite)
 */
export type DrizzleDatabase<TSchema extends Record<string, any> = Record<string, any>> = {
  select: (fields?: any) => any
  insert: (table: any) => any
  update: (table: any) => any
  delete: (table: any) => any
  execute?: (query: SQL) => Promise<any>  // PostgreSQL/MySQL async
  run?: (query: SQL) => any              // SQLite sync
  all?: (query: SQL) => any[]            // SQLite sync
  get?: (query: SQL) => any              // SQLite sync
  $with: (alias: string) => any
  with: (...args: any[]) => any
  schema?: TSchema
}

/**
 * Query context passed to cube SQL functions
 * Provides access to database, schema, and security context
 */
export interface QueryContext<TSchema extends Record<string, any> = Record<string, any>> {
  /** Drizzle database instance */
  db: DrizzleDatabase<TSchema>
  /** Database schema (tables, columns, etc.) */
  schema: TSchema
  /** Security context for filtering */
  securityContext: SecurityContext
  /** The semantic query being executed */
  query: SemanticQuery
  /** The compiled cube being queried */
  cube: CompiledCube<TSchema>
}

/**
 * Semantic cube definition with Drizzle integration
 */
export interface SemanticCube<TSchema extends Record<string, any> = Record<string, any>> {
  name: string
  title?: string
  description?: string
  
  /** Base SQL for the cube - can use Drizzle query builder */
  sql: string | SQL | ((context: QueryContext<TSchema>) => SQL | Promise<SQL>)
  
  /** Cube dimensions */
  dimensions: Record<string, SemanticDimension<TSchema>>
  
  /** Cube measures */
  measures: Record<string, SemanticMeasure<TSchema>>
  
  /** Joins to other cubes */
  joins?: Record<string, SemanticJoin<TSchema>>
  
  /** Whether cube is publicly accessible */
  public?: boolean
  
  /** SQL alias for the cube */
  sqlAlias?: string
  
  /** Data source identifier */
  dataSource?: string
  
  /** Refresh configuration */
  refreshKey?: {
    every?: string
    sql?: string | SQL
  }
  
  /** Pre-aggregation definitions */
  preAggregations?: Record<string, SemanticPreAggregation>
  
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Semantic dimension with Drizzle column support
 */
export interface SemanticDimension<TSchema extends Record<string, any> = Record<string, any>> {
  name: string
  title?: string
  description?: string
  type: DimensionType
  
  /** SQL expression - can be Drizzle column reference or SQL template */
  sql: string | SQL | DrizzleColumn | ((context: QueryContext<TSchema>) => SQL | DrizzleColumn)
  
  /** Whether this is a primary key */
  primaryKey?: boolean
  
  /** Whether to show in UI */
  shown?: boolean
  
  /** Display format */
  format?: DimensionFormat
  
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Semantic measure with Drizzle aggregation support
 */
export interface SemanticMeasure<TSchema extends Record<string, any> = Record<string, any>> {
  name: string
  title?: string
  description?: string
  type: MeasureType
  
  /** SQL expression - can be Drizzle column or aggregation function */
  sql: string | SQL | DrizzleColumn | ((context: QueryContext<TSchema>) => SQL | DrizzleColumn)
  
  /** Display format */
  format?: MeasureFormat
  
  /** Whether to show in UI */
  shown?: boolean
  
  /** Filters applied to this measure */
  filters?: Array<{ 
    sql: string | SQL | ((context: QueryContext<TSchema>) => SQL) 
  }>
  
  /** Rolling window configuration */
  rollingWindow?: {
    trailing?: string
    leading?: string
    offset?: string
  }
  
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Join definition between cubes
 */
export interface SemanticJoin<TSchema extends Record<string, any> = Record<string, any>> {
  name?: string
  type?: JoinType
  
  /** Join condition using Drizzle SQL */
  sql: string | SQL | ((context: QueryContext<TSchema>) => SQL)
  
  /** Relationship type */
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
}

/**
 * Drizzle column reference type
 */
export type DrizzleColumn = {
  _: {
    name: string
    dataType: string
    columnType: string
  }
}

/**
 * Measure aggregation types
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

/**
 * Display formats
 */
export type MeasureFormat = 'currency' | 'percent' | 'number' | 'integer'
export type DimensionFormat = 'currency' | 'percent' | 'number' | 'date' | 'datetime' | 'id' | 'link'
export type DimensionType = 'string' | 'number' | 'time' | 'boolean'
export type JoinType = 'left' | 'right' | 'inner' | 'full'
export type TimeGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

/**
 * Semantic query structure (Cube.js compatible)
 */
export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: Array<Filter>
  timeDimensions?: Array<TimeDimension>
  limit?: number
  offset?: number
  order?: Record<string, 'asc' | 'desc'>
}

/**
 * Filter definitions with logical operators
 */
export type Filter = FilterCondition | LogicalFilter

export interface FilterCondition {
  member: string
  operator: FilterOperator
  values: any[]
}

export interface LogicalFilter {
  and?: Filter[]
  or?: Filter[]
}

/**
 * Time dimension with granularity
 */
export interface TimeDimension {
  dimension: string
  granularity?: TimeGranularity
  dateRange?: string | string[]
}

/**
 * Supported filter operators
 */
export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains'
  | 'startsWith'
  | 'notStartsWith'
  | 'endsWith'
  | 'notEndsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'set'
  | 'notSet'
  | 'inDateRange'
  | 'beforeDate'
  | 'afterDate'

/**
 * Compiled cube with executable query function
 */
export interface CompiledCube<TSchema extends Record<string, any> = Record<string, any>> extends SemanticCube<TSchema> {
  queryFn: (query: SemanticQuery, securityContext: SecurityContext) => Promise<QueryResult>
}

/**
 * Query execution result
 */
export interface QueryResult {
  data: any[]
  annotation: {
    measures: Record<string, MeasureAnnotation>
    dimensions: Record<string, DimensionAnnotation>
    segments: Record<string, any>
    timeDimensions: Record<string, TimeDimensionAnnotation>
  }
}

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
 * SQL generation result
 */
export interface SqlResult {
  sql: string
  params?: any[]
}

/**
 * Cube metadata for API responses
 */
export interface CubeMetadata {
  name: string
  title: string
  description?: string
  measures: MeasureMetadata[]
  dimensions: DimensionMetadata[]
  segments: any[]
}

export interface MeasureMetadata {
  name: string
  title: string
  shortTitle: string
  type: MeasureType
  format?: MeasureFormat
  description?: string
}

export interface DimensionMetadata {
  name: string
  title: string
  shortTitle: string
  type: string
  format?: DimensionFormat
  description?: string
}

/**
 * Pre-aggregation configuration
 */
export interface SemanticPreAggregation {
  name: string
  measures: string[]
  dimensions: string[]
  timeDimension?: {
    dimension: string
    granularity: TimeGranularity[]
  }
  refreshKey?: {
    every: string
    sql?: string | SQL
  }
  indexes?: Record<string, string[]>
}

/**
 * Utility type for cube definition with schema inference
 */
export type CubeDefinition<TSchema extends Record<string, any>> = Omit<SemanticCube<TSchema>, 'name'> & {
  name?: string
}

/**
 * Helper type for creating type-safe cubes
 */
export interface CubeDefiner<TSchema extends Record<string, any>> {
  <TName extends string>(
    name: TName,
    definition: CubeDefinition<TSchema>
  ): SemanticCube<TSchema> & { name: TName }
}

/**
 * Create a type-safe cube definition with schema inference
 * @param _schema - Drizzle schema containing table definitions (used for type inference only)
 * @param definition - Cube definition with type inference
 * @returns Type-safe semantic cube
 */
export function defineCube<TSchema extends Record<string, any>>(
  _schema: TSchema,
  definition: CubeDefinition<TSchema> & { name: string }
): SemanticCube<TSchema> {
  return {
    ...definition,
    name: definition.name
  } as SemanticCube<TSchema>
}

/**
 * Abstract base class for database executors
 */
export abstract class BaseDatabaseExecutor<TSchema extends Record<string, any> = Record<string, any>> implements DatabaseExecutor<TSchema> {
  constructor(
    public db: DrizzleDatabase<TSchema>,
    public schema?: TSchema
  ) {}

  abstract execute<T = any[]>(query: SQL | any): Promise<T>
  abstract getEngineType(): 'postgres' | 'mysql' | 'sqlite'
}

/**
 * PostgreSQL database executor
 * Works with postgres.js and Neon drivers
 */
export class PostgresExecutor<TSchema extends Record<string, any> = Record<string, any>> extends BaseDatabaseExecutor<TSchema> {
  async execute<T = any[]>(query: SQL | any): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object') {
      // Check for various execution methods that Drizzle queries might have
      if (typeof query.execute === 'function') {
        const result = await query.execute()
        if (Array.isArray(result)) {
          return result.map(row => this.convertNumericFields(row)) as T
        }
        return result as T
      }
      
      // Try to execute through the database instance if it's a query builder
      if (this.db && typeof this.db.execute === 'function') {
        try {
          const result = await this.db.execute(query)
          if (Array.isArray(result)) {
            return result.map(row => this.convertNumericFields(row)) as T
          }
          return result as T
        } catch (error) {
          // If that fails, try to get SQL and execute it
          if (typeof query.getSQL === 'function') {
            const sqlResult = query.getSQL()
            const result = await this.db.execute(sqlResult)
            if (Array.isArray(result)) {
              return result.map(row => this.convertNumericFields(row)) as T
            }
            return result as T
          }
          throw error
        }
      }
    }
    
    // Handle raw SQL objects
    if (!this.db.execute) {
      throw new Error('PostgreSQL database instance must have an execute method')
    }
    const result = await this.db.execute(query)
    
    // Convert numeric strings to numbers for PostgreSQL results
    if (Array.isArray(result)) {
      return result.map(row => this.convertNumericFields(row)) as T
    }
    
    return result as T
  }

  /**
   * Convert numeric string fields to numbers
   */
  private convertNumericFields(row: any): any {
    if (!row || typeof row !== 'object') return row
    
    const converted: any = {}
    for (const [key, value] of Object.entries(row)) {
      // Convert numeric strings to numbers for count, sum, avg, etc.
      if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
        converted[key] = value.includes('.') ? parseFloat(value) : parseInt(value, 10)
      } else {
        converted[key] = value
      }
    }
    return converted
  }

  getEngineType(): 'postgres' {
    return 'postgres'
  }
}

/**
 * SQLite database executor  
 * Works with better-sqlite3 driver
 */
export class SQLiteExecutor<TSchema extends Record<string, any> = Record<string, any>> extends BaseDatabaseExecutor<TSchema> {
  async execute<T = any[]>(query: SQL | any): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object' && typeof query.execute === 'function') {
      // This is a Drizzle query object, execute it directly
      const result = await query.execute()
      return result as T
    }
    
    // SQLite is synchronous, but we wrap in Promise for consistency
    try {
      // For SQLite with better-sqlite3, we need to execute through the Drizzle instance
      // The query is already a prepared Drizzle SQL object that handles parameter binding
      if (this.db.all) {
        const result = this.db.all(query)
        return result as T
      } else if (this.db.run) {
        // Fallback to run method if all is not available
        const result = this.db.run(query)
        return result as T
      } else {
        throw new Error('SQLite database instance must have an all() or run() method')
      }
    } catch (error) {
      throw new Error(`SQLite execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getEngineType(): 'sqlite' {
    return 'sqlite'
  }
}

/**
 * MySQL database executor
 * Works with mysql2 driver
 */
export class MySQLExecutor<TSchema extends Record<string, any> = Record<string, any>> extends BaseDatabaseExecutor<TSchema> {
  async execute<T = any[]>(query: SQL | any): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object' && typeof query.execute === 'function') {
      // This is a Drizzle query object, execute it directly
      const result = await query.execute()
      return result as T
    }
    
    if (!this.db.execute) {
      throw new Error('MySQL database instance must have an execute method')
    }
    const result = await this.db.execute(query)
    return result as T
  }

  getEngineType(): 'mysql' {
    return 'mysql'
  }
}

/**
 * Factory functions for creating database executors
 */
export function createPostgresExecutor<TSchema extends Record<string, any>>(
  db: DrizzleDatabase<TSchema>,
  schema?: TSchema
): PostgresExecutor<TSchema> {
  return new PostgresExecutor(db, schema)
}

export function createSQLiteExecutor<TSchema extends Record<string, any>>(
  db: DrizzleDatabase<TSchema>,
  schema?: TSchema
): SQLiteExecutor<TSchema> {
  return new SQLiteExecutor(db, schema)
}

export function createMySQLExecutor<TSchema extends Record<string, any>>(
  db: DrizzleDatabase<TSchema>,
  schema?: TSchema
): MySQLExecutor<TSchema> {
  return new MySQLExecutor(db, schema)
}

/**
 * Auto-detect database type and create appropriate executor
 * @param db - Drizzle database instance
 * @param schema - Optional schema for type inference
 * @param engineType - Optional explicit engine type override
 * @returns Appropriate database executor
 */
export function createDatabaseExecutor<TSchema extends Record<string, any>>(
  db: DrizzleDatabase<TSchema>,
  schema?: TSchema,
  engineType?: 'postgres' | 'mysql' | 'sqlite'
): DatabaseExecutor<TSchema> {
  // If engine type is explicitly provided, use it
  if (engineType) {
    switch (engineType) {
      case 'postgres':
        return createPostgresExecutor(db, schema)
      case 'mysql':
        return createMySQLExecutor(db, schema)
      case 'sqlite':
        return createSQLiteExecutor(db, schema)
    }
  }

  // Auto-detect based on available methods
  if (db.all && db.run) {
    // SQLite has synchronous methods
    return createSQLiteExecutor(db, schema)
  } else if (db.execute) {
    // PostgreSQL and MySQL have async execute method
    // We default to PostgreSQL since it's more common
    return createPostgresExecutor(db, schema)
  } else {
    throw new Error('Unable to determine database engine type. Please specify engineType parameter.')
  }
}