# Executor Summary — Issue #591

## What was done
- Refactored MCP chart auto-selection so chart-type choice and config derivation are separate concerns.
- Added table-specific config derivation that orders columns as dimensions, time dimensions, measures, then any remaining result keys in encounter order.
- Updated the MCP app to store chart config/display config in state, recompute config on manual chart-type switches, and stop stale AI hint axes from overriding a manual switch.
- Exported `McpApp` and guarded root mounting behind a root-element check for focused component tests.
- Added focused regression tests for chart auto-selection and MCP app chart switching.

## Files changed
- `src/mcp-app/chartAutoSelect.ts`
- `src/mcp-app/mcp-app.tsx`
- `tests/client/mcp-app/chartAutoSelect.test.ts`
- `tests/client/mcp-app/mcp-app.test.tsx`

## Test results
- `CI=true npx vitest run --config vitest.config.client.ts tests/client/mcp-app/` -> passed (2 files, 5 tests)
- `npm run test:client` -> passed

## Deviations from plan
- `mcp_github_setup_git_auth` failed with `ENOENT: no such file or directory, open '/root/.hermes/.gh-token'`, so the branch was cloned over public HTTPS and git push may rely on unauthenticated access.

## Known issues or concerns
- Local environment reports a Node engine warning during `npm install` because the sandbox is on Node 20 while one dev dependency prefers Node 22, but the targeted and full client test runs still passed.

