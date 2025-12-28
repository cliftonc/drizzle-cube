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
      className="border-b border-dc-border"
      style={{ background: 'linear-gradient(to right, var(--dc-ai-gradient-start), var(--dc-ai-gradient-end))' }}
    >
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-dc-border bg-dc-surface-secondary">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-dc-accent" />
          <span className="text-sm font-medium text-dc-text">AI Query Generator</span>
          {isGenerating && (
            <span className="text-xs text-dc-accent animate-pulse">
              Generating...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasGeneratedQuery && (
            <button
              onClick={onAccept}
              className="px-3 py-1 text-xs font-medium text-white bg-dc-success hover:opacity-80 rounded transition-colors"
            >
              Accept
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover border border-dc-border rounded transition-colors"
          >
            {hasGeneratedQuery ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Prompt input */}
          <div className="flex-1">
            <textarea
              value={userPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your query in natural language... (e.g., 'Show total sales by month for the last year')"
              className="w-full px-3 py-2 text-sm border border-dc-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-dc-accent focus:border-dc-accent resize-none bg-dc-surface text-dc-text placeholder-dc-text-muted"
              rows={2}
              disabled={isGenerating}
            />
            <div className="mt-1 text-xs text-dc-text-muted">
              Press Enter to generate, Shift+Enter for new line
            </div>
          </div>

          {/* Generate button */}
          <div className="flex-shrink-0">
            <button
              onClick={onGenerate}
              disabled={isGenerating || !userPrompt.trim()}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                isGenerating || !userPrompt.trim()
                  ? 'bg-dc-surface-tertiary text-dc-text-disabled cursor-not-allowed'
                  : 'bg-dc-accent hover:bg-dc-accent-hover text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-dc-error-bg border border-dc-error-border rounded-md">
            <ErrorIcon className="w-4 h-4 text-dc-error mt-0.5 flex-shrink-0" />
            <div className="text-sm text-dc-error">{error}</div>
          </div>
        )}

        {/* Success message */}
        {hasGeneratedQuery && !error && (
          <div className="mt-3 p-3 bg-dc-success-bg border border-dc-success-border rounded-md">
            <div className="text-sm text-dc-success">
              Query generated and loaded! Check the results below, then click{' '}
              <strong>Accept</strong> to keep or <strong>Cancel</strong> to revert.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
