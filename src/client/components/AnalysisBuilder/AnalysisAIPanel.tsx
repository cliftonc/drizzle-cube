/**
 * AnalysisAIPanel Component
 *
 * A collapsible panel for AI-powered query generation.
 * Appears above the results panel when activated.
 */

import { useCallback, KeyboardEvent } from 'react'
import { getIcon } from '../../icons'

const SparklesIcon = getIcon('sparkles')
const ErrorIcon = getIcon('error')

export interface AnalysisAIPanelProps {
  /** User's natural language prompt */
  userPrompt: string
  /** Callback when prompt changes */
  onPromptChange: (prompt: string) => void
  /** Whether a query is being generated */
  isGenerating: boolean
  /** Error message from generation */
  error: string | null
  /** Whether the AI has generated a query */
  hasGeneratedQuery: boolean
  /** Callback to generate query */
  onGenerate: () => void
  /** Callback to accept the generated query */
  onAccept: () => void
  /** Callback to cancel and restore previous state */
  onCancel: () => void
}

export default function AnalysisAIPanel({
  userPrompt,
  onPromptChange,
  isGenerating,
  error,
  hasGeneratedQuery,
  onGenerate,
  onAccept,
  onCancel
}: AnalysisAIPanelProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onGenerate()
      }
    },
    [onGenerate]
  )

  return (
    <div
      className="dc:border-b border-dc-border"
      style={{ background: 'linear-gradient(to right, var(--dc-ai-gradient-start), var(--dc-ai-gradient-end))' }}
    >
      {/* Header */}
      <div className="dc:px-4 dc:py-2 dc:flex dc:items-center dc:justify-between dc:border-b border-dc-border bg-dc-surface-secondary">
        <div className="dc:flex dc:items-center dc:gap-2">
          <SparklesIcon className="dc:w-4 dc:h-4 text-dc-accent" />
          <span className="dc:text-sm dc:font-medium text-dc-text">AI Query Generator</span>
          {isGenerating && (
            <span className="dc:text-xs text-dc-accent dc:animate-pulse">
              Generating...
            </span>
          )}
        </div>
        <div className="dc:flex dc:items-center dc:gap-2">
          {hasGeneratedQuery && (
            <button
              onClick={onAccept}
              className="dc:px-3 dc:py-1 dc:text-xs dc:font-medium text-white bg-dc-success dc:hover:opacity-80 dc:rounded dc:transition-colors"
            >
              Accept
            </button>
          )}
          <button
            onClick={onCancel}
            className="dc:px-3 dc:py-1 dc:text-xs dc:font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover dc:border border-dc-border dc:rounded dc:transition-colors"
          >
            {hasGeneratedQuery ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="dc:p-4">
        <div className="dc:flex dc:gap-3">
          {/* Prompt input */}
          <div className="dc:flex-1">
            <textarea
              value={userPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your query in natural language... (e.g., 'Show total sales by month for the last year')"
              className="dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border border-dc-border dc:rounded-md dc:shadow-sm dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:resize-none bg-dc-surface text-dc-text placeholder-dc-text-muted"
              rows={2}
              disabled={isGenerating}
            />
            <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
              Press Enter to generate, Shift+Enter for new line
            </div>
          </div>

          {/* Generate button */}
          <div className="dc:flex-shrink-0">
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userPrompt.trim()}
              className={`dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors dc:flex dc:items-center dc:gap-2 ${
                isGenerating || !userPrompt.trim()
                  ? 'bg-dc-surface-tertiary text-dc-text-disabled dc:cursor-not-allowed'
                  : 'bg-dc-accent hover:bg-dc-accent-hover text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="dc:w-4 dc:h-4 dc:border-2 border-white border-t-transparent dc:rounded-full dc:animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="dc:w-4 dc:h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="dc:mt-3 dc:flex dc:items-start dc:gap-2 dc:p-3 bg-dc-error-bg dc:border border-dc-error-border dc:rounded-md">
            <ErrorIcon className="dc:w-4 dc:h-4 text-dc-error dc:mt-0.5 dc:flex-shrink-0" />
            <div className="dc:text-sm text-dc-error">{error}</div>
          </div>
        )}

        {/* Success message */}
        {hasGeneratedQuery && !error && (
          <div className="dc:mt-3 dc:p-3 bg-dc-success-bg dc:border border-dc-success-border dc:rounded-md">
            <div className="dc:text-sm text-dc-success">
              Query generated and loaded! Check the results below, then click{' '}
              <strong>Accept</strong> to keep or <strong>Cancel</strong> to revert.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
