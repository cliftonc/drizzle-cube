# AnalysisBuilder

Visual query construction UI — the largest client subsystem (~14k lines, 41 files). Supports four analysis modes (query, funnel, flow, retention) with a search-first field picker, drag-and-drop sections, and auto-executing queries.

## Layout

Results panel (left/top) + query builder panel (right/bottom). Each AnalysisBuilder instance gets its own Zustand store via `AnalysisBuilderStoreProvider` — standalone mode persists to localStorage, modal/portlet mode initializes from props.

## Directory Layout

```
src/client/components/AnalysisBuilder/
├── index.tsx                        Main component — store provider + inner layout
├── types.ts                         AnalysisBuilderProps, AnalysisBuilderRef
│
│ Query Builder Panels
├── AnalysisQueryPanel.tsx           Right panel — tabs: metrics, breakdowns, filters, chart config
├── AnalysisResultsPanel.tsx         Left panel — chart/table/debug views, toolbar
├── AnalysisChartConfigPanel.tsx     Chart type picker + axis drop-zone config
├── AnalysisDisplayConfigPanel.tsx   Display options (legend, grid, tooltip toggles)
├── AnalysisTypeSelector.tsx         Mode switcher: query | funnel | flow | retention
├── AnalysisAIPanel.tsx              AI natural-language query generation panel
├── AnalysisModeErrorBoundary.tsx    Error boundary per analysis mode
│
│ Field Selection
├── FieldSearchModal.tsx             Search-first modal for picking measures/dimensions
├── FieldSearchItem.tsx              Individual field row in search results
├── FieldDetailPanel.tsx             Field metadata detail view
│
│ Query Sections
├── MetricsSection.tsx               Measure pill list with drag-reorder
├── MetricItemCard.tsx               Individual measure pill
├── BreakdownSection.tsx             Dimension pill list with granularity controls
├── BreakdownItemCard.tsx            Individual dimension pill
├── AnalysisFilterSection.tsx        Filter group container
├── AnalysisFilterGroup.tsx          AND/OR filter group logic
├── AnalysisFilterItem.tsx           Individual filter row with operator/value
├── FilterConfigModal.tsx            Filter operator and value configuration
├── AnalysisAxisDropZone.tsx         Drag target for chart axis configuration
├── LimitSection.tsx                 Row limit control
├── SectionHeading.tsx               Reusable collapsible section header
├── ExecutionPlanPanel.tsx           Query execution plan / dry-run viewer
├── ExplainAIPanel.tsx               AI explanation of query results
│
│ Funnel Mode
├── FunnelModeContent.tsx            Funnel-specific query panel content
├── FunnelConfigPanel.tsx            Funnel configuration (cube, binding key, time)
├── FunnelStepList.tsx               Ordered list of funnel steps
├── FunnelStepCard.tsx               Individual funnel step with filter config
├── FunnelBindingKeySelector.tsx     User identity dimension picker for funnels
│
│ Flow & Retention Modes
├── FlowModeContent.tsx              Flow analysis panel (event paths)
├── FlowConfigPanel.tsx              Flow configuration (starting step, depth)
├── RetentionModeContent.tsx         Retention analysis panel
├── RetentionConfigPanel.tsx         Retention configuration (cohort, activity, periods)
│
└── utils/                           Pure utility functions
    ├── index.ts                     Barrel exports
    ├── fieldUtils.ts                Field label resolution, cube extraction
    ├── filterUtils.ts               Filter creation, operator logic
    ├── idUtils.ts                   Stable ID generation for metrics/breakdowns
    ├── queryUtils.ts                Query state → SemanticQuery conversion
    ├── recentFieldsUtils.ts         Recently-used field tracking (localStorage)
    └── storageUtils.ts              LocalStorage read/write with versioning
```

## Key Components

| Component | Purpose |
|-----------|---------|
| `AnalysisBuilder` (index.tsx) | Root — wraps inner component with store provider, handles share URL parsing |
| `AnalysisQueryPanel` | Right panel orchestrator — renders mode-specific content and shared tabs |
| `AnalysisResultsPanel` | Left panel — chart rendering, table view, debug panels, toolbar actions |
| `FieldSearchModal` | Search-first field picker — filters cubes/measures/dimensions with recent fields |
| `AnalysisTypeSelector` | Dropdown to switch between query/funnel/flow/retention modes |
| `FunnelModeContent` | Replaces default query panel content when in funnel mode |
| `FlowModeContent` | Replaces default query panel content when in flow mode |
| `RetentionModeContent` | Replaces default query panel content when in retention mode |

## Hooks (external to this directory)

- `useAnalysisBuilder` — master hook: all state, data fetching, and actions
- `useAnalysisAI` — AI query generation (prompt → query)
- `useAnalysisShare` — share URL encoding/decoding

## Guard Rails

1. Each instance gets its own Zustand store — no global state leakage between portlets
2. Mode switching preserves per-mode state (query, funnel, flow, retention stored independently)
3. Field selection always goes through `FieldSearchModal` — no free-text field entry
4. All utils are pure functions — no React hooks or side effects in `utils/`
5. CSS uses `dc:` prefix classes for namespace isolation
