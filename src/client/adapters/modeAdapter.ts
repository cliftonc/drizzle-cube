/**
 * ModeAdapter Interface
 *
 * Defines the contract for analysis mode adapters. Each analysis mode
 * (query, funnel, future: flow, retention, cohort) implements this interface
 * to handle mode-specific logic including:
 * - Converting UI state to/from AnalysisConfig (save/load)
 * - Validation
 * - Default chart configuration
 *
 * This pattern keeps the core store mode-agnostic while allowing
 * each mode to own its specific logic.
 */

import type {
  AnalysisConfig,
  AnalysisType,
  ChartConfig,
} from '../types/analysisConfig'

// ============================================================================
// Validation Result
// ============================================================================

/**
 * Result from adapter validation
 */
export interface ValidationResult {
  /** Whether the state is valid for execution */
  isValid: boolean

  /** Errors that prevent execution */
  errors: string[]

  /** Warnings that don't prevent execution but should be shown */
  warnings: string[]
}

// ============================================================================
// Mode Adapter Interface
// ============================================================================

/**
 * Mode adapter interface - owns all mode-specific logic
 *
 * TUIState is the shape of the UI state for this mode. For example:
 * - Query mode: { queryStates, activeQueryIndex, mergeStrategy }
 * - Funnel mode: { funnelCube, funnelSteps, funnelBindingKey, ... }
 *
 * The adapter handles conversion between this UI state and the
 * persisted AnalysisConfig format.
 */
export interface ModeAdapter<TUIState> {
  // ===========================================================================
  // Identity
  // ===========================================================================

  /**
   * The analysis type this adapter handles.
   * Must match one of the AnalysisType union values.
   */
  readonly type: AnalysisType

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Create initial empty UI state for this mode.
   * Called on store initialization and when clearing state.
   */
  createInitial(): TUIState

  // ===========================================================================
  // State Extraction
  // ===========================================================================

  /**
   * Extract this mode's state from the full store state.
   * This replaces the need for hardcoded property access in the store.
   *
   * Called when:
   * - Saving state to AnalysisConfig
   * - Getting validation for current mode
   *
   * @param storeState - The full store state object
   * @returns The extracted UI state for this mode
   */
  extractState(storeState: Record<string, unknown>): TUIState

  // ===========================================================================
  // Persistence
  // ===========================================================================

  /**
   * Convert AnalysisConfig → UI state (loading).
   *
   * Called when:
   * - Loading from portlet (editing a dashboard widget)
   * - Loading from share URL
   * - Loading from localStorage
   *
   * @param config - The AnalysisConfig to load
   * @returns The UI state for this mode's slice
   * @throws Error if config cannot be loaded (malformed data)
   */
  load(config: AnalysisConfig): TUIState

  /**
   * Check if this adapter can load the given config.
   * Used for graceful error handling before attempting load.
   *
   * Should return false for:
   * - Wrong analysis type
   * - Missing required fields
   * - Invalid version
   *
   * @param config - Unknown value to check
   * @returns Type guard indicating if config is valid for this adapter
   */
  canLoad(config: unknown): config is AnalysisConfig

  /**
   * Convert UI state → AnalysisConfig (saving).
   *
   * Builds the executable query from UI state. Called when:
   * - Saving a portlet
   * - Creating a share URL
   * - Persisting to localStorage
   *
   * @param state - The current UI state for this mode
   * @param charts - The charts config map from store
   * @param activeView - Current active view ('table' or 'chart')
   * @returns The persisted AnalysisConfig
   */
  save(
    state: TUIState,
    charts: Partial<Record<AnalysisType, ChartConfig>>,
    activeView: 'table' | 'chart'
  ): AnalysisConfig

  // ===========================================================================
  // Validation
  // ===========================================================================

  /**
   * Validate UI state before execution.
   *
   * Returns validation errors/warnings that can be displayed to user.
   * A query with errors should not be executed.
   *
   * @param state - The current UI state to validate
   * @returns Validation result with errors and warnings
   */
  validate(state: TUIState): ValidationResult

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Reset UI state to initial (optionally preserve cube selection).
   *
   * Called when user clicks "Clear" in the mode.
   * May preserve certain selections like the current cube.
   *
   * @param state - Current state to clear
   * @returns New cleared state
   */
  clear(state: TUIState): TUIState

  // ===========================================================================
  // Chart Configuration
  // ===========================================================================

  /**
   * Default chart config for this mode.
   *
   * Called when:
   * - Mode switch with no existing chart config for this mode
   * - Load with missing chart config in the AnalysisConfig
   * - Initial store creation
   *
   * @returns Default ChartConfig for this mode
   */
  getDefaultChartConfig(): ChartConfig
}
