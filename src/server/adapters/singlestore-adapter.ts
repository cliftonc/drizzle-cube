/**
 * SingleStore Database Adapter  
 * Extends MySQL adapter since SingleStore is largely MySQL-compatible
 * Handles SingleStore-specific behaviors and limitations
 */

import { MySQLAdapter } from './mysql-adapter.js'

export class SingleStoreAdapter extends MySQLAdapter {
  getEngineType(): 'singlestore' {
    return 'singlestore'
  }

  // SingleStore inherits most MySQL functionality
  // Override methods here only if SingleStore-specific behavior is needed

  // Note: SingleStore has some known limitations:
  // - ORDER BY and LIMIT cannot be chained together in some contexts
  // - Nested selects with aggregation functions are not supported
  // - Serial column type only assures uniqueness (tests may need ORDER BY)

  // These limitations are typically handled at the query building level
  // rather than in the adapter, but can be addressed here if needed

  // tryCastToType is inherited from MySQLAdapter unchanged. That implementation guards CAST
  // with REGEXP using base-adapter.ts's decimalTryCastPattern()/integerTryCastPattern()/
  // timestampTryCastPattern(), which are deliberately written in portable POSIX-ERE syntax
  // (no \d/\s shorthands) specifically because SingleStore's REGEXP dialect is switchable via
  // the `regexp_format` session variable ('extended' = POSIX ERE, 'advanced' = ICU/PCRE-style
  // — SingleStore's docs suggest 'extended' is the default). Do not "simplify" those shared
  // patterns to use \d/\s without re-verifying SingleStore's default regexp_format, or this
  // silently breaks: an unrecognized escape makes the guard match nothing, so every value
  // becomes NULL instead of only unparseable ones.
}