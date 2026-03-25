---
name: add-query-mode
description: Use when adding a new analysis/query mode to drizzle-cube (e.g., cohort, path analysis). Covers backend types, query builder, executor/compiler integration, frontend adapter, store slice, hooks, UI components, tests, and icon.
---

# Adding a Query Mode

Drizzle-cube has four analysis modes: query, funnel, flow, and retention. Each mode requires coordinated changes across backend (types → query builder → executor → compiler → cache), frontend (types → adapter → store slice → hooks → UI), tests, and an icon. Follow this checklist in order.

## Checklist

### Backend

- [ ] **1. Create type definitions** — Create `src/server/types/{mode}.ts` with `{Mode}QueryConfig`, `{Mode}ResultRow`, and `{Mode}ValidationResult` interfaces. Export from `src/server/types/index.ts`. Add optional `{mode}?: {Mode}QueryConfig` field to `SemanticQuery` in `src/server/types/query.ts`.

- [ ] **2. Create query builder** — Create `src/server/builders/{mode}-query-builder.ts` with: `has{Mode}(query)` detection, `validateConfig(config, cubes)` validation, `build{Mode}Query(config, cubes, context)` SQL generation via Drizzle, and `transformResult(rawResult)` post-processing.

- [ ] **3. Integrate with executor** — In `src/server/executor.ts`, add a `{mode}QueryBuilder` field to the `QueryExecutor` class, initialize it in the constructor, add detection in the `execute()` method, add routing to a new `execute{Mode}QueryWithCache()` method, and implement `execute{Mode}Query()` and `dryRun{Mode}()` methods.

- [ ] **4. Integrate with compiler** — In `src/server/compiler.ts`, add a `dryRun{Mode}()` public method, add a validation path in `validateQueryAgainstCubes()`, and add routing in `explainQuery()`.

- [ ] **5. Update cache utils** — In `src/server/cache-utils.ts`, add `normalize{Mode}Config()` and wire it into `normalizeQuery()`.

- [ ] **6. Database adapter updates** (if mode needs DB-specific SQL) — Add abstract methods to `src/server/adapters/base-adapter.ts` and implement in postgres, mysql, sqlite, duckdb, snowflake, singlestore, and databend adapters.

- [ ] **7. Update AI prompts** (if AI should understand this mode) — Update `src/server/prompts/types.ts` and `src/server/prompts/step1-shape-prompt.ts` with mode-specific query structures.

### Frontend

- [ ] **8. Create frontend types** — Create `src/client/types/{mode}.ts` with `{Mode}SliceState`, `Server{Mode}Query`, `{Mode}ChartData`, and type guards. Export public types from `src/client/index.ts`.

- [ ] **9. Update AnalysisConfig types** — In `src/client/types/analysisConfig.ts`, add `'{mode}'` to the `AnalysisType` union, create `{Mode}AnalysisConfig` extending `AnalysisConfigBase`, and add to the `AnalysisConfig` union type.

- [ ] **10. Create mode adapter** — Create `src/client/adapters/{mode}ModeAdapter.ts` implementing `ModeAdapter<{Mode}SliceState>` with: `type`, `createInitial()`, `extractState()` (critical for workspace persistence), `canLoad()`, `load()`, `save()`, `validate()`, `clear()`, `getDefaultChartConfig()`. Register via `adapterRegistry.register()` in `src/client/adapters/adapterRegistry.ts`.

- [ ] **11. Create store slice** — Create `src/client/stores/slices/{mode}Slice.ts` with state interface, actions (including `build{Mode}Query()` returning `Server{Mode}Query | null` and `is{Mode}ModeEnabled()`), and `createInitial{Mode}State()`. Export from `src/client/stores/slices/index.ts`. Compose into `src/client/stores/analysisBuilderStore.tsx`.

- [ ] **12. Create query hook** — Create `src/client/hooks/queries/use{Mode}Query.ts` handling debouncing, caching, and result transformation via `useQuery`. Export from `src/client/hooks/queries/index.ts`. A single shared `useDryRunQuery.ts` already handles SQL preview for all modes.

- [ ] **13. Update query execution** — In `src/client/hooks/useAnalysisQueryExecution.ts`, add `server{Mode}Query` to the options interface and add mode routing. In `src/client/hooks/useAnalysisBuilderHook.ts`, add mode-specific state and actions to the hook result.

- [ ] **14. Create UI components** — Create `src/client/components/AnalysisBuilder/{Mode}ModeContent.tsx` (main mode panel) and `{Mode}ConfigPanel.tsx` (configuration UI). Update `AnalysisQueryPanel.tsx` to conditionally render `{Mode}ModeContent`. Update `AnalysisTypeSelector.tsx` to add the mode option.

- [ ] **15. Update portlet integration** — Update `src/client/components/AnalyticsPortlet.tsx` and `src/client/components/PortletContainer.tsx` to detect and handle the new mode's queries.

- [ ] **16. Add icon** — In `src/client/icons/customIcons.ts`, create `{mode}Icon: IconifyIcon` with appropriate SVG path data.

- [ ] **17. Chart type integration** (if mode needs a new chart type) — Create chart component in `src/client/components/charts/`, update `src/client/shared/chartDefaults.ts` `getChartAvailability()`, and update `ChartTypeSelector` `excludeTypes`.

### Testing

- [ ] **18. Backend tests** — Create `tests/{mode}-query.test.ts` covering query builder methods, execution integration, security context isolation, cross-cube filtering, and multi-database compatibility (`TEST_DB_TYPE` env).

- [ ] **19. Client adapter tests** — Create `tests/client/adapters/{mode}ModeAdapter.test.ts` covering `createInitial()`, `canLoad()`, `load()`, `save()`, `validate()`, `clear()`, `getDefaultChartConfig()`, and a round-trip test (`save → load` state equivalence).

- [ ] **20. Client validation and execution tests** — Create `tests/client/{mode}/{mode}Validation.test.ts` and `tests/client/{mode}/{mode}Execution.test.ts` for validation functions, data transformations, and metric calculations.

## File Reference

| File | Action | Key Symbols |
|------|--------|-------------|
| `src/server/types/{mode}.ts` | Create | `{Mode}QueryConfig`, `{Mode}ResultRow` |
| `src/server/types/index.ts` | Export new types | — |
| `src/server/types/query.ts` | Add field to union | `SemanticQuery` |
| `src/server/builders/{mode}-query-builder.ts` | Create | `has{Mode}()`, `build{Mode}Query()`, `validateConfig()`, `transformResult()` |
| `src/server/executor.ts` | Add builder + routing | `QueryExecutor`, `execute()`, `execute{Mode}QueryWithCache()` |
| `src/server/compiler.ts` | Add public methods | `dryRun{Mode}()`, `validateQueryAgainstCubes()`, `explainQuery()` |
| `src/server/cache-utils.ts` | Add normalizer | `normalize{Mode}Config()`, `normalizeQuery()` |
| `src/client/types/{mode}.ts` | Create | `{Mode}SliceState`, `Server{Mode}Query`, `{Mode}ChartData` |
| `src/client/types/analysisConfig.ts` | Extend union + config | `AnalysisType`, `{Mode}AnalysisConfig` |
| `src/client/adapters/{mode}ModeAdapter.ts` | Create | `{mode}ModeAdapter` : `ModeAdapter` |
| `src/client/adapters/adapterRegistry.ts` | Register adapter | `adapterRegistry.register()` |
| `src/client/stores/slices/{mode}Slice.ts` | Create | `create{Mode}Slice`, `createInitial{Mode}State()` |
| `src/client/stores/analysisBuilderStore.tsx` | Compose slice | `createAnalysisBuilderStore()` |
| `src/client/hooks/queries/use{Mode}Query.ts` | Create | `use{Mode}Query()` |
| `src/client/hooks/useAnalysisQueryExecution.ts` | Add mode routing | `server{Mode}Query` |
| `src/client/hooks/useAnalysisBuilderHook.ts` | Add state/actions | — |
| `src/client/components/AnalysisBuilder/{Mode}ModeContent.tsx` | Create | — |
| `src/client/components/AnalysisBuilder/{Mode}ConfigPanel.tsx` | Create | — |
| `src/client/components/AnalysisBuilder/AnalysisTypeSelector.tsx` | Add option | — |
| `src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx` | Add conditional render | — |
| `src/client/components/AnalyticsPortlet.tsx` | Add mode detection | — |
| `src/client/icons/customIcons.ts` | Add icon | `{mode}Icon` : `IconifyIcon` |

## Reference Implementations

Study these existing modes as patterns (paths only — read the files directly):

**Funnel** — `src/server/builders/funnel-query-builder.ts`, `src/server/types/funnel.ts`, `src/client/adapters/funnelModeAdapter.ts`, `src/client/types/funnel.ts`, `src/client/stores/slices/funnelSlice.ts`, `src/client/hooks/queries/useFunnelQuery.ts`, `src/client/components/AnalysisBuilder/FunnelModeContent.tsx`, `src/client/components/AnalysisBuilder/FunnelConfigPanel.tsx`, `tests/funnel-query.test.ts`, `tests/client/adapters/funnelModeAdapter.test.ts`

**Flow** — `src/server/builders/flow-query-builder.ts`, `src/server/types/flow.ts`, `src/client/adapters/flowModeAdapter.ts`, `src/client/types/flow.ts`, `src/client/stores/slices/flowSlice.ts`, `src/client/hooks/queries/useFlowQuery.ts`, `src/client/components/AnalysisBuilder/FlowModeContent.tsx`, `tests/flow-query.test.ts`, `tests/client/adapters/flowModeAdapter.test.ts`

**Retention** — `src/server/builders/retention-query-builder.ts`, `src/server/types/retention.ts`, `src/client/adapters/retentionModeAdapter.ts`, `src/client/types/retention.ts`, `src/client/stores/slices/retentionSlice.ts`, `src/client/hooks/queries/useRetentionQuery.ts`, `src/client/components/AnalysisBuilder/RetentionModeContent.tsx`, `src/client/components/AnalysisBuilder/RetentionConfigPanel.tsx`, `tests/retention-query.test.ts`, `tests/client/adapters/retentionModeAdapter.test.ts`

## Verification

- `npx tsc --noEmit` — zero type errors
- `npm test -- {mode}-query.test.ts` — backend tests pass
- `npm test -- {mode}ModeAdapter.test.ts` — adapter tests pass
- `npm run build` — successful build
- New mode appears in AnalysisTypeSelector with correct icon
- Mode adapter round-trips correctly (save → load preserves state)
