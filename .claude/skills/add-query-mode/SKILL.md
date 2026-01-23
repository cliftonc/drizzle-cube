---
name: add-query-mode
description: Use when adding a new analysis or query mode to drizzle-cube (e.g., retention, cohort, path analysis). Covers all backend, frontend, testing, and documentation requirements for new modes.
---

# Adding a Query Mode to Drizzle-Cube

## Overview

Drizzle-cube supports multiple analysis modes: `query`, `funnel`, and `flow`. Each mode requires coordinated changes across backend (types, query builder, executor, compiler), frontend (adapter, store slice, hooks, UI components), tests, and documentation.

This skill provides a comprehensive checklist ensuring nothing is missed when adding a new mode.

## When to Use

- Adding a new analysis type (retention, cohort, path analysis, etc.)
- Extending drizzle-cube with a new query capability
- Following the existing funnel/flow mode patterns

## Checklist

### Phase 1: Backend Implementation

- [ ] **1.1 Create Type Definitions** (`src/server/types/{mode}.ts`)
  - Define `{Mode}QueryConfig` interface (query configuration)
  - Define `{Mode}ResultRow` interface (result format)
  - Define `{Mode}ValidationResult` interface
  - Export from `src/server/types/index.ts`
  - Add optional `{mode}?: {Mode}QueryConfig` to `SemanticQuery` in `types/query.ts`

- [ ] **1.2 Create Query Builder** (`src/server/{mode}-query-builder.ts`)
  - `has{Mode}(query: SemanticQuery): boolean` - Detection method
  - `validateConfig(config, cubes): { isValid, errors[] }` - Validation
  - `build{Mode}Query(config, cubes, context): QueryBuilder` - SQL generation
  - `transformResult(rawResult): {Mode}ResultRow[]` - Post-processing

- [ ] **1.3 Integrate with Executor** (`src/server/executor.ts`)
  - Add `{mode}QueryBuilder` field to class (line ~54)
  - Initialize in constructor (line ~70)
  - Add detection logic in `execute()` method (line ~86-108)
  - Add routing to `execute{Mode}QueryWithCache()` (line ~171-177)
  - Implement `execute{Mode}QueryWithCache()` method
  - Implement `execute{Mode}Query()` method
  - Implement `dryRun{Mode}()` method

- [ ] **1.4 Integrate with Compiler** (`src/server/compiler.ts`)
  - Add `dryRun{Mode}()` public method (line ~415-458)
  - Add validation path in `validateQueryAgainstCubes()` (line ~561-595)
  - Add routing in `explainQuery()` if needed (line ~1336-1359)

- [ ] **1.5 Update Cache Utils** (`src/server/cache-utils.ts`)
  - Add `normalize{Mode}Config()` function for cache key normalization
  - Update `normalizeQuery()` to include `{mode}: query.{mode} ? normalize{Mode}Config(query.{mode}) : undefined`

- [ ] **1.6 Database Adapter Updates** (if mode needs DB-specific SQL)
  - Update `src/server/adapters/base-adapter.ts` with abstract methods
  - Implement in `postgres-adapter.ts`, `mysql-adapter.ts`, `sqlite-adapter.ts`, `duckdb-adapter.ts`
  - Check database capabilities (e.g., lateral joins, window functions)

- [ ] **1.7 Update AI Prompts** (if AI should understand this mode)
  - Update `src/server/prompts/types.ts` with mode-specific query types
  - Update `src/server/prompts/step1-shape-prompt.ts` with mode examples
  - Update other prompt files as needed

### Phase 2: Frontend Implementation

- [ ] **2.1 Create Frontend Types** (`src/client/types/{mode}.ts`)
  - Define `{Mode}SliceState` interface (UI state shape)
  - Define `Server{Mode}Query` interface (executable query format)
  - Define `{Mode}ChartData` interface (chart data format)
  - Add type guards (e.g., `is{Mode}Data()`)
  - Export from `src/client/types/index.ts`

- [ ] **2.2 Update AnalysisConfig Types** (`src/client/types/analysisConfig.ts`)
  - Add `'{mode}'` to `AnalysisType` union (line ~46)
  - Create `{Mode}AnalysisConfig` interface extending `AnalysisConfigBase`
  - Add to `AnalysisConfig` union type
  - Update type guards if needed

- [ ] **2.3 Create Mode Adapter** (`src/client/adapters/{mode}ModeAdapter.ts`)
  - Implement `ModeAdapter<{Mode}SliceState>` interface:
    - `type: '{mode}'`
    - `createInitial(): {Mode}SliceState`
    - `extractState(storeState): {Mode}SliceState` (CRITICAL for workspace persistence)
    - `canLoad(config): config is AnalysisConfig`
    - `load(config): {Mode}SliceState`
    - `save(state, charts, activeView): {Mode}AnalysisConfig`
    - `validate(state): ValidationResult`
    - `clear(state): {Mode}SliceState`
    - `getDefaultChartConfig(): ChartConfig`
  - Register in `src/client/adapters/index.ts` `initializeAdapters()`

- [ ] **2.4 Create Store Slice** (`src/client/stores/slices/{mode}Slice.ts`)
  - Define `{Mode}SliceState` interface
  - Define `{Mode}SliceActions` interface
  - Create `createInitial{Mode}State()` function
  - Create `create{Mode}Slice: StateCreator<...>` function
  - Include `build{Mode}Query()` action that returns `Server{Mode}Query | null`
  - Include `is{Mode}ModeEnabled()` helper
  - Export from `src/client/stores/slices/index.ts`

- [ ] **2.5 Update Main Store** (`src/client/stores/analysisBuilderStore.tsx`)
  - Import and compose the new slice
  - Add slice state and actions to `AnalysisBuilderStore` type
  - Initialize slice in `createAnalysisBuilderStore()`

- [ ] **2.6 Create Query Hooks** (`src/client/hooks/queries/`)
  - Create `use{Mode}Query.ts` - Main data fetching hook
    - Handles debouncing, caching, transformResult
    - Returns `{ data, isLoading, isFetching, error, refetch }`
  - Create `use{Mode}DryRunQuery.ts` - SQL preview hook
  - Export from `src/client/hooks/queries/index.ts`

- [ ] **2.7 Update useAnalysisQueryExecution** (`src/client/hooks/useAnalysisQueryExecution.ts`)
  - Add `server{Mode}Query?: Server{Mode}Query | null` to options interface
  - Add mode routing in execution logic
  - Add `{mode}ServerQuery` and `{mode}DebugData` to result interface

- [ ] **2.8 Create UI Components**
  - `src/client/components/AnalysisBuilder/{Mode}ModeContent.tsx` - Main mode panel
  - `src/client/components/AnalysisBuilder/{Mode}ConfigPanel.tsx` - Configuration UI
  - Additional components as needed (step lists, filters, etc.)

- [ ] **2.9 Update AnalysisTypeSelector** (`src/client/components/AnalysisBuilder/AnalysisTypeSelector.tsx`)
  - Add new type option with label and icon

- [ ] **2.10 Update AnalysisQueryPanel** (`src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx`)
  - Add `is{Mode}Mode` detection
  - Add props for mode-specific state/actions
  - Add conditional rendering for `<{Mode}ModeContent />`

- [ ] **2.11 Update useAnalysisBuilder Hook** (`src/client/hooks/useAnalysisBuilderHook.ts`)
  - Add mode-specific state to hook result
  - Add mode-specific actions to hook

- [ ] **2.12 Update Portlet Integration**
  - Update `src/client/components/AnalyticsPortlet.tsx` to detect and handle mode queries
  - Update `src/client/components/PortletContainer.tsx` if needed

- [ ] **2.13 Add Custom Icon** (`src/client/icons/customIcons.ts`)
  - Create `{mode}Icon: IconifyIcon` with appropriate SVG
  - Export from icons module

- [ ] **2.14 Chart Type Integration**
  - Add mode-specific chart type(s) if needed (e.g., sankey, heatmap)
  - Create chart component if new type needed (`src/client/components/charts/{Mode}Chart.tsx`)
  - Update `ChartTypeSelector` `excludeTypes` for mode filtering
  - Update `getChartAvailability()` in `src/client/shared/chartDefaults.ts`

### Phase 3: Testing

- [ ] **3.1 Backend Tests** (`tests/{mode}-query.test.ts`)
  - QueryBuilder unit tests (`has{Mode}`, `validateConfig`, `transformResult`)
  - Query execution integration tests
  - Security context isolation tests
  - Cross-cube filtering tests (if applicable)
  - Database adapter method tests
  - Error handling tests
  - Multi-database compatibility (use `TEST_DB_TYPE` env)

- [ ] **3.2 Client Adapter Tests** (`tests/client/adapters/{mode}ModeAdapter.test.ts`)
  - `createInitial()` - Returns valid initial state
  - `canLoad()` - Type guard correctness
  - `load()` - Config to state conversion
  - `save()` - State to config conversion
  - `validate()` - Returns proper errors/warnings
  - `clear()` - Returns initial state
  - `getDefaultChartConfig()` - Returns valid chart config
  - Round-trip test: `save(state) → config → load(config) → state`

- [ ] **3.3 Client Validation Tests** (`tests/client/{mode}/{mode}Validation.test.ts`)
  - Individual validation function tests
  - Composite validation tests
  - Error type and message verification

- [ ] **3.4 Client Execution Tests** (`tests/client/{mode}/{mode}Execution.test.ts`)
  - Utility function tests
  - Data transformation tests
  - Metric calculation tests
  - Type guard tests

### Phase 4: Documentation

- [ ] **4.1 Create Mode Documentation** (`~/work/drizzle-cube-help/src/content/docs/client/{mode}-analysis.md`)
  - Overview (how mode differs from others)
  - Key concepts
  - Cube setup requirements
  - UI usage in Analysis Builder
  - Query format (server request/response)
  - `{Mode}AnalysisConfig` type definition
  - Server-side execution explanation
  - Metrics explanation
  - Programmatic API usage (`use{Mode}Query` hook)
  - Chart visualization
  - Troubleshooting

- [ ] **4.2 Update AnalysisConfig Reference** (`~/work/drizzle-cube-help/src/content/docs/api-reference/analysis-config.md`)
  - Add `{Mode}AnalysisConfig` interface
  - Update union type definition
  - Add example config

- [ ] **4.3 Update Analysis Builder Docs** (`~/work/drizzle-cube-help/src/content/docs/client/analysis-builder.md`)
  - Add mode to "Analysis Types" section
  - Document mode-specific UI
  - Link to new mode documentation

- [ ] **4.4 Update Sidebar** (`~/work/drizzle-cube-help/astro.config.mjs`)
  - Add sidebar item under "Client Components":
    ```javascript
    { label: "{Mode} Analysis", slug: "client/{mode}-analysis" }
    ```

## File Reference

### Backend Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/server/types/{mode}.ts` | CREATE | Type definitions |
| `src/server/types/index.ts` | MODIFY | Export new types |
| `src/server/types/query.ts` | MODIFY | Add to SemanticQuery |
| `src/server/{mode}-query-builder.ts` | CREATE | SQL generation |
| `src/server/executor.ts` | MODIFY | Execution routing |
| `src/server/compiler.ts` | MODIFY | Public API methods |
| `src/server/cache-utils.ts` | MODIFY | Add normalize{Mode}Config() |
| `src/server/adapters/*.ts` | MODIFY | If DB-specific SQL needed |
| `src/server/prompts/*.ts` | MODIFY | If AI awareness needed |

### Frontend Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/client/types/{mode}.ts` | CREATE | UI state types, Server{Mode}Query |
| `src/client/types/index.ts` | MODIFY | Export new types |
| `src/client/types/analysisConfig.ts` | MODIFY | AnalysisType union, {Mode}AnalysisConfig |
| `src/client/adapters/{mode}ModeAdapter.ts` | CREATE | Mode adapter |
| `src/client/adapters/index.ts` | MODIFY | Register adapter |
| `src/client/stores/slices/{mode}Slice.ts` | CREATE | Mode-specific slice |
| `src/client/stores/slices/index.ts` | MODIFY | Export slice |
| `src/client/stores/analysisBuilderStore.tsx` | MODIFY | Compose slice |
| `src/client/hooks/queries/use{Mode}Query.ts` | CREATE | Data fetching hook |
| `src/client/hooks/queries/use{Mode}DryRunQuery.ts` | CREATE | SQL preview hook |
| `src/client/hooks/queries/index.ts` | MODIFY | Export hooks |
| `src/client/hooks/useAnalysisQueryExecution.ts` | MODIFY | Add mode routing |
| `src/client/hooks/useAnalysisBuilderHook.ts` | MODIFY | Add state/actions |
| `src/client/components/AnalysisBuilder/{Mode}ModeContent.tsx` | CREATE | Mode UI |
| `src/client/components/AnalysisBuilder/{Mode}ConfigPanel.tsx` | CREATE | Config UI |
| `src/client/components/AnalysisBuilder/AnalysisTypeSelector.tsx` | MODIFY | Add option |
| `src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx` | MODIFY | Conditional render |
| `src/client/components/AnalyticsPortlet.tsx` | MODIFY | Portlet mode detection |
| `src/client/components/PortletContainer.tsx` | MODIFY | If needed |
| `src/client/icons/customIcons.ts` | MODIFY | Add mode icon |
| `src/client/components/charts/{Mode}Chart.tsx` | CREATE | If new chart type needed |
| `src/client/shared/chartDefaults.ts` | MODIFY | Chart availability |

### Test Files to Create

| File | Purpose |
|------|---------|
| `tests/{mode}-query.test.ts` | Backend execution tests (~1000 lines) |
| `tests/client/adapters/{mode}ModeAdapter.test.ts` | Adapter tests |
| `tests/client/{mode}/{mode}Validation.test.ts` | Validation tests |
| `tests/client/{mode}/{mode}Execution.test.ts` | Execution utility tests |

### Documentation Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `~/work/drizzle-cube-help/src/content/docs/client/{mode}-analysis.md` | CREATE | Mode docs (~15-20KB) |
| `~/work/drizzle-cube-help/src/content/docs/api-reference/analysis-config.md` | MODIFY | Config reference |
| `~/work/drizzle-cube-help/src/content/docs/client/analysis-builder.md` | MODIFY | Link to mode |
| `~/work/drizzle-cube-help/astro.config.mjs` | MODIFY | Sidebar entry |

## Implementation Patterns

### Backend Query Builder Pattern

```typescript
// src/server/{mode}-query-builder.ts
import type { SemanticQuery, SecurityContext, Cube } from './types'
import type { {Mode}QueryConfig, {Mode}ResultRow } from './types/{mode}'

export class {Mode}QueryBuilder {
  constructor(
    private filterBuilder: FilterBuilder,
    private dateTimeBuilder: DateTimeBuilder
  ) {}

  has{Mode}(query: SemanticQuery): boolean {
    return !!query.{mode} && query.{mode}.{requiredField} != null
  }

  validateConfig(
    config: {Mode}QueryConfig,
    cubes: Map<string, Cube>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    // Validation logic
    return { isValid: errors.length === 0, errors }
  }

  build{Mode}Query(
    config: {Mode}QueryConfig,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): QueryBuilder {
    // SQL generation using Drizzle
    // Return query builder
  }

  transformResult(rawResult: unknown[]): {Mode}ResultRow[] {
    // Post-process raw DB results
  }
}
```

### Frontend Mode Adapter Pattern

```typescript
// src/client/adapters/{mode}ModeAdapter.ts
import type { ModeAdapter, ValidationResult } from './modeAdapter'
import type { AnalysisConfig, AnalysisType, ChartConfig } from '../types/analysisConfig'
import type { {Mode}SliceState } from '../types/{mode}'

export const {mode}ModeAdapter: ModeAdapter<{Mode}SliceState> = {
  type: '{mode}',

  createInitial(): {Mode}SliceState {
    return {
      // Initial state values
    }
  },

  extractState(storeState: Record<string, unknown>): {Mode}SliceState {
    return {
      // Extract mode-specific fields from store state
      // CRITICAL: Required for saveWorkspace/loadWorkspace
    }
  },

  canLoad(config: unknown): config is AnalysisConfig {
    if (!config || typeof config !== 'object') return false
    const c = config as Record<string, unknown>
    return c.version === 1 && c.analysisType === '{mode}'
  },

  load(config: AnalysisConfig): {Mode}SliceState {
    if (config.analysisType !== '{mode}') {
      throw new Error(`Cannot load ${config.analysisType} with {mode} adapter`)
    }
    // Convert server query format to UI state
  },

  save(
    state: {Mode}SliceState,
    charts: Partial<Record<AnalysisType, ChartConfig>>,
    activeView: 'table' | 'chart'
  ): AnalysisConfig {
    return {
      version: 1,
      analysisType: '{mode}',
      activeView,
      charts: { {mode}: charts.{mode} || this.getDefaultChartConfig() },
      query: stateToServerQuery(state), // Convert UI state to executable query
    }
  },

  validate(state: {Mode}SliceState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    // Validation logic
    return { isValid: errors.length === 0, errors, warnings }
  },

  clear(state: {Mode}SliceState): {Mode}SliceState {
    return this.createInitial()
  },

  getDefaultChartConfig(): ChartConfig {
    return {
      chartType: '{defaultChartType}', // e.g., 'heatmap', 'sankey'
      chartConfig: {},
      displayConfig: { showLegend: true, showGrid: true, showTooltip: true }
    }
  }
}
```

### Store Slice Pattern

```typescript
// src/client/stores/slices/{mode}Slice.ts
import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type { Server{Mode}Query } from '../../types/{mode}'

export interface {Mode}SliceState {
  {mode}Cube: string | null
  // ... mode-specific state
}

export interface {Mode}SliceActions {
  set{Mode}Cube: (cube: string | null) => void
  is{Mode}Mode: () => boolean
  is{Mode}ModeEnabled: () => boolean
  build{Mode}Query: () => Server{Mode}Query | null
}

export type {Mode}Slice = {Mode}SliceState & {Mode}SliceActions

export const createInitial{Mode}State = (): {Mode}SliceState => ({
  {mode}Cube: null,
  // ... initial values
})

export const create{Mode}Slice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  {Mode}Slice
> = (set, get) => ({
  ...createInitial{Mode}State(),

  set{Mode}Cube: (cube) => set({ {mode}Cube: cube }),

  is{Mode}Mode: () => get().analysisType === '{mode}',

  is{Mode}ModeEnabled: () => {
    const state = get()
    if (state.analysisType !== '{mode}') return false
    if (!state.{mode}Cube) return false
    // ... other validation
    return true
  },

  build{Mode}Query: () => {
    const state = get()
    if (!state.is{Mode}ModeEnabled()) return null
    return {
      {mode}: {
        // ... build server query from state
      }
    }
  },
})
```

### Query Hook Pattern

```typescript
// src/client/hooks/queries/use{Mode}Query.ts
import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCubeApi } from '../../providers/CubeApiProvider'
import { useDebounceQuery } from '../useDebounceQuery'
import type { Server{Mode}Query, {Mode}ChartData } from '../../types/{mode}'

export function use{Mode}Query(
  query: Server{Mode}Query | null,
  options: Use{Mode}QueryOptions = {}
): Use{Mode}QueryResult {
  const { skip = false, debounceMs = 300 } = options
  const { cubeApi } = useCubeApi()
  const queryClient = useQueryClient()

  const isValid = isValid{Mode}Query(query)

  const { debouncedValue: debouncedQuery, isDebouncing } = useDebounceQuery(
    query,
    { isValid, skip, debounceMs }
  )

  const queryKey = useMemo(() => {
    if (!debouncedQuery) return ['cube', '{mode}', null] as const
    return ['cube', '{mode}', JSON.stringify(debouncedQuery)] as const
  }, [debouncedQuery])

  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      const resultSet = await cubeApi.load(debouncedQuery as unknown as CubeQuery)
      return { rawData: resultSet.rawData() }
    },
    enabled: isValid && !skip && !!debouncedQuery,
    staleTime: 60000,
  })

  const chartData = useMemo<{Mode}ChartData | null>(() => {
    if (!queryResult.data?.rawData) return null
    return transform{Mode}Result(queryResult.data.rawData)
  }, [queryResult.data])

  return {
    data: chartData,
    rawData: queryResult.data?.rawData ?? null,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isDebouncing,
    error: queryResult.error as Error | null,
    // ...
  }
}
```

### Security Context Pattern (MANDATORY)

```typescript
// Every cube MUST filter by security context
defineCube({
  name: '{Mode}Events',
  sql: (securityContext) => eq(table.organisationId, securityContext.organisationId),
  // ...
})

// Every query MUST pass security context
const result = await executor.execute(query, securityContext)
```

## Reference Implementations

Study these existing implementations for patterns:

### Funnel Mode (Complete Reference)
- **Backend**: `src/server/funnel-query-builder.ts` (962 lines)
- **Backend Types**: `src/server/types/funnel.ts`
- **Frontend Adapter**: `src/client/adapters/funnelModeAdapter.ts`
- **Frontend Types**: `src/client/types/funnel.ts`
- **Store Slice**: `src/client/stores/slices/funnelSlice.ts`
- **Query Hook**: `src/client/hooks/queries/useFunnelQuery.ts`
- **UI Components**: `FunnelModeContent.tsx`, `FunnelConfigPanel.tsx`, `FunnelStepList.tsx`
- **Documentation**: `~/work/drizzle-cube-help/src/content/docs/client/funnel-analysis.md`
- **Backend Tests**: `tests/funnel-query.test.ts` (~1041 lines)
- **Client Tests**: `tests/client/adapters/funnelModeAdapter.test.ts`, `tests/client/funnel/`

### Flow Mode (Reference - Note Some Tests Missing)
- **Backend**: `src/server/flow-query-builder.ts` (1171 lines)
- **Backend Types**: `src/server/types/flow.ts`
- **Frontend Adapter**: `src/client/adapters/flowModeAdapter.ts`
- **Frontend Types**: `src/client/types/flow.ts`
- **Store Slice**: `src/client/stores/slices/flowSlice.ts`
- **Query Hook**: `src/client/hooks/queries/useFlowQuery.ts`
- **UI Components**: `FlowModeContent.tsx`, `FlowConfigPanel.tsx`
- **Backend Tests**: `tests/flow-query.test.ts` (~1049 lines)
- **Warning**: Missing documentation, client adapter tests, client validation/execution tests

### Icons
- **Custom Icons**: `src/client/icons/customIcons.ts` (funnelIcon, flowIcon)

## Validation Commands

After implementation, verify:

```bash
# Type checking
npm run typecheck

# Run all tests
npm test

# Run specific mode tests
npm test {mode}-query.test.ts
npm test {mode}ModeAdapter.test.ts

# Multi-database testing
TEST_DB_TYPE=postgres npm test
TEST_DB_TYPE=mysql npm test
TEST_DB_TYPE=sqlite npm test

# Build verification
npm run build
npm run build:all
```
