# CLAUDE.md - Client Area

This file provides guidance for working with the drizzle-cube client components, specifically focusing on recent fixes and improvements.

## BarChart Component Restoration

The BarChart component was completely rewritten to restore functionality that was lost during migration from the original fintune-react implementation. Here are the key changes made:

### 1. Time Dimension Display Names

**Problem**: Time dimensions were showing raw timestamps like `"2023-02-01 00:00:00+00"` instead of readable labels.

**Solution**: Fixed `formatTimeValue()` function in `/src/client/utils/chartUtils.ts`:
- Updated regex pattern to handle PostgreSQL timestamp format (`YYYY-MM-DD HH:MM:SS+TZ`)
- Added timestamp normalization to convert PostgreSQL format to ISO format
- Enhanced granularity detection to properly format based on query timeDimensions

**Result**: Time dimensions now display properly formatted labels:
- `"2023-01-01 00:00:00+00"` with `granularity: "month"` → `"2023-01"`
- `"2023-02-01 00:00:00+00"` with `granularity: "month"` → `"2023-02"`

### 2. Series Support and Data Transformation

**Problem**: The chart couldn't handle multiple series from dimensions, and stacking wasn't working.

**Solution**: Implemented `transformChartDataWithSeries()` function:
- Handles both measure-based and dimension-based series
- Proper data aggregation and grouping by X-axis values
- Dynamic series key generation from dimension values
- Support for complex multi-dimensional data with series fields

**Key Features**:
- **Series Fields**: Use `chartConfig.series` to specify which dimensions create separate series
- **Stacking**: Control with `displayConfig.stackedBarChart: true`
- **Data Aggregation**: Automatically groups and sums measure values by dimension series

### 3. Interactive Legend System

**Problem**: Legend was not showing at all due to component rendering issues.

**Solution**: Fixed legend rendering and interaction:
- Removed problematic custom `ChartLegend` wrapper that wasn't rendering
- Used direct Recharts `Legend` component with proper conditional rendering
- Added hover state management with opacity changes
- Fixed React re-render loop caused by `console.log` inside JSX

**Features**:
- Shows when `displayConfig.showLegend: true` and multiple series exist
- Interactive hover effects that highlight/fade chart bars
- Proper positioning and styling

### 4. Chart Infrastructure Components

**Created supporting components**:
- **`ChartContainer.tsx`**: Responsive container with error handling
- **`ChartTooltip.tsx`**: Standardized tooltip component  
- **`chartConstants.ts`**: Shared colors and margin configurations
- **`chartUtils.ts`**: Time formatting and data transformation utilities

### 5. Configuration Support

**Supports both legacy and new configuration formats**:
```typescript
// Legacy format
{
  x: 'Employees.createdAt',
  y: ['Employees.count']
}

// New format  
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

### 6. Advanced Features Restored

- **Positive/Negative Value Coloring**: Automatically uses green/red for single series with mixed values
- **Rotated X-axis Labels**: Proper spacing and rotation for time dimension labels  
- **Interactive Hover Effects**: Legend hover changes bar opacity
- **Error Boundaries**: Robust error handling with user-friendly messages
- **Type Safety**: Full TypeScript support throughout

## Key Technical Fixes

### React Re-render Loop Issue
**Problem**: Chart was re-rendering 4 times on each load due to `console.log` inside JSX return statement.
**Solution**: Moved all debugging outside JSX to prevent infinite re-render loops.

### Timestamp Format Compatibility  
**Problem**: `formatTimeValue()` only handled ISO format, but database returns PostgreSQL format.
**Solution**: Enhanced regex and normalization to handle both formats.

### Legend Component Architecture
**Problem**: Custom wrapper component had rendering issues.
**Solution**: Use direct Recharts components with proper conditional rendering patterns.

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

## Files Modified/Created

- `/src/client/components/charts/BarChart.tsx` - Complete rewrite
- `/src/client/utils/chartUtils.ts` - New utility functions
- `/src/client/utils/chartConstants.ts` - New constants  
- `/src/client/components/charts/ChartContainer.tsx` - New container
- `/src/client/components/charts/ChartTooltip.tsx` - New tooltip
- `/src/client/components/charts/ChartLegend.tsx` - New legend (not used in final solution)

The BarChart now has full feature parity with the original fintune-react implementation and properly handles time dimensions, series, stacking, and interactive legends.