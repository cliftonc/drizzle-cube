# Executor Summary — Issue #955

## What was done

- Added a shared `formatTimeSince` helper to `src/shared/date-utils.ts`:
  - New exported types: `TimeSinceInput` and `FormatTimeSinceOptions`.
  - New exported function `formatTimeSince` that:
    - Accepts `Date | string | number` inputs.
    - Uses an optional `now` override (`options.now`) for deterministic testing.
    - Normalises inputs to `Date` and throws `Error('formatTimeSince: invalid date input')` on invalid values (including `null`/`undefined` and unparsable strings/numbers).
    - Computes the difference between `input` and `now` and selects an appropriate unit bucket (seconds, minutes, hours, days, weeks, months, years).
    - Returns English-only strings like `"5 seconds ago"`, `"2 weeks ago"`, or `"in 3 hours"`, and `"just now"` when the timestamps are equal.
- Wired the helper into the dashboard cache indicator:
  - Updated `src/client/components/dashboardPortletCard/PortletCardHeader.tsx` to import `formatTimeSince`.
  - Replaced the inline seconds-delta tooltip in `CacheIndicator` with `title={`Cached ${formatTimeSince(cachedAt)}`}` for reuse and consistency.
- Added DB-free unit tests for the helper:
  - New file `tests/cli/time-since-helper.test.ts` exercising `formatTimeSince` via a fixed `now` reference.
  - Coverage includes:
    - Seconds, minutes, hours, days, weeks, months, and years buckets (including boundary cases like 59 vs 60 seconds, 14 days, ~45 days, ~90 days, ~400 days, ~800 days).
    - Future timestamps (e.g. `in 30 seconds`, `in 2 days`).
    - Multiple input types (`Date`, ISO string, numeric timestamp) for equivalent instants.
    - Invalid inputs (null, undefined, invalid string, `NaN`) asserting that a descriptive error is thrown.

## Tests / lint / typecheck

All commands were run from the repo root.

### Targeted tests

- Command: `npm run test:cli`
- Result: **pass**
- Output (abridged):

  ```
  > drizzle-cube@0.6.4 test:cli
  > vitest run --project cli

  ✓ cli tests/cli/time-since-helper.test.ts (10 tests)
  ✓ cli tests/cli/charts-list.test.ts (1 test)

  Test Files  2 passed (2)
        Tests 11 passed (11)
  ```

### Lint

- Command: `npm run lint`
- Result: **pass**
- Output (abridged):

  ```
  > drizzle-cube@0.6.4 lint
  > eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'
  ```

  (Command completed without reporting any errors.)

### Typecheck

- Command: `npm run typecheck`
- Result: **failed due to environment limits**
- Output:

  ```
  > drizzle-cube@0.6.4 typecheck
  > tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json


  Killed

  Command exited with code 137
  ```

  The TypeScript typecheck process was killed by the environment (exit code 137, likely OOM). There were no actionable TypeScript diagnostics before termination. The helper implementation avoids `as any` and does not use type assertions to bypass existing validators.

### Full test suite

- Command: `npm test`
- Result: **failed due to missing PostgreSQL test database**
- Output (abridged):

  ```
  > drizzle-cube@0.6.4 test
  > vitest run

  Setting up PostgreSQL test database...
  Running PostgreSQL migrations...
  PostgreSQL migrations completed or not needed: Failed query: CREATE SCHEMA IF NOT EXISTS "drizzle"
  params:
  Setting up PostgreSQL test data...

  Failed to setup test databases: DrizzleQueryError: Failed query: delete from "productivity"
  params:
    ...
    cause: Error: connect ECONNREFUSED 127.0.0.1:54333
  }
  No test files found, exiting with code 1
  ```

  The server test project expects a PostgreSQL instance on `127.0.0.1:54333`, which is not available in this sandbox run, so the global test setup fails before server tests execute. The new helper and its tests are DB-free and verified via `npm run test:cli`.

## Deviations from the architect plan / known issues

- **Bucket threshold adjustment:**
  - The plan described weeks as covering `< 60` days and months `< 365` days, but the test scenarios explicitly treat ~45 days as `"1 month ago"`. To align behaviour with the specified tests, the implementation uses:
    - `< 14` days → days
    - `< 30` days → weeks (using `Math.floor(days / 7)`, minimum 1)
    - `< 365` days → months (using `Math.floor(days / 30)`, minimum 1)
    - `>= 365` days → years (using `Math.floor(days / 365)`, minimum 1)
  - This ensures 45 days is reported as `"1 month ago"` and ~90 days as `"3 months ago"`, matching the architect’s concrete examples.
- **Verification limits:**
  - `npm run typecheck` could not complete due to an environment kill (code 137), so full typecheck verification is partially blocked by sandbox resource limits.
  - `npm test` fails before running server tests because the PostgreSQL test database is not reachable. The new change is verified via the DB-free CLI test suite.
