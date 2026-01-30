# Client Component Testing Plan

## Philosophy: Quality Over Coverage

**Do NOT write tests purely to increase coverage numbers.** Every test must answer: "What user behavior or critical business logic am I validating?"

### What Makes a High-Value Test

1. **User behavior validation** - Tests what users actually do
2. **Business logic verification** - Tests calculations, transformations, state changes
3. **Error boundary coverage** - Tests failure modes users might encounter
4. **Accessibility validation** - Tests keyboard navigation, ARIA attributes
5. **Integration points** - Tests component interactions with hooks/stores

### What to SKIP

- Visual styling (colors, spacing, fonts)
- Implementation details (internal state, private methods)
- Third-party library behavior (Recharts rendering, react-grid-layout internals)
- Snapshot tests (brittle, low value)
- Tests that duplicate hook tests (hooks are tested separately)

---

## Component Categories & Testing Strategy

### Category 1: Core Infrastructure (HIGH PRIORITY)
Components that other components depend on. Test thoroughly.

| Component | Lines | Test Focus | Existing Tests |
|-----------|-------|------------|----------------|
| `ChartErrorBoundary` | 89 | Error catching, fallback rendering, recovery | None |
| `Modal` | 150 | Open/close, keyboard (Escape), focus trap | None |
| `ConfirmModal` | 83 | Confirm/cancel callbacks, button states | None |
| `LoadingIndicator` | 45 | Renders correctly, accessible | None |

### Category 2: Data Display Components (HIGH PRIORITY)
Core charts and data visualization. Focus on data transformation, not rendering.

| Component | Lines | Test Focus | Existing Tests |
|-----------|-------|------------|----------------|
| `DataTable` | 358 | Sorting, pagination, column visibility | None |
| `KpiNumber` | 148 | Number formatting, comparison display | None |
| `KpiDelta` | 514 | Delta calculation, trend indicators | None |
| `KpiText` | 95 | Text truncation, null handling | None |

### Category 3: AnalysisBuilder (MEDIUM-HIGH PRIORITY)
Complex stateful components. Test user workflows, not internal state.

| Component | Lines | Test Focus | Existing Tests |
|-----------|-------|------------|----------------|
| `AnalysisBuilder/index` | 629 | Mode switching, config loading | Partial |
| `FieldSearchModal` | 445 | Search, keyboard nav, selection | None |
| `AnalysisQueryPanel` | 584 | Tab switching, field management | None |
| `FilterConfigModal` | 752 | Filter creation, validation | None |
| `AnalysisChartConfigPanel` | 505 | Axis mapping, chart type selection | None |

### Category 4: Dashboard Components (MEDIUM PRIORITY)
Layout and editing. Focus on edit mode interactions.

| Component | Lines | Test Focus | Existing Tests |
|-----------|-------|------------|----------------|
| `DashboardGrid` | 1281 | Edit mode, drag callbacks, responsive | Partial |
| `AnalyticsPortlet` | 850 | Query execution, refresh, resize | Partial |
| `DashboardPortletCard` | 481 | Edit/delete actions, title editing | None |
| `FloatingEditToolbar` | 137 | Save/cancel/add actions | None |

### Category 5: Filter Components (MEDIUM PRIORITY)
User input and filtering. Focus on value handling.

| Component | Lines | Test Focus | Existing Tests |
|-----------|-------|------------|----------------|
| `shared/FilterItem` | 519 | Operator selection, value input | None |
| `CompactFilterBar` | 456 | Filter chips, clear all | None |
| `FilterValueSelector` | 285 | Value type handling | None |
| `DateRangeSelector` | 296 | Date picking, presets | None |

### Category 6: Chart Components (LOW PRIORITY)
Recharts wrappers. Minimal testing - focus on data prep, not rendering.

| Component | Lines | Test Focus | Existing Tests |
|-----------|-------|------------|----------------|
| `BarChart` | 340 | Data transformation only | None |
| `LineChart` | 454 | Series grouping logic | None |
| `PieChart` | 224 | Percentage calculation | None |
| `FunnelChart` | 446 | Step data formatting | Partial |

---

## Phase 1: Infrastructure & Core Components

**Goal**: Establish patterns, test foundational components
**Estimated Tests**: ~30 tests across 4-5 files

### 1.1 ChartErrorBoundary
```typescript
// tests/client/components/ChartErrorBoundary.test.tsx
describe('ChartErrorBoundary', () => {
  // Test: catches errors and renders fallback
  // Test: displays error message
  // Test: retry button resets error state
  // Test: logs errors appropriately
})
```

### 1.2 Modal & ConfirmModal
```typescript
// tests/client/components/Modal.test.tsx
describe('Modal', () => {
  // Test: renders when open=true, not when false
  // Test: calls onClose when clicking overlay
  // Test: calls onClose when pressing Escape
  // Test: traps focus within modal
  // Test: has correct ARIA attributes
})

describe('ConfirmModal', () => {
  // Test: calls onConfirm when confirm clicked
  // Test: calls onCancel when cancel clicked
  // Test: shows custom title and message
  // Test: confirm button can be disabled
})
```

### 1.3 LoadingIndicator
```typescript
// tests/client/components/LoadingIndicator.test.tsx
describe('LoadingIndicator', () => {
  // Test: renders spinner
  // Test: has accessible label
  // Test: accepts custom size
})
```

---

## Phase 2: Data Display Components

**Goal**: Test data transformation and formatting logic
**Estimated Tests**: ~40 tests across 4-5 files

### 2.1 DataTable
```typescript
// tests/client/components/charts/DataTable.test.tsx
describe('DataTable', () => {
  // Test: renders rows from data array
  // Test: sorts ascending/descending on header click
  // Test: paginates correctly
  // Test: shows "no data" when empty
  // Test: handles null values gracefully
  // Test: formats numbers and dates
})
```

### 2.2 KPI Components
```typescript
// tests/client/components/charts/KpiNumber.test.tsx
describe('KpiNumber', () => {
  // Test: formats large numbers (1.2M, 3.5K)
  // Test: shows comparison value when provided
  // Test: shows trend indicator (up/down)
  // Test: handles null/undefined value
  // Test: applies custom formatting
})

// tests/client/components/charts/KpiDelta.test.tsx
describe('KpiDelta', () => {
  // Test: calculates percentage change correctly
  // Test: shows positive/negative indicator
  // Test: handles division by zero
  // Test: formats based on metric type
})
```

---

## Phase 3: AnalysisBuilder Components

**Goal**: Test user workflows in the query builder
**Estimated Tests**: ~60 tests across 6-8 files

### 3.1 FieldSearchModal
```typescript
// tests/client/components/AnalysisBuilder/FieldSearchModal.test.tsx
describe('FieldSearchModal', () => {
  // Test: opens when trigger clicked
  // Test: filters fields by search term
  // Test: navigates with arrow keys
  // Test: selects field with Enter
  // Test: closes with Escape
  // Test: groups fields by cube
  // Test: shows recent fields section
})
```

### 3.2 AnalysisQueryPanel
```typescript
// tests/client/components/AnalysisBuilder/AnalysisQueryPanel.test.tsx
describe('AnalysisQueryPanel', () => {
  // Test: switches between Metrics/Breakdown/Filters tabs
  // Test: adds metric via field search
  // Test: removes metric when X clicked
  // Test: shows validation errors
  // Test: enables run button when valid
})
```

### 3.3 FilterConfigModal
```typescript
// tests/client/components/AnalysisBuilder/FilterConfigModal.test.tsx
describe('FilterConfigModal', () => {
  // Test: shows operators for selected field type
  // Test: validates required values
  // Test: creates filter on submit
  // Test: handles date range filters
  // Test: handles multi-value filters
})
```

---

## Phase 4: Dashboard Components

**Goal**: Test edit mode and portlet management
**Estimated Tests**: ~50 tests across 5-6 files

### 4.1 DashboardPortletCard
```typescript
// tests/client/components/DashboardPortletCard.test.tsx
describe('DashboardPortletCard', () => {
  // Test: shows title
  // Test: shows edit/delete buttons in edit mode
  // Test: hides edit controls when not in edit mode
  // Test: calls onEdit when edit clicked
  // Test: calls onDelete when delete clicked
  // Test: allows inline title editing
})
```

### 4.2 FloatingEditToolbar
```typescript
// tests/client/components/FloatingEditToolbar.test.tsx
describe('FloatingEditToolbar', () => {
  // Test: shows Save/Cancel buttons
  // Test: shows Add Portlet button
  // Test: disables Save when no changes
  // Test: calls onSave when clicked
  // Test: calls onCancel when clicked
})
```

---

## Phase 5: Filter Components

**Goal**: Test filter value handling and validation
**Estimated Tests**: ~40 tests across 4-5 files

### 5.1 FilterItem
```typescript
// tests/client/components/shared/FilterItem.test.tsx
describe('FilterItem', () => {
  // Test: shows field name
  // Test: shows operator dropdown
  // Test: shows appropriate value input for type
  // Test: validates required values
  // Test: calls onChange when modified
  // Test: calls onRemove when removed
})
```

### 5.2 DateRangeSelector
```typescript
// tests/client/components/shared/DateRangeSelector.test.tsx
describe('DateRangeSelector', () => {
  // Test: shows preset options (Today, Last 7 days, etc.)
  // Test: opens date picker for custom range
  // Test: validates start < end
  // Test: formats display value correctly
})
```

---

## Phase 6: Chart Data Preparation (Optional)

**Goal**: Test data transformation logic ONLY (not rendering)
**Estimated Tests**: ~20 tests across 3-4 files

Focus on extracting and testing data transformation functions, NOT the React components themselves.

```typescript
// tests/client/charts/chartDataUtils.test.ts
describe('prepareBarChartData', () => {
  // Test: groups data by series field
  // Test: handles missing values
  // Test: sorts by category
})

describe('preparePieChartData', () => {
  // Test: calculates percentages
  // Test: groups small slices into "Other"
})
```

---

## Testing Patterns for Agents

### Pattern 1: Component with MSW (Integration)
Use for components that fetch data.

```typescript
import { renderWithProviders, screen, waitFor } from '../../client-setup/test-utils'
import { server } from '../../client-setup/msw-server'
import { http, HttpResponse } from 'msw'

it('should display data from API', async () => {
  server.use(
    http.get('*/cubejs-api/v1/load', () => {
      return HttpResponse.json({ data: [{ value: 42 }] })
    })
  )

  renderWithProviders(<MyComponent query={query} />)

  await waitFor(() => {
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
```

### Pattern 2: Component with Mocked Hooks (Unit)
Use for components with complex internal logic.

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../../src/client/hooks/useMyHook', () => ({
  useMyHook: vi.fn(() => ({ data: mockData, isLoading: false }))
}))

it('should render data from hook', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### Pattern 3: User Interaction Testing
Use `userEvent` for realistic interactions.

```typescript
import userEvent from '@testing-library/user-event'

it('should open modal on button click', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)

  await user.click(screen.getByRole('button', { name: /open/i }))

  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

### Pattern 4: Keyboard Navigation
Test accessibility.

```typescript
it('should navigate with keyboard', async () => {
  const user = userEvent.setup()
  render(<FieldList fields={fields} />)

  // Focus first item
  await user.tab()
  expect(screen.getByText('Field 1')).toHaveFocus()

  // Navigate down
  await user.keyboard('{ArrowDown}')
  expect(screen.getByText('Field 2')).toHaveFocus()

  // Select with Enter
  await user.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledWith('field2')
})
```

---

## Agent Task Template

When assigning testing tasks to agents, use this template:

```markdown
## Task: Test [ComponentName]

### Component Location
`src/client/components/[path]/[ComponentName].tsx`

### Test File Location
`tests/client/components/[path]/[ComponentName].test.tsx`

### Component Purpose
[Brief description of what the component does]

### Test Requirements
1. [ ] Test case 1: [description]
2. [ ] Test case 2: [description]
3. [ ] Test case 3: [description]

### Testing Pattern
Use Pattern [1/2/3/4] from COMPONENT_TESTING_PLAN.md

### Props/Dependencies
- `prop1`: [type] - [description]
- Uses hook: `useXxx` - [mock or use MSW]

### Acceptance Criteria
- All tests pass
- Tests focus on user behavior, not implementation
- No snapshot tests
- Follows existing test patterns in the codebase
```

---

## Estimated Total Tests

| Phase | Components | Est. Tests | Priority |
|-------|------------|------------|----------|
| Phase 1 | 4 | ~30 | HIGH |
| Phase 2 | 4 | ~40 | HIGH |
| Phase 3 | 6 | ~60 | MEDIUM-HIGH |
| Phase 4 | 5 | ~50 | MEDIUM |
| Phase 5 | 4 | ~40 | MEDIUM |
| Phase 6 | 3 | ~20 | LOW |
| **Total** | **26** | **~240** | |

---

## Success Metrics

After all phases:
- **Line coverage**: Target 50-60% (up from 27%)
- **Branch coverage**: Target 40-50% (up from 21%)
- **Meaningful coverage**: All user-facing workflows have at least one test path

**Remember**: 50% meaningful coverage is better than 80% coverage full of implementation-detail tests that break on every refactor.
