# Consumer smoke tests

Fresh apps that install the **packed** `drizzle-cube` tarball the way a user
would, with plain npm (no `legacy-peer-deps`), and check that they install,
build and typecheck. They catch packaging bugs that the in-repo suites cannot
see: a dependency that should be a peer, an "optional" peer that a bundler
cannot do without, a public `.d.ts` that imports an undeclared package.

```bash
npm run build            # the tarball is packed from dist/
npm run test:consumers   # all fixtures
npm run test:consumers -- vite-minimal webpack-minimal   # some
```

Each fixture is a directory with a `package.json` (its dependencies, without
`drizzle-cube`) and a `check` script. The runner copies it to a temp dir,
installs the tarball plus its dependencies, and runs `npm run check`.

| Fixture | Installs | Checks |
|---|---|---|
| `server-only` | `drizzle-orm` | no client/React-Router/DuckDB/d3 packages installed; `server` + `mcp` run and bundle without the MCP App HTML |
| `vite-minimal` | `react react-dom recharts` + Vite 8 | `tsc` (`skipLibCheck: false`) and `vite build` with no optional peers |
| `vite-react18` | as above, React 18 | same |
| `webpack-minimal` | `react react-dom recharts` + webpack 5 | build has 0 errors with no optional peers |
| `vite-full-peers` | every client peer | `tsc` and `vite build` |
| `webpack-full-peers` | every client peer | build has 0 errors and 0 warnings |
