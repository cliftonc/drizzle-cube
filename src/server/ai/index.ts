/**
 * AI-Ready Data Layer Utilities
 * Schema-aware intelligence for AI agents - no server-side LLM required
 */

export {
  discoverCubes,
  findBestFieldMatch,
  type CubeDiscoveryResult,
  type DiscoveryOptions
} from './discovery'

export {
  suggestQuery,
  type QuerySuggestion
} from './suggestion'

export {
  validateQuery,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning
} from './validation'

export {
  QUERY_SCHEMAS,
  type QuerySchemas
} from './schemas'
