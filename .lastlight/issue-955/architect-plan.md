# Architect Plan — Issue #955: Time-since helper

## Problem Statement

- The codebase has shared date utilities in `src/shared/date-utils.ts:1–229` (relative date range parsing, range formatting, prior-period calculation) but **no helper for formatting a single timestamp as a human-readable "time since" string** (e.g. "5 seconds ago", "2 weeks ago").
- Issue #955 requests a reusable helper that, given a timestamp in the past, returns a concise human-readable description of how long ago it was (e.g. seconds/minutes/hours/days/weeks/months/years), suitable for both server and client usage.
- Consumers today would need to reimplement this logic ad hoc, risking inconsistent thresholds and pluralisation rules across the project.

## Summary of what needs to change

- Add a shared utility function in `src/shared/date-utils.ts` that takes a timestamp (Date / string / number) and returns a human-readable relative time string such as "5 seconds ago", "10 minutes ago", "1 hour ago", "10 days ago", "2 weeks ago", etc.
- Design the helper to be **side-effect free and DB-independent**, usable from both server and client code, with clear semantics for past vs future timestamps and invalid input.
- Add a **DB-free Vitest test suite** under `tests/cli/` that exercises the helper across boundary cases (seconds → minutes → hours → days → weeks → months → years), different input types, past vs future, and invalid inputs.

## Files to modify (exhaustive)

### 1. Shared date utilities

#### `src/shared/date-utils.ts`

_Current contents:_ Relative date-range parsing (`parseRelativeDateRange` at `src/shared/date-utils.ts:25–181`), generic date range parsing (`parseDateRange` at `187–198`), cube date formatting (`formatDateForCube` at `200–205`), and prior-period calculation (`calculatePriorPeriod` at `214–229`). No single-timestamp human-readable helper exists.

Planned changes:

- **Add a new exported helper** near the bottom of the file (after `calculatePriorPeriod`):
  - **Name:** `formatTimeSince`.
  - **Signature:**
    - `export type TimeSinceInput = Date | string | number`
    - `export interface FormatTimeSinceOptions { now?: Date }`
    - `export function formatTimeSince(input: TimeSinceInput, options?: FormatTimeSinceOptions): string`
  - **Behaviour:**
    - Accept `Date`, ISO-like string, or numeric epoch milliseconds.
    - Resolve `now` as `options?.now ?? new Date()` to keep tests deterministic and avoid callers poking `Date.now`.
    - Parse `input`:
      - If `input` is `Date`, use as-is.
      - If `string` or `number`, construct `new Date(input)`.
      - If resulting date is `Invalid Date` (NaN) or `input` is `null`/`undefined`, **throw a descriptive `Error`** (see "Risks and edge cases" for warn-and-surface rationale).
    - Compute `diffMs = now.getTime() - target.getTime()`.
      - If `diffMs === 0`, return `'just now'`.
      - Determine `isFuture = diffMs < 0` and `absMs = Math.abs(diffMs)` so the same bucket logic is used for past and future.
    - Derive absolute units:
      - `const seconds = Math.floor(absMs / 1000)`
      - `const minutes = Math.floor(seconds / 60)`
      - `const hours = Math.floor(minutes / 60)`
      - `const days = Math.floor(hours / 24)`
    - Map the absolute difference into buckets with **example outputs matching the issue**:
      - `< 60 seconds` → `N second(s)` (e.g. `5 seconds ago`).
      - `< 60 minutes` → `N minute(s)` (e.g. `10 minutes ago`).
      - `< 24 hours` → `N hour(s)` (e.g. `1 hour ago`).
      - `< 14 days` → `N day(s)` (e.g. `10 days ago`).
      - `< 60 days` → `N week(s)` using `Math.floor(days / 7)` with a minimum of 1 (e.g. `2 weeks ago` when `days >= 14`).
      - `< 365 days` → `N month(s)` using `Math.floor(days / 30)` with a minimum of 1.
      - `>= 365 days` → `N year(s)` using `Math.floor(days / 365)` with a minimum of 1.
    - Perform simple pluralisation: `1 second` vs `2 seconds`, etc., for units: `second`, `minute`, `hour`, `day`, `week`, `month`, `year`.
    - For **past** values: return `"<value> <unit> ago"`.
    - For **future** values: return `"in <value> <unit>"`.
  - **Documentation comments:**
    - Brief JSDoc explaining purpose, supported input types, and examples for past and future timestamps.
    - Note that this helper is intentionally **English-only** and suitable for non-localized contexts; UI callers needing i18n-friendly output should wrap it or implement a key-based variant.

### 2. CLI / DB-free tests (new file + group enumeration)

#### `tests/cli/time-since-helper.test.ts` (new)

Planned contents:

- New Vitest suite covering `formatTimeSince` with a **fixed `now` reference** so the tests are deterministic:
  - Set `const fixedNow = new Date('2024-01-15T12:00:00Z')` in the test file.
  - Helper utility in the test: `const fmt = (input: Date | string | number) => formatTimeSince(input, { now: fixedNow })`.
- Test cases:
  - **Seconds:**
    - `fixedNow` minus 5 seconds → `'5 seconds ago'`.
    - `fixedNow` minus 1 second → `'1 second ago'`.
  - **Minutes:**
    - `fixedNow` minus 10 minutes → `'10 minutes ago'`.
    - Boundary from seconds → minutes (e.g. 59s vs 60s).
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
    - `fixedNow` plus 2 days → `'in 2 days'` (verifying prefix changes and pluralisation still works).
  - **Input type variants:**
    - Call with `Date`, ISO string (`'2024-01-15T11:59:55Z'`), and numeric timestamp (`fixedNow.getTime() - 5000`) and assert they all produce the same output for equivalent instants.
  - **Invalid inputs (warn-and-surface):**
    - Call with an invalid date string (e.g. `'not-a-date'`) and assert it throws a descriptive error (`toThrow(/formatTimeSince/ or /Invalid date/`) rather than silently returning a fallback.
    - Call with `NaN` as number and assert it throws.
- Import path:
  - `import { formatTimeSince } from '../../src/shared/date-utils.js'`
- Mark this as a **DB-free test** (no test database helpers, no Docker requirements) to stay within the `cli` project expectations.

#### `tests/cli/charts-list.test.ts` (existing, no functional changes)

- This is the existing CLI test in the `cli` Vitest project.
- **No code changes are required**, but it is listed here to fully enumerate the `tests/cli/` test group that now contains:
  - `tests/cli/charts-list.test.ts`
  - `tests/cli/time-since-helper.test.ts` (new)

## Commands

The executor should use the established guardrail commands (from prior guardrails reports) to validate changes:

- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests (full suite): `npm test`

For quick, targeted feedback while iterating on this helper, it is also reasonable to run:

- CLI-only tests: `npm run test:cli`

## Implementation approach (step-by-step)

1. **Design the API in `src/shared/date-utils.ts`:**
   - Add `TimeSinceInput` and `FormatTimeSinceOptions` types and the `formatTimeSince` function signature, keeping them co-located with existing date utilities.
   - Ensure the function is exported alongside the other helpers.

2. **Implement robust input parsing and validation:**
   - Normalise the `input` into a `Date` instance according to the rules above.
   - If `input` cannot be parsed into a valid `Date` (NaN result, null/undefined), throw an `Error('formatTimeSince: invalid date input')` (warn-and-surface) instead of returning a misleading string.
   - Resolve `now` from options with a default of `new Date()`.

3. **Compute time difference and bucket selection:**
   - Compute `diffMs`, `isFuture`, and absolute units (`seconds`, `minutes`, `hours`, `days`).
   - Implement the bucket thresholds (seconds, minutes, hours, days, weeks, months, years) exactly as described so behaviour around 10 days vs 2 weeks vs months matches expectations.
   - Implement a small helper inside `formatTimeSince` (not exported) for pluralisation (e.g. `formatUnit(value, unit)` that returns `"1 day"` vs `"2 days"`).

4. **Construct final strings:**
   - Use `"<value> <unit> ago"` for `!isFuture` and `"in <value> <unit>"` for `isFuture`.
   - Handle the `diffMs === 0` special case as `'just now'`.

5. **Add tests in `tests/cli/time-since-helper.test.ts`:**
   - Implement the suite as described, reusing a fixed `now` to avoid flaky time-based expectations.
   - Cover all bucket boundaries and pluralisation paths, plus invalid inputs and future timestamps.

6. **Run tests and quality gates:**
   - Run `npm run test:cli` to quickly validate the new helper’s tests.
   - Run `npm run lint` and `npm run typecheck` to ensure the new code meets style and type-safety requirements.
   - Run `npm test` to confirm the full test suite still passes.

## Risks and edge cases

- **Invalid inputs (non-date / unparsable):**
  - Behaviour: **warn-and-surface** by throwing an `Error` when `input` cannot be parsed into a valid `Date` (e.g. invalid string, `NaN`, `null`/`undefined`).
  - Rationale: returning a generic string like `'0 seconds ago'` would silently hide caller bugs and is considered a correctness issue.

- **Future timestamps:**
  - Behaviour: **warn-and-surface via output**, not by throwing. The helper will return phrases like `"in 5 minutes"` or `"in 2 days"` when `input` is after `now`.
  - Rationale: future times are valid in many domains (scheduled jobs, upcoming events); they should not be silently coerced to past tense or ignored.

- **Zero-difference timestamps:**
  - Behaviour: when `input` equals `now` within millisecond precision, return `'just now'`.
  - This is explicit user-facing output; there is no skipped or dropped case.

- **Very large differences (many years):**
  - Behaviour: fall back to the `years` bucket using `Math.floor(days / 365)`, e.g. `'10 years ago'`.
  - No silent truncation occurs; the full magnitude is surfaced.

- **Localisation / i18n:**
  - This helper returns **English strings only** and does not integrate with the existing `src/i18n` runtime.
  - Behaviour: callers needing translated text should either:
    - Treat this helper as internal and expose localised strings from UI components, or
    - Use it only in non-localised contexts (logs, diagnostics, developer tooling).
  - The helper itself does not attempt i18n to avoid coupling shared utilities to React/i18n dependencies.

- **Time zone differences:**
  - Behaviour: the function uses the underlying `Date` millisecond epoch values; it does not attempt any additional UTC normalisation.
  - This is appropriate for "time since" semantics; no cases are silently skipped or altered beyond the absolute difference in milliseconds.

## Test strategy

- **Unit tests (DB-free, under `tests/cli/`):**
  - Verify correct output for each time bucket (seconds, minutes, hours, days, weeks, months, years) with a fixed `now`.
  - Verify correct pluralisation for values of 1 vs >1 across different units.
  - Verify behaviour for future timestamps (`in 5 minutes`, `in 2 days`).
  - Verify that invalid inputs (unparsable strings, `NaN`) throw errors rather than returning misleading defaults.
  - Verify that different input representations (Date, string, number) produce identical outputs when representing the same instant.

- **Regression / integration confidence:**
  - Run `npm run test:cli` to ensure the new tests pass in isolation.
  - Run `npm run lint` and `npm run typecheck` to validate code quality and type correctness.
  - Run `npm test` to ensure no unintended side effects on existing server/client tests.

## Estimated complexity

- **Estimated complexity:** simple
- Changes are confined to one shared utility file and one new DB-free test file, with no database or API surface modifications.