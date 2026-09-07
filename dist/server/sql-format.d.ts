/**
 * SQL pretty-printing for generated queries.
 *
 * Lives in the server layer (rather than adapters/) so that the compiler can
 * format SQL without importing up into the framework-adapter layer — which
 * would create an import cycle (compiler → adapters/utils → server).
 */
/**
 * Format SQL string using sql-formatter with appropriate dialect
 */
export declare function formatSqlString(sqlString: string, engineType: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'): string;
