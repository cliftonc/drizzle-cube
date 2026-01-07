/**
 * Zustand Stores - Barrel Export
 *
 * Centralized state management stores for the drizzle-cube client.
 *
 * ARCHITECTURE: Instance-based stores
 * - Each AnalysisBuilder/Dashboard gets its own Zustand store instance via Context
 * - Use `*StoreProvider` to wrap components that need store access
 * - Use `use*Store` hook to access state (must be inside provider)
 */

// ============================================================================
// AnalysisBuilder Store
// ============================================================================
export {
  // Provider and hooks
  AnalysisBuilderStoreProvider,
  useAnalysisBuilderStore,
  useAnalysisBuilderStoreApi,

  // Factory function (for advanced use cases)
  createAnalysisBuilderStore,

  // Selectors
  selectCurrentState,
  selectMetrics,
  selectBreakdowns,
  selectFilters,
  selectChartConfig,
  selectUIState,
  selectMultiQueryState,

  // Types
  type AnalysisBuilderStore,
  type AnalysisBuilderStoreState,
  type AnalysisBuilderStoreActions,
  type FieldModalMode,
  type SharedState,
  type CreateStoreOptions,
  type AnalysisBuilderStoreProviderProps,
} from './analysisBuilderStore.js'

// ============================================================================
// Dashboard Store
// ============================================================================
export {
  // Provider and hooks
  DashboardStoreProvider,
  useDashboardStore,
  useDashboardStoreApi,
  useDashboardStoreOptional,

  // Factory function (for advanced use cases)
  createDashboardStore,

  // Selectors
  selectEditModeState,
  selectModalState,
  selectLayoutState,
  selectDebugData,
  selectPortletDebugData,
  selectEditModeActions,
  selectModalActions,
  selectLayoutActions,
  selectDebugDataActions,
  selectAllActions,

  // Types
  type DashboardStore,
  type DashboardStoreState,
  type DashboardStoreActions,
  type PortletDebugDataEntry,
  type DebugDataEntry as DashboardDebugDataEntry, // Alias to avoid conflict with hooks/queries
  type DragState,
  type CreateDashboardStoreOptions,
  type DashboardStoreProviderProps,
} from './dashboardStore.js'
