# Phase 4: Dashboard Components

**Priority**: MEDIUM
**Estimated Tests**: ~50
**Status**: COMPLETE (134 tests implemented)
**Dependencies**: Phase 1 (Modal, ConfirmModal), Phase 2 (charts)

## Overview

Dashboard layout and editing components. Focus on edit mode interactions, portlet management, and layout changes - NOT on react-grid-layout internals.

---

## Task 4.1: DashboardPortletCard

### Component
`src/client/components/DashboardPortletCard.tsx` (~481 lines)

### Test File
`tests/client/components/DashboardPortletCard.test.tsx`

### Purpose
Container for individual dashboard portlets with edit controls, title, and actions.

### Test Cases

```typescript
describe('DashboardPortletCard', () => {
  const defaultProps = {
    id: 'portlet-1',
    title: 'Sales Overview',
    isEditMode: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTitleChange: vi.fn(),
    children: <div>Chart Content</div>
  }

  describe('view mode (isEditMode=false)', () => {
    it('should render title')
    it('should render children (chart content)')
    it('should NOT show edit button')
    it('should NOT show delete button')
    it('should NOT allow title editing')
  })

  describe('edit mode (isEditMode=true)', () => {
    it('should show edit button')
    it('should show delete button')
    it('should call onEdit when edit button clicked')
    it('should show confirm dialog when delete clicked')
    it('should call onDelete after confirmation')
    it('should NOT call onDelete if confirmation cancelled')
  })

  describe('inline title editing', () => {
    it('should enter edit mode when title double-clicked in edit mode')
    it('should show input field with current title')
    it('should save title on Enter')
    it('should save title on blur')
    it('should cancel edit on Escape')
    it('should call onTitleChange with new title')
  })

  describe('loading state', () => {
    it('should show loading overlay when isLoading=true')
    it('should dim content when loading')
  })

  describe('error state', () => {
    it('should show error indicator when hasError=true')
    it('should show retry option on error')
  })

  describe('actions menu', () => {
    it('should show actions menu button')
    it('should open menu when clicked')
    it('should include refresh action')
    it('should include fullscreen action')
    it('should include download action')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

```typescript
import userEvent from '@testing-library/user-event'

it('should enter title edit mode on double-click', async () => {
  const user = userEvent.setup()
  render(<DashboardPortletCard {...defaultProps} isEditMode={true} />)

  await user.dblClick(screen.getByText('Sales Overview'))

  expect(screen.getByRole('textbox')).toHaveValue('Sales Overview')
})
```

### Key Props
- `id: string`
- `title: string`
- `isEditMode: boolean`
- `onEdit: () => void`
- `onDelete: () => void`
- `onTitleChange: (title: string) => void`
- `isLoading?: boolean`
- `hasError?: boolean`
- `children: ReactNode`

---

## Task 4.2: FloatingEditToolbar

### Component
`src/client/components/FloatingEditToolbar.tsx` (~137 lines)

### Test File
`tests/client/components/FloatingEditToolbar.test.tsx`

### Purpose
Floating toolbar shown during dashboard edit mode with Save, Cancel, and Add actions.

### Test Cases

```typescript
describe('FloatingEditToolbar', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onAddPortlet: vi.fn(),
    hasUnsavedChanges: false,
    isSaving: false
  }

  describe('rendering', () => {
    it('should render Save button')
    it('should render Cancel button')
    it('should render Add Portlet button')
  })

  describe('save button', () => {
    it('should be disabled when hasUnsavedChanges=false')
    it('should be enabled when hasUnsavedChanges=true')
    it('should call onSave when clicked')
    it('should show loading spinner when isSaving=true')
    it('should be disabled when isSaving=true')
  })

  describe('cancel button', () => {
    it('should call onCancel when clicked')
    it('should show confirmation if hasUnsavedChanges=true')
    it('should not show confirmation if hasUnsavedChanges=false')
  })

  describe('add portlet button', () => {
    it('should call onAddPortlet when clicked')
  })

  describe('positioning', () => {
    it('should be fixed at bottom of screen')
    it('should be centered horizontally')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `onSave: () => void`
- `onCancel: () => void`
- `onAddPortlet: () => void`
- `hasUnsavedChanges: boolean`
- `isSaving: boolean`

---

## Task 4.3: DashboardEditModal

### Component
`src/client/components/DashboardEditModal.tsx` (~200 lines)

### Test File
`tests/client/components/DashboardEditModal.test.tsx`

### Purpose
Modal for editing dashboard metadata (title, description) and settings.

### Test Cases

```typescript
describe('DashboardEditModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialValues: {
      title: 'My Dashboard',
      description: 'Dashboard description'
    }
  }

  describe('form fields', () => {
    it('should show title input with initial value')
    it('should show description textarea with initial value')
    it('should update title as user types')
    it('should update description as user types')
  })

  describe('validation', () => {
    it('should require title')
    it('should show error when title is empty')
    it('should allow empty description')
  })

  describe('submission', () => {
    it('should call onSave with updated values')
    it('should close modal after save')
    it('should not save if validation fails')
  })

  describe('cancellation', () => {
    it('should call onClose when cancel clicked')
    it('should reset form to initial values on cancel')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

---

## Task 4.4: PortletAnalysisModal

### Component
`src/client/components/PortletAnalysisModal.tsx` (~300 lines)

### Test File
`tests/client/components/PortletAnalysisModal.test.tsx`

### Purpose
Modal containing AnalysisBuilder for creating/editing portlet configurations.

### Test Cases

```typescript
describe('PortletAnalysisModal', () => {
  describe('create mode', () => {
    it('should show empty AnalysisBuilder')
    it('should show "Add Portlet" title')
    it('should enable Save when valid query configured')
    it('should call onCreate with new portlet config')
  })

  describe('edit mode', () => {
    it('should populate AnalysisBuilder with existing config')
    it('should show "Edit Portlet" title')
    it('should call onUpdate with modified config')
  })

  describe('preview', () => {
    it('should show chart preview as user configures')
    it('should update preview when query changes')
  })

  describe('closing', () => {
    it('should warn about unsaved changes')
    it('should close without warning if no changes')
  })
})
```

### Testing Pattern
Use Pattern 2 (Mocked Hooks) - mock AnalysisBuilder internals.

---

## Task 4.5: CompactFilterBar

### Component
`src/client/components/DashboardFilters/CompactFilterBar.tsx` (~456 lines)

### Test File
`tests/client/components/DashboardFilters/CompactFilterBar.test.tsx`

### Purpose
Horizontal bar showing active dashboard filters as chips with quick edit capabilities.

### Test Cases

```typescript
describe('CompactFilterBar', () => {
  const mockFilters = [
    { id: '1', field: 'Users.status', operator: 'equals', values: ['active'] },
    { id: '2', field: 'Orders.date', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
  ]

  describe('filter chips', () => {
    it('should render chip for each active filter')
    it('should show field name on chip')
    it('should show filter value on chip')
    it('should truncate long values')
  })

  describe('chip interactions', () => {
    it('should open filter editor when chip clicked')
    it('should remove filter when X clicked on chip')
    it('should show confirmation before removing')
  })

  describe('add filter', () => {
    it('should show "Add filter" button')
    it('should open filter modal when clicked')
  })

  describe('clear all', () => {
    it('should show "Clear all" when multiple filters exist')
    it('should remove all filters when clicked')
    it('should show confirmation before clearing')
  })

  describe('date filters', () => {
    it('should show date range as readable text')
    it('should show preset name if applicable (e.g., "Last 7 days")')
  })

  describe('overflow', () => {
    it('should show "+N more" when many filters')
    it('should expand to show all on click')
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `filters: DashboardFilter[]`
- `onFilterChange: (filters: DashboardFilter[]) => void`
- `onAddFilter: () => void`
- `availableFields: FieldMeta[]`

---

## Setup Requirements

1. Mock the dashboard store:
```typescript
vi.mock('../../../src/client/stores/dashboardStore', () => ({
  useDashboardStore: vi.fn((selector) => selector(mockDashboardState))
}))
```

2. Create portlet config fixtures:
```typescript
export const mockPortletConfig = {
  id: 'portlet-1',
  title: 'Sales Chart',
  query: JSON.stringify({ measures: ['Sales.total'] }),
  chartType: 'bar',
  w: 6,
  h: 4,
  x: 0,
  y: 0
}
```

---

## Acceptance Criteria

- [x] All test cases pass (134 tests total)
- [x] Edit mode toggling is thoroughly tested
- [x] Confirmation dialogs are tested for destructive actions
- [x] Inline editing (title) works correctly
- [x] Form validation is tested
- [x] No tests for react-grid-layout drag/drop internals

## Completion Status

**COMPLETED: 2026-01-28**

### Test Summary
- **DashboardPortletCard.test.tsx**: 25 tests
- **FloatingEditToolbar.test.tsx**: 28 tests
- **DashboardEditModal.test.tsx**: 29 tests
- **PortletAnalysisModal.test.tsx**: 28 tests
- **CompactFilterBar.test.tsx**: 24 tests
- **Total**: 134 tests (all passing)

---

## File Structure After Completion

```
tests/client/components/
├── DashboardPortletCard.test.tsx
├── FloatingEditToolbar.test.tsx
├── DashboardEditModal.test.tsx
├── PortletAnalysisModal.test.tsx
└── DashboardFilters/
    └── CompactFilterBar.test.tsx
```
