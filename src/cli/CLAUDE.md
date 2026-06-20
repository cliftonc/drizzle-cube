# CLI — `drizzle-cube`

The `drizzle-cube` binary (`bin` → `dist/cli/index.cjs`). Entry point `index.ts` routes
positional args to commands under `commands/`. Keep the CLI a thin, deterministic, **DB-free**
layer — it generates and scaffolds files; it never connects to a database.

## Structure

```
src/cli/
├── index.ts            # arg routing (node:util parseArgs), top-level error handling
└── commands/
    └── charts.ts       # `charts init|list` — scaffold / list custom chart plugins
```

## Conventions for all CLI code

- **No database, ever.** The CLI reads/writes local files only. It must run with no Docker,
  no connection string, and no network in its core path.
- **Deterministic output.** Given identical inputs, emit byte-identical files (sort models,
  columns, joins, and imports). Re-running on unchanged inputs is a zero diff — this is what
  makes a `--check` / drift mode meaningful.
- **The I/O boundary is one module.** Keep filesystem reads/writes and interactive prompts at
  the command edge; keep parsing, normalization, and emission as pure, unit-testable functions.

## Testing

CLI logic is DB-free, so its tests live in the **`cli` vitest project** (`tests/cli/`), not the
DB-backed `server` project. No Docker, no `globalSetup`, in-memory fixtures, milliseconds.

```bash
npm run test:cli
```

See `tests/CLAUDE.md` ("Choosing where a test goes") and the live project definitions in
`vitest.config.ts`. Decide by the subject under test, not by where the source lives: if it never
issues SQL, it belongs in `tests/cli/`.

## Type safety

Generators emit code that must typecheck against the real public types. A passing `npm run
typecheck` is **necessary, not sufficient**:

- **No `as any`**, and no type assertion that bypasses a local validator. If you wrote a
  validator/guard for a config or artifact shape, route values through it — do not cast around
  it to silence the compiler. Casting to satisfy `tsc` while skipping the runtime check is a bug,
  not a fix (this is the failure that motivated #939).
- Generated cube/schema files must compile against the **public** `drizzle-cube/server` types
  (the non-generic `Cube` / `QueryContext` surface), exactly as a consumer would import them.

## Generator conventions — `dbt generate` (and any artifact → cube generator)

These are the rules a dbt-artifact → Drizzle-schema/cube generator (see #936) must follow. They
are written down here so the next contribution lands them by default rather than rediscovering
them in review.

### Unsupported types → warn and skip

When a catalog/source column maps to a type the generator does not understand, the policy is
**warn-and-skip**: emit a clear warning naming the model + column + offending type, and omit that
column. **Never `throw`** (one bad column must not abort the whole run) and **never silently
default** to a placeholder type (a wrong `text`/`unknown` column is worse than a visible gap).
The same warn-and-skip cascade applies when a whole model is skipped — any join pointing at a
skipped model is dropped with its own warning so every emitted reference still resolves.

### Composite / multi-column primary keys → emit, never drop

A model whose primary key spans multiple columns must **not** lose its key. Expected output:

- one **`primaryKey: true` dimension per key column**, and
- the baseline **`countDistinct` measure** (the standard count for a keyed cube).

A single-column PK is the trivial case of the same rule. The wrong behaviors to guard against are
silently dropping the composite key (emitting a cube with no PK) or arbitrarily picking one column
of the key.

### Drift / `--check` → detect removals, not just changes

`--check` (CI/drift mode) must fail when the emitted output no longer matches what the current
inputs would produce — and that **includes removed sources**, not only changed ones. If a model
is deleted upstream, its orphaned generated cube file is real drift: `--check` must report it and
exit non-zero. A `--check` that only diffs files it would currently write (and ignores files it
would no longer write) passes on real drift — that is the bug to avoid. Compare the **full set**
of expected outputs against the full set of existing generated outputs.

### Security is explicit, never inferred

The tenant/security column is provided (flag, prompt, or `meta` override) — the generator never
guesses it. A model missing the configured security column is skipped with a warning (per the
warn-and-skip rule above), never emitted without row-level isolation.
