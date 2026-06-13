---
name: quality-gate
description: Use before finishing or opening a PR for a large / multi-file change to drizzle-cube, to ensure code quality does not regress. Runs `fallow audit` (complexity, duplication, dead code, circular deps scoped to the diff, blocking only on issues the change *introduces*) plus a `madge` circular-dependency snapshot. Use when the user says "check quality", "make sure quality doesn't regress", "is this PR clean", or after a refactor touching many files.
---

# Quality Regression Gate

A "don't make it worse" gate for drizzle-cube. The hard part of static analysis on a
mature codebase is noise: there are already 373 high-complexity functions, 120 duplicate
clone groups, and 20 circular dependencies. Reporting those on every change is useless.

The gate is built around one tool that solves this: **`fallow audit`** scopes analysis to
the changed files **and** distinguishes findings the change *introduced* from findings it
*inherited*. The default `new-only` gate fails **only on introduced findings**. That — and
only that — is what "quality doesn't regress" means here. Inherited debt is reported for
context but never blocks.

## When to use

- After a refactor or feature touching several files, **before** committing / opening a PR.
- When the user asks to verify a change is clean or that quality hasn't regressed.
- NOT needed for one-line fixes or doc/test-only edits — the gate's value is on large diffs.

This gate is the static-analysis layer. It complements, and does **not** replace,
`npm run typecheck`, `npm run lint`, and `npm test`. For a full pre-PR check, run those too.

## The one command that matters

```bash
npm run quality                 # fallow audit, base auto-detected (merge-base vs main/origin)
```

`fallow audit` auto-detects the base as the git merge-base against the branch's upstream or
`origin/main`, so on a feature branch no argument is needed. To pin the base explicitly
(pass args through npm with `--`):

```bash
npm run quality -- --base main
npm run quality -- --base "$(git merge-base main HEAD)"
```

**Exit code 0 = pass, 1 = fail.** A failure means the change introduced new complexity,
duplication, dead code, or a circular dependency. The verdict ignores inherited findings —
watch for the line `audit gate excluded N inherited findings`, which confirms pre-existing
debt was not counted against you.

### Reading the result precisely (JSON)

For an unambiguous machine-readable verdict, ask for JSON and read `verdict` +
`attribution.*_introduced`:

```bash
npm run quality --silent -- --format json
```

```jsonc
{
  "verdict": "pass" | "warn" | "fail",
  "attribution": {
    "gate": "new-only",
    "dead_code_introduced": 0,      // <- these *_introduced fields are what blocks
    "complexity_introduced": 0,
    "duplication_introduced": 0,
    "dead_code_inherited": 8,       // <- inherited: reported, never blocks
    "complexity_inherited": 17,
    "duplication_inherited": 93
  }
}
```

A clean change has all three `*_introduced` fields at `0` and `verdict: "pass"`.

## Supplementary snapshot (informational — do NOT gate on it)

`quality:health` has no new-vs-inherited attribution, so on this codebase it always reports the
full backlog. Use it to *understand* a finding or look at the whole picture — never as a
pass/fail signal:

```bash
npm run quality:health      # fallow health: full complexity/duplication/maintainability score
```

Circular dependencies are covered by the gate itself — `npm run quality` (fallow audit) reports
them under "Structure" with introduced-vs-inherited attribution, and `quality:health` lists them
all. There is no separate circular-dependency script.

## Occasional architecture check (madge, on demand)

fallow is the source of truth for circular dependencies and ignores `import type` cycles (not
runtime hazards). On the rare occasion you want either (a) a **visual dependency graph**, or
(b) to surface **type-only import tangles** that fallow deliberately hides, reach for `madge`
via `npx` — it is intentionally NOT a pinned dependency or part of the gate:

```bash
npx madge --circular --extensions ts,tsx src              # includes type-only cycles (noisier)
npm run quality:graph                                      # writes dependency-graph.svg (needs graphviz)
```

This is an exploratory tool, not a regression check — its output has no introduced-vs-inherited
attribution and will always show the full inherited backlog.

## Acting on a FAIL

Only the introduced findings need fixing. fallow prints each with a file:line and a docs
link. Typical fixes:

| Introduced finding | What to do |
|--------------------|------------|
| **Complexity** (function over CRAP / cyclomatic / cognitive threshold) | Extract helpers; split the new function. Most drizzle-cube modules already follow a builder/planner split — mirror it. |
| **Duplication** (new clone group) | Hoist the shared logic. Note existing cross-engine clones in `executors/`/`adapters/` are inherited and expected — don't churn them. |
| **Dead code** (new unused export/file) | Delete it, or wire it up. Before deleting an "unused" export, confirm with `npx fallow dead-code --trace <file>:<export>` (a public API re-exported from an entry point can look unused). |
| **Circular dependency** | Break the cycle, usually by moving a shared type into a leaf `types/*` module. |

### False positives

If a finding is genuinely a false positive (e.g. a public export consumed only by package
consumers), suppress it inline rather than restructuring:

```ts
// fallow-ignore-next-line complexity
// fallow-ignore-next-line unused-dependencies
// fallow-ignore-file circular-dependencies
```

Prefer fixing over suppressing. Suppress only with a one-line reason, and never suppress to
get a green gate on a finding you actually introduced.

## How it's wired

- `fallow@2.95.0` and `madge@8.0.0` are pinned devDependencies (`package.json`).
- Scripts: `quality`, `quality:circular`, `quality:health`, `quality:graph`.
- No `fallow.config` — defaults are used intentionally. The gate is `new-only`, so inherited
  debt (the 5 false-positive unused devDeps, 20 circular deps, existing duplication) is
  reported but never blocks. Add a config only if you later want tunable thresholds or to
  exclude `dist`/generated dirs from duplication.
