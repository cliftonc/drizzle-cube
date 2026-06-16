/**
 * EXPLAIN plan parsers
 * Normalize raw EXPLAIN output from different databases to a common format
 */

export { parsePostgresExplain } from './postgres-parser.js'
export { parseMySQLExplain } from './mysql-parser.js'
export { parseSQLiteExplain } from './sqlite-parser.js'
export { parseDuckDBExplain } from './duckdb-parser.js'

export type { ExplainOperation, ExplainResult, ExplainSummary, ExplainOptions } from '../types/executor.js'
