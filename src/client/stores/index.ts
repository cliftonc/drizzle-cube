/**
 * Zustand Stores - Barrel Export
 *
 * Centralized state management stores for the drizzle-cube client.
 *
 * ARCHITECTURE: Instance-based stores
 * - Each AnalysisBuilder gets its own Zustand store instance via Context
 * - Use `AnalysisBuilderStoreProvider` to wrap components that need store access
 * - Use `useAnalysisBuilderStore` hook to access state (must be inside provider)
 */

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
