# Phase 1: Infrastructure Components

**Priority**: HIGH
**Estimated Tests**: ~30
**Dependencies**: None (foundational)
**Status**: COMPLETE (59 tests implemented)

## Overview

These are foundational components that other components depend on. Test thoroughly as they affect the entire application's reliability.

---

## Task 1.1: ChartErrorBoundary - COMPLETE

### Component
`src/client/components/ChartErrorBoundary.tsx` (~89 lines)

### Test File
`tests/client/components/ChartErrorBoundary.test.tsx`

### Purpose
React error boundary that catches rendering errors in chart components and displays a fallback UI instead of crashing the entire dashboard.

### Tests Implemented (11 tests)

```typescript
describe('ChartErrorBoundary', () => {
  describe('error catching', () => {
    it('should render children when no error occurs') // PASS
    it('should catch errors from child components and render fallback') // PASS
    it('should display the error message in fallback UI') // PASS
    it('should display custom portlet title in error message when provided') // PASS
    it('should render custom fallback when provided') // PASS
  })

  describe('recovery', () => {
    it('should reset error state when retry button is clicked') // PASS
    it('should have a try again button in the error UI') // PASS
    it('should attempt to re-render when try again button is clicked') // PASS
  })

  describe('error reporting', () => {
    it('should log errors to console when error is caught') // PASS
  })

  describe('debug information', () => {
    it('should show portlet configuration details when provided') // PASS
    it('should show cube query details when provided') // PASS
  })
})
```

### Testing Pattern
Use Pattern 2 (Mocked Hooks) - Create a component that throws to test error boundary.

```typescript
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error')
  return <div>Content</div>
}
```

### Key Props
- `children: ReactNode` - Components to wrap
- `fallback?: ReactNode` - Custom fallback UI
- `portletTitle?: string` - Title to show in error message
- `portletConfig?: any` - Debug info for portlet configuration
- `cubeQuery?: string` - Debug info for cube query

---

## Task 1.2: Modal - COMPLETE

### Component
`src/client/components/Modal.tsx` (~150 lines)

### Test File
`tests/client/components/Modal.test.tsx`

### Purpose
Reusable modal dialog with overlay, keyboard handling, and focus management.

### Tests Implemented (17 tests)

```typescript
describe('Modal', () => {
  describe('visibility', () => {
    it('should render children when isOpen is true') // PASS
    it('should not render anything when isOpen is false') // PASS
    it('should render overlay when isOpen is true') // PASS
  })

  describe('closing', () => {
    it('should call onClose when overlay is clicked') // PASS
    it('should call onClose when Escape key is pressed') // PASS
    it('should NOT call onClose when clicking inside modal content') // PASS
    it('should NOT call onClose on Escape when closeOnEscape is false') // PASS
    it('should NOT call onClose on backdrop click when closeOnBackdropClick is false') // PASS
    it('should call onClose when close button is clicked') // PASS
  })

  describe('accessibility', () => {
    it('should have role="dialog"') // PASS
    it('should have aria-modal="true"') // PASS
    it('should have aria-labelledby when title is provided') // PASS
    it('should prevent body scroll when modal is open') // PASS
    it('should restore body scroll when modal is closed') // PASS
  })

  describe('customization', () => {
    it('should render custom title when provided') // PASS
    it('should not show close button when showCloseButton is false') // PASS
    it('should render footer when provided') // PASS
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction) with `userEvent`.

```typescript
import userEvent from '@testing-library/user-event'

it('should close on Escape', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<Modal isOpen={true} onClose={onClose}><div>Content</div></Modal>)

  await user.keyboard('{Escape}')

  expect(onClose).toHaveBeenCalled()
})
```

### Key Props
- `isOpen: boolean` - Controls visibility
- `onClose: () => void` - Close callback
- `title?: string` - Modal title
- `children: ReactNode` - Modal content
- `closeOnBackdropClick?: boolean` - Default true
- `closeOnEscape?: boolean` - Default true
- `showCloseButton?: boolean` - Default true
- `footer?: ReactNode` - Footer content

---

## Task 1.3: ConfirmModal - COMPLETE

### Component
`src/client/components/ConfirmModal.tsx` (~83 lines)

### Test File
`tests/client/components/ConfirmModal.test.tsx`

### Purpose
Specialized modal for confirmation dialogs with confirm/cancel actions.

### Tests Implemented (23 tests)

```typescript
describe('ConfirmModal', () => {
  describe('rendering', () => {
    it('should display title') // PASS
    it('should display message') // PASS
    it('should display confirm button with custom text') // PASS
    it('should display cancel button with custom text') // PASS
    it('should use default button text when not provided') // PASS
    it('should use default title when not provided') // PASS
    it('should not render when isOpen is false') // PASS
  })

  describe('actions', () => {
    it('should call onConfirm when confirm button is clicked') // PASS
    it('should call onClose when cancel button is clicked') // PASS
    it('should call onClose when modal is closed via Escape key') // PASS
    it('should call onClose when backdrop is clicked') // PASS
    it('should call onClose after onConfirm completes') // PASS
    it('should handle async onConfirm') // PASS
  })

  describe('states', () => {
    it('should show loading state on confirm button when isLoading is true') // PASS
    it('should disable confirm button when isLoading is true') // PASS
    it('should disable cancel button when isLoading is true') // PASS
    it('should not close on Escape when isLoading is true') // PASS
    it('should not close on backdrop click when isLoading is true') // PASS
  })

  describe('variants', () => {
    it('should apply danger styling when confirmVariant is "danger"') // PASS
    it('should apply warning styling when confirmVariant is "warning"') // PASS
    it('should apply primary styling when confirmVariant is "primary" (default)') // PASS
    it('should default to primary styling when confirmVariant is not provided') // PASS
  })

  describe('message content', () => {
    it('should support React nodes as message') // PASS
  })
})
```

### Testing Pattern
Use Pattern 3 (User Interaction).

### Key Props
- `isOpen: boolean`
- `onConfirm: () => void | Promise<void>`
- `onClose: () => void`
- `title?: string` (default: "Confirm")
- `message: ReactNode`
- `confirmText?: string` (default: "Confirm")
- `cancelText?: string` (default: "Cancel")
- `confirmVariant?: 'primary' | 'danger' | 'warning'`
- `isLoading?: boolean`

---

## Task 1.4: LoadingIndicator - COMPLETE

### Component
`src/client/components/LoadingIndicator.tsx` (~45 lines)

### Test File
`tests/client/components/LoadingIndicator.test.tsx`

### Purpose
Accessible loading spinner with customizable size.

### Tests Implemented (8 tests)

```typescript
describe('LoadingIndicator', () => {
  describe('rendering', () => {
    it('should render a spinner element') // PASS
    it('should render with default size (md)') // PASS
    it('should render with small size when size="sm"') // PASS
    it('should render with large size when size="lg"') // PASS
  })

  describe('accessibility', () => {
    it('should have role="status"') // PASS
    it('should have aria-label for screen readers') // PASS
  })

  describe('customization', () => {
    it('should apply custom className') // PASS
    it('should preserve default classes when custom className is added') // PASS
  })
})
```

### Testing Pattern
Use basic render testing - this is a simple presentational component.

### Key Props
- `size?: 'sm' | 'md' | 'lg'`
- `className?: string`

---

## Setup Requirements

Before writing tests, ensure you have:

1. Read the component source code
2. Imported test utilities:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
```

3. For Modal/ConfirmModal, you may need to mock Portal:
```typescript
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node
  }
})
```

---

## Acceptance Criteria

- [x] All test cases pass
- [x] Tests use `screen` queries (not container queries)
- [x] Tests use accessible queries (`getByRole`, `getByLabelText`) where possible
- [x] No snapshot tests
- [x] No tests for CSS/styling
- [x] Error boundary tests properly catch and verify errors
- [x] Modal tests verify keyboard interactions work

---

## File Structure After Completion

```
tests/client/components/
├── ChartErrorBoundary.test.tsx  (11 tests)
├── Modal.test.tsx               (17 tests)
├── ConfirmModal.test.tsx        (23 tests)
├── LoadingIndicator.test.tsx    (8 tests)
└── drill-components.test.tsx    (existing)
```

---

## Summary

| Component | Tests | Status |
|-----------|-------|--------|
| ChartErrorBoundary | 11 | PASS |
| Modal | 17 | PASS |
| ConfirmModal | 23 | PASS |
| LoadingIndicator | 8 | PASS |
| **Total** | **59** | **ALL PASS** |

Run tests: `npm run test:client -- --run tests/client/components/`
