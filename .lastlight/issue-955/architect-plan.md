# Architect Plan — Issue #955: Shared "time since" helper

## Problem Statement

- Shared date utilities live in `src/shared/date-utils.ts:1–229` (relative date range parsing, range formatting, prior-period calculation), but there is **no helper for formatting a single timestamp as a human-readable "time since" string**.
- The dashboard cache indicator currently computes a rough "seconds ago" value inline in `src/client/components/dashboardPortletCard/PortletCardHeader.tsx:35–45` using `Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000)` and hard-coded English text, which is not reusable and makes it hard to improve or standardise behaviour.
- Issue #955 requests a reusable helper that, given a timestamp, returns a concise human-readable description of how long ago (or from now) it is, so both server and client code can avoid duplicating date-difference logic.

## Summary of what needs to change

- Extend `src/shared/date-utils.ts` with a new exported helper that, given a timestamp and optional `now`, returns an English, human-readable relative time string (e.g. `"5 seconds ago"`, `"10 minutes ago"`, `"2 weeks ago"`, `"in 3 hours"`).
- Ensure the helper is **side-effect free and DB-independent**, with clear, documented behaviour for past vs future timestamps and invalid inputs.
- Add a **DB-free Vitest test suite** under `tests/cli/` that exercises the helper across boundary cases (seconds → minutes → hours → days → weeks → months → years), multiple input types, past vs future, and invalid inputs.
- Optionally adopt the helper in the cache indicator tooltip in `PortletCardHeader` so that at least one UI call-site benefits immediately and serves as a reference usage.

## Files to modify (exhaustive)

### 1. Shared date utilities

#### `src/shared/date-utils.ts`

_Current contents:_ Relative date-range parsing (`parseRelativeDateRange`), generic date range parsing (`parseDateRange`), cube date formatting (`formatDateForCube`), and prior-period calculation (`calculatePriorPeriod`). No single-timestamp human-readable helper exists.

Planned changes:

- **Add new exported types** near the bottom of the file, alongside the other exports:
  - `export type TimeSinceInput = Date | string | number`
  - `export interface FormatTimeSinceOptions { now?: Date }`
- **Add a new exported helper** below `calculatePriorPeriod` (keeping all date helpers collocated):
  - **Name:** `formatTimeSince`.
  - **Signature:**
    - `export function formatTimeSince(input: TimeSinceInput, options?: FormatTimeSinceOptions): string`
  - **Input handling:**
    - Accept `Date`, ISO-like `string`, or numeric epoch milliseconds (`number`).
    - Resolve the reference time as `const now = options?.now ?? new Date()` to make tests deterministic while defaulting to the current time for normal usage.
    - Normalise `input`:
      - If `input` is a `Date`, use it as-is.
      - If `input` is a `string` or `number`, construct `new Date(input)`.
    - If the resulting date is invalid (`isNaN(target.getTime())` is true) or `input` is `null`/`undefined` (guard defensively), **throw an `Error('formatTimeSince: invalid date input')`** rather than returning a misleading string (this is explicit warn-and-surface behaviour).
  - **Difference calculation:**
    - Compute `const diffMs = now.getTime() - target.getTime()`.
    - If `diffMs === 0`, return `'just now'` directly.
    - Determine `const isFuture = diffMs < 0` and `const absMs = Math.abs(diffMs)` so bucket logic is symmetric for past and future.
    - Derive units from `absMs`:
      - `const seconds = Math.floor(absMs / 1000)`
      - `const minutes = Math.floor(seconds / 60)`
      - `const hours = Math.floor(minutes / 60)`
      - `const days = Math.floor(hours / 24)`
  - **Bucket selection and pluralisation:**
    - Implement internal helper `const formatUnit = (value: number, unit: string) => value === 1 ? `${value} ${unit}` : `${value} ${unit}s``.
    - Choose the display unit according to these thresholds (examples are past-tense; future uses the same magnitudes):
      - `< 60` seconds → `N second(s)` (e.g. `5 seconds ago`).
      - `< 60` minutes → `N minute(s)` (e.g. `10 minutes ago`).
      - `< 24` hours → `N hour(s)` (e.g. `1 hour ago`).
      - `< 14` days → `N day(s)` (e.g. `10 days ago`).
      - `< 60` days → `N week(s)` using `Math.floor(days / 7)` with a minimum of 1 (so 14–20 days → `2 weeks`, etc.).
      - `< 365` days → `N month(s)` using `Math.floor(days / 30)` with a minimum of 1.
      - `>= 365` days → `N year(s)` using `Math.floor(days / 365)` with a minimum of 1.
  - **Final string construction:**
    - For **past** timestamps (`!isFuture`): return `"<value> <unit> ago"` (e.g. `"5 seconds ago"`).
    - For **future** timestamps (`isFuture`): return `"in <value> <unit>"` (e.g. `"in 3 hours"`).
    - Document behaviour for `diffMs === 0` (`'just now'`).
  - **Documentation comments:**
    - Add a JSDoc block describing the helper, supported input types, past vs future handling, and the fact that it is intentionally **English-only** and returns plain strings (callers that need localisation should either treat this as an internal helper or wrap it with the i18n runtime).

### 2. Client cache indicator (optional but recommended wiring)

#### `src/client/components/dashboardPortletCard/PortletCardHeader.tsx`

_Current contents:_ The `CacheIndicator` component computes a seconds-delta tooltip inline:

```ts
function CacheIndicator({ cachedAt }: { cachedAt: string }) {
  return (
    <span
      className="dc:p-1 text-dc-text-muted dc:opacity-40"
      title={`Cached ${Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000)}s ago`}
    >
      {/* icon */}
    </span>
  )
}
```

Planned changes:

- **Import the shared helper** at the top of the file:
  - `import { formatTimeSince } from '../../../shared/date-utils.js'`
- **Update the `CacheIndicator` tooltip** to use the helper instead of ad hoc math:
  - Replace the `title` prop value with something like:

    ```tsx
    title={`Cached ${formatTimeSince(cachedAt)}`}
    ```

  - This will change the tooltip from `"Cached 5s ago"` to `"Cached 5 seconds ago"`, but keeps the overall meaning while delegating the time-difference logic to the shared helper.
- No other parts of the component need to change; this call site simply serves as the canonical example of `formatTimeSince` usage.

### 3. CLI / DB-free tests (new file + group enumeration)

#### `tests/cli/time-since-helper.test.ts` (new)

Planned contents:

- New Vitest suite covering `formatTimeSince` with a **fixed `now` reference** so the tests are deterministic:
  - Define `const fixedNow = new Date('2024-01-15T12:00:00Z')` in the test file.
  - Helper within the test: `const fmt = (input: Date | string | number) => formatTimeSince(input, { now: fixedNow })`.
- Test cases:
  - **Seconds:**
    - `fixedNow` minus 5 seconds → `'5 seconds ago'`.
    - `fixedNow` minus 1 second → `'1 second ago'`.
  - **Minutes:**
    - `fixedNow` minus 10 minutes → `'10 minutes ago'`.
    - Boundary from seconds to minutes (e.g. 59 seconds vs 60 seconds).
  - **Hours:**
    - `fixedNow` minus 1 hour → `'1 hour ago'`.
    - `fixedNow` minus 23 hours → `'23 hours ago'`.
  - **Days vs weeks:**
    - `fixedNow` minus 10 days → `'10 days ago'`.
    - `fixedNow` minus 14 days → `'2 weeks ago'`.
  - **Months:**
    - `fixedNow` minus ~45 days → `'1 month ago'`.
    - `fixedNow` minus ~90 days → `'3 months ago'`.
  - **Years:**
    - `fixedNow` minus ~400 days → `'1 year ago'`.
    - `fixedNow` minus ~800 days → `'2 years ago'`.
  - **Future timestamps:**
    - `fixedNow` plus 30 seconds → `'in 30 seconds'`.
    - `fixedNow` plus 2 days → `'in 2 days'`.
  - **Input type variants:**
    - Call with `Date`, ISO string (e.g. `'2024-01-15T11:59:55Z'`), and numeric timestamp (`fixedNow.getTime() - 5000`) and assert they all produce the same output for equivalent instants.
  - **Invalid inputs (warn-and-surface):**
    - Call with an invalid date string (e.g. `'not-a-date'`) and assert it throws a descriptive error (e.g. `toThrow(/formatTimeSince: invalid date input/)`).
    - Call with `NaN` as number and assert it throws.
- Import path:
  - `import { formatTimeSince } from '../../src/shared/date-utils.js'`
- This test file should remain **DB-free**: no imports from server executors, no global test DB setup, keeping it in the lightweight `cli` Vitest project.

#### `tests/cli/charts-list.test.ts` (existing, unchanged)

- This file is the existing CLI-oriented test; it does not need code changes for this issue, but is listed here to fully enumerate the `tests/cli/` group, which after this change will contain:
  - `tests/cli/charts-list.test.ts`
  - `tests/cli/time-since-helper.test.ts` (new)

## Commands

Executors should use the established guardrail commands from `.lastlight/issue-955/guardrails-report.md` to validate changes:

- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests (full suite): `npm test`

For quick, targeted feedback while iterating on this helper, it is also appropriate to run:

- CLI-only tests: `npm run test:cli`

## Implementation approach (step-by-step)

1. **Extend `src/shared/date-utils.ts` with the new API:**
   - Define `TimeSinceInput` and `FormatTimeSinceOptions` types near the other exports.
   - Implement and export `formatTimeSince` below `calculatePriorPeriod`, following the input normalisation, diff calculation, bucket thresholds, and pluralisation rules described above.
   - Keep the implementation free of any framework/i18n dependencies so it remains usable in both server and client contexts.

2. **Implement robust input parsing and validation:**
   - Normalise the `input` into a `Date` instance (handling `Date`, `string`, and `number`).
   - If the computed `Date` is invalid, throw `Error('formatTimeSince: invalid date input')` to **warn-and-surface** misuse instead of silently returning a fallback.
   - Resolve `now` from `options.now` with a default of `new Date()` so callers can inject a stable reference during testing.

3. **Compute the time difference and select the bucket:**
   - Compute `diffMs`, `isFuture`, and the derived units (`seconds`, `minutes`, `hours`, `days`).
   - Implement the bucket thresholds (seconds, minutes, hours, days, weeks, months, years) exactly as specified so behaviour is predictable around boundary transitions (e.g. 10 days vs 2 weeks vs 1 month).
   - Implement the small `formatUnit` helper inside `formatTimeSince` to centralise pluralisation.

4. **Construct final strings:**
   - Use `'just now'` for the `diffMs === 0` case.
   - For past timestamps, build `"<value> <unit> ago"`; for future timestamps, build `"in <value> <unit>"`.
   - Add JSDoc comments explaining that the helper is English-only, and that callers who need localisation should wrap or adapt it rather than using its output directly in translatable UI.

5. **Wire the helper into `PortletCardHeader` (cache indicator):**
   - Add the `formatTimeSince` import from `src/shared/date-utils.ts`.
   - Replace the inline seconds-delta calculation in the `CacheIndicator` `title` prop with `title={`Cached ${formatTimeSince(cachedAt)}`}`.
   - Manually verify that the tooltip string still reads sensibly (e.g. `"Cached 5 seconds ago"`) and that the component’s public API is unchanged.

6. **Add tests in `tests/cli/time-since-helper.test.ts`:**
   - Implement the Vitest suite as described above, using a fixed `now` reference to make expectations stable.
   - Cover all bucket boundaries, pluralisation paths, future timestamps, multiple input representations, and invalid-input error paths.

7. **Run tests and quality gates:**
   - Run `npm run test:cli` to validate the new helper’s tests in isolation.
   - Run `npm run lint` and `npm run typecheck` to ensure style and type-safety expectations are met.
   - Run `npm test` to confirm the full test suite (once test databases are available) still passes and nothing else regressed.

## Risks and edge cases

- **Invalid inputs (non-date / unparsable):**
  - Behaviour: **warn-and-surface** by throwing `Error('formatTimeSince: invalid date input')` when `input` cannot be parsed into a valid `Date` (invalid strings, `NaN`, `null`/`undefined`).
  - Rationale: returning a default like `'0 seconds ago'` would silently mask caller bugs and is considered an error.

- **Future timestamps:**
  - Behaviour: **warn-and-surface via output**, not by throwing. The helper returns phrases like `"in 5 minutes"` or `"in 2 days"` when `input` is after `now`.
  - Rationale: future times are valid (e.g. scheduled jobs, expiries); they should not be coerced into past tense or ignored.

- **Zero-difference timestamps:**
  - Behaviour: when `input` equals `now` to the millisecond, return `'just now'`.
  - This is explicit user-facing output; no case is silently skipped.

- **Very large differences (many years):**
  - Behaviour: use the `years` bucket with `Math.floor(days / 365)` so that large spans surface as `"10 years ago"`, `"20 years ago"`, etc.
  - There is no truncation or clamping; the full magnitude is surfaced.

- **Localisation / i18n:**
  - This helper returns **English-only strings** and does not integrate with the `src/i18n` runtime.
  - Behaviour: callers needing translated text should either:
    - Treat this as an internal helper and convert its structured behaviour into i18n keys elsewhere, or
    - Use it only in contexts where English text is acceptable (e.g. internal tooling, debug UIs such as the cache indicator tooltip).
  - The helper itself does not attempt localisation; it always returns explicit text rather than silently skipping unsupported locales.

- **Time zone considerations:**
  - Behaviour: the function uses `Date` epoch milliseconds directly and does not normalise to UTC; `formatTimeSince` is purely about absolute elapsed time, independent of timezone.
  - Callers are responsible for ensuring the `input` timestamp is the correct instant (e.g. already in UTC or appropriately converted).

## Test strategy

- **Unit tests (DB-free, under `tests/cli/`):**
  - Verify correct output for each time bucket (seconds, minutes, hours, days, weeks, months, years) with a fixed `now`.
  - Verify pluralisation for values of 1 vs >1 across multiple units.
  - Verify that future timestamps return `"in <value> <unit>"` rather than throwing or being treated as past.
  - Verify that invalid inputs (unparsable strings, `NaN`, `null`/`undefined`) throw errors rather than returning misleading defaults.
  - Verify that different input shapes (Date, string, number) produce identical outputs for the same instant.

- **Regression / integration confidence:**
  - Run `npm run test:cli` to confirm the helper’s own tests pass quickly.
  - Run `npm run lint` and `npm run typecheck` to validate code quality and type correctness.
  - Run `npm test` (with the appropriate DB setup) to ensure no unintended side effects on existing server/client behaviour.

## Estimated complexity

- **Estimated complexity:** simple
- Changes are limited to one shared utility module, one React component wiring change, and one new DB-free test file; no API surfaces or database interactions are modified.