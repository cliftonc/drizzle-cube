/**
 * YAML Semantic Layer Type Definitions
 * 
 * These types define the YAML structure for cube definitions,
 * which will be converted to SemanticCube objects.
 */

import type { DimensionType, MeasureType, TimeGranularity, JoinType } from './types'

/**
 * YAML Dimension Definition
 */
export interface YamlDimension {
  name: string
  title?: string
  description?: string
  type: DimensionType
  sql: string
  primary_key?: boolean
  primaryKey?: boolean  // Support both snake_case and camelCase
  shown?: boolean
  format?: 'id' | 'link' | 'currency' | 'percent' | 'number' | 'date' | 'datetime'
  meta?: Record<string, any>
}

/**
 * YAML Measure Definition
 */
export interface YamlMeasure {
  name: string
  title?: string
  description?: string
  type: MeasureType
  sql: string
  format?: 'currency' | 'percent' | 'number' | 'integer'
  shown?: boolean
  filters?: Array<{
    sql: string
  }>
  rolling_window?: {
    trailing?: string
    leading?: string
    offset?: string
  }
  rollingWindow?: {  // Support both snake_case and camelCase
    trailing?: string
    leading?: string
    offset?: string
  }
  meta?: Record<string, any>
}

/**
 * YAML Join Definition
 */
export interface YamlJoin {
  name: string
  type?: JoinType
  relationship: 'one_to_one' | 'one_to_many' | 'many_to_one'
  sql: string
}

/**
 * YAML Pre-aggregation Definition
 */
export interface YamlPreAggregation {
  name: string
  measures: string[]
  dimensions: string[]
  time_dimension?: {
    dimension: string
    granularity: TimeGranularity[]
  }
  timeDimension?: {  // Support both snake_case and camelCase
    dimension: string
    granularity: TimeGranularity[]
  }
  refresh_key?: {
    every: string
    sql?: string
  }
  refreshKey?: {  // Support both snake_case and camelCase
    every: string
    sql?: string
  }
  indexes?: Record<string, string[]>
}

/**
 * Single YAML Cube Definition
 */
export interface YamlCube {
  name: string
  title?: string
  description?: string
  sql?: string
  sql_table?: string  // Support Cube.dev sql_table syntax
  sqlTable?: string   // Support camelCase version
  sql_alias?: string
  sqlAlias?: string   // Support both snake_case and camelCase
  data_source?: string
  dataSource?: string // Support both snake_case and camelCase
  refresh_key?: {
    every?: string
    sql?: string
  }
  refreshKey?: {  // Support both snake_case and camelCase
    every?: string
    sql?: string
  }
  dimensions?: YamlDimension[]
  measures?: YamlMeasure[]
  joins?: YamlJoin[]
  pre_aggregations?: YamlPreAggregation[]
  preAggregations?: YamlPreAggregation[]  // Support both snake_case and camelCase
  meta?: Record<string, any>
}

/**
 * YAML View Definition (for future support)
 */
export interface YamlView {
  name: string
  title?: string
  description?: string
  cubes: Array<{
    join_path?: string
    joinPath?: string  // Support both snake_case and camelCase
    prefix?: boolean
    includes?: string[]
    excludes?: string[]
  }>
  meta?: Record<string, any>
}

/**
 * Root YAML Schema - supports multiple formats:
 * 1. Single cube definition (properties at root)
 * 2. Multiple cubes (cubes array)
 * 3. Cubes and views (separate arrays)
 */
export interface YamlSchema {
  // Single cube format (properties at root level)
  name?: string
  title?: string
  description?: string
  sql?: string
  sql_table?: string
  sqlTable?: string
  sql_alias?: string
  sqlAlias?: string
  data_source?: string
  dataSource?: string
  refresh_key?: YamlCube['refresh_key']
  refreshKey?: YamlCube['refreshKey']
  dimensions?: YamlDimension[]
  measures?: YamlMeasure[]
  joins?: YamlJoin[]
  pre_aggregations?: YamlPreAggregation[]
  preAggregations?: YamlPreAggregation[]
  meta?: Record<string, any>
  
  // Multiple cubes format
  cubes?: YamlCube[]
  
  // Views (future support)
  views?: YamlView[]
}

/**
 * Validation result for YAML parsing
 */
export interface YamlValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  cubes: YamlCube[]
}