# Executor Summary — Issue #591

## What was done
- Followed up on the reviewer finding by tightening MCP hint normalization: typeless legacy hints no longer override derived chart config on initial render.
- Preserved backward-compatible metadata flow so typeless hints can still contribute non-axis metadata like `title` and `displayConfig`.
- Added a focused regression test covering a typeless hint with legacy `xAxis`/`yAxis` while auto-selection resolves to `table`.

## Files changed
- `src/mcp-app/mcp-app.tsx`
- `tests/client/mcp-app/mcp-app.test.tsx`
- `.lastlight/issue-591/executor-summary.md`

## Test results
- `CI=true npx vitest run --config vitest.config.client.ts tests/client/mcp-app/mcp-app.test.tsx` -> failed first (new regression reproduced reviewer report), then passed after fix
- `CI=true npx vitest run --config vitest.config.client.ts tests/client/mcp-app/` -> passed (2 files, 6 tests)

## Deviations from plan
- `mcp_github_setup_git_auth` failed with `ENOENT: no such file or directory, open '/root/.hermes/.gh-token'`, so the branch was cloned over public HTTPS and git push may rely on unauthenticated access.

## Known issues or concerns
- Local environment reports a Node engine warning during `npm install` because the sandbox is on Node 20 while one dev dependency prefers Node 22, but the targeted and full client test runs still passed.



