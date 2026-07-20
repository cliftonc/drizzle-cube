import type { MeasureType } from '../../server/types/core.js'

export type SecurityMode =
  | { kind: 'filter'; columnName: string; contextProperty: string }
  | { kind: 'none' }

export interface DbtGenerateOptions {
  manifestPath: string
  catalogPath: string
  dialect: 'postgres'
  outDir: string
  security: SecurityMode
  dryRun: boolean
  check: boolean
  force: boolean
  configPath?: string
}

export interface GeneratorWarning {
  code: string
  message: string
  modelName?: string
  columnName?: string
}

export interface GeneratedFile {
  path: string
  content: string
}

export type SupportedMaterialization = 'table' | 'view' | 'incremental'
export type PgColumnBuilder = 'bigint' | 'boolean' | 'date' | 'doublePrecision' | 'integer' | 'jsonb' | 'numeric' | 'real' | 'text' | 'timestamp'
export type EmittedDimensionType = 'string' | 'number' | 'time' | 'boolean'

export interface DbtColumn {
  name: string
  description?: string
  meta?: Record<string, unknown>
  tests: string[]
}

export interface DbtModel {
  uniqueId: string
  name: string
  alias: string
  schema?: string
  database?: string
  description?: string
  materialized?: string
  columns: DbtColumn[]
  meta?: Record<string, unknown>
  testsByColumn: Record<string, string[]>
}

export interface CatalogColumn {
  name: string
  type: string
  index?: number
  comment?: string
}

export interface CatalogNode {
  uniqueId: string
  columns: CatalogColumn[]
}

export interface DbtRelationshipTest {
  sourceModelId: string
  sourceColumn: string
  targetModelId: string
  targetColumn: string
}

export interface ParsedDbtArtifacts {
  models: DbtModel[]
  catalogNodes: Map<string, CatalogNode>
  relationships: DbtRelationshipTest[]
  warnings: GeneratorWarning[]
}

export interface GeneratedColumn {
  sqlName: string
  propertyName: string
  dimensionName: string
  title: string
  description?: string
  builder: PgColumnBuilder
  dimensionType: EmittedDimensionType
  primaryKey: boolean
  notNull: boolean
  catalogIndex: number
}

export interface GeneratedMeasure {
  name: string
  title?: string
  description?: string
  type: MeasureType
  columnName?: string
}

export interface GeneratedRelationship {
  name: string
  sourceColumnName: string
  targetCubeName: string
  targetTableExportName: string
  targetColumnName: string
}

export interface GeneratedModel {
  uniqueId: string
  dbtName: string
  relationName: string
  tableExportName: string
  cubeName: string
  cubeExportName: string
  fileName: string
  title: string
  description?: string
  columns: GeneratedColumn[]
  measures: GeneratedMeasure[]
  relationships: GeneratedRelationship[]
  security: SecurityMode
}

export interface WriteResult {
  created: string[]
  updated: string[]
  unchanged: string[]
  deleted: string[]
  conflicts: string[]
  warnings: GeneratorWarning[]
}

export interface GenerationResult {
  files: GeneratedFile[]
  writeResult: WriteResult
  warnings: GeneratorWarning[]
}

export interface EmitContext {
  header: string
}
