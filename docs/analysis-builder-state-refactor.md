# Analysis Builder State Refactor (Proposal)

## Goals
- Make it safe to add new analysis types (flow, retention) without cross-mode breakage.
- Unify serialization so load/save works the same for standalone (localStorage), share URLs, and dashboards.
- Remove legacy funnel via `mergeStrategy: 'funnel'` while keeping old portlets working.
- Keep chart configuration per mode so new chart types don’t sprawl top-level state.

## Scope / Non-Goals
- Scope: AnalysisBuilder client state, serialization, hydration, and dashboard portlet persistence.
- Back-compat required for portlet data already saved in dashboards. LocalStorage/share URLs can break compat.
- Server contracts unchanged in this proposal; only client wiring is described.

## Problems Today (brief)
- One monolithic store mixes domain, UI, charts, and dual funnel implementations.
- Serialization is ad-hoc: localStorage partialize, share URL shape, and portlet save format all differ.
- Legacy funnel (`mergeStrategy: 'funnel'`) coexists with dedicated funnel mode, doubling code paths and migration risk.
- Chart config stored as top-level fields per mode; adding new modes/charts grows the surface area.

## Proposed Architecture

### 1) Versioned `AnalysisSnapshot`
Single source of truth for persisted/portable state. All persistence (localStorage, share, dashboard) uses this.

TypeScript shape (illustrative):
```ts
type AnalysisMode = 'query' | 'funnel' | 'flow' | 'retention'

type AnalysisSnapshot = AnalysisSnapshotV1

interface AnalysisSnapshotV1 {
  version: 1
  analysisType: AnalysisMode
  modes: {
    query?: QuerySnapshot  // single + multi live here
    funnel?: FunnelSnapshot
    flow?: FlowSnapshot
    retention?: RetentionSnapshot
  }
  charts: {
    [K in AnalysisMode]?: {
      chartType: ChartType
      chartConfig: ChartAxisConfig
      displayConfig: ChartDisplayConfig
    }
  }
  activeView: 'table' | 'chart'
  meta?: { source?: 'share' | 'dashboard' | 'local'; savedAt?: string }
}

interface QuerySnapshot {
  queries: QueryState[] // length 1 == single query; >1 == multi
  mergeStrategy: 'concat' | 'merge'
  mergeKeys?: string[]
}

interface FunnelSnapshot {
  cube: string | null
  bindingKey: FunnelBindingKey | null
  timeDimension: string | null
  steps: FunnelStepState[]
}

// Flow/retention snapshots can mirror funnel: keep data self-contained.
```

Rules:
- Every mode’s data lives inside `modes[mode]`; chart/display lives in `charts[mode]`.
- No UI/panel open state in the snapshot (keep persistence domain-only).
- Migrations handled centrally: `decodeSnapshot` reads `version`, migrates to latest, and yields canonical state.

### 2) Mode Adapters
Define a per-mode adapter interface to isolate logic and make new modes pluggable:
```ts
interface ModeAdapter<TSnapshot, TRuntimeQuery> {
  createInitial(): TSnapshot
  hydrate(snapshot: TSnapshot): ModeState
  serialize(state: ModeState): TSnapshot
  buildRuntimeQuery(state: ModeState): TRuntimeQuery  // CubeQuery | ServerFunnelQuery | etc.
  validate(state: ModeState): ValidationResult
  clear(state: ModeState): ModeState
}
```
- Existing logic moves into `queryAdapter` and `funnelAdapter`. New modes implement the same interface.
- Store delegates build/validate/clear to the active adapter; no mode-specific code in the core store.

### 3) Store Restructure (Zustand)
- Core slice: `analysisType`, `activeView`, palette selection, and adapter registry.
- Mode slices: one per mode, holding mode-specific state only.
- Derived selectors (metrics, breakdowns, filters, etc.) become adapter-driven, reducing top-level branching.
- Chart config: keep per-mode map (`charts[mode]`). Switching modes picks the stored chart config; new modes add entries without new top-level fields.

### 4) Unified Persistence Surfaces
- **LocalStorage**: persist the `AnalysisSnapshot` only (no UI flags). Hydration: `decodeSnapshot` -> adapters hydrate.
- **Share URLs**: same snapshot, compressed. No backward compatibility required.
- **Dashboard Portlets (backward compatible)**:
  - New fields: `analysisSnapshot` (stringified snapshot) and `chart` kept in `analysisSnapshot.charts`.
  - Continue writing `query` (runtime query) for rendering and legacy consumers.
  - Load order:
    1) If `analysisSnapshot` exists: decode + hydrate.
    2) Else parse `query`. If it is a legacy funnel (`MultiQueryConfig` with `mergeStrategy: 'funnel'`), convert to `funnel` snapshot (one step per query, binding key if present).
    3) Else treat as `query` mode snapshot.
  - Save order: always write `analysisSnapshot`; also write `query` built from the snapshot’s runtime query so old renderers keep working.
  - Rendering: prefer runtime query built from snapshot; fall back to stored `query` if snapshot missing.

### 5) Remove Legacy Funnel `mergeStrategy: 'funnel'`
- In adapters: drop support for `mergeStrategy: 'funnel'` in `queryAdapter`.
- Migration path for old portlets:
  - Detection during load (see above) converts `mergeStrategy: 'funnel'` to a `funnel` snapshot.
  - After save, portlets store the new `analysisSnapshot` and a `ServerFunnelQuery` in `query` for backward rendering.

### 6) Backward Compatibility Summary
- Portlets: **must** load old `query` strings (single, multi, legacy funnel). New saves include both `analysisSnapshot` and `query` to stay compatible.
- LocalStorage/share: may change shape; no back-compat needed.
- Chart types: stored per mode; new chart types for new modes fit into the `charts[mode]` map without top-level additions.

## Implementation Plan (phased)
1) **Scaffold snapshot + adapters**
   - Add `analysisSnapshot` types, `encode/ decode/ migrate` helpers.
   - Implement `queryAdapter` + `funnelAdapter` using current logic.
   - Add snapshot round-trip tests (encode/decode/hydrate/buildRuntimeQuery).
2) **Refactor store**
   - Split Zustand store into core + per-mode slices; wire adapters.
   - Replace direct state access in hooks/components with adapter-backed selectors.
   - Move chart/display to per-mode map.
3) **Persistence wiring**
   - LocalStorage + share use the snapshot only.
   - Portlet load/save: prefer `analysisSnapshot`, fallback to legacy `query`, write both on save.
   - Add migration for legacy funnel `mergeStrategy: 'funnel'` -> funnel snapshot.
4) **Remove legacy funnel usage**
   - Delete `mergeStrategy: 'funnel'` handling from query code paths.
   - Ensure execution uses `analysisType` + adapter-built runtime query.
5) **Testing**
   - Unit: snapshot migrations, adapter `buildRuntimeQuery`, legacy funnel migration.
   - Integration: portlet load/save round-trip (old `query` -> snapshot -> save -> renders).
   - Regression: share URL generation/parse with new snapshot.

## Notes / Decisions
- UI/panel state stays out of persistence; keeps snapshots stable.
- Per-mode chart config map satisfies “new chart types live with the mode.”
- Future modes (flow/retention) implement adapters; no core store changes required beyond registering the adapter.
