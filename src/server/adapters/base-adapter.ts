/**
 * Base Database Adapter Interface
 * Defines the contract for database-specific SQL generation
 * Each database adapter must implement these methods to handle SQL dialect differences
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types/index.js'
import { buildWindowOverClause, buildWindowExpression } from './window-function-builder.js'

/**
 * Database capabilities for feature detection
 * Used for graceful degradation when functions aren't supported
 */
export interface DatabaseCapabilities {
  /** Whether the database supports PERCENTILE_CONT or similar */
  supportsPercentile: boolean
  /** Whether the database supports LATERAL joins (PostgreSQL 9.3+, MySQL 8.0.14+) */
  supportsLateralJoins: boolean
  /** Whether percentile functions work in subqueries against CTEs (false for DuckDB) */
  supportsPercentileSubqueries: boolean
  /** Whether correlated LATERAL subqueries can reference CTEs (false for Snowflake) */
  supportsLateralSubqueriesInCTE: boolean
}

/**
 * Window function types supported by the adapter
 */
export type WindowFunctionType =
  | 'lag'
  | 'lead'
  | 'rank'
  | 'denseRank'
  | 'rowNumber'
  | 'ntile'
  | 'firstValue'
  | 'lastValue'
  | 'movingAvg'
  | 'movingSum'

/**
 * Window function configuration
 */
export interface WindowFunctionConfig {
  /** Number of rows to offset for lag/lead */
  offset?: number
  /** Default value when offset is out of bounds */
  defaultValue?: any
  /** Number of buckets for ntile */
  nTile?: number
  /** Frame specification for moving aggregates */
  frame?: {
    type: 'rows' | 'range'
    start: number | 'unbounded'
    end: number | 'current' | 'unbounded'
  }
}

export interface DatabaseAdapter {
  /**
   * Get the database engine type this adapter supports
   */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build SQL INTERVAL from ISO 8601 duration string
   * Used for time window constraints in funnel analysis
   * @param duration - ISO 8601 duration (e.g., "P7D" for 7 days, "PT1H" for 1 hour)
   * @returns SQL expression representing the interval
   */
  buildIntervalFromISO(duration: string): SQL

  /**
   * Build time difference expression in seconds between two timestamps
   * Used for calculating time-to-convert metrics in funnel analysis
   * @param end - End timestamp expression
   * @param start - Start timestamp expression
   * @returns SQL expression for (end - start) in seconds
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL

  /**
   * Build expression to add an ISO 8601 duration to a timestamp
   * Used for time window constraint checks in funnel analysis
   * @param timestamp - Base timestamp expression
   * @param duration - ISO 8601 duration to add
   * @returns SQL expression for timestamp + interval
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL

  /**
   * Build conditional aggregation with database-specific syntax
   * Used for single-pass funnel metrics aggregation
   * PostgreSQL uses FILTER clause, MySQL/SQLite use CASE WHEN
   * @param aggFn - Aggregation function: 'count' | 'avg' | 'min' | 'max' | 'sum'
   * @param expr - Expression to aggregate (null for COUNT(*))
   * @param condition - Condition for filtering
   * @returns SQL for conditional aggregation
   */
  buildConditionalAggregation(
    aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum',
    expr: SQL | null,
    condition: SQL
  ): SQL

  /**
   * Build date difference expression in specified periods
   * Used for retention analysis to calculate period numbers
   * @param startDate - Start date expression
   * @param endDate - End date expression
   * @param unit - Unit for difference ('day' | 'week' | 'month')
   * @returns SQL expression for date difference in periods
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL

  /**
   * Build a subquery that generates a series of period numbers (0 to maxPeriod)
   * Used for retention analysis to cross-join with user data
   * @param maxPeriod - Maximum period number to generate
   * @returns SQL expression for period series subquery with alias 'p' containing 'period_number' column
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL

  /**
   * Build time dimension expression with granularity truncation
   * @param granularity - Time granularity (day, month, year, etc.)
   * @param fieldExpr - The date/timestamp field expression
   * @returns SQL expression for truncated time dimension
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build string matching condition
   * @param fieldExpr - The field to search in
   * @param operator - The string matching operator
   * @param value - The value to match
   * @returns SQL expression for string matching
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL

  /**
   * Cast expression to specific database type
   * @param fieldExpr - The field expression to cast
   * @param targetType - Target database type
   * @returns SQL expression with type casting
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL

  /**
   * Cast expression to specific database type, tolerantly: unparseable input yields NULL
   * instead of raising an error (PostgreSQL's `::`/`CAST` on bad input) or silently producing
   * 0 (MySQL/SQLite `CAST` on non-numeric text). Intended for EAV-style schemas where a text
   * column holds numbers/timestamps for some attributes and free text for others, so one dirty
   * value doesn't fail the whole query or masquerade as a real 0.
   * @param fieldExpr - The field expression to cast
   * @param targetType - Target database type
   * @returns SQL expression with tolerant type casting; unparseable/NULL input yields NULL
   */
  tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL

  /**
   * Build AVG aggregation expression with database-specific null handling
   * @param fieldExpr - The field expression to average
   * @returns SQL expression for AVG aggregation (COALESCE vs IFNULL for null handling)
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build CASE WHEN conditional expression
   * @param conditions - Array of condition/result pairs
   * @param elseValue - Optional ELSE clause value
   * @returns SQL expression for CASE WHEN statement
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL

  /**
   * Build boolean literal expression
   * @param value - Boolean value to represent
   * @returns SQL expression for boolean literal (TRUE/FALSE/1/0 depending on database)
   */
  buildBooleanLiteral(value: boolean): SQL

  /**
   * Convert filter values to database-compatible types
   * @param value - The filter value to convert
   * @returns Converted value for database queries
   */
  convertFilterValue(value: any): any

  /**
   * Prepare date value for database-specific storage format
   * @param date - Date value to prepare
   * @returns Database-compatible date representation
   */
  prepareDateValue(date: Date): any

  /**
   * Check if this database stores timestamps as integers
   * @returns True if timestamps are stored as integers (milliseconds), false for native timestamps
   */
  isTimestampInteger(): boolean

  /**
   * Convert time dimension result values back to Date objects for consistency
   * @param value - The time dimension value from query results
   * @returns Date object or original value if not a time dimension
   */
  convertTimeDimensionResult(value: any): any

  /**
   * Preprocess calculated measure template for database-specific transformations
   * This allows each adapter to modify the template before substitution occurs
   * @param calculatedSql - The template string with {member} references
   * @returns Preprocessed template string
   */
  preprocessCalculatedTemplate(calculatedSql: string): string

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * Get database capabilities for feature detection
   * Used for graceful degradation when functions aren't supported
   */
  getCapabilities(): DatabaseCapabilities

  /**
   * Build STDDEV aggregation expression
   * @param fieldExpr - The field expression to calculate stddev for
   * @param useSample - Use sample stddev (STDDEV_SAMP) vs population (STDDEV_POP). Default: false
   * @returns SQL expression or null if unsupported
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample?: boolean): SQL | null

  /**
   * Build VARIANCE aggregation expression
   * @param fieldExpr - The field expression to calculate variance for
   * @param useSample - Use sample variance (VAR_SAMP) vs population (VAR_POP). Default: false
   * @returns SQL expression or null if unsupported
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample?: boolean): SQL | null

  /**
   * Build PERCENTILE aggregation expression
   * @param fieldExpr - The field expression to calculate percentile for
   * @param percentile - Percentile value (0-100)
   * @returns SQL expression or null if unsupported
   */
  buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL | null

  /**
   * Build a window function expression
   * @param type - Window function type (lag, lead, rank, etc.)
   * @param fieldExpr - The field expression (null for rank functions that don't need a field)
   * @param partitionBy - PARTITION BY columns
   * @param orderBy - ORDER BY columns with direction
   * @param config - Additional configuration (offset, default, frame, etc.)
   * @returns SQL expression or null if unsupported
   */
  buildWindowFunction(
    type: WindowFunctionType,
    fieldExpr: AnyColumn | SQL | null,
    partitionBy?: (AnyColumn | SQL)[],
    orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>,
    config?: WindowFunctionConfig
  ): SQL | null
}

/**
 * Abstract base class for database adapters
 * Provides common functionality that can be shared across database implementations
 */
export abstract class BaseDatabaseAdapter implements DatabaseAdapter {
  // ============================================
  // Engine-specific methods (must be implemented per engine)
  // ============================================

  abstract getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  // Funnel analysis methods — interval/date arithmetic differs per engine
  abstract buildIntervalFromISO(duration: string): SQL
  abstract buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL
  abstract buildDateAddInterval(timestamp: SQL, duration: string): SQL
  abstract buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL
  abstract buildPeriodSeriesSubquery(maxPeriod: number): SQL

  // Time-dimension truncation (DATE_TRUNC vs DATE_FORMAT vs date() modifiers)
  abstract buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL
  // Type casting (::type vs CAST(...))
  abstract castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL
  // Tolerant type casting (NULL on unparseable input). Semantics diverge too much per engine
  // (regex-guarded CASE vs GLOB-guarded CASE vs native TRY_CAST) for a shared default to be
  // correct for the majority, so — like castToType — it stays abstract.
  abstract tryCastToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL
  // Feature flags per engine
  abstract getCapabilities(): DatabaseCapabilities
  // Percentile support varies widely (PERCENTILE_CONT / QUANTILE_CONT / unsupported)
  abstract buildPercentile(fieldExpr: AnyColumn | SQL, percentile: number): SQL | null

  // ============================================
  // Shared default implementations (override only where the engine differs)
  // ============================================

  /**
   * Default implementation returns template unchanged
   * Override in specific adapters for database-specific preprocessing
   */
  preprocessCalculatedTemplate(calculatedSql: string): string {
    return calculatedSql
  }

  /**
   * Wrap an aggregate so NULL (empty set) becomes 0.
   * Default uses COALESCE; engines without COALESCE (MySQL/SQLite) override with IFNULL.
   */
  protected nullToZero(expr: SQL): SQL {
    return sql`COALESCE(${expr}, 0)`
  }

  /**
   * Case-insensitive LIKE matching for contains/startsWith/endsWith/ilike.
   * Default uses native ILIKE (PostgreSQL/DuckDB/Snowflake); engines without ILIKE
   * (MySQL/SQLite/Databend) override with LOWER()+LIKE.
   * @param pattern - the LIKE pattern in its original case (already wrapped with % as needed)
   */
  protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL {
    return negated
      ? sql`${fieldExpr} NOT ILIKE ${pattern}`
      : sql`${fieldExpr} ILIKE ${pattern}`
  }

  /**
   * Regular-expression matching. Default uses PostgreSQL's ~* / !~* operators;
   * each other engine overrides with its own regex syntax (REGEXP, GLOB, regexp_matches, REGEXP_LIKE).
   */
  protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL {
    return negated
      ? sql`${fieldExpr} !~* ${value}`
      : sql`${fieldExpr} ~* ${value}`
  }

  /**
   * Build a string matching condition. The case-insensitive and regex families are
   * delegated to the caseInsensitiveLike()/regexCondition() hooks; plain LIKE/NOT LIKE
   * are identical across all engines.
   */
  buildStringCondition(
    fieldExpr: AnyColumn | SQL,
    operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex',
    value: string
  ): SQL {
    switch (operator) {
      case 'contains':
        return this.caseInsensitiveLike(fieldExpr, `%${value}%`, false)
      case 'notContains':
        return this.caseInsensitiveLike(fieldExpr, `%${value}%`, true)
      case 'startsWith':
        return this.caseInsensitiveLike(fieldExpr, `${value}%`, false)
      case 'endsWith':
        return this.caseInsensitiveLike(fieldExpr, `%${value}`, false)
      case 'like':
        return sql`${fieldExpr} LIKE ${value}`
      case 'notLike':
        return sql`${fieldExpr} NOT LIKE ${value}`
      case 'ilike':
        return this.caseInsensitiveLike(fieldExpr, value, false)
      case 'regex':
        return this.regexCondition(fieldExpr, value, false)
      case 'notRegex':
        return this.regexCondition(fieldExpr, value, true)
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build conditional aggregation. Default uses portable CASE WHEN
   * (MySQL/SQLite/Databend/Snowflake); PostgreSQL/DuckDB override with the FILTER clause.
   */
  buildConditionalAggregation(
    aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum',
    expr: SQL | null,
    condition: SQL
  ): SQL {
    const fnName = aggFn.toUpperCase()
    if (aggFn === 'count' && !expr) {
      return sql`${sql.raw(fnName)}(CASE WHEN ${condition} THEN 1 END)`
    }
    return sql`${sql.raw(fnName)}(CASE WHEN ${condition} THEN ${expr} END)`
  }

  /**
   * Build AVG with null-to-zero handling (COALESCE/IFNULL via nullToZero()).
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return this.nullToZero(sql`AVG(${fieldExpr})`)
  }

  /**
   * Build CASE WHEN conditional expression.
   * SQLite overrides this to handle embedded SQL objects in THEN/ELSE.
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)

    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build boolean literal. Default uses TRUE/FALSE keywords; SQLite overrides with 1/0.
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values to database-compatible types.
   * Default is a pass-through; SQLite overrides to handle booleans/dates as integers.
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare a Date for storage. Default passes the Date through (native timestamps);
   * SQLite overrides to convert to integer milliseconds.
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * Whether timestamps are stored as integers. Default false; SQLite overrides to true.
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * Convert a time-dimension result value. Default is a pass-through.
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

  /**
   * Build STDDEV aggregation. Default uses STDDEV_POP/STDDEV_SAMP with null-to-zero.
   * Engines without native STDDEV (SQLite) override to return null.
   */
  buildStddev(fieldExpr: AnyColumn | SQL, useSample = false): SQL | null {
    const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
    return this.nullToZero(sql`${sql.raw(fn)}(${fieldExpr})`)
  }

  /**
   * Build VARIANCE aggregation. Default uses VAR_POP/VAR_SAMP with null-to-zero.
   * SQLite overrides to null; Databend overrides to a COVAR-based workaround.
   */
  buildVariance(fieldExpr: AnyColumn | SQL, useSample = false): SQL | null {
    const fn = useSample ? 'VAR_SAMP' : 'VAR_POP'
    return this.nullToZero(sql`${sql.raw(fn)}(${fieldExpr})`)
  }

  /**
   * Build a window function expression. Identical across all supported engines
   * (standard SQL:2003 window syntax), so it lives here as a shared default.
   */
  buildWindowFunction(
    type: WindowFunctionType,
    fieldExpr: AnyColumn | SQL | null,
    partitionBy?: (AnyColumn | SQL)[],
    orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>,
    config?: WindowFunctionConfig
  ): SQL | null {
    const over = buildWindowOverClause(partitionBy, orderBy, config)
    return buildWindowExpression(type, fieldExpr, over, config)
  }

  /**
   * Regex pattern for tryCastToType's decimal guard: optional leading sign, digits with an
   * optional fractional part (or a bare fractional part like `.5`), surrounded by optional
   * spaces; rejects everything else. Shared by PostgreSQL (`~`) and MySQL/SingleStore
   * (`REGEXP`).
   *
   * Deliberately written using only POSIX ERE syntax (`[0-9]` instead of `\d`, a literal
   * space instead of `\s`) rather than Perl/ICU shorthands. PostgreSQL's `~` always
   * understands `\d`/`\s`, and MySQL 8.0.4+'s default ICU regex engine does too — but
   * SingleStore's `REGEXP` is dialect-switchable via the `regexp_format` session variable
   * ('extended' = POSIX ERE, 'advanced' = ICU/PCRE-style), and SingleStore's own docs
   * recommend explicitly opting into 'advanced' for new regex logic, implying 'extended'
   * (POSIX, no `\d`/`\s`) is the default. Since SingleStoreAdapter inherits this pattern
   * unchanged from MySQLAdapter and this repo doesn't control session variables for
   * consumers, the pattern is written as the POSIX-ERE/ICU/ARE intersection so it matches
   * correctly regardless of which dialect is active.
   */
  protected decimalTryCastPattern(): string {
    return '^ *[+-]?([0-9]+(\\.[0-9]+)?|\\.[0-9]+) *$'
  }

  /**
   * Regex pattern for tryCastToType's integer guard: optional leading sign, digits only,
   * surrounded by optional spaces. Same POSIX-ERE/ICU/ARE-portable rationale as
   * decimalTryCastPattern().
   */
  protected integerTryCastPattern(): string {
    return '^ *[+-]?[0-9]+ *$'
  }

  /**
   * Regex pattern for tryCastToType's timestamp guard: an ISO 8601-shaped date, optionally
   * followed by a time component (with optional seconds, fractional seconds and a UTC/offset
   * suffix), surrounded by optional spaces. This only validates the *shape* of the input —
   * it does not catch calendar-invalid dates (e.g. 2024-02-30) or reject strings that "look"
   * like a timestamp but aren't (that would need engine-side parsing, which is exactly what
   * tryCastToType is avoiding relying on for error-safety). Same POSIX-ERE/ICU/ARE-portable
   * rationale as decimalTryCastPattern().
   */
  protected timestampTryCastPattern(): string {
    return '^ *[0-9]{4}-[0-9]{2}-[0-9]{2}([ T][0-9]{2}:[0-9]{2}(:[0-9]{2}(\\.[0-9]+)?)?([+-][0-9]{2}:?[0-9]{2}|Z)?)? *$'
  }

  /**
   * Helper method to build pattern for string matching
   * Can be overridden by specific adapters if needed
   */
  protected buildPattern(operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith', value: string): string {
    switch (operator) {
      case 'contains':
      case 'notContains':
        return `%${value}%`
      case 'startsWith':
        return `${value}%`
      case 'endsWith':
        return `%${value}`
      default:
        return value
    }
  }

  /**
   * Parse ISO 8601 duration into components
   * Supports P[n]Y[n]M[n]DT[n]H[n]M[n]S format
   * @param duration - ISO 8601 duration string (e.g., "P7D", "PT1H30M", "P1DT2H")
   * @returns Parsed duration components
   */
  protected parseISODuration(duration: string): {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
  } {
    const result = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

    // Match ISO 8601 duration pattern
    const pattern = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
    const match = duration.match(pattern)

    if (!match) {
      throw new Error(`Invalid ISO 8601 duration format: ${duration}`)
    }

    result.years = parseInt(match[1] || '0', 10)
    result.months = parseInt(match[2] || '0', 10)
    result.days = parseInt(match[3] || '0', 10)
    result.hours = parseInt(match[4] || '0', 10)
    result.minutes = parseInt(match[5] || '0', 10)
    result.seconds = parseFloat(match[6] || '0')

    return result
  }

  /**
   * Convert ISO 8601 duration to total seconds
   * Note: Months and years are approximated (30 days/month, 365 days/year)
   * @param duration - ISO 8601 duration string
   * @returns Total seconds
   */
  protected durationToSeconds(duration: string): number {
    const parsed = this.parseISODuration(duration)
    return (
      parsed.years * 365 * 24 * 60 * 60 +
      parsed.months * 30 * 24 * 60 * 60 +
      parsed.days * 24 * 60 * 60 +
      parsed.hours * 60 * 60 +
      parsed.minutes * 60 +
      parsed.seconds
    )
  }
}