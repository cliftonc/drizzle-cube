# Architect Plan for #900

## Problem Statement

The repository's root `CLAUDE.md` identifies `.claude/` as the place for agent skills (`CLAUDE.md:16`) and lists project commands and conventions, but it does not currently point agents to the published LLM context file at `https://www.drizzle-cube.dev/llms.txt`. A repository search found no existing `llms.txt` references, so agents have no in-repo hint that the documentation site's LLM-optimized context exists. The three checked-in Claude skills are `.claude/skills/add-chart-type/SKILL.md`, `.claude/skills/add-query-mode/SKILL.md`, and `.claude/skills/quality-gate/SKILL.md`; two implementation skills contain file-by-file checklists (`add-chart-type` lines 12-30, `add-query-mode` lines 10-56), while the quality skill explicitly says it is unnecessary for one-line/doc-only edits (`quality-gate` lines 18-25).

## Summary of what needs to change

Add a concise documentation-context pointer to `CLAUDE.md` so any agent reading the main project guidance can discover `https://www.drizzle-cube.dev/llms.txt`. Sharpen all repository skills by adding skill-specific guidance on when/how to consult that LLM docs file: implementation skills should consult it for current public API/documentation context before changing generated checklists, and the quality-gate skill should mention it as optional context only, not as an added gate for doc-only edits. This is a docs-only change; no runtime code or tests should be changed.

## Files to modify — exhaustive manifest

Modify exactly these files and no sibling skill/rule files unless the executor finds a direct conflict with the anchors below:

1. `CLAUDE.md`
   - Anchor: after the project structure code block that ends at `CLAUDE.md:17` and before `## Database Support` at `CLAUDE.md:19`.
   - Change: add a new second-level section, for example:
     ```md
     ## Agent Documentation Context

     Before planning non-trivial changes, review the LLM-optimized documentation index at https://www.drizzle-cube.dev/llms.txt for current public docs, examples, and API context. Use it as supplementary context alongside this repository's `CLAUDE.md` files and source code; repository files remain the source of truth for implementation details.
     ```
   - Keep the link as plain text so agents and tools can copy it easily.

2. `.claude/skills/add-chart-type/SKILL.md`
   - Anchor: after the introductory paragraphs, specifically after line 10 (`For custom/third-party charts...`) and before `## Checklist` at line 12.
   - Change: add a short section such as:
     ```md
     ## Documentation Context

     Before designing or updating a built-in chart type, review https://www.drizzle-cube.dev/llms.txt for the current documentation map and public chart/plugin guidance. Use repository source and the checklist below as the implementation source of truth when docs and code differ.
     ```
   - Do not alter the existing checklist file references or verification commands.

3. `.claude/skills/add-query-mode/SKILL.md`
   - Anchor: after the opening paragraph at line 8 and before `## Checklist` at line 10.
   - Change: add a short section such as:
     ```md
     ## Documentation Context

     Before designing or updating an analysis/query mode, review https://www.drizzle-cube.dev/llms.txt for the current documentation map, public API guidance, and mode-related examples. Use repository source and the checklist below as the implementation source of truth when docs and code differ.
     ```
   - Do not alter the existing backend/frontend/testing checklist or reference implementation paths.

4. `.claude/skills/quality-gate/SKILL.md`
   - Anchor: after the paragraph at lines 24-25 explaining that the gate complements `npm run typecheck`, `npm run lint`, and `npm test`, and before `## The one command that matters` at line 27.
   - Change: add a short section such as:
     ```md
     ## Documentation Context

     If the change affects public docs, examples, or agent-facing guidance, review https://www.drizzle-cube.dev/llms.txt to understand the published documentation surface before reporting quality findings. Do not run this quality gate solely because of a one-line or documentation-only edit; the guidance above still applies.
     ```
   - Preserve the existing warning that this gate is not needed for one-line or doc/test-only edits (`quality-gate` lines 20-22).

No changes are planned for:
- `.claude/rules/theming.md` — scoped to `src/client/**/*.tsx` theming rules, not agent docs discovery.
- `.claude/plan.md` — historical test coverage plan, not an active reusable skill.
- `.claude/settings.json` — plugin settings only.
- Runtime source, tests, package metadata, or generated files.

## Commands

Guardrails report (`.lastlight/issue-900/guardrails-report.md:10-17`) says this is a documentation/quality change and no tooling bootstrap is required. It identifies the available scripts as test, lint, and typecheck. Use these exact commands if verification is required:

```bash
npm run lint
npm run typecheck
npm test
```

For this docs-only change, the minimum acceptable verification is a targeted review/diff of the four modified Markdown files. Full lint/typecheck/test can be skipped if no code changes occur, but mention the skip reason.

## Implementation approach

1. Open the four target Markdown files and apply the sections exactly at the anchors above.
2. Keep wording concise and agent-focused: the new link is supplementary context, not a replacement for repo-local guidance or source code.
3. Ensure all three skills in `.claude/skills/` are covered:
   - `add-chart-type`
   - `add-query-mode`
   - `quality-gate`
4. Do not add process requirements that conflict with existing guidance. In particular, keep `quality-gate` optional for doc-only edits.
5. Review `git diff -- CLAUDE.md .claude/skills/add-chart-type/SKILL.md .claude/skills/add-query-mode/SKILL.md .claude/skills/quality-gate/SKILL.md` to confirm only intended Markdown changes.
6. Run no code-generation or dependency commands.

## Risks and edge cases

- Avoid implying that external documentation overrides repository source. The plan explicitly says repo files/source are the implementation source of truth.
- Avoid making `quality-gate` mandatory for documentation-only edits, because its existing skill guidance says it is not needed for one-line/doc/test-only edits.
- The published URL may be unavailable during execution; the executor only needs to add the link, not fetch or validate remote content.
- Markdown-only changes should not affect lint/typecheck/test, but formatting should stay simple and consistent.

## Test strategy

- Required: inspect the Markdown diff for the four files and verify the URL appears in `CLAUDE.md` plus all three `SKILL.md` files.
- Optional/full guardrails: run `npm run lint`, `npm run typecheck`, and `npm test` if the executor wants full confidence or if any non-doc file changes unexpectedly.
- No new automated tests are needed because this is documentation/agent-guidance only.

## Estimated complexity

simple
