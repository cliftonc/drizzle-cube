/**
 * EXPLAIN plan parsers
 * Normalize raw EXPLAIN output from different databases to a common format
 */

export { parsePostgresExplain } from './postgres-parser'
export { parseMySQLExplain } from './mysql-parser'
export { parseSQLiteExplain } from './sqlite-parser'
export { parseDuckDBExplain } from './duckdb-parser'

export type { ExplainOperation, ExplainResult, ExplainSummary, ExplainOptions } from '../types/executor'
