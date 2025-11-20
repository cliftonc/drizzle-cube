# FormatValue Feature Specification

## Overview

Add a `formatValue` callback function to `ChartDisplayConfig` to allow custom formatting of numeric values displayed in charts, particularly KPI numbers.

## Motivation

When displaying time-based metrics (hours, days) or other domain-specific values, raw numeric values are often not user-friendly. For example:
- **Problem**: Displaying "120.5" for a time metric requires the user to mentally convert to "5 days"
- **Problem**: Displaying "0.5" hours as "30 minutes" requires custom formatting
- **Problem**: Very small values like "0.1 hours" should show as "< 1 hour" for clarity

## Proposed API

### Type Definition

```typescript
interface ChartDisplayConfig {
  // ... existing properties ...

  /**
   * Custom value formatter function
   * Receives the raw numeric value and returns a formatted string
   * Takes precedence over suffix/prefix if provided
   */
  formatValue?: (value: number | null | undefined) => string
}
```

### Behavior

1. **Optional**: If not provided, use default formatting with `decimals`, `suffix`, `prefix`
2. **Priority**: When `formatValue` is provided, it overrides `suffix`, `prefix`, and `decimals` for the value display
3. **Input**: Receives the raw numeric value as `number | null | undefined`
4. **Output**: Returns a formatted string to display
5. **Use Cases**:
   - Smart time formatting (hours/days/minutes)
   - Currency formatting with locale
   - Custom units (e.g., "< 1", "∞", "N/A")
   - Contextual formatting based on value ranges

## Usage Example

### Smart Time Formatting

```typescript
// Smart time formatter that auto-selects unit
function formatSmartTime(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) {
    return 'N/A'
  }

  if (hours < 1) {
    return '< 1 hour'
  }

  if (hours < 48) {
    // Show in hours for values under 48 hours (2 days)
    return `${hours.toFixed(1)} hours`
  }

  // Show in days for longer timeframes
  const days = hours / 24
  return `${days.toFixed(1)} days`
}

// Usage in AnalyticsPortlet
<AnalyticsPortlet
  query={JSON.stringify({
    measures: ['DORAMetrics.medianLeadTimeHours'],
    timeDimensions: [
      {
        dimension: 'DORAMetrics.deployedAt',
        dateRange: 'last 30 days',
      },
    ],
  })}
  chartType="kpiNumber"
  chartConfig={{
    xAxis: [],
    yAxis: ['DORAMetrics.medianLeadTimeHours'],
  }}
  displayConfig={{
    valueColorIndex: 1,
    formatValue: formatSmartTime, // Custom formatter
  }}
  colorPalette={themeAwareColorPalette}
/>
```

**Result**:
- Input: `120.5` → Output: `"5.0 days"`
- Input: `24.0` → Output: `"24.0 hours"`
- Input: `0.5` → Output: `"< 1 hour"`
- Input: `null` → Output: `"N/A"`

### Other Use Cases

```typescript
// Currency with locale
formatValue: (value) =>
  value ? new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value) : '$0'

// Percentage with custom logic
formatValue: (value) =>
  value === null ? 'N/A' :
  value < 0.1 ? '< 0.1%' :
  `${value.toFixed(1)}%`

// File size formatting
formatValue: (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

## Implementation Notes

### For KPI Numbers
- Apply `formatValue` to the main display value
- If `formatValue` is provided, ignore `suffix` and `prefix` for the main value
- Still respect `decimals` if `formatValue` is not provided

### For Line/Bar Charts
- Apply `formatValue` to:
  - Y-axis labels
  - Tooltip values
  - Legend values (if applicable)
- Ensure consistent formatting across all chart elements

### Null/Undefined Handling
- The formatter receives `number | null | undefined` to allow custom handling
- Formatter should handle these cases gracefully (e.g., return "N/A", "—", or "0")

### Performance
- Formatter may be called multiple times for rendering
- Should be a pure function with no side effects
- Should be fast (avoid complex calculations inside formatter)

## Backwards Compatibility

- **Fully backwards compatible**: Existing charts without `formatValue` work exactly as before
- **Opt-in**: Only charts that specify `formatValue` get custom formatting
- **Existing options**: `suffix`, `prefix`, `decimals` continue to work when `formatValue` is not provided

## Testing Scenarios

1. **KPI Number with formatValue**: Should display custom formatted value
2. **KPI Number without formatValue**: Should use existing suffix/prefix/decimals logic
3. **Null/undefined values**: Formatter should handle gracefully
4. **Line chart Y-axis**: Custom formatter should apply to axis labels
5. **Tooltips**: Custom formatter should apply to tooltip values

## Example Output

### Before (current behavior with hours measure):
```
Median Lead Time
120.5
```
*User has to mentally calculate: "That's about 5 days"*

### After (with formatValue):
```
Median Lead Time
5.0 days
```
*Immediately clear and actionable*

## Real-World Context

This feature request comes from implementing DORA metrics dashboards where time-based metrics (Lead Time, Cycle Time, MTTR) need to be displayed in user-friendly formats. Raw millisecond or hour values are not intuitive for teams tracking their DevOps performance.

Current workaround: Creating multiple cube measures (e.g., `medianLeadTimeMs`, `medianLeadTimeHours`, `medianLeadTimeDays`) and selecting the right one based on expected value ranges. This is cumbersome and doesn't handle edge cases well.

With `formatValue`, we can use a single `medianLeadTimeHours` measure and let the formatter intelligently choose the display unit based on the actual value.
