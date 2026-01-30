# Phase 3: AnalysisBuilder Components

**Priority**: MEDIUM-HIGH
**Estimated Tests**: ~60
**Status**: COMPLETE (161 tests implemented)
**Dependencies**: Phase 1 (Modal), MSW infrastructure

## Overview

The AnalysisBuilder is the primary query builder interface. These are complex, stateful components. Focus on user workflows and interactions, NOT internal state management.

**Important**: The AnalysisBuilder uses Zustand stores. For most tests, mock the store hooks rather than testing store logic directly (stores have their own tests).

---

## Task 3.1: FieldSearchModal

### Component
`src/client/components/AnalysisBuilder/FieldSearchModal.tsx` (~445 lines)

### Test File
`tests/client/components/AnalysisBuilder/FieldSearchModal.test.tsx`

### Purpose
Search-first field picker modal for selecting measures and dimensions. Supports keyboard navigation and grouping by cube.

### Test Cases

```typescript
describe('FieldSearchModal', () => {
  const mockFields = [
    { name: 'Users.count', type: 'measure', cube: 'Users', title: 'User Count' },
    { name: 'Users.name', type: 'dimension', cube: 'Users', title: 'User Name' },
    { name: 'Orders.total', type: 'measure', cube: 'Orders', title: 'Order Total' },
    { name: 'Orders.status', type: 'dimension', cube: 'Orders', title: 'Order Status' },
  ]

  describe('opening and closing', () => {
    it('should open when trigger element is clicked')
    it('should close when clicking outside')
    it('should close when pressing Escape')
    it('should focus search input when opened')
  })

  describe('search filtering', () => {
    it('should show all fields when search is empty')
    it('should filter fields by search term')
    it('should match against field name and title')
    it('should show "No results" when search matches nothing')
    it('should be case-insensitive')
  })

  describe('field grouping', () => {
    it('should group fields by cube')
    it('should show cube name as section header')
    it('should filter to single cube when cube filter is active')
  })

  describe('keyboard navigation', () => {
    it('should highlight first result by default')
    it('should move highlight down with ArrowDown')
    it('should move highlight up with ArrowUp')
    it('should wrap from last to first item')
    it('should select highlighted field on Enter')
  })

  describe('selection', () => {
    it('should call onSelect with field name when field clicked')
    it('should call onSelect with field name when Enter pressed')
    it('should close modal after selection')
  })

  describe('recent fields', () => {
    it('should show recent fields section when available')
    it('should not show recent fields when search is active')
  })

  describe('field type filtering', () => {
    it('should filter to measures only when type="measure"')
    it('should filter to dimensions only when type="dimension"')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction) with Pattern 2 (Mocked Hooks).

```typescript
import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/react'

// Mock the metadata context
vi.mock('../../../src/client/providers/CubeMetaContext', () => ({
  useCubeMeta: vi.fn(() => ({
    meta: { cubes: mockCubes },
    getFieldLabel: (name: string) => name.split('.').pop()
  }))
}))
```

### Key Props
- `open: boolean`
- `onClose: () => void`
- `onSelect: (fieldName: string) => void`
- `type?: 'measure' | 'dimension' | 'all'`
- `excludeFields?: string[]` - Fields to hide

---

## Task 3.2: AnalysisQueryPanel

### Component
`src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx` (~584 lines)

### Test File
`tests/client/components/AnalysisBuilder/AnalysisQueryPanel.test.tsx`

### Purpose
Tabbed panel containing Metrics, Breakdowns, and Filters sections for building queries.

### Test Cases

```typescript
describe('AnalysisQueryPanel', () => {
  describe('tab navigation', () => {
    it('should show Metrics tab as active by default')
    it('should switch to Breakdowns tab when clicked')
    it('should switch to Filters tab when clicked')
    it('should show tab content for active tab only')
  })

  describe('metrics section', () => {
    it('should show "Add metric" button')
    it('should open field modal when "Add metric" clicked')
    it('should display added metrics as pills/cards')
    it('should remove metric when X button clicked')
    it('should allow reordering metrics via drag')
  })

  describe('breakdowns section', () => {
    it('should show "Add breakdown" button')
    it('should open field modal filtered to dimensions')
    it('should display added breakdowns')
    it('should remove breakdown when X button clicked')
  })

  describe('filters section', () => {
    it('should show "Add filter" button')
    it('should open filter config modal when "Add filter" clicked')
    it('should display added filters')
    it('should allow editing existing filter')
    it('should remove filter when X button clicked')
  })

  describe('validation', () => {
    it('should show validation error when no metrics selected')
    it('should enable "Run" button when query is valid')
    it('should disable "Run" button when query is invalid')
  })

  describe('badge counts', () => {
    it('should show count badge on Metrics tab')
    it('should show count badge on Filters tab when filters exist')
  })
})
```

### Testing Pattern
Use Pattern 2 (Mocked Hooks) - mock the Zustand store.

```typescript
// Mock the store
const mockStoreState = {
  queryStates: [{
    metrics: ['Users.count'],
    breakdowns: [],
    filters: []
  }],
  activeQueryIndex: 0,
  activeTab: 'metrics',
  setActiveTab: vi.fn(),
  addMetric: vi.fn(),
  removeMetric: vi.fn(),
  // ... other actions
}

vi.mock('../../../src/client/stores/analysisBuilderStore', () => ({
  useAnalysisBuilderStore: vi.fn((selector) =>
    selector ? selector(mockStoreState) : mockStoreState
  )
}))
```

### Key Props
- Component reads from AnalysisBuilderStore context
- No direct props (uses store)

---

## Task 3.3: FilterConfigModal

### Component
`src/client/components/AnalysisBuilder/FilterConfigModal.tsx` (~752 lines)

### Test File
`tests/client/components/AnalysisBuilder/FilterConfigModal.test.tsx`

### Purpose
Modal for creating and editing filters with field selection, operator selection, and value input.

### Test Cases

```typescript
describe('FilterConfigModal', () => {
  describe('field selection', () => {
    it('should show field selector when no field selected')
    it('should display selected field name')
    it('should allow changing selected field')
  })

  describe('operator selection', () => {
    it('should show operators appropriate for string fields')
    it('should show operators appropriate for number fields')
    it('should show operators appropriate for date fields')
    it('should update value input when operator changes')
  })

  describe('value input - string operators', () => {
    it('should show text input for "equals" operator')
    it('should show text input for "contains" operator')
    it('should allow multiple values for "in" operator')
  })

  describe('value input - number operators', () => {
    it('should show number input for "gt" operator')
    it('should show number input for "between" operator')
    it('should validate number format')
  })

  describe('value input - date operators', () => {
    it('should show date picker for "afterDate" operator')
    it('should show date range picker for "inDateRange" operator')
    it('should show preset options (Today, Last 7 days, etc.)')
  })

  describe('validation', () => {
    it('should require field selection')
    it('should require operator selection')
    it('should require value for most operators')
    it('should allow empty value for "set" and "notSet" operators')
    it('should show validation errors inline')
  })

  describe('submission', () => {
    it('should call onSave with filter object when valid')
    it('should not submit when validation fails')
    it('should close modal after successful save')
  })

  describe('editing', () => {
    it('should populate form when editing existing filter')
    it('should update existing filter on save')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `open: boolean`
- `onClose: () => void`
- `onSave: (filter: Filter) => void`
- `initialFilter?: Filter` - For editing
- `availableFields: FieldMeta[]`

---

## Task 3.4: AnalysisChartConfigPanel

### Component
`src/client/components/AnalysisBuilder/AnalysisChartConfigPanel.tsx` (~505 lines)

### Test File
`tests/client/components/AnalysisBuilder/AnalysisChartConfigPanel.test.tsx`

### Purpose
Panel for configuring chart type, axis mappings, and display options.

### Test Cases

```typescript
describe('AnalysisChartConfigPanel', () => {
  describe('chart type selection', () => {
    it('should show available chart types')
    it('should highlight currently selected chart type')
    it('should change chart type when option clicked')
    it('should disable chart types incompatible with current data')
  })

  describe('axis configuration', () => {
    it('should show X-axis drop zone')
    it('should show Y-axis drop zone')
    it('should show Series drop zone for applicable charts')
    it('should allow dropping fields into drop zones')
    it('should show currently mapped fields in drop zones')
    it('should allow removing fields from drop zones')
  })

  describe('display options', () => {
    it('should show legend toggle')
    it('should show grid toggle')
    it('should show stacked toggle for bar/area charts')
    it('should show orientation toggle for bar charts')
  })

  describe('auto-configuration', () => {
    it('should auto-populate axis config based on query fields')
    it('should suggest appropriate chart type for data shape')
  })
})
```

### Testing Pattern
Use Pattern 2 (Mocked Hooks).

### Key Props
- Reads from AnalysisBuilderStore
- No direct props

---

## Task 3.5: AnalysisResultsPanel

### Component
`src/client/components/AnalysisBuilder/AnalysisResultsPanel.tsx` (~1756 lines)

### Test File
`tests/client/components/AnalysisBuilder/AnalysisResultsPanel.test.tsx`

### Purpose
Displays query results as chart or table with view toggle.

### Test Cases

```typescript
describe('AnalysisResultsPanel', () => {
  describe('view toggle', () => {
    it('should show Chart and Table toggle buttons')
    it('should default to Chart view')
    it('should switch to Table view when Table clicked')
    it('should persist view preference')
  })

  describe('loading state', () => {
    it('should show loading indicator when query is executing')
    it('should show skeleton while loading')
  })

  describe('empty state', () => {
    it('should show empty state when no query configured')
    it('should show "No results" when query returns empty data')
  })

  describe('error state', () => {
    it('should show error message when query fails')
    it('should show retry button on error')
  })

  describe('chart rendering', () => {
    it('should render chart component based on chartType')
    it('should pass data and config to chart')
  })

  describe('table rendering', () => {
    it('should render DataTable when in table view')
    it('should pass data to DataTable')
  })

  describe('actions', () => {
    it('should show refresh button')
    it('should show download/export button')
    it('should trigger query refresh when refresh clicked')
  })
})
```

### Testing Pattern
Use Pattern 2 (Mocked Hooks) - this is a complex component, mock most dependencies.

```typescript
// Mock the query hook
vi.mock('../../../src/client/hooks/queries/useCubeLoadQuery', () => ({
  useCubeLoadQuery: vi.fn(() => ({
    rawData: mockData,
    isLoading: false,
    error: null
  }))
}))
```

---

## Setup Requirements

1. Create store mock helper:
```typescript
// tests/client/helpers/mockAnalysisBuilderStore.ts
export const createMockStore = (overrides = {}) => ({
  queryStates: [{ metrics: [], breakdowns: [], filters: [] }],
  activeQueryIndex: 0,
  activeTab: 'metrics',
  chartType: 'bar',
  ...overrides
})
```

2. Create field metadata fixtures:
```typescript
// tests/client/fixtures/fields.ts
export const mockFields = [
  { name: 'Users.count', type: 'number', title: 'User Count', fieldType: 'measure' },
  { name: 'Users.name', type: 'string', title: 'Name', fieldType: 'dimension' },
  // ...
]
```

---

## Acceptance Criteria

- [x] All test cases pass (161 tests passing)
- [x] Tests focus on user interactions, not internal state
- [x] Modal tests verify open/close behavior
- [x] Keyboard navigation tests are comprehensive
- [x] Form validation is tested
- [x] No tests that depend on specific Recharts rendering

## Completion Status: COMPLETE

**Date**: 2026-01-28
**Tests Created**: 161 tests across 5 files
- FieldSearchModal.test.tsx: 37 tests
- AnalysisQueryPanel.test.tsx: 33 tests
- FilterConfigModal.test.tsx: 30 tests
- AnalysisChartConfigPanel.test.tsx: 25 tests
- AnalysisResultsPanel.test.tsx: 36 tests

---

## File Structure After Completion

```
tests/client/components/AnalysisBuilder/
├── FieldSearchModal.test.tsx
├── AnalysisQueryPanel.test.tsx
├── FilterConfigModal.test.tsx
├── AnalysisChartConfigPanel.test.tsx
└── AnalysisResultsPanel.test.tsx
```
