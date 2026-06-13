/**
 * SQL pretty-printing for generated queries.
 *
 * Lives in the server layer (rather than adapters/) so that the compiler can
 * format SQL without importing up into the framework-adapter layer — which
 * would create an import cycle (compiler → adapters/utils → server).
 */

import { format } from 'sql-formatter'

/**
 * Format SQL string using sql-formatter with appropriate dialect
 */
export function formatSqlString(sqlString: string, engineType: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'): string {
  try {
    // Map drizzle-cube engine types to sql-formatter language options
    const dialectMap = {
      postgres: 'postgresql',
      mysql: 'mysql',
      sqlite: 'sqlite',
      singlestore: 'mysql',  // SingleStore uses MySQL dialect for formatting
      duckdb: 'postgresql',  // DuckDB is PostgreSQL-compatible for formatting
      databend: 'postgresql', // Databend is PostgreSQL-compatible for formatting
      snowflake: 'postgresql' // Snowflake is PostgreSQL-compatible for formatting
    } as const

    return format(sqlString, {
      language: dialectMap[engineType],
      tabWidth: 2,
      keywordCase: 'upper',
      indentStyle: 'standard'
    })
  } catch (error) {
    // If formatting fails, return original SQL

    // codeql[js/log-injection] error source is internal, not user-controlled
    console.warn('SQL formatting failed:', error)
    return sqlString
  }
}
