/**
 * ExecutionPlanPanelParts
 *
 * Presentational sub-components extracted from ExecutionPlanPanel to keep the
 * panel's render flat: the SQL block (loading / error / code / placeholder
 * states) and the EXPLAIN results block (summary badges + raw plan). Behaviour
 * and markup are identical to the previous inline rendering.
 */

import type { ReactNode } from 'react'
import { CodeBlock } from '../../shared/index.js'
import type { ExplainResult } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

function SqlBlockShell({
  title,
  height,
  className,
  children,
}: {
  title: string
  height: string
  className: string
  children: ReactNode
}) {
  return (
    <>
      <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{title}</h4>
      <div className={className} style={{ height }}>
        {children}
      </div>
    </>
  )
}

export function SqlBlock({
  sql,
  sqlLoading,
  sqlError,
  sqlPlaceholder,
  formattedSql,
  title,
  height,
  headerRight,
}: {
  sql: { sql: string; params?: unknown[] } | null | undefined
  sqlLoading: boolean
  sqlError?: Error | null
  sqlPlaceholder: string
  formattedSql: string
  title: string
  height: string
  headerRight: ReactNode
}) {
  const { t } = useTranslation()

  if (sqlLoading) {
    return (
      <SqlBlockShell
        title={title}
        height={height}
        className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:animate-pulse"
      >
        {t('results.debug.loadingSql')}
      </SqlBlockShell>
    )
  }

  if (sqlError) {
    return (
      <SqlBlockShell
        title={title}
        height={height}
        className="text-dc-error dc:text-sm bg-dc-danger-bg dc:p-3 dc:rounded dc:border border-dc-error"
      >
        {sqlError.message}
      </SqlBlockShell>
    )
  }

  if (sql) {
    return (
      <CodeBlock
        code={formattedSql}
        language="sql"
        title={title}
        height={height}
        headerRight={headerRight}
      />
    )
  }

  return (
    <SqlBlockShell
      title={title}
      height={height}
      className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm"
    >
      {sqlPlaceholder}
    </SqlBlockShell>
  )
}

function ExplainSummaryBadges({ summary }: { summary: ExplainResult['summary'] }) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:flex-wrap dc:items-center dc:gap-2">
      <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded">
        {summary.database.toUpperCase()}
      </span>
      {summary.hasSequentialScans && (
        <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-warning-bg text-dc-warning dc:border border-dc-warning dc:rounded">
          {t('debug.sequentialScans')}
        </span>
      )}
      {summary.usedIndexes.length > 0 && (
        <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-success-bg text-dc-success dc:border border-dc-success dc:rounded">
          {summary.usedIndexes.length === 1
            ? t('debug.indexesUsed', { count: summary.usedIndexes.length })
            : t('debug.indexesUsedPlural', { count: summary.usedIndexes.length })}
        </span>
      )}
      {summary.executionTime !== undefined && (
        <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-surface-secondary text-dc-text-secondary dc:border border-dc-border dc:rounded">
          {t('debug.executionTime', { time: summary.executionTime.toFixed(2) })}
        </span>
      )}
      {summary.planningTime !== undefined && (
        <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-surface-secondary text-dc-text-secondary dc:border border-dc-border dc:rounded">
          {t('debug.planningTime', { time: summary.planningTime.toFixed(2) })}
        </span>
      )}
      {summary.totalCost !== undefined && (
        <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-surface-secondary text-dc-text-secondary dc:border border-dc-border dc:rounded">
          {t('debug.cost', { cost: summary.totalCost.toFixed(2) })}
        </span>
      )}
    </div>
  )
}

export function ExplainResults({
  explainLoading,
  explainError,
  explainResult,
  useAnalyze,
  aiButton,
}: {
  explainLoading: boolean
  explainError?: Error | null
  explainResult: ExplainResult | null
  useAnalyze: boolean
  aiButton: ReactNode
}) {
  const { t } = useTranslation()

  if (explainLoading) {
    return (
      <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:animate-pulse">
        {useAnalyze ? t('debug.explainRunningAnalyze') : t('debug.explainRunningBasic')}
      </div>
    )
  }

  if (explainError) {
    return (
      <div className="text-dc-error dc:text-sm bg-dc-danger-bg dc:p-3 dc:rounded dc:border border-dc-error">
        <strong>{t('debug.explainError')}</strong> {explainError.message}
      </div>
    )
  }

  if (!explainResult) return null

  return (
    <div className="dc:space-y-3">
      <ExplainSummaryBadges summary={explainResult.summary} />

      {/* Index usage details */}
      {explainResult.summary.usedIndexes.length > 0 && (
        <div className="dc:text-xs text-dc-text-muted">
          <strong>{t('debug.indexes')}</strong> {explainResult.summary.usedIndexes.join(', ')}
        </div>
      )}

      {/* Raw EXPLAIN output with AI button in header */}
      <CodeBlock
        code={explainResult.raw}
        language="sql"
        title={t('debug.executionPlanTitle', { database: explainResult.summary.database })}
        height="16rem"
        headerRight={aiButton}
      />
    </div>
  )
}
