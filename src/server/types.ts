/**
 * Core types for Drizzle Cube semantic layer
 * Framework-agnostic definitions
 */

export interface SecurityContext {
  [key: string]: any
}

export interface DatabaseExecutor {
  execute(sql: string, params?: any[]): Promise<any[]>
}

export interface SemanticCube {
  name: string
  title?: string
  description?: string
  sql: string | ((context: QueryContext) => SQL | string)
  dimensions: Record<string, SemanticDimension>
  measures: Record<string, SemanticMeasure>
  joins?: Record<string, SemanticJoin>
  public?: boolean
}

export interface SemanticDimension {
  name: string
  title?: string
  description?: string
  type: 'string' | 'number' | 'time' | 'boolean'
  sql: string | ((context: QueryContext) => SQL | string)
  primaryKey?: boolean
  shown?: boolean
  format?: DimensionFormat
  meta?: Record<string, any>
}

export interface SemanticMeasure {
  name: string
  title?: string
  description?: string
  type: MeasureType
  sql: string | ((context: QueryContext) => SQL | string)
  format?: MeasureFormat
  filters?: Array<{ sql: string }>
  rollingWindow?: {
    trailing?: string
    leading?: string
    offset?: string
  }
  meta?: Record<string, any>
}

export interface SemanticJoin {
  sql: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
}

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

export type MeasureFormat = 'currency' | 'percent' | 'number' | 'integer'
export type DimensionFormat = 'currency' | 'percent' | 'number' | 'date' | 'datetime'
export type TimeGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: Array<{
    member: string
    operator: FilterOperator
    values: any[]
  }>
  timeDimensions?: Array<{
    dimension: string
    granularity?: TimeGranularity
    dateRange?: string | string[]
  }>
  limit?: number
  offset?: number
  order?: Record<string, 'asc' | 'desc'>
}

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

export interface QueryContext {
  securityContext: SecurityContext
  cube: CompiledCube
  query: SemanticQuery
  table: {
    [column: string]: string
  }
}

export interface CompiledCube extends SemanticCube {
  queryFn: (query: SemanticQuery, context: SecurityContext) => Promise<QueryResult>
}

export interface QueryResult {
  data: any[]
  annotation: {
    measures: Record<string, MeasureAnnotation>
    dimensions: Record<string, DimensionAnnotation>
    segments: Record<string, any>
    timeDimensions: Record<string, TimeDimensionAnnotation>
  }
}

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

export interface SqlResult {
  sql: string
  params?: any[]
}

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

// Helper type for SQL template literals (if using drizzle)
export interface SQL {
  sql: string
  params?: any[]
}