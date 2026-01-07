# Client Architecture

This document describes the complete client architecture of drizzle-cube, focusing on patterns, conventions, and guardrails for building analytics dashboards with React components.

## Overview

The drizzle-cube client is a **modular React component library** designed for building analytics dashboards. It provides a lightweight alternative to Cube.js React components while maintaining API compatibility. The architecture prioritizes minimal dependencies, embeddability, and type safety.

## Core Architecture

```
App → CubeProvider → Dashboard/Analysis → Components → Charts
         ↓                  ↓                  ↓
    QueryClient        Zustand Store      TanStack Query
    (TanStack)         (Client State)     (Server State)
```

### Architecture Layers

1. **CubeProvider** - React context providing API client, metadata, and QueryClient
2. **Zustand Stores** - Instance-based stores for UI/client state (per-component)
3. **TanStack Query** - All server state (data fetching, caching, loading states)
4. **Master Hooks** - `useAnalysisBuilder`, `useDashboard` coordinate stores + queries

### Design Principles
- **Minimal Dependencies** - React, Recharts, react-grid-layout, Zustand, TanStack Query
- **Embeddable** - Designed to integrate into existing applications
- **Type-Safe** - Full TypeScript coverage throughout
- **Modular** - Component-based architecture with clear separation of concerns
- **Server State in TanStack Query** - Never store API response data in Zustand

---

## State Management Architecture

### Zustand Stores (Client State Only)

The client uses **instance-based Zustand stores** with React Context providers. Each component instance gets its own store to prevent state sharing between multiple instances.

#### Key Stores

**1. AnalysisBuilderStore** (`src/client/stores/analysisBuilderStore.tsx`)
```typescript
interface AnalysisBuilderStoreState {
  // Query configuration (NOT query results)
  queryStates: AnalysisBuilderState[]  // Metrics, breakdowns, filters
  activeQueryIndex: number
  mergeStrategy: QueryMergeStrategy

  // Chart configuration
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig

  // UI state
  activeTab: QueryPanelTab
  activeView: 'table' | 'chart'
  showFieldModal: boolean

  // AI state
  aiState: AIState
}
```

**2. DashboardStore** (`src/client/stores/dashboardStore.tsx`)
```typescript
interface DashboardStoreState {
  // Edit mode state
  isEditMode: boolean
  hasUnsavedChanges: boolean

  // Modal state
  editingPortletId: string | null
  deletePortletId: string | null

  // Layout state
  dragState: DragState | null
  layoutMode: 'grid' | 'rows'
}
```

#### Store Provider Pattern

Each store uses React Context for instance isolation:

```typescript
// Usage - wrap component with provider
<AnalysisBuilderStoreProvider persist={isStandalone}>
  <AnalysisBuilder />
</AnalysisBuilderStoreProvider>

// Inside component - access store via hook
const metrics = useAnalysisBuilderStore(state => state.queryStates[0].metrics)
const addMetric = useAnalysisBuilderStore(state => state.addMetric)
```

#### Store Selectors

Use exported selectors with `useShallow` for optimal re-renders:

```typescript
import { useShallow } from 'zustand/react/shallow'
import { selectCurrentState, selectMetrics } from '../stores/analysisBuilderStore'

// Use exported selectors
const currentState = useAnalysisBuilderStore(useShallow(selectCurrentState))
const metrics = useAnalysisBuilderStore(selectMetrics)
```

### What Belongs in Zustand (Client State)

- Query configuration (selected metrics, breakdowns, filters)
- Chart type and display configuration
- UI state (active tabs, modal open/closed, edit mode)
- User preferences (palette, view mode)
- Form state during editing

### What Does NOT Belong in Zustand (Server State)

- Query results / fetched data
- Loading states
- Error states
- Cache information
- Stale/fresh indicators

---

## Data Fetching Architecture (TanStack Query)

All server state is managed exclusively by TanStack Query. **Never store API response data in Zustand.**

### Query Hooks

**Primary Hooks** (`src/client/hooks/queries/`):

| Hook | Purpose | Query Key |
|------|---------|-----------|
| `useCubeLoadQuery` | Single cube data loading with debouncing | `['cube', 'load', query]` |
| `useMultiCubeLoadQuery` | Multi-cube parallel execution | `['cube', 'multiLoad', config]` |
| `useCubeMetaQuery` | Cube metadata with caching | `['cube', 'meta']` |
| `useDryRunQuery` | SQL preview/debugging | `['cube', 'dryRun', query]` |

### useCubeLoadQuery Example

```typescript
import { useCubeLoadQuery } from 'drizzle-cube/client'

function MyChart({ query }: { query: CubeQuery }) {
  const {
    resultSet,       // CubeResultSet | null
    rawData,         // unknown[] | null
    isLoading,       // Initial load
    isFetching,      // Refetch in progress
    isDebouncing,    // Waiting for user to stop typing
    error,           // Error | null
    refetch,         // () => void
  } = useCubeLoadQuery(query, {
    skip: !query,           // Skip if no query
    debounceMs: 300,        // Debounce delay
    keepPreviousData: true, // Show stale data while loading
    staleTime: 60000,       // 1 minute cache
  })

  if (isLoading) return <LoadingIndicator />
  if (error) return <ErrorDisplay error={error} />
  if (!rawData) return <EmptyState />

  return <Chart data={rawData} />
}
```

### useMultiCubeLoadQuery Example

```typescript
import { useMultiCubeLoadQuery } from 'drizzle-cube/client'

function MultiChart({ config }: { config: MultiQueryConfig }) {
  const {
    mergedData,      // Combined results from all queries
    queryResults,    // Individual query results
    isLoading,
    errors,          // Per-query errors
    isAnyLoading,
    areAllComplete,
  } = useMultiCubeLoadQuery(config, {
    mergeStrategy: 'concat',  // or 'merge'
  })

  return <Chart data={mergedData} />
}
```

### Query Configuration

Global defaults are set in CubeProvider:

```typescript
// QueryClient defaults (src/client/providers/CubeProvider.tsx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 15 * 60 * 1000,       // 15 minutes garbage collection
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Master Coordination Hooks

Master hooks coordinate between Zustand stores and TanStack Query:

### useAnalysisBuilder

Coordinates AnalysisBuilder state, query building, and data fetching:

```typescript
import { useAnalysisBuilder } from 'drizzle-cube/client'

function AnalysisBuilderComponent() {
  const {
    // Store state (from Zustand)
    metrics,
    breakdowns,
    filters,
    chartType,

    // Actions (from Zustand)
    addMetric,
    removeMetric,
    setChartType,

    // Query state (from TanStack Query)
    isLoading,
    isFetching,
    rawData,
    resultSet,
    error,

    // Computed values
    builtQuery,
    isValidQuery,

  } = useAnalysisBuilder({
    persist: true,  // Enable localStorage persistence
  })
}
```

### useDashboard

Coordinates Dashboard editing and portlet management:

```typescript
import { useDashboard } from 'drizzle-cube/client'

function DashboardComponent({ config }: { config: DashboardConfig }) {
  const {
    // Edit mode
    isEditMode,
    setEditMode,
    hasUnsavedChanges,

    // Actions
    saveConfig,
    addPortlet,
    updatePortlet,
    deletePortlet,

    // Modal state
    openPortletEditor,
    closePortletEditor,

  } = useDashboard({
    config,
    onSave: handleSave,
  })
}
```

---

## Core Components Architecture

### 1. Context Layer (`src/client/providers/CubeProvider.tsx`)

**Purpose**: Centralized API configuration and TanStack Query setup

```typescript
interface CubeContextValue {
  cubeApi: CubeClient           // API client instance
  options?: CubeQueryOptions    // Default query options
  meta: CubeMeta | null         // Cube metadata (from TanStack Query)
  metaLoading: boolean          // Metadata loading state
  metaError: string | null      // Metadata error state
  getFieldLabel: (fieldName: string) => string
  refetchMeta: () => void
  features: FeaturesConfig      // Feature toggles
}
```

**Usage**:
```typescript
<CubeProvider
  apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
  token="your-auth-token"
  features={{ aiAssist: true }}
>
  <App />
</CubeProvider>
```

### 2. Data Layer (`src/client/client/CubeClient.ts`)

**Purpose**: HTTP client for Cube.js-compatible API endpoints

```typescript
interface CubeClient {
  load(query: CubeQuery): Promise<CubeResultSet>
  sql(query: CubeQuery): Promise<{ sql: string }>
  meta(): Promise<CubeMeta>
}

interface CubeResultSet {
  rawData(): any[]
  tablePivot(): any[]
  series(): any[]
  annotation(): any
  loadResponse?: any
}
```

### 3. Dashboard Container (`src/client/components/AnalyticsDashboard.tsx`)

```typescript
interface AnalyticsDashboardProps {
  config: DashboardConfig
  editable?: boolean
  onConfigChange?: (config: DashboardConfig) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  onDirtyStateChange?: (isDirty: boolean) => void
}
```

### 4. Portlet System (`src/client/components/AnalyticsPortlet.tsx`)

Individual dashboard widgets using TanStack Query for data fetching:

```typescript
interface PortletConfig {
  id: string
  title: string
  query: string              // JSON string of CubeQuery
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  w: number                  // Grid dimensions
  h: number
  x: number
  y: number
}
```

---

## Chart System Architecture

### Chart Component Pattern

All charts follow a consistent interface:

```typescript
interface ChartProps {
  data: any[]                    // Raw data array
  chartConfig?: ChartAxisConfig  // Axis mapping configuration
  displayConfig?: ChartDisplayConfig // Visual styling configuration
  queryObject?: CubeQuery        // Original query for metadata
  height?: string | number       // Container height
}
```

### Chart Configuration

```typescript
interface ChartAxisConfig {
  xAxis?: string[]    // Dimension fields for X axis
  yAxis?: string[]    // Measure fields for Y axis
  series?: string[]   // Fields for series/grouping
  sizeField?: string  // Bubble size field
  colorField?: string // Bubble color field
}

interface ChartDisplayConfig {
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  colors?: string[]
  orientation?: 'horizontal' | 'vertical'
  stacked?: boolean
}
```

### Supported Chart Types

- **RechartsBarChart** - Bar and column charts with stacking
- **RechartsLineChart** - Line charts with multiple series
- **RechartsAreaChart** - Area charts with stacking
- **RechartsPieChart** - Pie and doughnut charts
- **RechartsScatterChart** - Scatter plots
- **RechartsRadarChart** - Radar/spider charts
- **BubbleChart** - Bubble charts with size/color dimensions
- **DataTable** - Sortable data tables

---

## Query Builder / AnalysisBuilder

### AnalysisBuilder (`src/client/components/AnalysisBuilder/`)

Modern search-first query builder with visual configuration:

**Components**:
- **FieldSearchModal** - Search-first field picker with cube filtering
- **AnalysisQueryPanel** - Metrics, breakdowns, filters tabs
- **AnalysisChartConfigPanel** - Chart axis and display configuration
- **AnalysisResultsPanel** - Results with chart/table toggle

**Features**:
- Multi-query support with merge strategies
- Visual drag-and-drop for chart configuration
- Recent fields tracking
- Keyboard navigation
- AI-assisted query building (optional)

### Filter System

```typescript
interface SimpleFilter {
  member: string
  operator: FilterOperator
  values: any[]
}

interface GroupFilter {
  type: 'and' | 'or'
  filters: Filter[]
}

type Filter = SimpleFilter | GroupFilter
```

**Supported Operators**:
- **String**: equals, notEquals, contains, notContains, startsWith, endsWith
- **Numeric**: gt, gte, lt, lte
- **Null**: set, notSet
- **Date**: inDateRange, beforeDate, afterDate

---

## Modular Export System

### Entry Points

**Main Export** (`drizzle-cube/client`):
- Complete component suite with styles
- All components, hooks, providers, utilities

**Modular Exports**:
- `drizzle-cube/client/charts` - Chart components only
- `drizzle-cube/client/hooks` - React hooks only
- `drizzle-cube/client/providers` - Context providers only
- `drizzle-cube/client/components` - UI components (no charts)
- `drizzle-cube/client/utils` - Utility functions only

---

## Guard Rails

### 1. Server State vs Client State (CRITICAL)

```typescript
// WRONG - Server state in Zustand
const store = create((set) => ({
  data: null,           // NO - server state
  isLoading: false,     // NO - server state
  error: null,          // NO - server state
  resultsStale: false,  // NO - server state
}))

// CORRECT - Server state in TanStack Query
const { data, isLoading, error, isFetching } = useCubeLoadQuery(query)

// CORRECT - Client state in Zustand
const store = create((set) => ({
  selectedMetrics: [],    // YES - user selection
  chartType: 'bar',       // YES - UI configuration
  isEditMode: false,      // YES - UI state
}))
```

### 2. Architecture Constraints
- **CubeProvider is mandatory** - All components must be wrapped in CubeProvider
- **Type safety required** - All components must have proper TypeScript interfaces
- **Error boundaries required** - All chart components must have error boundaries
- **Use TanStack Query for ALL data fetching** - Never use useEffect for API calls

### 3. Store Usage Rules
- **Use store providers** - Wrap component trees with `*StoreProvider`
- **Use selectors** - Use exported selectors with `useShallow` for performance
- **No server state in stores** - Only UI/configuration state
- **Instance isolation** - Each component instance gets its own store

### 4. Query Hook Rules
- **Always use TanStack Query hooks** - `useCubeLoadQuery`, `useMultiCubeLoadQuery`
- **Handle loading states from query** - Don't duplicate in store
- **Use skip option** - Skip queries when inputs aren't ready
- **Enable keepPreviousData** - Better UX during refetches

### 5. Component Development
- **Props interface required** - All components need typed props interfaces
- **Default values** - Provide sensible defaults for optional props
- **Memoization patterns** - Use useMemo/useCallback for expensive operations
- **Use dc- theme classes** - Never use raw Tailwind colors (see theming.md)

### 6. Performance Optimization
- **Use selectors** - Only subscribe to needed state slices
- **Debounce queries** - Use built-in debouncing in useCubeLoadQuery
- **Lazy load charts** - Use LazyChart for code splitting
- **Memoize expensive computations** - Use useMemo for derived values

---

## Key Files Reference

### State Management
- `src/client/stores/analysisBuilderStore.tsx` - AnalysisBuilder store
- `src/client/stores/dashboardStore.tsx` - Dashboard store
- `src/client/stores/index.ts` - Store exports

### Data Fetching
- `src/client/hooks/queries/useCubeLoadQuery.ts` - Primary data fetching hook
- `src/client/hooks/queries/useMultiCubeLoadQuery.ts` - Multi-query support
- `src/client/hooks/queries/useCubeMetaQuery.ts` - Metadata fetching

### Master Hooks
- `src/client/hooks/useAnalysisBuilderHook.ts` - AnalysisBuilder coordinator
- `src/client/hooks/useDashboardHook.ts` - Dashboard coordinator

### Core Components
- `src/client/providers/CubeProvider.tsx` - Main context provider
- `src/client/components/AnalyticsDashboard.tsx` - Dashboard container
- `src/client/components/AnalyticsPortlet.tsx` - Portlet widgets
- `src/client/components/AnalysisBuilder/index.tsx` - Query builder

### Chart System
- `src/client/components/charts/` - Chart components
- `src/client/charts/chartConfigs.ts` - Chart configuration system
- `src/client/charts/ChartLoader.ts` - Lazy loading

---

## Integration Example

```typescript
import {
  CubeProvider,
  AnalyticsDashboard,
  useCubeLoadQuery
} from 'drizzle-cube/client'
import 'drizzle-cube/client/styles.css'

function App() {
  return (
    <CubeProvider
      apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
      token={authToken}
    >
      <Dashboard />
    </CubeProvider>
  )
}

function Dashboard() {
  // TanStack Query handles all data fetching
  const { data, isLoading, error } = useCubeLoadQuery(query)

  return (
    <AnalyticsDashboard
      config={dashboardConfig}
      editable={true}
      onSave={handleSave}
    />
  )
}
```
