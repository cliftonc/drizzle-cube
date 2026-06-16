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
import { ExplainAIPanel } from './ExplainAIPanel.js'
import { SqlBlock, ExplainResults } from './ExecutionPlanPanelParts.js'
import type { ExplainResult, AIExplainAnalysis } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

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
  const { t } = useTranslation()
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
      className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded bg-dc-accent text-white hover:bg-dc-accent-hover dc:disabled:opacity-50 dc:disabled:cursor-not-allowed dc:flex dc:items-center dc:gap-1"
    >
      {aiAnalysisLoading ? (
        <>
          <span className="dc:animate-spin">⟳</span>
          {t('debug.aiAnalyzing')}
        </>
      ) : (
        <>{`✨ ${t('debug.aiAnalysis')}`}</>
      )}
    </button>
  ) : null

  return (
    <div className="dc:space-y-3">
      {/* SQL Block */}
      <SqlBlock
        sql={sql}
        sqlLoading={sqlLoading}
        sqlError={sqlError}
        sqlPlaceholder={sqlPlaceholder}
        formattedSql={formattedSql}
        title={title}
        height={height}
        headerRight={
          <>
            {/* Include timing checkbox */}
            <label className="dc:flex dc:items-center dc:gap-1 dc:text-xs text-dc-text-secondary dc:cursor-pointer">
              <input
                type="checkbox"
                checked={useAnalyze}
                onChange={(e) => setUseAnalyze(e.target.checked)}
                className="dc:w-3 dc:h-3 dc:rounded border-dc-border text-dc-accent focus:ring-dc-accent"
              />
              {t('debug.explainIncludeTiming')}
            </label>

            {/* Explain Plan button */}
            <button
              onClick={() => runExplain({ analyze: useAnalyze })}
              disabled={explainLoading}
              className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text dc:transition-colors dc:disabled:opacity-50 dc:disabled:cursor-not-allowed"
            >
              {explainLoading ? t('debug.explainRunning') : t('debug.explainPlan')}
            </button>
          </>
        }
      />

      {/* EXPLAIN Results */}
      {explainHasRun && (
        <div>
          <ExplainResults
            explainLoading={explainLoading}
            explainError={explainError}
            explainResult={explainResult}
            useAnalyze={useAnalyze}
            aiButton={aiButton}
          />
        </div>
      )}

      {/* AI Analysis Error (shown inline) */}
      {aiAnalysisError && (
        <div className="text-dc-error dc:text-sm bg-dc-danger-bg dc:p-3 dc:rounded dc:border border-dc-error">
          <strong>{t('debug.aiAnalysisError')}</strong> {aiAnalysisError.message}
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
