/**
 * YAML Semantic Layer Loader
 * 
 * Parses YAML files and converts them to SemanticCube objects
 * compatible with the existing semantic layer infrastructure.
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { 
  SemanticCube, 
  SemanticDimension, 
  SemanticMeasure, 
  SemanticJoin,
  SemanticPreAggregation,
  QueryContext 
} from './types'
import type { 
  YamlSchema, 
  YamlCube, 
  YamlDimension, 
  YamlMeasure, 
  YamlJoin,
  YamlPreAggregation,
  YamlValidationResult 
} from './yaml-types'

/**
 * Parse YAML content and return validation result with converted cubes
 */
export function parseYamlCubes(yamlContent: string): YamlValidationResult {
  const result: YamlValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    cubes: []
  }

  try {
    const parsed = parseYaml(yamlContent) as YamlSchema

    if (!parsed) {
      result.valid = false
      result.errors.push('Invalid YAML: empty or malformed content')
      return result
    }

    // Handle different YAML formats
    if (parsed.cubes && Array.isArray(parsed.cubes)) {
      // Multi-cube format: { cubes: [...] }
      result.cubes = parsed.cubes
    } else if (parsed.name) {
      // Single cube format: properties at root level
      result.cubes = [parsed as YamlCube]
    } else {
      result.valid = false
      result.errors.push('YAML must contain either a "cubes" array or cube properties at root level')
      return result
    }

    // Validate each cube
    for (const cube of result.cubes) {
      const cubeErrors = validateYamlCube(cube)
      result.errors.push(...cubeErrors)
    }

    result.valid = result.errors.length === 0

  } catch (error) {
    result.valid = false
    result.errors.push(`YAML parsing error: ${error instanceof Error ? error.message : String(error)}`)
  }

  return result
}

/**
 * Validate a single YAML cube definition
 */
function validateYamlCube(cube: YamlCube): string[] {
  const errors: string[] = []

  // Required fields
  if (!cube.name) {
    errors.push('Cube name is required')
  }

  if (!cube.sql && !cube.sql_table && !cube.sqlTable) {
    errors.push('Cube must have either "sql", "sql_table", or "sqlTable" property')
  }

  // Validate dimensions
  if (cube.dimensions) {
    cube.dimensions.forEach((dim, index) => {
      if (!dim.name) {
        errors.push(`Dimension at index ${index} is missing name`)
      }
      if (!dim.type) {
        errors.push(`Dimension "${dim.name}" is missing type`)
      }
      if (!dim.sql) {
        errors.push(`Dimension "${dim.name}" is missing sql`)
      }
    })
  }

  // Validate measures
  if (cube.measures) {
    cube.measures.forEach((measure, index) => {
      if (!measure.name) {
        errors.push(`Measure at index ${index} is missing name`)
      }
      if (!measure.type) {
        errors.push(`Measure "${measure.name}" is missing type`)
      }
      if (!measure.sql) {
        errors.push(`Measure "${measure.name}" is missing sql`)
      }
    })
  }

  // Validate joins
  if (cube.joins) {
    cube.joins.forEach((join, index) => {
      if (!join.name) {
        errors.push(`Join at index ${index} is missing name`)
      }
      if (!join.relationship) {
        errors.push(`Join "${join.name}" is missing relationship`)
      }
      if (!join.sql) {
        errors.push(`Join "${join.name}" is missing sql`)
      }
    })
  }

  return errors
}

/**
 * Convert YAML cube to SemanticCube object
 */
export function yamlCubeToSemanticCube(yamlCube: YamlCube): SemanticCube {
  // Convert dimensions from array to record
  const dimensions: Record<string, SemanticDimension> = {}
  if (yamlCube.dimensions) {
    yamlCube.dimensions.forEach(dim => {
      dimensions[dim.name] = convertYamlDimension(dim)
    })
  }

  // Convert measures from array to record
  const measures: Record<string, SemanticMeasure> = {}
  if (yamlCube.measures) {
    yamlCube.measures.forEach(measure => {
      measures[measure.name] = convertYamlMeasure(measure)
    })
  }

  // Convert joins from array to record
  const joins: Record<string, SemanticJoin> = {}
  if (yamlCube.joins) {
    yamlCube.joins.forEach(join => {
      joins[join.name] = convertYamlJoin(join)
    })
  }

  // Convert pre-aggregations from array to record
  const preAggregations: Record<string, SemanticPreAggregation> = {}
  if (yamlCube.pre_aggregations || yamlCube.preAggregations) {
    const preAggs = yamlCube.pre_aggregations || yamlCube.preAggregations || []
    preAggs.forEach(preAgg => {
      preAggregations[preAgg.name] = convertYamlPreAggregation(preAgg)
    })
  }

  // Handle sql vs sql_table
  let sql = yamlCube.sql
  if (!sql && (yamlCube.sql_table || yamlCube.sqlTable)) {
    const tableName = yamlCube.sql_table || yamlCube.sqlTable
    sql = `SELECT * FROM ${tableName}`
  }

  // Handle refresh key (support both formats)
  const refreshKey = yamlCube.refresh_key || yamlCube.refreshKey

  return {
    name: yamlCube.name,
    title: yamlCube.title,
    description: yamlCube.description,
    sql: sql || '',
    sqlAlias: yamlCube.sql_alias || yamlCube.sqlAlias,
    dataSource: yamlCube.data_source || yamlCube.dataSource,
    refreshKey: refreshKey ? {
      every: refreshKey.every,
      sql: refreshKey.sql
    } : undefined,
    dimensions,
    measures,
    joins: Object.keys(joins).length > 0 ? joins : undefined,
    preAggregations: Object.keys(preAggregations).length > 0 ? preAggregations : undefined,
    meta: yamlCube.meta
  }
}

/**
 * Convert YAML dimension to SemanticDimension
 */
function convertYamlDimension(yamlDim: YamlDimension): SemanticDimension {
  return {
    name: yamlDim.name,
    title: yamlDim.title,
    description: yamlDim.description,
    type: yamlDim.type,
    sql: yamlDim.sql,
    primaryKey: yamlDim.primary_key || yamlDim.primaryKey,
    shown: yamlDim.shown,
    format: yamlDim.format,
    meta: yamlDim.meta
  }
}

/**
 * Convert YAML measure to SemanticMeasure
 */
function convertYamlMeasure(yamlMeasure: YamlMeasure): SemanticMeasure {
  const filters = yamlMeasure.filters?.map(filter => ({
    sql: filter.sql
  }))

  const rollingWindow = yamlMeasure.rolling_window || yamlMeasure.rollingWindow

  return {
    name: yamlMeasure.name,
    title: yamlMeasure.title,
    description: yamlMeasure.description,
    type: yamlMeasure.type,
    sql: yamlMeasure.sql,
    format: yamlMeasure.format,
    shown: yamlMeasure.shown,
    filters,
    rollingWindow,
    meta: yamlMeasure.meta
  }
}

/**
 * Convert YAML join to SemanticJoin
 */
function convertYamlJoin(yamlJoin: YamlJoin): SemanticJoin {
  return {
    name: yamlJoin.name,
    type: yamlJoin.type,
    relationship: yamlJoin.relationship,
    sql: yamlJoin.sql
  }
}

/**
 * Convert YAML pre-aggregation to SemanticPreAggregation
 */
function convertYamlPreAggregation(yamlPreAgg: YamlPreAggregation): SemanticPreAggregation {
  const timeDimension = yamlPreAgg.time_dimension || yamlPreAgg.timeDimension
  const refreshKey = yamlPreAgg.refresh_key || yamlPreAgg.refreshKey

  return {
    name: yamlPreAgg.name,
    measures: yamlPreAgg.measures,
    dimensions: yamlPreAgg.dimensions,
    timeDimension,
    refreshKey,
    indexes: yamlPreAgg.indexes
  }
}

/**
 * Check if running in an environment without Node.js fs support
 */
async function hasFileSystemSupport(): Promise<boolean> {
  try {
    // Try to import fs and test if readFile actually works
    const { promises: fs } = await import('fs')
    
    // Test if fs.readFile is really implemented (not just a polyfill)
    const testResult = await fs.readFile('non-existent-file.txt', 'utf-8').catch(err => {
      // If it throws ENOENT, fs is working (just file doesn't exist)
      // If it throws "not implemented", fs is polyfilled
      return err.message
    })
    
    // If we get "not implemented" or similar, fs is polyfilled
    if (typeof testResult === 'string' && testResult.includes('not implemented')) {
      return false
    }
    
    return true
  } catch {
    // fs module not available
    return false
  }
}

/**
 * Load and parse YAML cubes from file content
 */
export function loadYamlCubes(yamlContent: string): SemanticCube[] {
  const result = parseYamlCubes(yamlContent)
  
  if (!result.valid) {
    throw new Error(`Invalid YAML cube definition:\n${result.errors.join('\n')}`)
  }

  return result.cubes.map(yamlCube => yamlCubeToSemanticCube(yamlCube))
}

/**
 * Load YAML cubes from file system (Node.js only)
 */
export async function loadYamlCubesFromFile(filePath: string): Promise<SemanticCube[]> {
  const hasFs = await hasFileSystemSupport()
  
  if (!hasFs) {
    console.log('ℹ️ YAML file loading not supported in this environment (Cloudflare Workers/Edge Runtime). Use inline YAML strings or build-time transformations instead.')
    return []
  }

  try {
    const { promises: fs } = await import('fs')
    const yamlContent = await fs.readFile(filePath, 'utf-8')
    return loadYamlCubes(yamlContent)
  } catch (error) {
    console.log(`ℹ️ Could not load YAML file ${filePath}:`, error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Helper function to convert Cube.dev-style YAML references
 * Converts {CUBE}, {CubeName.field}, etc. to our format
 */
export function convertCubeReferences(sql: string): string {
  // First, convert {CUBE} style references to ${} format
  let converted = sql
  
  // Convert {CUBE} to ${CUBE}
  converted = converted.replace(/\{CUBE\}/g, '$' + '{CUBE}')
  
  // Convert {CubeName.field} to ${CubeName.field}
  converted = converted.replace(/\{([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)\}/g, '$' + '{$1}')
  
  // Convert {CubeName} to ${CubeName}
  converted = converted.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, '$' + '{$1}')
  
  // Fix any double dollar signs that might have been created
  converted = converted.replace(/\$\$\{/g, '${')
  
  return converted
}

/**
 * Create a YAML cube definition from a SemanticCube (for export/migration)
 */
export function semanticCubeToYaml(cube: SemanticCube): string {
  const yamlCube: YamlCube = {
    name: cube.name,
    title: cube.title,
    description: cube.description,
    sql: typeof cube.sql === 'string' ? cube.sql : undefined,
    dimensions: Object.values(cube.dimensions).map(dim => ({
      name: dim.name,
      title: dim.title,
      description: dim.description,
      type: dim.type,
      sql: typeof dim.sql === 'string' ? dim.sql : '',
      primary_key: dim.primaryKey,
      shown: dim.shown,
      format: dim.format,
      meta: dim.meta
    })),
    measures: Object.values(cube.measures).map(measure => ({
      name: measure.name,
      title: measure.title,
      description: measure.description,
      type: measure.type,
      sql: typeof measure.sql === 'string' ? measure.sql : '',
      format: measure.format,
      shown: measure.shown,
      filters: measure.filters?.map(filter => ({
        sql: typeof filter.sql === 'string' ? filter.sql : ''
      })),
      rolling_window: measure.rollingWindow,
      meta: measure.meta
    })),
    joins: cube.joins ? Object.values(cube.joins).map(join => ({
      name: join.name || '',
      type: join.type,
      relationship: join.relationship,
      sql: typeof join.sql === 'string' ? join.sql : ''
    })) : undefined,
    meta: cube.meta
  }

  // Convert back to YAML string
  return stringifyYaml(yamlCube, {
    indent: 2,
    lineWidth: 120,
    minContentWidth: 40
  })
}