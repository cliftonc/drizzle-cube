# Client Architecture

This document describes the complete client architecture of drizzle-cube, focusing on patterns, conventions, and guardrails for building analytics dashboards with React components.

## Overview

The drizzle-cube client is a **modular React component library** designed for building analytics dashboards. It provides a lightweight alternative to Cube.js React components while maintaining API compatibility. The architecture prioritizes minimal dependencies, embeddability, and type safety.

## Core Architecture

```
App → CubeProvider → Dashboard/Portlets → Charts → CubeClient → API
       ↓              ↓                    ↓
   Context/State   Query Building      Data Visualization
```

### Design Principles
- **Minimal Dependencies** - Only React, Recharts, and react-grid-layout
- **Embeddable** - Designed to integrate into existing applications
- **Type-Safe** - Full TypeScript coverage throughout
- **Modular** - Component-based architecture with clear separation of concerns
- **Cube.js Compatible** - Drop-in replacement for @cubejs-client/react

## Core Components Architecture

### 1. Context Layer (@src/client/providers/CubeProvider.tsx)

**Purpose**: Centralized state management and API integration
```typescript
interface CubeContextValue {
  cubeApi: CubeClient           // API client instance
  options?: CubeQueryOptions    // Default query options
  meta: CubeMeta | null         // Cube metadata
  labelMap: FieldLabelMap       // Field display names
  metaLoading: boolean          // Metadata loading state
  metaError: string | null      // Metadata error state
  getFieldLabel: (fieldName: string) => string
  refetchMeta: () => void
  updateApiConfig: (apiOptions: CubeApiOptions, token?: string) => void
  features: FeaturesConfig      // Feature toggles
}
```

**Key Patterns**:
- **Mandatory Context** - All components must use CubeProvider
- **Dynamic Configuration** - API config can be updated at runtime
- **Metadata Caching** - Cube metadata cached with invalidation support
- **Feature Flags** - Enable/disable features like AI assistance

### 2. Data Layer (@src/client/client/CubeClient.ts)

**Purpose**: HTTP client for Cube.js-compatible API endpoints
**Pattern**: Cube.js ResultSet compatibility
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

**Key Features**:
- **Cube.js API Compatibility** - POST /cubejs-api/v1/load, /sql, /meta
- **Token-based Authentication** - Bearer token support
- **Error Handling** - Structured error responses
- **TypeScript Support** - Full typing for queries and responses

### 3. Query Execution (@src/client/hooks/useCubeQuery.ts)

**Purpose**: React hook for executing queries with state management
**Pattern**: Similar to @cubejs-client/react useCubeQuery
```typescript
function useCubeQuery(
  query: CubeQuery | null, 
  options: CubeQueryOptions = {}
): {
  resultSet: CubeResultSet | null
  isLoading: boolean
  error: Error | null
  queryId: string | null
}
```

**Key Patterns**:
- **Automatic Query Deduplication** - Prevents duplicate requests
- **Race Condition Prevention** - QueryId-based result validation
- **Atomic State Updates** - Consistent loading states
- **Query Invalidation** - resetResultSetOnChange option

## Dashboard Architecture

### 1. Dashboard Container (@src/client/components/AnalyticsDashboard.tsx)

**Purpose**: Main dashboard container with configuration management
```typescript
interface AnalyticsDashboardProps {
  config: DashboardConfig
  editable?: boolean
  onConfigChange?: (config: DashboardConfig) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  onDirtyStateChange?: (isDirty: boolean) => void
}
```

**Key Features**:
- **Dirty State Tracking** - Prevents saves during initial load
- **Configuration Management** - JSON-based dashboard config
- **Edit Mode** - Toggle between view and edit modes
- **Save Coordination** - Async save with error handling

### 2. Grid Layout (@src/client/components/DashboardGrid.tsx)

**Purpose**: Responsive grid layout using react-grid-layout
**Pattern**: Breakpoint-based responsive layouts
```typescript
interface GridLayout {
  i: string    // Portlet ID
  x: number    // Grid X position
  y: number    // Grid Y position
  w: number    // Grid width
  h: number    // Grid height
  minW?: number
  minH?: number
}
```

**Responsive Breakpoints**:
- `lg`: 1200px+ (12 columns)
- `md`: 996px+ (10 columns)  
- `sm`: 768px+ (6 columns)
- `xs`: 480px+ (4 columns)
- `xxs`: <480px (2 columns)

### 3. Portlet System (@src/client/components/AnalyticsPortlet.tsx)

**Purpose**: Individual dashboard widgets with chart rendering
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

**Key Patterns**:
- **Query String Storage** - CubeQuery stored as JSON string
- **Chart Type Registry** - Dynamic chart component loading
- **Configuration Layers** - Separate chart axis and display config
- **Error Boundaries** - Graceful error handling per portlet

## Chart System Architecture

### 1. Chart Component Pattern

**Structure**: All charts follow consistent interface
```typescript
interface ChartProps {
  data: any[]                    // Raw data array
  chartConfig?: ChartAxisConfig  // Axis mapping configuration
  displayConfig?: ChartDisplayConfig // Visual styling configuration
  queryObject?: CubeQuery        // Original query for metadata
  height?: string | number       // Container height
}
```

### 2. Chart Configuration System (@src/client/charts/chartConfigs.ts)

**Purpose**: Type-safe configuration for chart axis mapping
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

### 3. Chart Type Registry (@src/client/charts/chartConfigRegistry.ts)

**Purpose**: Metadata-driven chart configuration UI
```typescript
interface AxisDropZoneConfig {
  key: string                    // chartConfig key
  label: string                  // UI label
  description?: string           // Help text
  mandatory?: boolean            // Required field
  maxItems?: number             // Maximum items
  acceptTypes?: ('dimension' | 'timeDimension' | 'measure')[]
  emptyText?: string            // Placeholder text
}

interface ChartTypeConfig {
  dropZones: AxisDropZoneConfig[]
  displayOptions?: string[]
  validate?: (config: any) => { isValid: boolean; message?: string }
}
```

### 4. Supported Chart Types

**Chart Components** (@src/client/components/charts/):
- **RechartsBarChart** - Bar and column charts with stacking
- **RechartsLineChart** - Line charts with multiple series
- **RechartsAreaChart** - Area charts with stacking
- **RechartsPieChart** - Pie and doughnut charts
- **RechartsScatterChart** - Scatter plots
- **RechartsRadarChart** - Radar/spider charts
- **RechartsRadialBarChart** - Radial bar charts
- **RechartsTreeMapChart** - Hierarchical treemaps
- **BubbleChart** - Bubble charts with size/color dimensions
- **DataTable** - Sortable data tables

## Query Builder Architecture

### 1. Query Builder Container (@src/client/components/QueryBuilder/index.tsx)

**Purpose**: Visual query construction interface
**Components**:
- **QueryPanel** - Measures, dimensions, filters selection
- **SetupPanel** - Chart configuration and settings
- **ResultsPanel** - Query results and visualization

### 2. Filter System (@src/client/components/QueryBuilder/FilterBuilder.tsx)

**Purpose**: Hierarchical filter construction with AND/OR logic
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

### 3. Metadata Explorer (@src/client/components/QueryBuilder/CubeMetaExplorer.tsx)

**Purpose**: Browse available cubes, measures, and dimensions
**Features**:
- **Cube Tree Navigation** - Expandable cube/field tree
- **Field Type Icons** - Visual indicators for measures/dimensions
- **Drag & Drop** - Direct drag to query builder
- **Search & Filter** - Find fields quickly

## Data Transformation Layer

### 1. Chart Data Utilities (@src/client/utils/chartUtils.ts)

**Purpose**: Transform CubeResultSet data for chart consumption
```typescript
export function formatChartData(
  resultSet: CubeResultSet,
  chartConfig: ChartAxisConfig,
  chartType: ChartType
): any[]

export function getTimeAxisFormat(granularity?: string): string
export function formatFieldValue(value: any, fieldType: string): string
```

**Key Functions**:
- **Data Pivoting** - Transform from flat to hierarchical data
- **Time Formatting** - Consistent date/time display
- **Series Grouping** - Split data by series fields
- **Null Handling** - Consistent null value representation

### 2. Chart Constants (@src/client/utils/chartConstants.ts)

**Purpose**: Shared styling and configuration
```typescript
export const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
  '#00ff00', '#0088fe', '#ffbb33', '#ff8042'
]

export const CHART_MARGINS = {
  default: { top: 20, right: 30, left: 20, bottom: 60 }
}
```

## Type System Architecture

### 1. Core Types (@src/client/types.ts)

**Type Categories**:
- **Query Types** - CubeQuery, Filter, TimeDimension
- **Configuration Types** - PortletConfig, DashboardConfig, ChartConfig
- **Component Types** - Props interfaces for all components
- **API Types** - CubeClient, CubeResultSet, CubeApiOptions
- **Metadata Types** - CubeMeta, CubeMetaCube, CubeMetaField

### 2. Metadata Types (@src/client/hooks/useCubeMeta.ts)

**Purpose**: Type-safe metadata handling
```typescript
interface CubeMeta {
  cubes: CubeMetaCube[]
}

interface CubeMetaCube {
  name: string
  title?: string
  measures: CubeMetaField[]
  dimensions: CubeMetaField[]
  segments?: CubeMetaField[]
}

interface CubeMetaField {
  name: string
  type: string
  title?: string
  shortTitle?: string
  description?: string
}
```

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

### Build System Integration

**Vite Configuration**: Separate entry points with tree-shaking
**Bundle Optimization**: Components imported on-demand
**CSS Integration**: Tailwind classes with PostCSS processing

## Development Patterns

### 1. Component Development Pattern

```typescript
// Component structure
interface ComponentProps {
  // Required props
  // Optional props with defaults
}

export default function Component({ 
  // Destructure with defaults
}: ComponentProps) {
  // Hooks at top
  // State management
  // Event handlers
  // Render logic
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  )
}
```

### 2. Hook Development Pattern

```typescript
// Custom hook structure
interface HookResult {
  // Return value interface
}

export function useCustomHook(
  param: Type,
  options: Options = {}
): HookResult {
  // State initialization
  // Effect hooks
  // Cleanup functions
  // Return stable object
  return useMemo(() => ({
    // Memoized return values
  }), [dependencies])
}
```

### 3. Chart Component Pattern

```typescript
export default function ChartComponent({ 
  data, 
  chartConfig = {}, 
  displayConfig = {},
  queryObject,
  height = 400 
}: ChartProps) {
  // Error boundary wrapper
  // Data transformation
  // Chart configuration
  // Event handlers
  
  if (!data || data.length === 0) {
    return <div>No data available</div>
  }
  
  return (
    <ChartContainer height={height}>
      <RechartsComponent>
        {/* Chart elements */}
      </RechartsComponent>
    </ChartContainer>
  )
}
```

## Integration Patterns

### 1. Embedding in Applications

```typescript
// App-level setup
import { CubeProvider, AnalyticsDashboard } from 'drizzle-cube/client'

function App() {
  return (
    <CubeProvider 
      apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
      token="your-auth-token"
    >
      <AnalyticsDashboard 
        config={dashboardConfig}
        editable={true}
        onSave={handleSave}
      />
    </CubeProvider>
  )
}
```

### 2. Custom Chart Integration

```typescript
// Register custom chart types
import { chartConfigRegistry } from 'drizzle-cube/client/charts'

chartConfigRegistry.customChart = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'Categories',
      acceptTypes: ['dimension']
    }
  ],
  displayOptions: ['showLegend']
}
```

### 3. Authentication Integration

```typescript
// Dynamic token updates
function AuthenticatedDashboard() {
  const { updateApiConfig } = useCubeContext()
  
  useEffect(() => {
    const token = getAuthToken()
    updateApiConfig({ apiUrl: '/api/cube' }, token)
  }, [authState])
}
```

## Performance Patterns

### 1. Query Optimization

- **Query Deduplication** - Automatic duplicate query prevention
- **Result Caching** - Component-level result caching
- **Lazy Loading** - Chart components loaded on demand
- **Memoization** - Expensive calculations memoized

### 2. Rendering Optimization

- **Virtual Scrolling** - Large data table support
- **Chart Debouncing** - Prevent excessive re-renders
- **Component Splitting** - Code splitting at component level
- **CSS Optimization** - Tailwind purging and minification

## Error Handling Architecture

### 1. Error Boundaries

```typescript
// Chart error boundary pattern
<ChartContainer>
  <ErrorBoundary fallback={<ChartError />}>
    <Chart data={data} />
  </ErrorBoundary>
</ChartContainer>
```

### 2. Error States

- **Network Errors** - API connection failures
- **Query Errors** - Invalid query structure
- **Data Errors** - Missing or malformed data
- **Rendering Errors** - Chart rendering failures

### 3. User Feedback

- **Loading States** - Skeleton loaders and spinners
- **Error Messages** - User-friendly error descriptions
- **Retry Mechanisms** - Automatic and manual retry options
- **Debug Information** - Development-mode error details

## Key Files Reference

### Core Architecture
- @src/client/index.ts:1 - Main export entry point
- @src/client/providers/CubeProvider.tsx:24 - Context implementation  
- @src/client/client/CubeClient.ts:1 - API client implementation
- @src/client/hooks/useCubeQuery.ts:17 - Query execution hook
- @src/client/types.ts:1 - Complete type definitions

### Dashboard System
- @src/client/components/AnalyticsDashboard.tsx:11 - Main dashboard container
- @src/client/components/DashboardGrid.tsx:1 - Grid layout implementation
- @src/client/components/AnalyticsPortlet.tsx:1 - Individual portlet widgets

### Chart System
- @src/client/components/charts/index.ts:1 - Chart component exports
- @src/client/charts/chartConfigs.ts:35 - Chart configuration system
- @src/client/utils/chartUtils.ts:1 - Data transformation utilities
- @src/client/utils/chartConstants.ts:1 - Shared styling constants

### Query Builder
- @src/client/components/QueryBuilder/index.tsx:1 - Main query builder
- @src/client/components/QueryBuilder/FilterBuilder.tsx:1 - Filter construction
- @src/client/hooks/useCubeMeta.ts:1 - Metadata access hook

## Guard Rails

### 1. Architecture Constraints
- **CubeProvider is mandatory** - All components must be wrapped in CubeProvider
- **Type safety required** - All components must have proper TypeScript interfaces
- **Error boundaries required** - All chart components must have error boundaries
- **Responsive design** - All components must work on mobile and desktop
- **Minimal dependencies** - Only add dependencies for core functionality

### 2. Component Development
- **Props interface required** - All components need typed props interfaces
- **Default values** - Provide sensible defaults for optional props
- **Memoization patterns** - Use useMemo/useCallback for expensive operations
- **Cleanup patterns** - Proper cleanup for effects and event listeners
- **Accessibility** - Follow ARIA guidelines and semantic HTML

### 3. Chart Development
- **ChartProps interface** - All charts must implement ChartProps
- **Data validation** - Check for empty/invalid data before rendering
- **Configuration flexibility** - Support both axis and display configuration
- **Consistent styling** - Use chartConstants for colors and spacing
- **Performance optimization** - Debounce chart updates for large datasets

### 4. Query Management
- **Query validation** - Validate query structure before execution
- **Loading states** - Always show loading indicators during queries
- **Error handling** - Graceful error handling with user feedback
- **Race condition prevention** - Use queryId pattern for concurrent queries
- **Security** - Never include sensitive data in query objects

### 5. State Management
- **Context isolation** - Keep component state separate from global state
- **Immutable updates** - Use immutable patterns for state updates
- **Effect dependencies** - Proper dependency arrays for useEffect
- **Cleanup patterns** - Clean up subscriptions and timers
- **Performance optimization** - Avoid unnecessary re-renders

### 6. Integration Requirements
- **API compatibility** - Maintain Cube.js API compatibility
- **Authentication support** - Support token-based authentication
- **Configuration flexibility** - Support runtime configuration updates
- **Modular imports** - Support tree-shaking and modular imports
- **CSS isolation** - Avoid global CSS conflicts

## Migration from Cube.js

### Component Mapping
- `@cubejs-client/react.CubeProvider` → `drizzle-cube/client.CubeProvider`
- `@cubejs-client/react.useCubeQuery` → `drizzle-cube/client.useCubeQuery` 
- Cube.js Charts → Recharts-based chart components
- Query builder → Enhanced query builder with filter groups

### Breaking Changes
- **Chart props structure** - Different chart configuration format
- **ResultSet interface** - Compatible but extended interface
- **Error handling** - Different error object structure
- **CSS dependencies** - Tailwind-based instead of custom CSS

### Migration Strategy
1. **Replace provider** - Update CubeProvider import and configuration
2. **Update chart components** - Migrate to new chart props format
3. **Update queries** - Verify query format compatibility
4. **Update styling** - Migrate to Tailwind classes
5. **Test functionality** - Comprehensive testing of all features