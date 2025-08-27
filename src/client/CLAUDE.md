# CLAUDE.md - Client Area

This file provides guidance for working with the drizzle-cube client components, specifically focusing on recent fixes and improvements.

### Chart Infrastructure Components

**Created supporting components**:
- **`ChartContainer.tsx`**: Responsive container with error handling
- **`ChartTooltip.tsx`**: Standardized tooltip component  
- **`chartConstants.ts`**: Shared colors and margin configurations
- **`chartUtils.ts`**: Time formatting and data transformation utilities

### 5. Configuration Support

```
{
  xAxis: ['Employees.createdAt'],
  yAxis: ['Employees.count'],
  series: ['Employees.departmentName'] // Creates separate series for each department
}
```

**Display configuration**:
```typescript
{
  showLegend: true,
  stackedBarChart: true, // Stack bars within series
  showGrid: true,
  showTooltip: true
}
```
## Usage Examples

### Time Series Chart with Multiple Departments
```typescript
const chartConfig = {
  xAxis: ['Employees.createdAt'],
  yAxis: ['Employees.count'], 
  series: ['Employees.departmentName']
}

const displayConfig = {
  showLegend: true,
  stackedBarChart: false
}

const queryObject = {
  measures: ['Employees.count'],
  dimensions: ['Employees.departmentName'],
  timeDimensions: [{
    dimension: 'Employees.createdAt',
    granularity: 'month'
  }]
}
```

### Stacked Bar Chart
```typescript
const displayConfig = {
  showLegend: true,
  stackedBarChart: true, // Stacks bars by series
  showGrid: true
}
```

## Best Practices

1. **Always use time dimensions** in queryObject for proper time formatting
2. **Specify granularity** in timeDimensions for readable labels  
3. **Use series fields** to create multiple data series from dimensions
4. **Enable legends** when you have multiple series for better UX
5. **Test both stacked and unstacked** configurations
6. **Avoid console.log inside JSX** to prevent re-render loops

## Key Files Reference

### Core Components
- @src/client/providers/CubeProvider.tsx - Main provider for API integration
- @src/client/hooks/useCubeQuery.ts - Query execution hook
- @src/client/hooks/useCubeMeta.ts - Metadata access hook
- @src/client/components/AnalyticsDashboard.tsx - Main dashboard component

### Chart System
- @src/client/components/charts/*.tsx - Individual chart implementations
- @src/client/utils/chartUtils.ts - Data transformation utilities
- @src/client/utils/chartConstants.ts - Shared styling and configuration

### Query Building
- @src/client/components/QueryBuilder/ - Complete query building interface
- @src/client/components/QueryBuilder/FilterBuilder.tsx - Dynamic filter system

## Entry Points

The client provides modular entry points for different use cases:
- `drizzle-cube/client` - Complete client suite
- `drizzle-cube/client/charts` - Chart components only
- `drizzle-cube/client/hooks` - Hooks only
- `drizzle-cube/client/providers` - Provider components only
- `drizzle-cube/client/components` - UI components only

## Guard Rails

1. **Always use CubeProvider** - Required for API integration
2. **Include queryObject for time formatting** - Enables proper time dimension display
3. **Follow chart config patterns** - Maintain consistency across chart types
4. **Use error boundaries** - Wrap charts in ChartContainer for error handling
5. **Maintain responsive design** - All components must work on mobile and desktop