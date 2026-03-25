# Client Architecture

The client is a modular React component library for analytics dashboards. It provides embeddable query builders, chart renderers, dashboards, an agentic notebook, and a data browser — all driven by TanStack Query for server state and Zustand for client state.

## Architecture Layers

```
App → CubeProvider → Dashboard / AnalysisBuilder / AgenticNotebook / DataBrowser
         ↓                          ↓                      ↓
    QueryClient              Zustand Stores          TanStack Query
    (TanStack)               (Client State)          (Server State)
```

- **CubeProvider** — React context providing API client, metadata, QueryClient, and feature flags
- **Zustand stores** — instance-based stores for UI/client state (per component)
- **TanStack Query** — all server state (fetching, caching, loading, errors)
- **Master hooks** — `useAnalysisBuilderHook`, `useDashboardHook`, `useDataBrowser`, `useAgentChat` coordinate stores + queries

## Directory Layout

```
src/client/
├── index.ts                       Main barrel export
├── charts.ts                      Chart-only export entry
├── components.ts                  Component-only export entry
├── hooks.ts                       Hook-only export entry
├── providers.ts                   Provider-only export entry
├── schema.ts                      Schema visualization export entry
├── styles.css                     Root stylesheet
├── types.ts                       Core client types (ChartType, filter types, etc.)
├── utils.ts                       Utility barrel export
│
├── adapters/                      Analysis mode adapters (see below)
│   ├── adapterRegistry.ts         Central adapter lookup
│   ├── modeAdapter.ts             ModeAdapter interface, ValidationResult
│   ├── queryModeAdapter.ts        Query mode adapter
│   ├── funnelModeAdapter.ts       Funnel mode adapter
│   ├── flowModeAdapter.ts         Flow mode adapter
│   ├── retentionModeAdapter.ts    Retention mode adapter
│   └── index.ts                   Barrel + initializeAdapters
│
├── charts/                        Chart system infrastructure
│   ├── ChartLoader.tsx            Lazy chart component loader
│   ├── chartConfigs.ts            ChartTypeConfig interface
│   ├── chartConfigRegistry.ts     Registry of all chart configs
│   ├── lazyChartConfigRegistry.ts Dynamic-import config registry
│   └── chartPlugin.ts             Chart plugin system
│
├── client/                        API client
│   ├── CubeClient.ts             HTTP client for Cube-compatible API
│   └── BatchCoordinator.ts       Request batching
│
├── components/                    React components
│   ├── AnalysisBuilder/           Query builder (~35 files, see AnalysisBuilder CLAUDE.md)
│   │   ├── index.tsx              Main entry
│   │   ├── Analysis*.tsx          Query panel, chart config, results, AI, filters, axis, mode selector
│   │   ├── Field*.tsx, Filter*.tsx  Field search modal, filter config modal
│   │   ├── Metrics*.tsx, Breakdown*.tsx, LimitSection.tsx
│   │   ├── Funnel*.tsx, Flow*.tsx, Retention*.tsx  Mode-specific content/config
│   │   ├── ExecutionPlanPanel.tsx, ExplainAIPanel.tsx  Debug/AI panels
│   │   └── utils/                 fieldUtils, filterUtils, queryUtils, etc.
│   │
│   ├── AgenticNotebook/           AI-driven notebook interface
│   │   ├── index.tsx              Main entry
│   │   ├── AgentChatPanel.tsx     Chat conversation panel
│   │   ├── ChatInput.tsx          Chat input component
│   │   ├── ChatMessage.tsx        Chat message renderer
│   │   ├── NotebookCanvas.tsx     Block canvas
│   │   ├── NotebookMarkdownBlock.tsx  Markdown block
│   │   └── NotebookPortletBlock.tsx   Portlet block
│   │
│   ├── DataBrowser/               Schema exploration tool
│   │   ├── index.tsx              Main entry
│   │   ├── DataBrowserSidebar.tsx Cube/field navigation
│   │   ├── DataBrowserTable.tsx   Data preview table
│   │   └── DataBrowserToolbar.tsx Toolbar with actions
│   │
│   ├── AIAssistant/               AI assistant utilities
│   │   ├── index.ts, types.ts, constants.ts, utils.ts
│   │
│   ├── DashboardFilters/          Dashboard filter components (~11 files)
│   │   ├── CompactFilterBar.tsx, FilterChip.tsx, FilterValuePopover.tsx
│   │   ├── DatePresetChips.tsx, CustomDateDropdown.tsx, XTDDropdown.tsx
│   │   └── DashboardFilterConfigModal.tsx, FilterEditModal.tsx, etc.
│   │
│   ├── SchemaVisualization/       ERD-style schema viewer
│   │   ├── index.tsx, SchemaVisualizationLazy.tsx
│   │   ├── CubeNode.tsx, RelationshipEdge.tsx, FieldDetailPanel.tsx
│   │   ├── useERDLayout.ts, xyflowContext.tsx
│   │
│   ├── shared/                    Shared filter components
│   │   ├── DateRangeFilter.tsx, DateRangeSelector.tsx
│   │   ├── FilterBuilder.tsx, FilterGroup.tsx, FilterItem.tsx
│   │   ├── FilterValueSelector.tsx, types.ts, utils.ts
│   │
│   ├── charts/                    Chart implementations (27 chart types)
│   │   ├── *Chart.tsx + .config.ts  One pair per chart type (Bar, Line, Area, Pie, Scatter,
│   │   │                            Radar, Bubble, Funnel, Sankey, HeatMap, TreeMap, Sunburst,
│   │   │                            RadialBar, BoxPlot, Waterfall, Candlestick, Gauge,
│   │   │                            ActivityGrid, RetentionHeatmap, RetentionCombined,
│   │   │                            MeasureProfile, KpiNumber, KpiDelta, KpiText, Markdown)
│   │   ├── DataTable.tsx + .config.ts  Sortable data table
│   │   ├── ChartContainer.tsx, ChartLegend.tsx, ChartTooltip.tsx  Shared wrappers
│   │   ├── AngledXAxisTick.tsx, AxisFormatControls.tsx
│   │   ├── MissingDependencyFallback.tsx
│   │   └── index.ts
│   │
│   ├── AnalyticsDashboard.tsx     Dashboard container
│   ├── AnalyticsPage.tsx          Full analytics page layout
│   ├── AnalyticsPortlet.tsx       Individual dashboard widget
│   ├── AnalysisBuilderLazy.tsx    Lazy-loaded AnalysisBuilder
│   ├── ChartErrorBoundary.tsx     Chart error boundary
│   ├── ChartTypeSelector.tsx      Chart type picker (driven by chartConfigRegistry)
│   ├── DashboardGrid.tsx          Grid layout engine
│   ├── DashboardPortletCard.tsx   Portlet card wrapper
│   ├── RowManagedLayout.tsx       Row-based layout engine
│   ├── MobileStackedLayout.tsx    Mobile-responsive layout
│   └── (modals & misc)            ConfirmModal, DashboardEditModal, DebugModal, Modal,
│                                  PortletAnalysisModal, PortletFilterConfigModal,
│                                  TextPortletModal, DrillBreadcrumb, DrillMenu,
│                                  FloatingEditToolbar, LoadingIndicator, etc.
│
├── hooks/                         React hooks
│   ├── queries/                   TanStack Query hooks
│   │   ├── useCubeLoadQuery.ts    Primary data fetching with debounce
│   │   ├── useMultiCubeLoadQuery.ts  Parallel multi-query execution
│   │   ├── useCubeMetaQuery.ts    Metadata fetching
│   │   ├── useDryRunQuery.ts      SQL preview / debug
│   │   ├── useExplainQuery.ts, useExplainAI.ts  EXPLAIN + AI explanation
│   │   ├── useFunnelQuery.ts, useFlowQuery.ts, useRetentionQuery.ts
│   │   └── index.ts
│   ├── dashboard/                 Dashboard layout hooks
│   │   ├── useDashboardController.ts, useGridLayoutEngine.ts
│   │   ├── useRowLayoutEngine.ts, layoutUtils.ts
│   ├── useAnalysisBuilderHook.ts  AnalysisBuilder master coordinator
│   ├── useAnalysisAI.ts           AI-assisted query building
│   ├── useAnalysis*.ts            Chart defaults, combined fields, init, query builder,
│   │                              query execution, share, UI state
│   ├── useAgentChat.ts            Agent chat hook
│   ├── useDashboardHook.ts        Dashboard master coordinator
│   ├── useDataBrowser.ts          Data browser coordination
│   └── (utility hooks)            useDebounce, useDirtyStateTracking, useDragAutoScroll,
│                                  useDrillInteraction, useFilterValues, useNotebookLayout,
│                                  useResponsiveDashboard, useScrollDetection, useTheme, etc.
│
├── icons/                         Icon system
│   ├── registry.tsx, defaultIcons.ts, customIcons.ts, types.ts, index.ts
│
├── providers/                     React context providers
│   ├── CubeProvider.tsx           Root provider (API + QueryClient + features)
│   ├── CubeApiProvider.tsx, CubeMetaProvider.tsx, CubeMetaContext.tsx
│   ├── CubeFeaturesProvider.tsx, ScrollContainerContext.tsx
│
├── shared/                        Shared utilities
│   ├── chartDefaults.ts, queryKey.ts, types.ts, utils.ts, index.ts
│   └── components/                CodeBlock.tsx, QueryAnalysisPanel.tsx
│
├── stores/                        Zustand stores (client state only)
│   ├── analysisBuilderStore.tsx   AnalysisBuilder state + actions
│   ├── dashboardStore.tsx         Dashboard editing/layout state
│   ├── dataBrowserStore.tsx       Data browser state
│   ├── notebookStore.tsx          Agentic notebook state
│   ├── index.ts
│   └── slices/                    Store slices (composable state)
│       ├── coreSlice.ts           Core analysis state
│       ├── querySlice.ts          Query mode state
│       ├── funnelSlice.ts         Funnel mode state
│       ├── flowSlice.ts           Flow mode state
│       ├── retentionSlice.ts      Retention mode state
│       ├── uiSlice.ts             UI state slice
│       └── index.ts
│
├── theme/                         Theming
│   ├── variables.css              CSS variables + Tailwind config (dc: prefix)
│   └── index.ts
│
├── types/                         Extended type definitions
│   ├── analysisConfig.ts          AnalysisConfig, ChartConfig, AnalysisType
│   ├── drill.ts                   Drill-down types
│   ├── flow.ts                    Flow analysis types
│   ├── funnel.ts                  Funnel analysis types
│   └── retention.ts               Retention analysis types
│
└── utils/                         Utility modules
    ├── index.ts
    ├── chartConstants.ts, chartUtils.ts  Chart data helpers
    ├── colorPalettes.ts           Color palette definitions
    ├── comparisonUtils.ts         Time comparison utilities
    ├── configMigration.ts         Config version migration
    ├── drillQueryBuilder.ts       Drill-down query construction
    ├── filterUtils.ts             Filter manipulation
    ├── funnelExecution.ts, funnelValidation.ts  Funnel helpers
    ├── multiQueryUtils.ts, multiQueryValidation.ts  Multi-query helpers
    ├── pivotUtils.ts              Data pivot transformations
    ├── shareUtils.ts              URL sharing / compression
    └── (misc)                     measureIcons, periodUtils, syntaxHighlighting,
                                   targetUtils, thumbnail
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CubeProvider` | `providers/CubeProvider.tsx` | Root context — API client, QueryClient, metadata, features |
| `AnalysisBuilder` | `components/AnalysisBuilder/index.tsx` | Search-first query builder with multi-mode support |
| `AnalyticsDashboard` | `components/AnalyticsDashboard.tsx` | Dashboard container with grid/row layout |
| `AnalyticsPortlet` | `components/AnalyticsPortlet.tsx` | Individual dashboard widget |
| `AgenticNotebook` | `components/AgenticNotebook/index.tsx` | AI-driven notebook with chat + canvas blocks |
| `DataBrowser` | `components/DataBrowser/index.tsx` | Schema exploration and data preview |
| `ChartLoader` | `charts/ChartLoader.tsx` | Lazy chart component loader |
| `chartConfigRegistry` | `charts/chartConfigRegistry.ts` | Registry of all chart type configs |
| `CubeClient` | `client/CubeClient.ts` | HTTP client for Cube-compatible API |
| `analysisBuilderStore` | `stores/analysisBuilderStore.tsx` | AnalysisBuilder Zustand store |
| `dashboardStore` | `stores/dashboardStore.tsx` | Dashboard Zustand store |
| `dataBrowserStore` | `stores/dataBrowserStore.tsx` | Data browser Zustand store |
| `notebookStore` | `stores/notebookStore.tsx` | Agentic notebook Zustand store |

## State Management

- **Zustand stores** hold UI/client state only: selected metrics, chart type, edit mode, active tabs
- **TanStack Query** holds all server state: query results, loading, errors, caching
- Stores are instance-based via React Context — each component tree gets its own store
- Store slices (`stores/slices/`) compose mode-specific state into the analysis builder store

## Analysis Mode Adapters

The AnalysisBuilder supports multiple analysis modes through a mode adapter pattern:

| Adapter | File | Mode |
|---------|------|------|
| `queryModeAdapter` | `adapters/queryModeAdapter.ts` | Standard query (single + multi) |
| `funnelModeAdapter` | `adapters/funnelModeAdapter.ts` | Funnel analysis |
| `flowModeAdapter` | `adapters/flowModeAdapter.ts` | Flow / path analysis |
| `retentionModeAdapter` | `adapters/retentionModeAdapter.ts` | Retention analysis |

Each adapter implements `ModeAdapter` from `adapters/modeAdapter.ts` with methods for initialization, persistence (`load`/`save`), validation, and chart defaults. Adapters are registered via `adapterRegistry`.

## CSS Isolation

All Tailwind utilities are prefixed with `dc:` to prevent conflicts in embedded contexts. Theme classes use `*-dc-*` pattern (e.g., `bg-dc-surface`, `text-dc-text`). In Tailwind v4, prefix comes first: `dc:hover:opacity-80` (not `hover:dc:opacity-80`). Configuration lives in `theme/variables.css`.

## Guard Rails

1. **Server state in TanStack Query only** — never store API response data, loading, or error state in Zustand
2. **CubeProvider is mandatory** — all components must be wrapped in CubeProvider
3. **Use store providers** — wrap component trees with `*StoreProvider` for instance isolation
4. **Use selectors with `useShallow`** — subscribe only to needed state slices
5. **Use TanStack Query hooks for all data fetching** — `useCubeLoadQuery`, `useMultiCubeLoadQuery`, etc.
6. **Error boundaries required** — all chart components use `ChartErrorBoundary`
7. **Use `dc:` prefix** — never use raw Tailwind colors; use `dc-*` theme classes
