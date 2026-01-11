/**
 * ExecutionPlanPanel - Shared component for SQL display, EXPLAIN plans, and AI analysis
 *
 * Used across all analysis modes (query, funnel, flow) to show:
 * - Generated SQL with copy functionality
 * - Explain Plan button with "Include timing" toggle
 * - EXPLAIN results with summary badges
 * - AI Analysis button (in Explain Plan header) and modal
 *
 * This is a composable component - the parent handles the layout,
 * this component handles the SQL -> Explain -> AI workflow.
 */

import { useState, memo } from 'react'
import { CodeBlock } from '../../shared'
import { ExplainAIPanel } from './ExplainAIPanel'
import type { ExplainResult, AIExplainAnalysis } from '../../types'

interface ExecutionPlanPanelProps {
  /** The generated SQL to display */
  sql: { sql: string; params?: unknown[] } | null | undefined
  /** Whether SQL is loading */
  sqlLoading?: boolean
  /** Error loading SQL */
  sqlError?: Error | null
  /** Placeholder text when no SQL */
  sqlPlaceholder?: string

  /** EXPLAIN plan result */
  explainResult: ExplainResult | null
  /** Whether EXPLAIN is running */
  explainLoading?: boolean
  /** Whether EXPLAIN has been run at least once */
  explainHasRun?: boolean
  /** Error running EXPLAIN */
  explainError?: Error | null
  /** Run EXPLAIN with options */
  runExplain: (options: { analyze: boolean }) => void

  /** AI analysis result */
  aiAnalysis?: AIExplainAnalysis | null
  /** Whether AI analysis is in progress */
  aiAnalysisLoading?: boolean
  /** Error from AI analysis */
  aiAnalysisError?: Error | null
  /** Run AI analysis */
  runAIAnalysis?: (explainResult: ExplainResult, query: unknown) => void
  /** Clear AI analysis (unused but kept for interface compatibility) */
  clearAIAnalysis?: () => void
  /** Whether AI is enabled */
  enableAI?: boolean

  /** The query object for AI context */
  query?: unknown

  /** Title for the SQL block */
  title?: string
  /** Height for the SQL block */
  height?: string
}

/**
 * ExecutionPlanPanel - Displays SQL, EXPLAIN results, and AI analysis
 */
export const ExecutionPlanPanel = memo(function ExecutionPlanPanel({
  sql,
  sqlLoading = false,
  sqlError,
  sqlPlaceholder = 'Add metrics to generate SQL',

  explainResult,
  explainLoading = false,
  explainHasRun = false,
  explainError,
  runExplain,

  aiAnalysis,
  aiAnalysisLoading = false,
  aiAnalysisError,
  runAIAnalysis,
  clearAIAnalysis: _clearAIAnalysis,
  enableAI = false,

  query,

  title = 'Generated SQL',
  height = '16rem',
}: ExecutionPlanPanelProps) {
  const [useAnalyze, setUseAnalyze] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)

  // Format SQL with parameters
  const formattedSql = sql
    ? sql.sql +
      (sql.params && sql.params.length > 0
        ? '\n\n-- Parameters:\n' + JSON.stringify(sql.params, null, 2)
        : '')
    : ''

  // Handle AI analysis - always re-run to get fresh results after schema/index changes
  const handleAIClick = () => {
    if (runAIAnalysis && explainResult && query) {
      // Always run fresh analysis - indexes may have been added since last run
      runAIAnalysis(explainResult, query)
      setShowAIModal(true)
    }
  }

  // Close modal
  const handleCloseModal = () => {
    setShowAIModal(false)
  }

  // Build the AI button for use in Explain Plan header
  const aiButton = enableAI && explainResult ? (
    <button
      onClick={handleAIClick}
      disabled={aiAnalysisLoading}
      className="px-2 py-1 text-xs font-medium rounded bg-dc-accent text-white hover:bg-dc-accent-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
    >
      {aiAnalysisLoading ? (
        <>
          <span className="animate-spin">⟳</span>
          Analyzing...
        </>
      ) : (
        <>✨ AI Analysis</>
      )}
    </button>
  ) : null

  return (
    <div className="space-y-3">
      {/* SQL Block */}
      {sqlLoading ? (
        <>
          <h4 className="text-sm font-semibold text-dc-text mb-2">{title}</h4>
          <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm animate-pulse" style={{ height }}>
            Loading SQL...
          </div>
        </>
      ) : sqlError ? (
        <>
          <h4 className="text-sm font-semibold text-dc-text mb-2">{title}</h4>
          <div className="text-dc-error text-sm bg-dc-danger-bg p-3 rounded border border-dc-error" style={{ height }}>
            {sqlError.message}
          </div>
        </>
      ) : sql ? (
        <CodeBlock
          code={formattedSql}
          language="sql"
          title={title}
          height={height}
          headerRight={
            <>
              {/* Include timing checkbox */}
              <label className="flex items-center gap-1 text-xs text-dc-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAnalyze}
                  onChange={(e) => setUseAnalyze(e.target.checked)}
                  className="w-3 h-3 rounded border-dc-border text-dc-accent focus:ring-dc-accent"
                />
                Include timing
              </label>

              {/* Explain Plan button */}
              <button
                onClick={() => runExplain({ analyze: useAnalyze })}
                disabled={explainLoading}
                className="px-2 py-1 text-xs font-medium rounded border border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {explainLoading ? 'Running...' : 'Explain Plan'}
              </button>
            </>
          }
        />
      ) : (
        <>
          <h4 className="text-sm font-semibold text-dc-text mb-2">{title}</h4>
          <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm" style={{ height }}>
            {sqlPlaceholder}
          </div>
        </>
      )}

      {/* EXPLAIN Results */}
      {explainHasRun && (
        <div>
          {explainLoading ? (
            <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm animate-pulse">
              Running EXPLAIN{useAnalyze ? ' ANALYZE' : ''}...
            </div>
          ) : explainError ? (
            <div className="text-dc-error text-sm bg-dc-danger-bg p-3 rounded border border-dc-error">
              <strong>Explain Error:</strong> {explainError.message}
            </div>
          ) : explainResult ? (
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-dc-accent text-white rounded">
                  {explainResult.summary.database.toUpperCase()}
                </span>
                {explainResult.summary.hasSequentialScans && (
                  <span className="px-2 py-1 text-xs font-medium bg-dc-warning-bg text-dc-warning border border-dc-warning rounded">
                    Sequential Scans Detected
                  </span>
                )}
                {explainResult.summary.usedIndexes.length > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-dc-success-bg text-dc-success border border-dc-success rounded">
                    {explainResult.summary.usedIndexes.length} Index{explainResult.summary.usedIndexes.length !== 1 ? 'es' : ''} Used
                  </span>
                )}
                {explainResult.summary.executionTime !== undefined && (
                  <span className="px-2 py-1 text-xs font-medium bg-dc-surface-secondary text-dc-text-secondary border border-dc-border rounded">
                    Execution: {explainResult.summary.executionTime.toFixed(2)}ms
                  </span>
                )}
                {explainResult.summary.planningTime !== undefined && (
                  <span className="px-2 py-1 text-xs font-medium bg-dc-surface-secondary text-dc-text-secondary border border-dc-border rounded">
                    Planning: {explainResult.summary.planningTime.toFixed(2)}ms
                  </span>
                )}
                {explainResult.summary.totalCost !== undefined && (
                  <span className="px-2 py-1 text-xs font-medium bg-dc-surface-secondary text-dc-text-secondary border border-dc-border rounded">
                    Cost: {explainResult.summary.totalCost.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Index usage details */}
              {explainResult.summary.usedIndexes.length > 0 && (
                <div className="text-xs text-dc-text-muted">
                  <strong>Indexes:</strong> {explainResult.summary.usedIndexes.join(', ')}
                </div>
              )}

              {/* Raw EXPLAIN output with AI button in header */}
              <CodeBlock
                code={explainResult.raw}
                language="sql"
                title={`Execution Plan (${explainResult.summary.database})`}
                height="16rem"
                headerRight={aiButton}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* AI Analysis Error (shown inline) */}
      {aiAnalysisError && (
        <div className="text-dc-error text-sm bg-dc-danger-bg p-3 rounded border border-dc-error">
          <strong>AI Analysis Error:</strong> {aiAnalysisError.message}
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && aiAnalysis && (
        <ExplainAIPanel
          analysis={aiAnalysis}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
})

export default ExecutionPlanPanel
