# Hooks

Drizzle Cube provides React hooks for seamless data fetching and state management. The hooks are designed to be Cube.js-compatible while leveraging Drizzle ORM's type safety and security features.

## Overview

The hook system consists of `useCubeQuery` for data fetching and `useCubeContext` for accessing the Cube API client. These hooks provide automatic loading states, error handling, and query optimization.

## useCubeQuery Hook

The primary hook for executing analytics queries and managing result state.

### Basic Usage

```tsx
import { useCubeQuery } from 'drizzle-cube/client'

function EmployeeMetrics() {
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName']
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!resultSet) return <div>No data</div>

  return (
    <div>
      {resultSet.rawData().map((row, index) => (
        <div key={index}>
          {row['Employees.departmentName']}: {row['Employees.count']}
        </div>
      ))}
    </div>
  )
}
```

### Hook Signature

```typescript
function useCubeQuery(
  query: CubeQuery | null,
  options?: CubeQueryOptions
): UseCubeQueryResult

interface UseCubeQueryResult {
  resultSet: CubeResultSet | null
  isLoading: boolean
  error: Error | null
}
```

### Query Structure

```typescript
interface CubeQuery {
  measures?: string[]           // Metrics to calculate
  dimensions?: string[]         // Grouping fields
  timeDimensions?: TimeDimension[]  // Time-based grouping
  filters?: Filter[]           // Query filters
  order?: [string, 'asc' | 'desc'][]  // Sorting
  limit?: number              // Result limit
  offset?: number             // Result offset
}
```

## Advanced Usage

### Time Dimensions

Query time-series data with automatic formatting:

```tsx
function RevenueChart() {
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: ['Orders.totalRevenue'],
    timeDimensions: [{
      dimension: 'Orders.createdAt',
      granularity: 'month',
      dateRange: ['2023-01-01', '2023-12-31']
    }]
  })

  // resultSet.rawData() returns formatted time data
  // e.g., { 'Orders.createdAt': '2023-01', 'Orders.totalRevenue': 50000 }
}
```

**Time Dimension Options:**
- `granularity`: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour'
- `dateRange`: [startDate, endDate] or relative dates
- `offset`: Time offset for comparative analysis

### Filtering Data

Apply filters to narrow down results:

```tsx
function ActiveEmployees() {
  const { resultSet } = useCubeQuery({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName'],
    filters: [
      {
        member: 'Employees.isActive',
        operator: 'equals',
        values: [true]
      },
      {
        member: 'Employees.createdAt', 
        operator: 'inDateRange',
        values: ['2023-01-01', '2023-12-31']
      }
    ]
  })
}
```

**Filter Operators:**
- `equals` / `notEquals`
- `contains` / `notContains`
- `gt` / `gte` / `lt` / `lte` (greater/less than)
- `inDateRange` / `notInDateRange`
- `set` / `notSet` (null checks)

### Multi-Cube Queries

Query data from multiple cubes using joins:

```tsx
function CrossCubeAnalysis() {
  const { resultSet } = useCubeQuery({
    measures: [
      'Employees.count',           // From Employees cube
      'Departments.totalBudget',   // From Departments cube
      'Productivity.avgLinesOfCode' // From Productivity cube
    ],
    dimensions: [
      'Departments.name',          // Group by department
      'Employees.isActive'         // Split by active status
    ]
  })

  // Automatically resolves join paths between cubes
}
```

### Sorting and Limiting

Control result ordering and pagination:

```tsx
function TopPerformers() {
  const { resultSet } = useCubeQuery({
    measures: ['Productivity.avgLinesOfCode'],
    dimensions: ['Employees.name'],
    order: [
      ['Productivity.avgLinesOfCode', 'desc']
    ],
    limit: 10  // Top 10 performers
  })
}
```

## Hook Options

### Query Options

```typescript
interface CubeQueryOptions {
  skip?: boolean                    // Skip query execution
  resetResultSetOnChange?: boolean  // Reset data when query changes
}
```

### Skip Query Execution

Conditionally skip queries:

```tsx
function ConditionalQuery({ showData }: { showData: boolean }) {
  const { resultSet, isLoading } = useCubeQuery(
    {
      measures: ['Employees.count'],
      dimensions: []
    },
    { skip: !showData }  // Only execute when showData is true
  )

  // Hook won't execute query until showData becomes true
}
```

### Reset Result Set

Control when to clear previous results:

```tsx
function DynamicQuery({ queryConfig }: { queryConfig: CubeQuery }) {
  const { resultSet } = useCubeQuery(
    queryConfig,
    { resetResultSetOnChange: true }  // Clear data when query changes
  )

  // Shows loading state when query changes instead of stale data
}
```

## CubeProvider Setup

Hooks require the `CubeProvider` context for API access:

```tsx
import { CubeProvider } from 'drizzle-cube/client'

function App() {
  return (
    <CubeProvider 
      config={{
        apiUrl: '/cubejs-api/v1',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      }}
    >
      <Dashboard />
    </CubeProvider>
  )
}
```

### CubeProvider Configuration

```typescript
interface CubeProviderConfig {
  apiUrl: string                    // API endpoint URL
  headers?: Record<string, string>  // Default headers
  credentials?: 'include' | 'same-origin' | 'omit'  // Fetch credentials
}
```

## Custom Hooks

Build reusable analytics hooks for common patterns:

### Department Metrics Hook

```tsx
import { useCubeQuery } from 'drizzle-cube/client'

function useDepartmentMetrics(departmentName?: string) {
  return useCubeQuery(
    departmentName ? {
      measures: ['Employees.count', 'Employees.avgSalary'],
      dimensions: ['Employees.departmentName'],
      filters: [{
        member: 'Employees.departmentName',
        operator: 'equals',
        values: [departmentName]
      }]
    } : null  // Skip if no department selected
  )
}

// Usage
function DepartmentCard({ department }: { department: string }) {
  const { resultSet, isLoading } = useDepartmentMetrics(department)
  
  if (isLoading) return <div>Loading {department}...</div>
  
  const data = resultSet?.rawData()[0]
  return (
    <div>
      <h3>{department}</h3>
      <p>Employees: {data?.['Employees.count']}</p>
      <p>Avg Salary: ${data?.['Employees.avgSalary']}</p>
    </div>
  )
}
```

### Time Range Hook

```tsx
function useTimeRangeQuery(
  baseQuery: Omit<CubeQuery, 'timeDimensions'>,
  timeDimension: string,
  range: [string, string],
  granularity: string = 'month'
) {
  return useCubeQuery({
    ...baseQuery,
    timeDimensions: [{
      dimension: timeDimension,
      granularity,
      dateRange: range
    }]
  })
}

// Usage
function RevenueOverTime() {
  const { resultSet } = useTimeRangeQuery(
    { measures: ['Orders.totalRevenue'] },
    'Orders.createdAt',
    ['2023-01-01', '2023-12-31'],
    'month'
  )
}
```

### Comparative Analysis Hook

```tsx
function useComparativeAnalysis(
  query: CubeQuery,
  timeDimension: string,
  compareToLastPeriod: boolean = true
) {
  const currentPeriod = useCubeQuery(query)
  
  const previousPeriod = useCubeQuery(
    compareToLastPeriod ? {
      ...query,
      timeDimensions: query.timeDimensions?.map(td => ({
        ...td,
        compareDateRange: td.dateRange  // Compare to previous period
      }))
    } : null
  )

  return {
    current: currentPeriod,
    previous: previousPeriod,
    growth: calculateGrowth(currentPeriod.resultSet, previousPeriod.resultSet)
  }
}
```

## Error Handling

Handle different types of errors gracefully:

```tsx
function RobustQuery() {
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName']
  })

  if (error) {
    // Handle different error types
    if (error.message.includes('Access denied')) {
      return <div>You don't have permission to view this data</div>
    }
    
    if (error.message.includes('Network')) {
      return <div>Network error. Please try again.</div>
    }
    
    return <div>An unexpected error occurred: {error.message}</div>
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading analytics...</div>
  }

  if (!resultSet || resultSet.rawData().length === 0) {
    return <div>No data available for the selected criteria</div>
  }

  return <div>Data loaded successfully!</div>
}
```

## Performance Optimization

### Query Memoization

Prevent unnecessary re-renders with query memoization:

```tsx
import { useMemo } from 'react'

function OptimizedQuery({ filters }: { filters: Filter[] }) {
  const query = useMemo(() => ({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName'],
    filters
  }), [filters])  // Only re-create query when filters change

  const { resultSet, isLoading } = useCubeQuery(query)
}
```

### Conditional Queries

Skip expensive queries when not needed:

```tsx
function ConditionalDashboard({ activeTab }: { activeTab: string }) {
  const employeeQuery = useCubeQuery(
    { measures: ['Employees.count'] },
    { skip: activeTab !== 'employees' }  // Only query when tab is active
  )

  const revenueQuery = useCubeQuery(
    { measures: ['Orders.totalRevenue'] },
    { skip: activeTab !== 'revenue' }
  )
}
```

### Result Set Caching

Leverage browser caching for repeated queries:

```tsx
// The underlying CubeClient automatically caches results
// Cache keys are based on query content and security context
const { resultSet } = useCubeQuery({
  measures: ['Employees.count']  // Cached if queried before
})
```

## Testing Hooks

Test analytics components with mock data:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { CubeProvider } from 'drizzle-cube/client'
import { useCubeQuery } from 'drizzle-cube/client'

// Mock CubeProvider for testing
const TestCubeProvider = ({ children }: { children: React.ReactNode }) => (
  <CubeProvider config={{ apiUrl: 'http://localhost:4000/cubejs-api/v1' }}>
    {children}
  </CubeProvider>
)

test('useCubeQuery returns data', async () => {
  const { result } = renderHook(
    () => useCubeQuery({
      measures: ['Employees.count'],
      dimensions: []
    }),
    { wrapper: TestCubeProvider }
  )

  expect(result.current.isLoading).toBe(true)

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  expect(result.current.resultSet).toBeTruthy()
  expect(result.current.error).toBeNull()
})
```

## Best Practices

1. **Query Memoization**: Use `useMemo` for complex query objects
2. **Error Handling**: Always handle loading states and errors
3. **Conditional Queries**: Use `skip` option to avoid unnecessary requests
4. **Custom Hooks**: Create reusable hooks for common query patterns
5. **Type Safety**: Leverage TypeScript for query and result type safety
6. **Performance**: Limit large result sets with filters and pagination
7. **Security**: Never bypass security context in queries

## Common Patterns

### Basic Data Fetching
```tsx
const { resultSet, isLoading, error } = useCubeQuery({
  measures: ['Table.count'],
  dimensions: ['Table.category']
})
```

### Time Series Analysis
```tsx
const { resultSet } = useCubeQuery({
  measures: ['Orders.totalRevenue'],
  timeDimensions: [{
    dimension: 'Orders.createdAt',
    granularity: 'month',
    dateRange: ['2023-01-01', '2023-12-31']
  }]
})
```

### Filtered Query
```tsx
const { resultSet } = useCubeQuery({
  measures: ['Employees.count'],
  dimensions: ['Employees.department'],
  filters: [{
    member: 'Employees.isActive',
    operator: 'equals',
    values: [true]
  }]
})
```

### Conditional Execution
```tsx
const { resultSet } = useCubeQuery(
  selectedDepartment ? {
    measures: ['Employees.count'],
    filters: [{
      member: 'Employees.departmentName',
      operator: 'equals',
      values: [selectedDepartment]
    }]
  } : null
)
```

## Next Steps

- Learn about [Charts](/help/client/charts) for data visualization
- Explore [Dashboards](/help/client/dashboards) for layout management
- Review [React Client](/help/client) overview
- Check out hook examples in the repository

## Roadmap Ideas

- Query builder hook with visual interface
- Real-time data hooks with WebSocket support
- Advanced caching strategies and invalidation
- Query performance monitoring and optimization hooks
- Offline-capable hooks with local storage
- Hook composition utilities for complex analytics patterns