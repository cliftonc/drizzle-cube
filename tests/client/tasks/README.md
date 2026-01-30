# Client Component Testing Tasks

This directory contains self-contained task files for implementing client component tests. Each phase can be assigned to an agent for parallel execution.

## Quick Start

1. Pick a phase based on priority
2. Read the phase file completely
3. Create test files as specified
4. Run tests with `npm run test:client -- --run [test-file]`
5. Mark tasks complete in the phase file

---

## Phase Overview

| Phase | File | Priority | Est. Tests | Actual | Status |
|-------|------|----------|------------|--------|--------|
| 1 | [PHASE_1_INFRASTRUCTURE.md](./PHASE_1_INFRASTRUCTURE.md) | HIGH | ~30 | 59 | ✅ Complete |
| 2 | [PHASE_2_DATA_DISPLAY.md](./PHASE_2_DATA_DISPLAY.md) | HIGH | ~40 | 109 | ✅ Complete |
| 3 | [PHASE_3_ANALYSIS_BUILDER.md](./PHASE_3_ANALYSIS_BUILDER.md) | MEDIUM-HIGH | ~60 | 161 | ✅ Complete |
| 4 | [PHASE_4_DASHBOARD.md](./PHASE_4_DASHBOARD.md) | MEDIUM | ~50 | 134 | ✅ Complete |
| 5 | [PHASE_5_FILTERS.md](./PHASE_5_FILTERS.md) | MEDIUM | ~40 | 86 | ✅ Complete |
| 6 | [PHASE_6_CHART_DATA.md](./PHASE_6_CHART_DATA.md) | LOW | ~20 | 28 | ✅ Complete |

**Estimated Tests**: ~240
**Actual Tests**: 577+

---

## Dependencies

```
Phase 1 (Infrastructure) ─┬─> Phase 2 (Data Display)
                          │
                          ├─> Phase 3 (AnalysisBuilder)
                          │
                          ├─> Phase 4 (Dashboard)
                          │
                          └─> Phase 5 (Filters)

Phase 6 (Chart Data) - No dependencies, optional
```

**Recommended Order**: 1 → 2 → (3, 4, 5 in parallel) → 6

---

## Before Starting Any Phase

### 1. Ensure Test Infrastructure is Set Up

```bash
# Verify MSW is installed
npm ls msw

# Verify test utilities exist
ls tests/client-setup/
# Should see: setup.ts, msw-handlers.ts, msw-server.ts, test-utils.tsx
```

### 2. Read the Testing Plan

Review `tests/client/COMPONENT_TESTING_PLAN.md` for:
- Testing philosophy (quality over coverage)
- What to test vs. what to skip
- Testing patterns with examples

### 3. Understand the Testing Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Pattern 1: MSW Integration | Components that fetch data | useCubeLoadQuery tests |
| Pattern 2: Mocked Hooks | Complex stateful components | AnalysisBuilder tests |
| Pattern 3: User Interaction | UI interactions | Modal, Form tests |
| Pattern 4: Keyboard Nav | Accessibility testing | FieldSearchModal tests |

---

## Running Tests

```bash
# Run all client tests
npm run test:client

# Run specific test file
npm run test:client -- --run tests/client/components/Modal.test.tsx

# Run with coverage
npm run test:client -- --coverage

# Watch mode during development
npm run test:client -- --watch tests/client/components/Modal.test.tsx
```

---

## Test File Naming Convention

```
tests/client/components/
├── [ComponentName].test.tsx          # Top-level components
├── charts/
│   └── [ChartName].test.tsx          # Chart components
├── shared/
│   └── [SharedComponent].test.tsx    # Shared/reusable components
└── AnalysisBuilder/
    └── [ABComponent].test.tsx        # AnalysisBuilder components
```

---

## Quality Checklist (Per Test File)

Before marking a phase task complete:

- [ ] All specified test cases are implemented
- [ ] Tests use accessible queries (`getByRole`, `getByLabelText`)
- [ ] Tests use `userEvent` for interactions (not `fireEvent`)
- [ ] No snapshot tests
- [ ] No tests for CSS styling
- [ ] Edge cases covered (null, empty, error states)
- [ ] Tests are independent (no shared state between tests)
- [ ] Tests run in <5 seconds

---

## Updating Progress

After completing tests, update the phase file:

```markdown
## Task 1.1: ChartErrorBoundary

### Status: ✅ COMPLETE

### Test File
`tests/client/components/ChartErrorBoundary.test.tsx`

### Tests Written
- ✅ should render children when no error occurs
- ✅ should catch errors and render fallback
- ✅ should display error message
- ✅ should reset on retry
- ✅ should call onError callback

### Notes
- Had to mock console.error to suppress expected errors in output
```

---

## Troubleshooting

### MSW Not Intercepting Requests

```typescript
// Ensure server is listening in setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
```

### Tests Timing Out

```typescript
// Increase timeout for slow tests
it('should do something', async () => {
  // ...
}, 10000) // 10 second timeout
```

### Store State Bleeding Between Tests

```typescript
// Reset store in beforeEach
beforeEach(() => {
  vi.clearAllMocks()
  // Reset store state
})
```

### React Act Warnings

```typescript
// Wrap state updates in act()
import { act } from '@testing-library/react'

await act(async () => {
  await user.click(button)
})
```

---

## Getting Help

- **Testing Patterns**: See `tests/client/COMPONENT_TESTING_PLAN.md`
- **MSW Examples**: See `tests/client/hooks/useCubeLoadQuery.test.tsx`
- **Store Mocking**: See `tests/client/AnalyticsPortlet.test.tsx`
- **Existing Tests**: Browse `tests/client/` for patterns
