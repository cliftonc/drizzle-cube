/**
 * Semantic Query Executor
 * Framework-agnostic query execution with pluggable database executor
 */

import type { 
  SemanticCube, 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  DatabaseExecutor,
  FilterOperator,
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation
} from './types'

export class SemanticQueryExecutor {
  constructor(private dbExecutor: DatabaseExecutor) {}

  async executeQuery(
    cube: SemanticCube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
      // Generate SQL
      const sqlResult = this.generateSQL(cube, query, securityContext)
      
      // Execute query
      const data = await this.dbExecutor.execute(sqlResult.sql, sqlResult.params)
      
      // Generate annotations
      const annotation = this.generateAnnotations(cube, query)
      
      return {
        data,
        annotation
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  generateSQL(
    cube: SemanticCube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): { sql: string; params?: any[] } {
    // Get base SQL and substitute security variables
    const baseSQL = this.substituteSecurityVariables(
      typeof cube.sql === 'string' ? cube.sql : cube.sql.toString(), 
      securityContext
    )
    
    // Build SELECT clause with measures and dimensions
    const selectClauses = this.buildSelectClause(cube, query)
    
    // Build WHERE clause from filters  
    const whereClause = this.buildWhereClause(cube, query)
    
    // Build GROUP BY clause for dimensions
    const groupByClause = this.buildGroupByClause(cube, query)
    
    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(query)
    
    // Build LIMIT clause
    const limitClause = this.buildLimitClause(query)
    
    // Combine all parts
    const parts = [
      `SELECT ${selectClauses.join(', ')}`,
      `FROM (${baseSQL}) as base_query`
    ]
    
    if (whereClause) parts.push(`WHERE ${whereClause}`)
    if (groupByClause) parts.push(`GROUP BY ${groupByClause}`)
    if (orderByClause) parts.push(`ORDER BY ${orderByClause}`)
    if (limitClause) parts.push(limitClause)
    
    const finalSQL = parts.join(' ')
    
    return { sql: finalSQL, params: [] }
  }

  private substituteSecurityVariables(sqlTemplate: string, securityContext: SecurityContext): string {
    let sql = sqlTemplate
    
    // Replace security context variables
    Object.entries(securityContext).forEach(([key, value]) => {
      const placeholder = `\${SECURITY_CONTEXT.${key}}`
      sql = sql.replaceAll(placeholder, `'${value}'`)
    })
    
    return sql
  }

  private buildSelectClause(cube: SemanticCube, query: SemanticQuery): string[] {
    const clauses: string[] = []
    
    // Add measures
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, measureKey] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[measureKey]) {
          const measure = cube.measures[measureKey]
          const measureSQL = this.buildMeasureSQL(measure, measureKey)
          clauses.push(`${measureSQL} as "${measureName}"`)
        }
      }
    }
    
    // Add dimensions
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = typeof dimension.sql === 'string' ? dimension.sql : dimension.sql.toString()
          clauses.push(`${dimensionSQL} as "${dimensionName}"`)
        }
      }
    }
    
    // Add time dimensions
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = typeof dimension.sql === 'string' ? dimension.sql : dimension.sql.toString()
          
          if (timeDim.granularity) {
            const truncatedSQL = `DATE_TRUNC('${timeDim.granularity}', ${dimensionSQL})`
            clauses.push(`${truncatedSQL} as "${timeDim.dimension}"`)
          } else {
            clauses.push(`${dimensionSQL} as "${timeDim.dimension}"`)
          }
        }
      }
    }
    
    return clauses.length > 0 ? clauses : ['1']
  }

  private buildMeasureSQL(measure: any, _measureKey: string): string {
    const sql = typeof measure.sql === 'string' ? measure.sql : measure.sql.toString()
    
    switch (measure.type) {
      case 'count':
        return `COUNT(${sql})`
      case 'countDistinct':
        return `COUNT(DISTINCT ${sql})`
      case 'sum':
        return `SUM(${sql})`
      case 'avg':
        return `AVG(${sql})`
      case 'min':
        return `MIN(${sql})`
      case 'max':
        return `MAX(${sql})`
      case 'number':
        return sql
      default:
        return `COUNT(${sql})`
    }
  }

  private buildWhereClause(cube: SemanticCube, query: SemanticQuery): string | null {
    if (!query.filters || query.filters.length === 0) {
      return null
    }

    const conditions: string[] = []
    
    for (const filter of query.filters) {
      const [cubeName, fieldKey] = filter.member.split('.')
      if (cubeName !== cube.name) continue
      
      const field = cube.dimensions[fieldKey] || cube.measures[fieldKey]
      if (!field) continue
      
      const fieldSQL = typeof field.sql === 'string' ? field.sql : field.sql.toString()
      const condition = this.buildFilterCondition(fieldSQL, filter.operator, filter.values)
      if (condition) {
        conditions.push(condition)
      }
    }
    
    return conditions.length > 0 ? conditions.join(' AND ') : null
  }

  private buildFilterCondition(fieldSQL: string, operator: FilterOperator, values: any[]): string | null {
    const value = values[0]
    const escapedValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
    
    switch (operator) {
      case 'equals':
        return `${fieldSQL} = ${escapedValue}`
      case 'notEquals':
        return `${fieldSQL} != ${escapedValue}`
      case 'contains':
        return `${fieldSQL} ILIKE '%${value}%'`
      case 'notContains':
        return `${fieldSQL} NOT ILIKE '%${value}%'`
      case 'startsWith':
        return `${fieldSQL} ILIKE '${value}%'`
      case 'endsWith':
        return `${fieldSQL} ILIKE '%${value}'`
      case 'gt':
        return `${fieldSQL} > ${escapedValue}`
      case 'gte':
        return `${fieldSQL} >= ${escapedValue}`
      case 'lt':
        return `${fieldSQL} < ${escapedValue}`
      case 'lte':
        return `${fieldSQL} <= ${escapedValue}`
      case 'set':
        return `${fieldSQL} IS NOT NULL`
      case 'notSet':
        return `${fieldSQL} IS NULL`
      case 'inDateRange':
        if (values.length >= 2) {
          return `${fieldSQL} BETWEEN '${values[0]}' AND '${values[1]}'`
        }
        return null
      case 'beforeDate':
        return `${fieldSQL} < '${value}'`
      case 'afterDate':
        return `${fieldSQL} > '${value}'`
      default:
        return null
    }
  }

  private buildGroupByClause(cube: SemanticCube, query: SemanticQuery): string | null {
    const groupFields: string[] = []
    
    // Add dimensions to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = typeof dimension.sql === 'string' ? dimension.sql : dimension.sql.toString()
          groupFields.push(dimensionSQL)
        }
      }
    }
    
    // Add time dimensions to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          const dimensionSQL = typeof dimension.sql === 'string' ? dimension.sql : dimension.sql.toString()
          
          if (timeDim.granularity) {
            groupFields.push(`DATE_TRUNC('${timeDim.granularity}', ${dimensionSQL})`)
          } else {
            groupFields.push(dimensionSQL)
          }
        }
      }
    }
    
    return groupFields.length > 0 ? groupFields.join(', ') : null
  }

  private buildOrderByClause(query: SemanticQuery): string | null {
    if (!query.order || Object.keys(query.order).length === 0) {
      return null
    }
    
    const orderClauses: string[] = []
    
    for (const [field, direction] of Object.entries(query.order)) {
      orderClauses.push(`"${field}" ${direction.toUpperCase()}`)
    }
    
    return orderClauses.join(', ')
  }

  private buildLimitClause(query: SemanticQuery): string | null {
    if (!query.limit) {
      return null
    }
    
    let clause = `LIMIT ${query.limit}`
    
    if (query.offset) {
      clause += ` OFFSET ${query.offset}`
    }
    
    return clause
  }

  private generateAnnotations(cube: SemanticCube, query: SemanticQuery) {
    const measures: Record<string, MeasureAnnotation> = {}
    const dimensions: Record<string, DimensionAnnotation> = {}
    const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
    
    // Generate measure annotations
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, measureKey] = measureName.split('.')
        if (cubeName === cube.name && cube.measures[measureKey]) {
          const measure = cube.measures[measureKey]
          measures[measureName] = {
            title: measure.title || measureKey,
            shortTitle: measure.title || measureKey,
            type: measure.type,
            format: measure.format
          }
        }
      }
    }
    
    // Generate dimension annotations
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, dimensionKey] = dimensionName.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          dimensions[dimensionName] = {
            title: dimension.title || dimensionKey,
            shortTitle: dimension.title || dimensionKey,
            type: dimension.type,
            format: dimension.format
          }
        }
      }
    }
    
    // Generate time dimension annotations
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, dimensionKey] = timeDim.dimension.split('.')
        if (cubeName === cube.name && cube.dimensions[dimensionKey]) {
          const dimension = cube.dimensions[dimensionKey]
          timeDimensions[timeDim.dimension] = {
            title: dimension.title || dimensionKey,
            shortTitle: dimension.title || dimensionKey,
            type: dimension.type,
            granularity: timeDim.granularity
          }
        }
      }
    }
    
    return {
      measures,
      dimensions,
      segments: {},
      timeDimensions
    }
  }
}