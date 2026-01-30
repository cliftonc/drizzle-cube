# Phase 5: Filter Components

**Priority**: MEDIUM
**Estimated Tests**: ~40 (Actual: 86)
**Dependencies**: Phase 1 (Modal)
**Status**: COMPLETE

## Overview

Filter UI components for building query filters. Focus on value handling, operator logic, and validation - NOT styling.

## Completion Summary

| Test File | Tests | Status |
|-----------|-------|--------|
| FilterItem.test.tsx | 20 | PASS |
| FilterValueSelector.test.tsx | 24 | PASS |
| DateRangeSelector.test.tsx | 22 | PASS |
| FilterBuilder.test.tsx | 20 | PASS |
| **Total** | **86** | **PASS** |

### Run Command
```bash
npm run test:client -- --run tests/client/components/shared/
```

---

## Task 5.1: FilterItem

### Component
`src/client/components/shared/FilterItem.tsx` (~519 lines)

### Test File
`tests/client/components/shared/FilterItem.test.tsx`

### Purpose
Individual filter row with field selector, operator dropdown, and value input. Adapts value input based on field type and operator.

### Test Cases

```typescript
describe('FilterItem', () => {
  const defaultProps = {
    filter: { member: 'Users.status', operator: 'equals', values: ['active'] },
    onChange: vi.fn(),
    onRemove: vi.fn(),
    fields: mockFields
  }

  describe('field display', () => {
    it('should show selected field name')
    it('should show field label if available')
    it('should allow changing field')
  })

  describe('operator selection', () => {
    it('should show operator dropdown')
    it('should show string operators for string fields')
    it('should show numeric operators for number fields')
    it('should show date operators for time fields')
    it('should call onChange when operator changed')
    it('should reset values when operator changes type')
  })

  describe('value input - string fields', () => {
    it('should show text input for "equals" operator')
    it('should show text input for "notEquals" operator')
    it('should show text input for "contains" operator')
    it('should show multi-select for "in" operator')
    it('should show no input for "set" operator')
    it('should show no input for "notSet" operator')
  })

  describe('value input - number fields', () => {
    it('should show number input for "equals" operator')
    it('should show number input for "gt" operator')
    it('should show two number inputs for "between" operator')
    it('should validate number format')
    it('should show error for non-numeric input')
  })

  describe('value input - date fields', () => {
    it('should show date picker for "equals" operator')
    it('should show date range picker for "inDateRange" operator')
    it('should show date picker for "beforeDate" operator')
    it('should show date picker for "afterDate" operator')
  })

  describe('multi-value handling', () => {
    it('should allow adding multiple values for "in" operator')
    it('should allow removing individual values')
    it('should show values as tags/chips')
  })

  describe('removal', () => {
    it('should show remove button')
    it('should call onRemove when clicked')
  })

  describe('validation', () => {
    it('should show error state when value is required but empty')
    it('should show error state for invalid number')
    it('should show error state for invalid date')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

```typescript
it('should change operator and update value input', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<FilterItem {...defaultProps} onChange={onChange} />)

  // Open operator dropdown
  await user.click(screen.getByRole('combobox', { name: /operator/i }))

  // Select 'contains'
  await user.click(screen.getByRole('option', { name: /contains/i }))

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ operator: 'contains' })
  )
})
```

### Key Props
- `filter: Filter`
- `onChange: (filter: Filter) => void`
- `onRemove: () => void`
- `fields: FieldMeta[]`
- `disabled?: boolean`

---

## Task 5.2: FilterValueSelector

### Component
`src/client/components/shared/FilterValueSelector.tsx` (~285 lines)

### Test File
`tests/client/components/shared/FilterValueSelector.test.tsx`

### Purpose
Smart value input that adapts based on field type - text, number, date, or multi-select.

### Test Cases

```typescript
describe('FilterValueSelector', () => {
  describe('text input', () => {
    it('should render text input for string type')
    it('should update value on change')
    it('should handle empty string')
  })

  describe('number input', () => {
    it('should render number input for number type')
    it('should only allow numeric input')
    it('should handle decimal numbers')
    it('should handle negative numbers')
    it('should show error for invalid input')
  })

  describe('date input', () => {
    it('should render date picker for date type')
    it('should format date correctly')
    it('should handle date selection')
  })

  describe('multi-value input', () => {
    it('should render multi-select for array values')
    it('should show existing values as tags')
    it('should allow adding new value')
    it('should allow removing value')
    it('should handle Enter key to add value')
  })

  describe('range input', () => {
    it('should render two inputs for range operators')
    it('should validate start < end for number range')
    it('should validate start < end for date range')
  })

  describe('suggestions', () => {
    it('should show suggestions when available')
    it('should filter suggestions by input')
    it('should select suggestion on click')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `type: 'string' | 'number' | 'time'`
- `operator: FilterOperator`
- `values: any[]`
- `onChange: (values: any[]) => void`
- `suggestions?: string[]`

---

## Task 5.3: DateRangeSelector

### Component
`src/client/components/shared/DateRangeSelector.tsx` (~296 lines)

### Test File
`tests/client/components/shared/DateRangeSelector.test.tsx`

### Purpose
Date range picker with preset options (Today, Last 7 days, etc.) and custom range selection.

### Test Cases

```typescript
describe('DateRangeSelector', () => {
  describe('presets', () => {
    it('should show preset options')
    it('should include "Today" preset')
    it('should include "Yesterday" preset')
    it('should include "Last 7 days" preset')
    it('should include "Last 30 days" preset')
    it('should include "This month" preset')
    it('should include "Last month" preset')
    it('should select preset and update value')
    it('should highlight currently selected preset')
  })

  describe('custom range', () => {
    it('should show "Custom range" option')
    it('should open date picker when custom selected')
    it('should allow selecting start date')
    it('should allow selecting end date')
    it('should validate start date is before end date')
    it('should show selected range in display')
  })

  describe('display', () => {
    it('should show preset name when preset selected')
    it('should show date range when custom selected')
    it('should format dates in readable format')
  })

  describe('relative dates', () => {
    it('should calculate "Last 7 days" from today')
    it('should calculate "This month" correctly')
    it('should recalculate on each open')
  })

  describe('clearing', () => {
    it('should allow clearing selection')
    it('should call onChange with empty on clear')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `value: [string, string] | null` - Start and end dates
- `onChange: (value: [string, string] | null) => void`
- `presets?: DatePreset[]`

### Date Mocking
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-06-15'))
})

afterEach(() => {
  vi.useRealTimers()
})
```

---

## Task 5.4: FilterBuilder

### Component
`src/client/components/shared/FilterBuilder.tsx` (~200 lines)

### Test File
`tests/client/components/shared/FilterBuilder.test.tsx`

### Purpose
Container component for building a list of filters with AND/OR grouping.

### Test Cases

```typescript
describe('FilterBuilder', () => {
  describe('filter list', () => {
    it('should render list of FilterItems')
    it('should show "Add filter" button')
    it('should add new empty filter when button clicked')
    it('should remove filter when FilterItem onRemove called')
  })

  describe('filter grouping', () => {
    it('should show AND/OR toggle between filters')
    it('should default to AND logic')
    it('should toggle to OR logic when clicked')
    it('should apply logic to all filters')
  })

  describe('empty state', () => {
    it('should show empty state message when no filters')
    it('should show "Add your first filter" prompt')
  })

  describe('onChange', () => {
    it('should call onChange when filter added')
    it('should call onChange when filter modified')
    it('should call onChange when filter removed')
    it('should call onChange when logic changed')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `filters: Filter[]`
- `onChange: (filters: Filter[]) => void`
- `fields: FieldMeta[]`
- `logic?: 'and' | 'or'`
- `onLogicChange?: (logic: 'and' | 'or') => void`

---

## Setup Requirements

1. Create mock fields fixture:
```typescript
// tests/client/fixtures/fields.ts
export const mockFields = [
  { name: 'Users.status', type: 'string', title: 'Status' },
  { name: 'Users.age', type: 'number', title: 'Age' },
  { name: 'Users.createdAt', type: 'time', title: 'Created At' },
  { name: 'Orders.total', type: 'number', title: 'Order Total' },
]

export const mockOperators = {
  string: ['equals', 'notEquals', 'contains', 'notContains', 'set', 'notSet'],
  number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'set', 'notSet'],
  time: ['equals', 'inDateRange', 'beforeDate', 'afterDate', 'set', 'notSet']
}
```

2. Create filter fixtures:
```typescript
export const mockFilters = [
  { member: 'Users.status', operator: 'equals', values: ['active'] },
  { member: 'Users.age', operator: 'gte', values: [18] },
  { member: 'Users.createdAt', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
]
```

---

## Acceptance Criteria

- [x] All test cases pass
- [x] Operator-to-value-input mapping is thoroughly tested
- [x] Number validation prevents non-numeric input
- [x] Date validation prevents invalid ranges
- [x] Multi-value inputs work correctly
- [x] Date presets calculate correctly (use fake timers)
- [x] onChange is called with correct filter shape

---

## File Structure After Completion

```
tests/client/components/shared/
├── FilterItem.test.tsx
├── FilterValueSelector.test.tsx
├── DateRangeSelector.test.tsx
└── FilterBuilder.test.tsx
```
