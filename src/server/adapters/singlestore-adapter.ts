/**
 * SingleStore Database Adapter  
 * Extends MySQL adapter since SingleStore is largely MySQL-compatible
 * Handles SingleStore-specific behaviors and limitations
 */

import { MySQLAdapter } from './mysql-adapter'

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
}