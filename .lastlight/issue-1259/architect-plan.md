# Architect Plan for Issue #1259

## Problem Statement

- `README.md` currently documents installation, features, and contribution guidelines but does not describe how to run the project's test suites (see `README.md` lines 369–387).
- Test-related npm scripts already exist in `package.json` and are referenced in `CLAUDE.md` and `CONTRIBUTING.md`, but there is no concise "Running tests" section in the main README for quick discovery.
- The issue requests adding a short section that lists the main test commands with one-line descriptions, without changing any code or behavior.

## Summary of What Needs to Change

- Add a new `## Running tests` section to `README.md` that lists the primary test, lint, and typecheck commands defined in `package.json`.
- Each command should have a concise one-line description, matching the intent described in the issue and existing documentation.
- Place this section near the existing contributor-facing docs (between "Examples" and "Contributing" in `README.md`) and make no other file or code changes.

## Files to Modify (Exhaustive)

1. `README.md`
   - **Location:** After the "## Examples" section (`README.md` lines 377–382) and before the "## Contributing" section (`README.md` lines 384–387).
   - **Change:** Insert a new section:
     - Heading: `## Running tests`
     - Content: A bullet or list-style description of the following commands, each with a one-line explanation:
       - `npm test` — runs the default Vitest projects.
       - `npm run test:client` — client tests only.
       - `npm run test:cli` — CLI / generator tests (DB-free).
       - `npm run test:setup` — start the test databases with docker-compose.
       - `npm run test:teardown` — stop the test databases with docker-compose.
       - `npm run typecheck` — run TypeScript type checking.
       - `npm run lint` — run ESLint.
     - Keep wording aligned with `CLAUDE.md` / `CONTRIBUTING.md` where applicable, but prioritize the concise phrasing from the issue description.
   - **Constraints:**
     - Do not modify any other sections or headings in `README.md`.
     - Do not change any code, configuration, or scripts; this is documentation-only.

_No other files should be created, removed, or modified as part of implementing this issue._

## Commands (from Guardrails Report)

The guardrails report defines the DB-free verification suite that the harness uses. For reference, the full gate command is:

```bash
npm run test:sqlite && npm run test:client && npm run test:cli && npm run lint && npm run typecheck
```

Individual commands:

- `npm run test:sqlite` — server tests against in-process SQLite (DB-free, no Docker required).
- `npm run test:client` — client tests (React components).
- `npm run test:cli` — CLI / generator tests (DB-free).
- `npm run lint` — ESLint.
- `npm run typecheck` — TypeScript type checking.

Per repository guidance, do **not** run `npm test`, `npm run test:postgres`, or `npm run test:mysql` in sandboxed environments without Docker.

## Implementation Approach (Step-by-Step)

1. Open `README.md` and locate the tail sections:
   - "## Documentation" (`README.md` lines 369–375).
   - "## Examples" (`README.md` lines 377–382).
   - "## Contributing" (`README.md` lines 384–387).
2. Between the "## Examples" and "## Contributing" headings, insert a new markdown section:
   ```md
   ## Running tests

   - `npm test` — runs the default Vitest projects.
   - `npm run test:client` — client tests only.
   - `npm run test:cli` — CLI / generator tests (DB-free).
   - `npm run test:setup` — start the test databases with docker-compose.
   - `npm run test:teardown` — stop the test databases with docker-compose.
   - `npm run typecheck` — TypeScript type checking.
   - `npm run lint` — ESLint linting.
   ```
3. Ensure formatting matches the rest of the README (heading level `##`, a blank line after the heading, and a simple bullet list).
4. Re-scan `README.md` to confirm that:
   - The new section appears only once.
   - No surrounding content was unintentionally altered.
5. Because this change is documentation-only, the executor may rely on the existing passing guardrails report; running the full DB-free test suite is optional but safe if time/resources allow.

## Risks and Edge Cases

- **Risk: Inconsistent wording with other docs.**
  - Mitigation: Align command descriptions with `CLAUDE.md` and `CONTRIBUTING.md` while keeping each description to a single concise sentence.
- **Risk: Future script changes.** If test-related npm scripts are renamed or expanded later, this section could become stale.
  - Mitigation: When scripts change, maintainers should update `README.md` accordingly. This plan assumes scripts remain as currently defined.
- **User-facing behavior / inputs:**
  - This change only affects documentation; it does not introduce new runtime inputs or behavior. There is no code path where inputs could be silently ignored.
  - If users run commands not documented here (e.g., engine-specific tests), behavior is governed by existing scripts and CI docs; there is no additional handling to warn or skip.

## Test Strategy

- Since this is a documentation-only change:
  - **Required for this issue:**
    - Visually inspect `README.md` to ensure the new section renders as expected and the markdown structure is valid.
  - **Optional (if the executor wants additional assurance, not strictly required):**
    - `npm run lint` — confirm no lint configuration issues (though this does not check docs).
    - `npm run typecheck` — confirm TypeScript configuration remains valid.
- Do **not** run Docker-backed test commands (`npm test`, `npm run test:postgres`, `npm run test:mysql`) in the sandbox, per `CLAUDE.md` guidance.

## Estimated Complexity

- **Estimated complexity:** simple — a single, well-scoped documentation insertion in `README.md` with no code or configuration changes.