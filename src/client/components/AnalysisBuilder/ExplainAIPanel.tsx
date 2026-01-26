/**
 * ExplainAIPanel - Display AI analysis of EXPLAIN plans in a modal
 *
 * Shows:
 * - Assessment badge (good/warning/critical)
 * - Query understanding
 * - Issues identified
 * - Actionable recommendations with code snippets
 *
 * Displayed in a near full-screen modal with scrolling support
 */

import React from 'react'
import type { AIExplainAnalysis, ExplainRecommendation, ExplainIssue } from '../../types'
import CodeBlock from '../../shared/components/CodeBlock'

interface ExplainAIPanelProps {
  /** AI analysis result */
  analysis: AIExplainAnalysis
  /** Callback to close the modal */
  onClose?: () => void
  /** Legacy: Callback to clear/close (backward compatible with old API) */
  onClear?: () => void
}

/**
 * Helper to safely render text that might be an object from AI
 * AI responses sometimes return objects instead of strings for text fields
 */
function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value ?? '')
}

/**
 * Color classes for assessment badges
 */
const assessmentColors = {
  good: 'bg-dc-success-bg text-dc-success border-dc-success',
  warning: 'bg-dc-warning-bg text-dc-warning border-dc-warning',
  critical: 'bg-dc-danger-bg text-dc-error border-dc-error',
}

/**
 * Color classes for severity badges
 */
const severityColors = {
  critical: 'bg-dc-danger-bg text-dc-error',
  warning: 'bg-dc-warning-bg text-dc-warning',
  suggestion: 'bg-dc-accent-bg text-dc-accent',
}

/**
 * Color classes for issue severity
 */
const issueSeverityColors = {
  high: 'text-dc-error',
  medium: 'text-dc-warning',
  low: 'text-dc-text-muted',
}

/**
 * Assessment badge component
 */
function AssessmentBadge({ assessment, reason }: { assessment: 'good' | 'warning' | 'critical'; reason: unknown }) {
  const labels = {
    good: 'Good',
    warning: 'Warning',
    critical: 'Critical',
  }

  return (
    <div className={`dc:p-4 dc:rounded-lg dc:border ${assessmentColors[assessment]}`}>
      <div className="dc:flex dc:items-center dc:gap-2 dc:mb-1">
        <span className="dc:font-semibold dc:uppercase dc:text-base">
          {assessment === 'good' && '✓ '}
          {assessment === 'warning' && '⚠ '}
          {assessment === 'critical' && '✕ '}
          {labels[assessment]}
        </span>
      </div>
      <p className="dc:text-sm">{safeText(reason)}</p>
    </div>
  )
}

/**
 * Issue item component
 */
function IssueItem({ issue }: { issue: ExplainIssue }) {
  return (
    <div className="dc:flex dc:items-start dc:gap-2 dc:py-2">
      <span className={`dc:text-sm ${issueSeverityColors[issue.severity]}`}>
        {issue.severity === 'high' && '●'}
        {issue.severity === 'medium' && '○'}
        {issue.severity === 'low' && '○'}
      </span>
      <span className="dc:text-sm text-dc-text-secondary">{safeText(issue.description)}</span>
    </div>
  )
}

/**
 * Copy button component
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="dc:px-2 dc:py-1 dc:text-xs dc:rounded bg-dc-surface hover:bg-dc-surface-hover text-dc-text-muted"
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

/**
 * Recommendation card component
 */
function RecommendationCard({ rec }: { rec: ExplainRecommendation }) {
  const typeLabels = {
    index: 'INDEX',
    table: 'TABLE',
    cube: 'CUBE',
    general: 'TIP',
  }

  return (
    <div className="dc:p-4 dc:border border-dc-border dc:rounded-lg bg-dc-surface">
      {/* Header */}
      <div className="dc:flex dc:items-center dc:gap-2 dc:mb-2">
        <span
          className={`dc:px-2 dc:py-0.5 dc:text-xs dc:font-medium dc:rounded ${severityColors[rec.severity]}`}
        >
          {typeLabels[rec.type]}
        </span>
        <h5 className="dc:font-medium text-dc-text">{safeText(rec.title)}</h5>
      </div>

      {/* Description */}
      <p className="dc:text-sm text-dc-text-secondary dc:mb-3">{safeText(rec.description)}</p>

      {/* SQL code for index/table recommendations */}
      {rec.sql && (
        <div className="dc:mt-2">
          <CodeBlock
            code={rec.sql}
            language="sql"
            headerRight={<CopyButton text={rec.sql} />}
          />
        </div>
      )}

      {/* TypeScript code for cube recommendations - display as text since CodeBlock doesn't support TS */}
      {rec.cubeCode && (
        <div className="dc:mt-2">
          {rec.cubeName && (
            <p className="dc:text-xs text-dc-text-muted dc:mb-1">
              Add to <code className="bg-dc-surface-secondary dc:px-1 dc:rounded">{rec.cubeName}</code> cube:
            </p>
          )}
          <div className="dc:relative">
            <pre className="dc:p-3 dc:text-xs bg-dc-surface-secondary dc:rounded dc:overflow-x-auto font-mono text-dc-text">
              {rec.cubeCode}
            </pre>
            <div className="dc:absolute dc:top-1 dc:right-1">
              <CopyButton text={rec.cubeCode} />
            </div>
          </div>
        </div>
      )}

      {/* Expected impact */}
      {rec.estimatedImpact && (
        <p className="dc:text-xs text-dc-text-muted dc:mt-2">
          <strong>Expected impact:</strong> {safeText(rec.estimatedImpact)}
        </p>
      )}
    </div>
  )
}

/**
 * ExplainAIPanel - Modal component for displaying AI analysis results
 * Shows in a near full-screen modal with scrolling
 */
export function ExplainAIPanel({ analysis, onClose, onClear }: ExplainAIPanelProps) {
  // Support both onClose (new) and onClear (legacy) for backward compatibility
  const handleClose = onClose || onClear

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && handleClose) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center dc:p-4 bg-black/50">
      {/* Modal backdrop */}
      <div
        className="dc:absolute dc:inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="dc:relative dc:w-full dc:max-w-4xl dc:max-h-[90vh] bg-dc-surface dc:rounded-lg dc:shadow-xl dc:flex dc:flex-col">
        {/* Header */}
        <div className="dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-4 dc:border-b border-dc-border dc:flex-shrink-0">
          <div className="dc:flex dc:items-center dc:gap-3">
            <span className="dc:text-lg">✨</span>
            <h3 className="dc:text-lg dc:font-semibold text-dc-text">AI Performance Analysis</h3>
          </div>
          <button
            onClick={handleClose}
            className="dc:p-2 dc:rounded-lg hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text dc:transition-colors"
            aria-label="Close"
          >
            <svg className="dc:w-5 dc:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="dc:flex-1 dc:overflow-y-auto dc:px-6 dc:py-4 dc:space-y-6">
          {/* Assessment */}
          <AssessmentBadge
            assessment={analysis.assessment}
            reason={analysis.assessmentReason}
          />

          {/* Summary */}
          <div>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-2">Summary</h4>
            <p className="text-dc-text">{safeText(analysis.summary)}</p>
          </div>

          {/* Query Understanding */}
          {analysis.queryUnderstanding && (
            <div>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-2">Query Analysis</h4>
              <p className="text-dc-text-secondary">{safeText(analysis.queryUnderstanding)}</p>
            </div>
          )}

          {/* Issues */}
          {analysis.issues && analysis.issues.length > 0 && (
            <div>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-2">
                Issues Found ({analysis.issues.length})
              </h4>
              <div className="dc:space-y-1 bg-dc-surface-secondary dc:rounded-lg dc:p-3">
                {analysis.issues.map((issue, i) => (
                  <IssueItem key={i} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-3">
                Recommendations ({analysis.recommendations.length})
              </h4>
              <div className="dc:space-y-4">
                {analysis.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {/* No recommendations case */}
          {(!analysis.recommendations || analysis.recommendations.length === 0) && (
            <div className="text-dc-text-muted dc:italic dc:p-4 bg-dc-surface-secondary dc:rounded-lg">
              No specific recommendations. The query appears to be well-optimized.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-3 dc:border-t border-dc-border dc:flex-shrink-0 bg-dc-surface-secondary">
          {/* Meta info */}
          {analysis._meta && (
            <div className="dc:text-xs text-dc-text-muted">
              Model: {analysis._meta.model}
              {analysis._meta.usingUserKey && ' (using your API key)'}
            </div>
          )}
          <button
            onClick={handleClose}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-lg bg-dc-primary text-white hover:bg-dc-primary-hover dc:transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExplainAIPanel
