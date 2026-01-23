// Re-exports all types for the Drizzle Cube semantic layer
// Maintains backward compatibility while providing a clean organization

// Core types
export * from './core'

// Query types
export * from './query'

// Funnel analysis types
export * from './funnel'

// Retention analysis types
export * from './retention'

// Cube definitions
export * from './cube'

// Database execution
export * from './executor'

// Metadata and API types
export * from './metadata'

// Query analysis types
export * from './analysis'

// Utility functions and helpers
export * from './utils'

// Cache types
export * from './cache'

// Legacy compatibility - re-export with old names for backwards compatibility
export type {
  Cube as SemanticCube,
  Dimension as SemanticDimension,
  Measure as SemanticMeasure,
  CubeJoin as SemanticJoin
} from './cube'

export type { 
  QueryContext as SemanticQueryContext 
} from './cube'

// Maintain the old defineCube function name as well
export { defineCube } from '../cube-utils'