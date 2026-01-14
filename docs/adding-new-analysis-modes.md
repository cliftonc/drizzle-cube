# Adding New Analysis Modes to Drizzle-Cube

This document provides a comprehensive checklist for adding new analysis modes to Drizzle-Cube (similar to Flow or Funnel mode). Analysis modes span both backend and frontend, requiring careful coordination across multiple layers.

## Architecture Overview

Analysis modes are defined by a **mode detection pattern** where the presence of specific configuration properties triggers specialized query handling:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       Analysis Mode Architecture                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   HTTP Request                                                             │
│       │                                                                    │
│       ▼                                                                    │
│   Express Adapter (/load, /sql)                                           │
│       │                                                                    │
│       ▼                                                                    │
│   SemanticLayerCompiler.execute() / generateSQL()                         │
│       │                                                                    │
│       ▼                                                                    │
│   QueryExecutor.execute() ─────────────────────────────────────────────   │
│       │                                                                    │
│       │ Mode Detection (in order):                                        │
│       │ 1. hasFunnel(query) → executeFunnelQuery()                        │
│       │ 2. hasFlow(query) → executeFlowQuery()                            │
│       │ 3. hasComparison(query) → executeComparisonQuery()                │
│       │ 4. else → executeStandardQuery()                                  │
│       │                                                                    │
│       ▼                                                                    │
│   {Mode}QueryBuilder                                                       │
│       ├─ validateConfig() → Validation result                              │
│       ├─ build{Mode}Query() → Drizzle query builder                        │
│       └─ transformResult() → Mode-specific result format                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       Frontend Mode Architecture                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   AnalysisBuilder Store                                                    │
│       │                                                                    │
│       ├─ coreSlice (analysisType, activeView, charts)                     │
│       ├─ querySlice (standard query state)                                │
│       ├─ funnelSlice (funnel-specific state)                              │
│       └─ flowSlice (flow-specific state)                                  │
│                                                                            │
│   Mode Adapter (modeAdapter.ts interface)                                  │
│       ├─ stateToServerQuery() → Convert UI state to executable query      │
│       ├─ serverQueryToState() → Load config into UI state                 │
│       └─ getValidationErrors() → Validate before execution                │
│                                                                            │
│   AnalysisConfig (types/analysisConfig.ts)                                │
│       ├─ QueryAnalysisConfig (analysisType: 'query')                      │
│       ├─ FunnelAnalysisConfig (analysisType: 'funnel')                    │
│       └─ FlowAnalysisConfig (analysisType: 'flow')                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Checklist

### 1. Create Server Type Definitions

**File:** `src/server/types/{mode}.ts`

Define the configuration and result types:

```typescript
/**
 * Server-side {Mode} Analysis Types
 */

import type { Filter } from './query'

// ============================================================================
// Configuration
// ============================================================================

/**
 * {Mode} query configuration
 */
export interface {Mode}QueryConfig {
  // Required fields that identify entities
  bindingKey: string | { cube: string; dimension: string }[]

  // Mode-specific configuration fields
  // ...

  // Optional fields with defaults
  someOption?: 'optionA' | 'optionB'
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result row returned from {mode} query execution
 */
export interface {Mode}ResultRow {
  // Mode-specific result structure
  // ...
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * {Mode} validation result
 */
export interface {Mode}ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// Constants
// ============================================================================

export const {MODE}_MIN_VALUE = 0
export const {MODE}_MAX_VALUE = 10
```

---

### 2. Add Mode to SemanticQuery

**File:** `src/server/types/query.ts`

Add the mode configuration property:

```typescript
import type { {Mode}QueryConfig } from './{mode}'

export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: Array<Filter>
  // ... existing fields

  funnel?: FunnelQueryConfig
  flow?: FlowQueryConfig
  {mode}?: {Mode}QueryConfig  // Add your mode
}
```

---

### 3. Create Query Builder

**File:** `src/server/{mode}-query-builder.ts`

Create the query builder class:

```typescript
import type { DrizzleDatabase } from './adapters/types'
import type { {Mode}QueryConfig, {Mode}ResultRow, {Mode}ValidationResult } from './types/{mode}'
import type { QueryContext } from './types/core'

export class {Mode}QueryBuilder {
  private db: DrizzleDatabase
  private schema: any

  constructor(db: DrizzleDatabase, schema?: any) {
    this.db = db
    this.schema = schema
  }

  /**
   * Check if query contains {mode} configuration
   */
  has{Mode}(query: SemanticQuery): boolean {
    return !!(
      query.{mode} &&
      query.{mode}.bindingKey &&
      // ... other required fields
    )
  }

  /**
   * Validate {mode} configuration
   */
  validateConfig(
    config: {Mode}QueryConfig,
    cubes: Record<string, any>
  ): {Mode}ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate required fields
    if (!config.bindingKey) {
      errors.push('bindingKey is required')
    }

    // Validate field existence in cubes
    // ...

    // Add warnings for performance concerns
    // ...

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Build the Drizzle query
   */
  build{Mode}Query(
    config: {Mode}QueryConfig,
    cubes: Record<string, any>,
    context: QueryContext
  ): ReturnType<typeof this.db.select> {
    // Build CTEs and main query using Drizzle
    // ...
  }

  /**
   * Transform raw query results to mode-specific format
   */
  transformResult(
    rawResult: any[],
    config: {Mode}QueryConfig
  ): {Mode}ResultRow[] {
    // Transform raw SQL results to typed result format
    // ...
  }
}
```

**Key methods to implement:**
| Method | Purpose |
|--------|---------|
| `has{Mode}()` | Detection logic for mode routing |
| `validateConfig()` | Configuration validation with helpful errors |
| `build{Mode}Query()` | Drizzle query construction |
| `transformResult()` | Convert raw SQL rows to typed results |

---

### 4. Integrate with Executor

**File:** `src/server/executor.ts`

Add mode detection and execution:

```typescript
import { {Mode}QueryBuilder } from './{mode}-query-builder'

export class QueryExecutor {
  private {mode}QueryBuilder: {Mode}QueryBuilder

  constructor(db, schema, options) {
    // ... existing initialization
    this.{mode}QueryBuilder = new {Mode}QueryBuilder(db, schema)
  }

  async execute(cubes, query, securityContext) {
    // ... existing mode checks (funnel, flow)

    // Add {mode} check (maintain detection order)
    if (this.{mode}QueryBuilder.has{Mode}(query)) {
      return this.execute{Mode}QueryWithCache(cubes, query, securityContext, cacheKey)
    }

    // ... fall through to standard
  }

  /**
   * Execute {mode} query with caching
   */
  private async execute{Mode}QueryWithCache(
    cubes: Record<string, any>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string
  ): Promise<QueryResult> {
    // Check cache first
    const cached = await this.cache?.get(cacheKey)
    if (cached) {
      return { ...cached, cache: { hit: true, cachedAt: cached.cachedAt } }
    }

    const result = await this.execute{Mode}Query(cubes, query, securityContext)

    // Store in cache
    await this.cache?.set(cacheKey, result)

    return result
  }

  /**
   * Execute {mode} query
   */
  private async execute{Mode}Query(
    cubes: Record<string, any>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    const config = query.{mode}!

    // Validate
    const validation = this.{mode}QueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`{Mode} validation failed: ${validation.errors.join(', ')}`)
    }

    // Create context
    const context: QueryContext = {
      db: this.db,
      schema: this.schema,
      securityContext,
    }

    // Build and execute query
    const {mode}Query = this.{mode}QueryBuilder.build{Mode}Query(config, cubes, context)
    const rawResult = await {mode}Query

    // Transform results
    const data = this.{mode}QueryBuilder.transformResult(rawResult, config)

    return {
      data,
      annotation: {
        {mode}: {
          // Mode-specific annotation data
        },
        measures: {},
        dimensions: {},
        segments: {},
        timeDimensions: {},
      },
    }
  }

  /**
   * Dry-run for {mode} query
   */
  async dryRun{Mode}(
    cubes: Record<string, any>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params: any[] }> {
    const config = query.{mode}!

    const validation = this.{mode}QueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`{Mode} validation failed: ${validation.errors.join(', ')}`)
    }

    const context: QueryContext = {
      db: this.db,
      schema: this.schema,
      securityContext,
    }

    const {mode}Query = this.{mode}QueryBuilder.build{Mode}Query(config, cubes, context)
    const sqlObj = {mode}Query.toSQL()

    return {
      sql: sqlObj.sql,
      params: sqlObj.params,
    }
  }
}
```

---

### 5. Add Dry-Run Support

**File:** `src/adapters/utils.ts`

Add mode handling in the dry-run dispatcher:

```typescript
export async function handleDryRun(
  query: SemanticQuery,
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
  // Check for funnel
  if (query.funnel && query.funnel.steps?.length >= 2) {
    return handleFunnelDryRun(query, securityContext, semanticLayer)
  }

  // Check for flow
  if (query.flow && query.flow.bindingKey && query.flow.eventDimension) {
    return handleFlowDryRun(query, securityContext, semanticLayer)
  }

  // Check for {mode}
  if (query.{mode} && query.{mode}.bindingKey /* && other required fields */) {
    return handle{Mode}DryRun(query, securityContext, semanticLayer)
  }

  // Fall through to standard
  return handleStandardDryRun(...)
}

/**
 * Handle {mode} dry-run
 */
async function handle{Mode}DryRun(
  query: SemanticQuery,
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
): Promise<DryRunResponse> {
  const sqlResult = await semanticLayer.dryRun{Mode}(query, securityContext)

  return {
    queryType: '{mode}Query',
    sql: [sqlResult.sql],
    {mode}: {
      // Mode-specific metadata for display
    },
    cubesUsed: [/* extracted cube names */],
  }
}
```

---

### 6. Update Database Adapters (if needed)

**File:** `src/server/adapters/base-adapter.ts`

Add capability methods if the mode requires database-specific features:

```typescript
export abstract class BaseAdapter {
  // ... existing methods

  /**
   * Check if database supports {feature} needed for {mode}
   */
  supports{Feature}(): boolean {
    return false  // Override in specific adapters
  }
}
```

**File:** `src/server/adapters/postgres-adapter.ts` (and others)

```typescript
export class PostgresAdapter extends BaseAdapter {
  supports{Feature}(): boolean {
    return true  // or false based on capability
  }
}
```

---

### 7. Add Cache Key Normalization

**File:** `src/server/cache-utils.ts`

Add normalization for consistent cache keys:

```typescript
/**
 * Normalize {mode} config for cache key generation
 */
export function normalize{Mode}Config(config: {Mode}QueryConfig): string {
  const normalized = {
    bindingKey: config.bindingKey,
    // ... all config fields that affect query results
    // Sort arrays, normalize strings, etc.
  }
  return JSON.stringify(normalized)
}
```

---

### 8. Create Backend Tests

**File:** `tests/{mode}-query.test.ts`

Create comprehensive tests:

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { {Mode}QueryBuilder } from '../src/server/{mode}-query-builder'

describe('{Mode}QueryBuilder', () => {
  describe('has{Mode}', () => {
    it('returns true when {mode} config is present and valid', () => {
      // ...
    })

    it('returns false when {mode} config is missing', () => {
      // ...
    })
  })

  describe('validateConfig', () => {
    it('validates required fields', () => {
      // ...
    })

    it('returns errors for invalid configuration', () => {
      // ...
    })

    it('returns warnings for performance concerns', () => {
      // ...
    })
  })

  describe('build{Mode}Query', () => {
    it('builds correct SQL for basic configuration', () => {
      // ...
    })

    it('applies security context filters', () => {
      // ...
    })

    // Database-specific tests
    it('handles PostgreSQL correctly', () => {
      // ...
    })

    it('handles MySQL correctly', () => {
      // ...
    })

    it('returns error for unsupported databases', () => {
      // ...
    })
  })

  describe('transformResult', () => {
    it('transforms raw results to typed format', () => {
      // ...
    })
  })
})
```

---

## Frontend Checklist

### 1. Create Client Type Definitions

**File:** `src/client/types/{mode}.ts`

Define UI state and server query types:

```typescript
/**
 * Client-side {Mode} Analysis Types
 */

import type { Filter } from '../types'

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Starting step / anchor configuration
 */
export interface {Mode}StartingStep {
  name: string
  filters: Filter[]
}

/**
 * UI state for {mode} slice
 */
export interface {Mode}SliceState {
  {mode}Cube: string | null
  {mode}BindingKey: /* binding key type */ | null
  // ... other state fields
}

// ============================================================================
// Server Query Types
// ============================================================================

/**
 * Server {mode} query format (executable as-is)
 */
export interface Server{Mode}Query {
  {mode}: {
    bindingKey: string | { cube: string; dimension: string }[]
    // ... all server config fields
  }
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * {Mode} result data for visualization
 */
export interface {Mode}ResultData {
  // Mode-specific result structure for charts
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if query is a server {mode} query
 */
export function isServer{Mode}Query(query: unknown): query is Server{Mode}Query {
  return (
    typeof query === 'object' &&
    query !== null &&
    '{mode}' in query &&
    typeof (query as any).{mode} === 'object'
  )
}

/**
 * Check if data is {mode} result data
 */
export function is{Mode}Data(data: unknown): data is {Mode}ResultData {
  // Type guard logic
}

// ============================================================================
// Constants
// ============================================================================

export const {MODE}_MIN_VALUE = 0
export const {MODE}_MAX_VALUE = 10
```

---

### 2. Add to AnalysisConfig

**File:** `src/client/types/analysisConfig.ts`

Update the analysis config union:

```typescript
import type { Server{Mode}Query } from './{mode}'

// Add to AnalysisType
export type AnalysisType = 'query' | 'funnel' | 'flow' | '{mode}'

// Create mode-specific config interface
export interface {Mode}AnalysisConfig extends AnalysisConfigBase {
  analysisType: '{mode}'
  query: Server{Mode}Query
}

// Update union type
export type AnalysisConfig =
  | QueryAnalysisConfig
  | FunnelAnalysisConfig
  | FlowAnalysisConfig
  | {Mode}AnalysisConfig

// Add type guard
export function is{Mode}AnalysisConfig(config: AnalysisConfig): config is {Mode}AnalysisConfig {
  return config.analysisType === '{mode}'
}

// Add default config factory
export function createDefault{Mode}Config(): {Mode}AnalysisConfig {
  return {
    version: 1,
    analysisType: '{mode}',
    activeView: 'chart',
    query: {
      {mode}: {
        bindingKey: '',
        // ... default values
      },
    },
    charts: {
      {mode}: {
        chartType: '{defaultChartType}',
        chartConfig: {},
        displayConfig: {},
      },
    },
  }
}
```

---

### 3. Create State Slice

**File:** `src/client/stores/slices/{mode}Slice.ts`

Create the Zustand slice:

```typescript
import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type { Filter } from '../../types'
import type { Server{Mode}Query } from '../../types/{mode}'

// ============================================================================
// Types
// ============================================================================

export interface {Mode}SliceState {
  /** Selected cube for {mode} */
  {mode}Cube: string | null
  /** Binding key for entity linking */
  {mode}BindingKey: /* type */ | null
  // ... other state fields
}

export interface {Mode}SliceActions {
  /** Set the {mode} cube (clears dependent fields) */
  set{Mode}Cube: (cube: string | null) => void
  /** Set the binding key */
  set{Mode}BindingKey: (key: /* type */ | null) => void
  // ... other actions

  /** Check if in {mode} mode */
  is{Mode}Mode: () => boolean
  /** Check if {mode} is ready for execution */
  is{Mode}ModeEnabled: () => boolean
  /** Build server query from state */
  build{Mode}Query: () => Server{Mode}Query | null
}

export type {Mode}Slice = {Mode}SliceState & {Mode}SliceActions

// ============================================================================
// Initial State
// ============================================================================

export const createInitial{Mode}State = (): {Mode}SliceState => ({
  {mode}Cube: null,
  {mode}BindingKey: null,
  // ... defaults
})

// ============================================================================
// Slice Creator
// ============================================================================

export const create{Mode}Slice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  {Mode}Slice
> = (set, get) => ({
  ...createInitial{Mode}State(),

  set{Mode}Cube: (cube) => {
    set({
      {mode}Cube: cube,
      // Clear dependent fields when cube changes
      {mode}BindingKey: null,
    })
  },

  set{Mode}BindingKey: (key) => {
    set({ {mode}BindingKey: key })
  },

  // ... other actions

  is{Mode}Mode: () => get().analysisType === '{mode}',

  is{Mode}ModeEnabled: () => {
    const state = get()
    return (
      state.analysisType === '{mode}' &&
      !!state.{mode}BindingKey &&
      // ... other required field checks
    )
  },

  build{Mode}Query: () => {
    const state = get()
    if (!state.is{Mode}ModeEnabled()) return null

    return {
      {mode}: {
        bindingKey: /* convert from state */,
        // ... other fields
      },
    }
  },
})
```

---

### 4. Create Mode Adapter

**File:** `src/client/adapters/{mode}ModeAdapter.ts`

Implement the adapter interface:

```typescript
import type { ModeAdapter, ValidationResult } from './modeAdapter'
import type {
  AnalysisConfig,
  {Mode}AnalysisConfig,
  ChartConfig,
} from '../types/analysisConfig'
import type { {Mode}SliceState, Server{Mode}Query } from '../types/{mode}'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert {Mode}SliceState to Server{Mode}Query
 */
function stateToServerQuery(state: {Mode}SliceState): Server{Mode}Query {
  return {
    {mode}: {
      bindingKey: /* convert */,
      // ... convert state to server format
    },
  }
}

/**
 * Convert Server{Mode}Query to {Mode}SliceState
 */
function serverQueryToState(query: Server{Mode}Query): {Mode}SliceState {
  const { {mode} } = query
  return {
    {mode}Cube: /* extract cube */,
    {mode}BindingKey: /* convert */,
    // ... convert server format to state
  }
}

/**
 * Get validation errors for {mode} state
 */
function getValidationErrors(state: {Mode}SliceState): string[] {
  const errors: string[] = []

  if (!state.{mode}BindingKey) {
    errors.push('Binding key is required')
  }

  // ... other validations

  return errors
}

// ============================================================================
// Adapter Implementation
// ============================================================================

export const {mode}ModeAdapter: ModeAdapter<{Mode}SliceState> = {
  type: '{mode}',

  createInitial: () => ({
    {mode}Cube: null,
    {mode}BindingKey: null,
    // ... initial state
  }),

  load: (config: AnalysisConfig): {Mode}SliceState => {
    if (config.analysisType !== '{mode}') {
      return {mode}ModeAdapter.createInitial()
    }
    return serverQueryToState(config.query)
  },

  save: (
    state: {Mode}SliceState,
    charts: Record<string, ChartConfig>,
    activeView: 'table' | 'chart'
  ): {Mode}AnalysisConfig => {
    return {
      version: 1,
      analysisType: '{mode}',
      activeView,
      query: stateToServerQuery(state),
      charts,
    }
  },

  validate: (state: {Mode}SliceState): ValidationResult => {
    const errors = getValidationErrors(state)
    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  clear: (state: {Mode}SliceState): {Mode}SliceState => ({
    ...{mode}ModeAdapter.createInitial(),
    {mode}Cube: state.{mode}Cube,  // Preserve cube selection
  }),

  getDefaultChartConfig: (): ChartConfig => ({
    chartType: '{defaultChartType}',
    chartConfig: {},
    displayConfig: {},
  }),
}
```

---

### 5. Register Adapter

**File:** `src/client/adapters/adapterRegistry.ts`

Register the new adapter:

```typescript
import { {mode}ModeAdapter } from './{mode}ModeAdapter'

// Add to lazy initialization
const adapters: Map<AnalysisType, ModeAdapter<any>> = new Map()

export function getAdapter(type: AnalysisType): ModeAdapter<any> {
  if (!adapters.has(type)) {
    switch (type) {
      case 'query':
        adapters.set(type, queryModeAdapter)
        break
      case 'funnel':
        adapters.set(type, funnelModeAdapter)
        break
      case 'flow':
        adapters.set(type, flowModeAdapter)
        break
      case '{mode}':
        adapters.set(type, {mode}ModeAdapter)
        break
    }
  }
  return adapters.get(type)!
}
```

---

### 6. Create Query Hook

**File:** `src/client/hooks/queries/use{Mode}Query.ts`

Create the query execution hook:

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDrizzleCube } from '../../context/DrizzleCubeContext'
import type { Server{Mode}Query, {Mode}ResultData } from '../../types/{mode}'

export interface Use{Mode}QueryOptions {
  query: Server{Mode}Query | null
  enabled?: boolean
}

export interface Use{Mode}QueryResult {
  data: {Mode}ResultData | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Create query key for {mode} queries
 */
export function create{Mode}QueryKey(query: Server{Mode}Query | null): string[] {
  if (!query) return ['{mode}', 'empty']
  return ['{mode}', JSON.stringify(query)]
}

/**
 * Validate {mode} query before execution
 */
export function isValid{Mode}Query(query: Server{Mode}Query | null): boolean {
  if (!query?.{mode}) return false
  const { {mode} } = query
  return (
    !!{mode}.bindingKey &&
    // ... other required field checks
  )
}

/**
 * Hook for executing {mode} queries
 */
export function use{Mode}Query({
  query,
  enabled = true,
}: Use{Mode}QueryOptions): Use{Mode}QueryResult {
  const { apiClient } = useDrizzleCube()
  const queryClient = useQueryClient()

  const isValid = isValid{Mode}Query(query)
  const queryKey = create{Mode}QueryKey(query)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!query || !isValid) {
        throw new Error('Invalid {mode} query')
      }
      return apiClient.load(query)
    },
    enabled: enabled && isValid,
    staleTime: 60000,  // 1 minute
    gcTime: 300000,    // 5 minutes
  })

  return {
    data: data as {Mode}ResultData | null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}
```

---

### 7. Create UI Components

**File:** `src/client/components/AnalysisBuilder/{Mode}ModeContent.tsx`

Create the mode configuration UI:

```typescript
import { memo } from 'react'
import { useAnalysisBuilder } from '../../hooks/useAnalysisBuilder'
import { {Mode}ConfigPanel } from './{Mode}ConfigPanel'

export const {Mode}ModeContent = memo(function {Mode}ModeContent() {
  const {
    {mode}Cube,
    {mode}BindingKey,
    // ... other state
    set{Mode}Cube,
    set{Mode}BindingKey,
    // ... other actions
  } = useAnalysisBuilder()

  return (
    <div className="space-y-4">
      <{Mode}ConfigPanel
        cube={{mode}Cube}
        bindingKey={{mode}BindingKey}
        onCubeChange={set{Mode}Cube}
        onBindingKeyChange={set{Mode}BindingKey}
        // ... other props
      />
    </div>
  )
})
```

**File:** `src/client/components/AnalysisBuilder/{Mode}ConfigPanel.tsx`

Create detailed configuration panels as needed.

---

### 8. Add to AnalysisTypeSelector

**File:** `src/client/components/AnalysisBuilder/AnalysisTypeSelector.tsx`

Add the new mode option:

```typescript
const analysisTypes: { value: AnalysisType; label: string; icon: ReactNode }[] = [
  { value: 'query', label: 'Query', icon: <QueryIcon /> },
  { value: 'funnel', label: 'Funnel', icon: <FunnelIcon /> },
  { value: 'flow', label: 'Flow', icon: <FlowIcon /> },
  { value: '{mode}', label: '{Mode}', icon: <{Mode}Icon /> },  // Add
]
```

---

### 9. Integrate with AnalysisBuilder

**File:** `src/client/components/AnalysisBuilder/index.tsx`

Add the mode content component:

```typescript
import { {Mode}ModeContent } from './{Mode}ModeContent'

// In the render logic:
{analysisType === '{mode}' && <{Mode}ModeContent />}
```

---

### 10. Create Chart Components (if needed)

If the mode requires new visualizations, follow the [Adding New Chart Types](./adding-new-chart-types.md) checklist.

---

### 11. Add Exports

**File:** `src/client/index.ts`

Export public API:

```typescript
// Query hook
export { use{Mode}Query, create{Mode}QueryKey } from './hooks/queries/use{Mode}Query'

// Types
export type {
  Server{Mode}Query,
  {Mode}SliceState,
  {Mode}ResultData,
  // ... other types
} from './types/{mode}'

// Type guards
export { isServer{Mode}Query, is{Mode}Data } from './types/{mode}'
```

---

### 12. Update Config Migration

**File:** `src/client/utils/configMigration.ts`

Handle legacy portlet migration:

```typescript
import { isServer{Mode}Query } from '../types/{mode}'

export function ensureAnalysisConfig(portlet: PortletConfig): AnalysisConfig {
  // If already has analysisConfig, return it
  if (portlet.analysisConfig) {
    return portlet.analysisConfig
  }

  // Detect mode from legacy fields
  const parsed = parseQueryString(portlet.query)

  if (isServer{Mode}Query(parsed)) {
    return {
      version: 1,
      analysisType: '{mode}',
      activeView: portlet.chartType ? 'chart' : 'table',
      query: parsed,
      charts: {
        {mode}: {
          chartType: portlet.chartType || '{defaultChartType}',
          chartConfig: portlet.chartConfig || {},
          displayConfig: portlet.displayConfig || {},
        },
      },
    }
  }

  // ... other mode checks, fall through to query mode
}
```

---

## Integration Checklist

### AI Prompts / Skills

Update the following AI skills to include the new mode:

**Files to update:**
- `~/.claude/skills/drizzle-cube/dc-query-building/SKILL.md` - Add mode query building
- `~/.claude/skills/drizzle-cube/dc-analysis-config/SKILL.md` - Add mode configuration
- `~/.claude/skills/drizzle-cube/dc-dashboard-config/SKILL.md` - Add mode portlet examples

**Content to add:**
- Mode description and use cases
- Query format with examples
- Configuration options
- Example portlet configurations

---

### Documentation

- [ ] Create implementation plan doc if the mode is complex
- [ ] Update README with mode description
- [ ] Add usage examples

---

## Testing Strategy

### Backend Tests
- **Unit tests**: Query builder validation, SQL generation, result transformation
- **Integration tests**: Full execution with test database
- **Database-specific tests**: PostgreSQL, MySQL, SQLite (or error handling)

### Frontend Tests
- **Slice tests**: State management and actions
- **Adapter tests**: State ↔ config conversion
- **Hook tests**: Query execution and caching
- **Component tests**: UI rendering and interactions

### E2E Tests
- Full flow from UI configuration to chart rendering
- Test in try-site with real data

---

## Quick Reference: Files to Modify/Create

### Backend

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/server/types/{mode}.ts` | Type definitions |
| Edit | `src/server/types/query.ts` | Add mode to SemanticQuery |
| Create | `src/server/{mode}-query-builder.ts` | Query builder |
| Edit | `src/server/executor.ts` | Mode detection + execution |
| Edit | `src/adapters/utils.ts` | Dry-run handling |
| Edit | `src/server/adapters/*.ts` | Database capabilities (if needed) |
| Edit | `src/server/cache-utils.ts` | Cache key normalization |
| Create | `tests/{mode}-query.test.ts` | Backend tests |

### Frontend

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/client/types/{mode}.ts` | Client type definitions |
| Edit | `src/client/types/analysisConfig.ts` | AnalysisConfig union |
| Create | `src/client/stores/slices/{mode}Slice.ts` | State management |
| Create | `src/client/adapters/{mode}ModeAdapter.ts` | Mode adapter |
| Edit | `src/client/adapters/adapterRegistry.ts` | Register adapter |
| Create | `src/client/hooks/queries/use{Mode}Query.ts` | Query hook |
| Create | `src/client/components/AnalysisBuilder/{Mode}ModeContent.tsx` | Mode UI |
| Edit | `src/client/components/AnalysisBuilder/AnalysisTypeSelector.tsx` | Add mode option |
| Edit | `src/client/components/AnalysisBuilder/index.tsx` | Integrate mode |
| Edit | `src/client/index.ts` | Public exports |
| Edit | `src/client/utils/configMigration.ts` | Legacy migration |

### Integration

| Action | File | Purpose |
|--------|------|---------|
| Edit | AI Skills | Documentation for AI assistance |

---

## Example: Flow Mode Reference

For a complete implementation example, see the flow mode:

**Backend:**
- `src/server/types/flow.ts` - Type definitions
- `src/server/flow-query-builder.ts` - Query builder (~1,100 lines)
- `tests/flow-query.test.ts` - Comprehensive tests

**Frontend:**
- `src/client/types/flow.ts` - Client types
- `src/client/stores/slices/flowSlice.ts` - State slice
- `src/client/adapters/flowModeAdapter.ts` - Mode adapter
- `src/client/hooks/queries/useFlowQuery.ts` - Query hook
- `src/client/components/AnalysisBuilder/FlowModeContent.tsx` - UI component
- `src/client/components/charts/SankeyChart.tsx` - Visualization
