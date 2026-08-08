import { readFile } from 'node:fs/promises'
import { DbtGenerateError } from './errors.js'
import type { ExplicitMeasureConfig, GeneratorConfig, SecurityConfig } from './types.js'

const validMeasureTypes = new Set([
  'count', 'countDistinct', 'countDistinctApprox', 'sum', 'avg', 'min', 'max', 'runningTotal', 'number', 'calculated',
  'stddev', 'stddevSamp', 'variance', 'varianceSamp', 'percentile', 'median', 'p95', 'p99',
  'lag', 'lead', 'rank', 'denseRank', 'rowNumber', 'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateSecurity(value: unknown): SecurityConfig {
  if (!isRecord(value)) throw new DbtGenerateError('Invalid config security: expected object.')
  if (value.mode === 'none') return { mode: 'none' }
  if (value.mode === 'column') {
    if (typeof value.column !== 'string' || typeof value.context !== 'string') {
      throw new DbtGenerateError('Invalid config security column mode: column and context must be strings.')
    }
    return { mode: 'column', column: value.column, context: value.context }
  }
  throw new DbtGenerateError('Invalid config security mode. Expected "none" or "column".')
}

function validateMeasure(value: unknown): ExplicitMeasureConfig {
  if (!isRecord(value)) throw new DbtGenerateError('Invalid measure config: expected object.')
  if (typeof value.name !== 'string' || typeof value.type !== 'string') {
    throw new DbtGenerateError('Invalid measure config: name and type are required strings.')
  }
  if (!validMeasureTypes.has(value.type)) {
    throw new DbtGenerateError(`Invalid measure type ${value.type}.`)
  }
  if (value.column !== undefined && typeof value.column !== 'string') throw new DbtGenerateError('Invalid measure config: column must be a string.')
  if (value.title !== undefined && typeof value.title !== 'string') throw new DbtGenerateError('Invalid measure config: title must be a string.')
  if (value.description !== undefined && typeof value.description !== 'string') throw new DbtGenerateError('Invalid measure config: description must be a string.')
  if (value.format !== undefined && typeof value.format !== 'string') throw new DbtGenerateError('Invalid measure config: format must be a string.')
  return value as unknown as ExplicitMeasureConfig
}

export async function loadGeneratorConfig(configPath?: string): Promise<GeneratorConfig> {
  if (!configPath) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(configPath, 'utf8'))
  } catch (error) {
    throw new DbtGenerateError(`Failed to load generator config ${configPath}: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!isRecord(parsed)) throw new DbtGenerateError('Invalid generator config: expected JSON object.')

  const config: GeneratorConfig = {}
  if (parsed.security !== undefined) config.security = validateSecurity(parsed.security)

  if (parsed.typeOverrides !== undefined) {
    if (!isRecord(parsed.typeOverrides)) throw new DbtGenerateError('Invalid typeOverrides: expected object.')
    config.typeOverrides = {}
    for (const [typeName, override] of Object.entries(parsed.typeOverrides)) {
      if (!isRecord(override) || typeof override.drizzleBuilder !== 'string') {
        throw new DbtGenerateError(`Invalid type override for ${typeName}: drizzleBuilder is required.`)
      }
      if (override.dimensionType !== undefined && typeof override.dimensionType !== 'string') {
        throw new DbtGenerateError(`Invalid type override for ${typeName}: dimensionType must be a string.`)
      }
      config.typeOverrides[typeName] = { drizzleBuilder: override.drizzleBuilder, dimensionType: override.dimensionType as any }
    }
  }

  if (parsed.models !== undefined) {
    if (!isRecord(parsed.models)) throw new DbtGenerateError('Invalid models config: expected object.')
    config.models = {}
    for (const [modelName, modelConfig] of Object.entries(parsed.models)) {
      if (!isRecord(modelConfig)) throw new DbtGenerateError(`Invalid model config for ${modelName}: expected object.`)
      const normalized: NonNullable<GeneratorConfig['models']>[string] = {}
      if (typeof modelConfig.cubeName === 'string') normalized.cubeName = modelConfig.cubeName
      if (typeof modelConfig.tableExportName === 'string') normalized.tableExportName = modelConfig.tableExportName
      if (isRecord(modelConfig.columns)) normalized.columns = modelConfig.columns as any
      if (Array.isArray(modelConfig.measures)) normalized.measures = modelConfig.measures.map(validateMeasure)
      config.models[modelName] = normalized
    }
  }

  return config
}
