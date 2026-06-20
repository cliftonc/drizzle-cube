# Architect Plan — #936 DBT Sync to Cubes v3

## Problem Statement

The `drizzle-cube dbt generate` command requested in #936 already exists on
this branch as a complete, convention-aligned implementation
(`src/cli/commands/dbt.ts`, `src/cli/dbt/*`, fixtures under
`tests/fixtures/dbt/postgres-simple/`, 103 passing DB-free CLI tests). It
reads local dbt `manifest.json`/`catalog.json`, normalizes materialized
Postgres models, and emits a `pg-core` schema + one cube file per model +
`index.ts`, with warn-and-skip on unsupported types/columns/materializations
(`src/cli/dbt/normalize.ts:9`, `src/cli/dbt/postgres-types.ts:9`),
composite-PK preservation via per-column `primaryKey` + `countDistinct`
(`src/cli/dbt/normalize.ts:120-135`), identifier-collision detection that
throws before emit (`src/cli/dbt/normalize.ts:335-370`), explicit security
with warn-and-skip for models missing the security column
(`src/cli/dbt/normalize.ts:417-422`, `src/cli/CLAUDE.md:82-90`), and
`--check`/`--dry-run`/normal modes with stale-file cleanup
(`src/cli/dbt/write-output.ts`). The repo's generator conventions are
codified in `src/cli/CLAUDE.md:37-90` and the implementation matches them.

The remaining work for v3 is **not a rebuild** — it is targeted hardening of
two real observability defects in the write/check reporting layer plus
expanded test coverage that locks the convention-mandated warn-and-skip
behaviours in place, so the feature ships with no silent paths.

### The two defects (both in `src/cli/dbt/write-output.ts` + `src/cli/commands/dbt.ts`)

1. **`--check` does not report which files are missing or orphaned.**
   `checkMode` (`src/cli/dbt/write-output.ts:120-142`) computes `missing`
   (line 129) and `orphaned` (line 136) arrays, sets `drift: true` correctly,
   but returns them **nowhere** — the `WriteResult` type
   (`src/cli/dbt/types.ts:189-196`) has no `missing`/`orphaned` fields, so
   `checkMode` returns only `{ created: [], updated: changed, deleted: [],
   conflicts: [], drift }`. Consequently `printSummary`'s check branch
   (`src/cli/commands/dbt.ts:~230-238`) can only print
   `${write.updated.length} changed/missing` and can never list the actual
   missing or orphaned file paths. A CI run sees a non-zero exit (correct)
   but a human cannot see *what* drifted without re-reading artifacts. This
   contradicts the repo convention that unsupported/drifted inputs are
   **surfaced, not silently flagged** (`src/cli/CLAUDE.md:37-90`).

2. **`--dry-run` summary omits orphaned (stale) files in check-style framing.**
   `dryRunMode` (`src/cli/dbt/write-output.ts:145-167`) *does* return
   `deleted` (orphaned), so the dry-run path is fine. The asymmetry is only
   in check mode. Defect #1 is the actionable one; #2 is noted for
   consistency — the fix unifies both paths through the same
   `WriteResult` shape.

## Summary of what needs to change

- Extend `WriteResult` with `missing: string[]` and `orphaned: string[]`
  fields so check/dry-run can report the full drift picture (changed,
  missing, orphaned, conflicts) instead of collapsing missing/orphaned into
  a boolean.
- Update `checkMode` and `dryRunMode` to populate the new fields; leave
  `normalMode` returning empty arrays for them (it acts, it doesn't report
  drift).
- Update `printSummary` (check branch) to list changed, missing, and
  orphaned file paths (sorted, capped for readability) so a human/CI log
  shows exactly what drifted.
- Add tests asserting missing and orphaned files appear in the `--check`
  `WriteResult` and in the printed summary.
- Add tests locking in the warn-and-skip cascade conventions from
  `src/cli/CLAUDE.md` that are not yet explicitly asserted: a join to a
  skipped model is dropped with a `RELATIONSHIP_DROPPED` warning; a join
  whose source/target column was skipped (unsupported type) is dropped with
  a warning; a model whose security column was itself skipped (unsupported
  type) is skipped with a `MODEL_SKIPPED` warning.
- Re-run the full achievable gate (`test:cli`, `build:cli`, `lint`,
    `typecheck`) and confirm green.

No source files outside `src/cli/dbt/write-output.ts`,
`src/cli/dbt/types.ts`, and `src/cli/commands/dbt.ts` are modified. No new
source modules. No fixture changes expected (existing fixtures already
exercises a relationship, a composite PK, an explicit measure, a skipped
ephemeral model, and security filtering).

## Files to modify — exhaustive manifest

### 1. `src/cli/dbt/types.ts` — `WriteResult` interface (`src/cli/dbt/types.ts:189-196`)

Add two fields to `WriteResult` so drift detail is observable, not just a
boolean:

```ts
export interface WriteResult {
  created: string[]
  updated: string[]
  deleted: string[]
  conflicts: string[]
  /** `--check`/`--dry-run`: expected files absent from disk. */
  missing: string[]
  /** `--check`/`--dry-run`: on-disk generated files no longer expected. */
  orphaned: string[]
  /** True when `--check` found drift (changed/missing/conflicting/orphaned). */
  drift: boolean
}
```

Update the JSDoc above the interface (lines 184-188) to mention missing and
orphaned. No other type in this file changes.

### 2. `src/cli/dbt/write-output.ts` — three functions return `WriteResult`

**`checkMode` (`src/cli/dbt/write-output.ts:118-142`):** the local `missing`
array (line 129) and `orphaned` array (line 136) are already computed. Add
them to the returned object and sort both deterministically:

```ts
return {
  created: [],
  updated: changed.sort((a, b) => a.localeCompare(b)),
  deleted: [],
  conflicts: [],
  missing: missing.sort((a, b) => a.localeCompare(b)),
  orphaned,
  drift,
}
```

(`orphaned` is already sorted at line 137.)

**`dryRunMode` (`src/cli/dbt/write-output.ts:145-167`):** it already
computes `deleted` (= orphaned, line 162). Add `missing: []` (dry-run does
not distinguish create vs missing in its current classification — `create`
is reported via `created`; keep `missing: []` here so the shape is uniform)
and `orphaned: deleted` so callers can read it by the canonical name:

```ts
return {
  created,
  updated,
  deleted,
  conflicts,
  missing: [],
  orphaned: deleted,
  drift: false,
}
```

(Ensure `created`/`updated`/`conflicts` are sorted for byte-stable reporting
if not already — they are pushed in file iteration order; sort them with
`localeCompare` to match the determinism rule in `src/cli/CLAUDE.md:22-25`.)

**`normalMode` (`src/cli/dbt/write-output.ts:170-205`):** return
`missing: []` and `orphaned: []` (normal mode acts on drift, it does not
report it). Sort `created`/`updated`/`conflicts`/`deleted` with
`localeCompare` for deterministic summary output.

Update the module header comment block (`src/cli/dbt/write-output.ts:1-12`)
to note that `--check` now reports missing/orphaned paths, not just a
boolean. Update the `writeGeneratedOutput` JSDoc
(`src/cli/dbt/write-output.ts:207-215`) to mention the new fields.

### 3. `src/cli/commands/dbt.ts` — `printSummary` check branch (`src/cli/commands/dbt.ts:~225-240`)

Replace the check branch so it lists the drifted paths. Keep output concise:
list up to 20 paths per category, then a `… and N more` line if exceeded.
Sort is already guaranteed by the writer. Pseudocode for the new check
branch:

```ts
if (check) {
  if (!write.drift) {
    console.log('[drizzle-cube] No drift detected. Generated output is up to date.')
    return
  }
  const categories: Array<[string, string[]]> = [
    ['changed', write.updated],
    ['missing', write.missing],
    ['orphaned', write.orphaned],
  ]
  const parts: string[] = []
  for (const [label, paths] of categories) {
    if (paths.length === 0) continue
    parts.push(`${paths.length} ${label}`)
  }
  console.log(`[drizzle-cube] Drift detected: ${parts.join(', ')}.`)
  for (const [label, paths] of categories) {
    if (paths.length === 0) continue
    const shown = paths.slice(0, 20)
    console.log(`[drizzle-cube] ${label}:`)
    for (const p of shown) console.log(`[drizzle-cube]   ${p}`)
    if (paths.length > shown.length) {
      console.log(`[drizzle-cube]   … and ${paths.length - shown.length} more`)
    }
  }
  return
}
```

Do not change the non-check branches of `printSummary` (dry-run/normal
already read `created`/`updated`/`deleted`/`conflicts`). Verify the dry-run
branch still reads `write.deleted` (orphaned) — it does.

No other function in `commands/dbt.ts` changes.

### 4. `tests/cli/dbt/write-output.test.ts` — extend the check-mode tests

The existing test file already covers check-ok, check-changed, check-missing,
check-orphan in temp dirs (`tests/cli/dbt/write-output.test.ts` full file,
153 lines). Update the **check-missing** and **check-orphan** cases to assert
the new `result.missing` / `result.orphaned` arrays contain the expected
paths (sorted), in addition to `result.drift === true`. Add a new test
`check reports all three drift categories together` that stages a dir with
one changed file, one missing expected file, and one orphaned generated
file, runs `--check`, and asserts `updated`, `missing`, and `orphaned` each
contain exactly the right path. Keep all assertions DB-free (temp dirs via
`fs/promises` `mkdtemp`, as the existing tests already do).

### 5. `tests/cli/dbt/command.test.ts` — assert summary lists drifted paths

Add one test that runs `dbtGenerate` (with the generator mocked, as the
existing command tests do) in `--check` mode with a mocked
`generateFromDbt` returning a `WriteResult` where `updated: ['cubes/a.ts']`,
`missing: ['cubes/b.ts']`, `orphaned: ['cubes/c.ts']`, `drift: true`, and
asserts the captured stdout contains the lines `changed:`, `missing:`,
`orphaned:` and the paths `cubes/a.ts`, `cubes/b.ts`, `cubes/c.ts`, and that
the function throws (drift → non-zero exit). Mirror the existing mock
pattern in this file (it already mocks `generateFromDbt`).

### 6. `tests/cli/dbt/normalize.test.ts` — lock in warn-and-skip join cascades

Add three targeted tests (pure, no I/O — call `normalizeDbtArtifacts`
directly with in-memory `ParsedDbtArtifacts` shapes, as the existing
normalize tests do):

- **Join to a skipped model is dropped with a warning.** Build a manifest
  with two materialized models (`orders`, `customers`) and one ephemeral
  `addresses` model, plus a `relationships` test from `orders` → `addresses`.
  Assert the `orders` model's `relationships` is empty and `warnings`
  contains a `RELATIONSHIP_DROPPED` entry naming `orders` and the target
  `addresses` model id.
- **Join whose source column was skipped (unsupported type) is dropped.**
  Build `orders` with a `customer_id` column mapped to an unsupported type
  (e.g. `bytea`) and a `relationships` test `orders.customer_id` →
  `customers.id`. Assert the join is dropped and a `RELATIONSHIP_DROPPED`
  warning is emitted naming the source column. (The `customer_id` column
  itself is also skipped with a `COLUMN_SKIPPED` warning — assert that too.)
- **Model whose security column was skipped (unsupported type) is skipped.**
  Build a model `orders` whose `organisation_id` column has an unsupported
  type, with `security: { kind: 'filter', columnName: 'organisation_id',
  contextProperty: 'organisationId' }`. Assert `orders` is not in the
  returned `models` and a `MODEL_SKIPPED` warning mentions the security
  column was skipped (unsupported type), matching
  `src/cli/dbt/normalize.ts:448-452`.

These mirror the conventions in `src/cli/CLAUDE.md:39-56` and
`src/cli/CLAUDE.md:82-90`.

### No other files change

- `src/cli/index.ts`, `vite.config.cli.ts`, `tsconfig.json`, `README.md`,
  `docs/dbt-generate.md`, `src/cli/dbt/{parse-artifacts,normalize,naming,
  postgres-types,emit-schema,emit-cubes,generate,types}.ts` (except the
  `WriteResult` field additions above), `tests/cli/dbt/{naming,postgres-types,
  parse-artifacts,emit}.test.ts`, and all fixtures are **unchanged** — they
  are already correct and green. Do not regenerate fixtures or touch
  expected output.
- The `--config` flag remains reserved/unwired (documented in
  `docs/dbt-generate.md`); v3 does not wire it.

## Commands

Copy these exact commands from `.lastlight/issue-936/guardrails-report.md`
and the repo's `package.json` scripts. The achievable gate (DB-free) is:

```bash
npm run test:cli          # vitest run --project cli  (the dbt tests live here)
npm run build:cli         # vite build --config vite.config.cli.ts
npm run lint              # eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'
npm run typecheck         # tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json
```

The full `npm test` / `npm run test` gate cannot pass in this sandbox:
the `server` vitest project's `globalSetup` connects to Postgres on
`127.0.0.1:54333` and fails with `ECONNREFUSED` because `docker-compose` is
unavailable. This is a pre-existing limitation unrelated to this feature
(the dbt generator is entirely DB-free and covered by the `cli` project).
The executor must run and confirm green the four achievable commands above.

Targeted re-run during development:

```bash
npx vitest run --project cli tests/cli/dbt/write-output.test.ts tests/cli/dbt/command.test.ts tests/cli/dbt/normalize.test.ts
```

## Implementation approach (step-by-step)

1. **Read the convention doc.** Re-read `src/cli/CLAUDE.md:37-90` end to end
   before touching anything — it is the source of truth for warn-and-skip,
   composite PK, drift/removals, and explicit-security rules. The existing
   code already complies; the changes here are observability + test locks.

2. **Extend `WriteResult`** (`src/cli/dbt/types.ts`) with `missing` and
   `orphaned` string arrays + JSDoc. This is the foundational change;
   everything else depends on it.

3. **Update `write-output.ts`** return paths:
   - `checkMode`: populate `missing` (sorted) and `orphaned` (already
     sorted) in the returned object.
   - `dryRunMode`: add `missing: []`, `orphaned: deleted`; sort
     `created`/`updated`/`conflicts` with `localeCompare`.
   - `normalMode`: add `missing: []`, `orphaned: []`; sort all returned
     arrays with `localeCompare` for deterministic summary output.
   - Update the module + function JSDoc to describe the new fields.

4. **Update `printSummary`** (`src/cli/commands/dbt.ts`) check branch to
   list changed/missing/orphaned paths (capped at 20 per category with an
   `… and N more` overflow line). Leave the non-check branches untouched.

5. **Extend `write-output.test.ts`**: update check-missing and check-orphan
   assertions to verify `result.missing`/`result.orphaned`; add the
   all-three-categories check test.

6. **Extend `command.test.ts`**: add the check-summary-lists-paths test
   using the existing `generateFromDbt` mock pattern; assert stdout contains
   the categories and paths and that the function throws on drift.

7. **Extend `normalize.test.ts`**: add the three warn-and-skip cascade
   tests (join-to-skipped-model, join-source-column-skipped,
   security-column-skipped-model).

8. **Verify**: run the four achievable commands. All must be green:
   `test:cli` (now >103 tests), `build:cli`, `lint`, `typecheck`.

9. **Update `.lastlight/issue-936/executor-summary.md`** with what changed
   (the two reporting fixes + new tests) and paste the green command output.

## Risks and edge cases

- **Do not rebuild working code.** The existing parser/normalizer/emitter
  already pass and comply with `src/cli/CLAUDE.md`. Re-emitting fixtures or
  rewriting modules risks regressing the byte-stable output the existing
  `emit.test.ts` asserts. The executor must make only the changes listed
  above. If a test fails unexpectedly, investigate the *test's* expectation
  vs the code — do not "fix" it by editing the expected fixture unless the
  fixture itself is wrong (it is not).

- **`--check` drift reporting must still exit non-zero.** The
  `dbtGenerate` throw on `options.check && result.write.drift`
  (`src/cli/commands/dbt.ts:~270`) must remain. The summary change is
  additive output before the throw; do not swallow the throw.

- **Large drift sets.** A repo with hundreds of generated files could
  flood the log. Cap at 20 paths per category with an overflow line so CI
  logs stay readable while still surfacing real drift (never collapse to a
  bare boolean — that is the defect being fixed).

- **Determinism of summary output.** All arrays surfaced in `printSummary`
  must be sorted (`localeCompare`) so re-running on identical drift prints
  identical text — consistent with the byte-stable-output convention
  (`src/cli/CLAUDE.md:22-25`).

- **Unsupported input handling — explicit warn-and-skip/surface policy**
  (per the plan's risk rule: no silent defaults, no silent skips):
  - Unsupported Postgres catalog type → **warn-and-skip the column**
    (`COLUMN_SKIPPED`), existing behaviour, unchanged.
  - Unsupported materialization / non-model resource / empty-column model →
    **warn-and-skip the model** (`MODEL_SKIPPED`), existing, unchanged.
  - Model missing the configured security column, or whose security column
    was skipped for an unsupported type → **warn-and-skip the model**
    (`MODEL_SKIPPED`), existing, unchanged. This intentionally diverges from
    the original issue spec ("fail by default") in favour of the repo's
    codified convention (`src/cli/CLAUDE.md:82-90`); the repo convention is
    the source of truth.
  - Join to a skipped model, or join whose source/target column was skipped
    → **warn-and-skip the join** (`RELATIONSHIP_DROPPED`), existing,
    unchanged — and now explicitly tested.
  - Identifier collision (table/cube/export/file) → **throw before emit**
    (`IDENTIFIER_COLLISION`), existing, unchanged — a collision is a
    data-correctness abort, not a warn-and-skip case.
  - Missing required CLI flags / unsupported dialect / non-interactive with
    no security choice / `--no-security` combined with security flags →
    **throw with a usage hint**, existing, unchanged.
  - Unreadable/non-JSON artifact file → **throw naming the path and cause**
    (`parse-artifacts.ts:readArtifactJson`), existing, unchanged.

- **`as any` / type-assertion rule.** No `as any` anywhere. The only
  narrowing in the pipeline is the local `unknown` guards in
  `parse-artifacts.ts` and the honest `as <tsType>` narrowing of the
  deliberately-loose public `SecurityContext` in `emit-cubes.ts` (documented
  in the existing executor summary). The planned changes add no new
  assertions; keep it that way.

- **`WriteResult` is a public-ish internal contract.** Only
  `generate.ts`, `commands/dbt.ts`, and the tests construct/read it. Adding
  fields is backward-compatible (all existing readers use named fields).
  No consumer outside the CLI references it.

## Test strategy

All tests are DB-free and live in the `cli` vitest project
(`npm run test:cli`), per `src/cli/CLAUDE.md:26-35` and `tests/CLAUDE.md`.

- **Existing tests stay green and unchanged** except the two check-mode
  assertions in `write-output.test.ts` that gain `missing`/`orphaned`
  field checks (additive).
- **New tests** (listed in the file manifest above):
  - `write-output.test.ts`: all-three-drift-categories check test.
  - `command.test.ts`: check-summary-lists-paths test (mocked generator).
  - `normalize.test.ts`: three warn-and-skip cascade tests.
- **No new fixtures.** The existing
  `tests/fixtures/dbt/postgres-simple/` fixture already exercises a
  relationship join, a composite-PK model (`order_lines`), an explicit
  measure (`totalAmount`), a skipped ephemeral model (`ephemeral_rollup`),
  and security filtering (`organisation_id`). The new normalize cascade
  tests use in-memory artifact shapes (no fixture files) to target the
  exact edges.
- **Byte-stable emit tests** (`emit.test.ts`) remain byte-for-byte against
  the expected fixtures — no output changes, so no fixture edits.

Verification gate (must all be green, run in this order):

```bash
npm run test:cli
npm run build:cli
npm run lint
npm run typecheck
```

## Estimated complexity

**Simple.** The feature is already implemented, reviewed-equivalent, and
green. The v3 work is two small reporting fixes (extend one interface,
populate two arrays in two return paths, expand one summary branch) plus
additive tests. No architectural change, no new modules, no fixture
regeneration, no DB dependency. Risk of regression is low because the
byte-stable emit tests guard the output and the new tests are additive.
