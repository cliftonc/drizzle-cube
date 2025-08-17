// Basic types - will be expanded in Phase 2
export interface SecurityContext {
  [key: string]: any
}

export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: any[]
}