/**
 * Section sub-components and helpers for QueryAnalysisPanel.
 * Split out of QueryAnalysisPanel.tsx to keep each render unit small.
 */

import React from 'react'
import { getIcon } from '../../icons'
import type { QueryAnalysis, JoinPathAnalysis } from '../types'
import { useTranslation } from '../../hooks/useTranslation'

/**
 * Format reason string for display
 */
export function formatReason(reason: string): string {
  return reason
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Get badge color based on reason
 */
export function getReasonBadgeClasses(reason: string): string {
  switch (reason) {
    case 'most_dimensions':
      return 'bg-dc-info-bg text-dc-info'
    case 'most_connected':
      return 'bg-dc-accent-bg text-dc-accent'
    case 'alphabetical_fallback':
      return 'bg-dc-warning-bg text-dc-warning'
    case 'single_cube':
      return 'bg-dc-success-bg text-dc-success'
    default:
      return 'bg-dc-muted-bg text-dc-muted'
  }
}

/**
 * Render the ordered list of join steps within a single join path.
 */
const JoinPathSteps: React.FC<{ jp: JoinPathAnalysis }> = ({ jp }) => {
  const ArrowRightIcon = getIcon('chevronRight')
  if (!jp.pathFound || !jp.path || jp.path.length === 0) return null

  return (
    <div className="dc:space-y-1 dc:ml-2">
      {jp.path.map((step, stepIdx) => (
        <div key={stepIdx} className="dc:flex dc:items-center dc:gap-1 dc:text-xs dc:flex-wrap">
          <span className="dc:font-mono text-dc-text-secondary">{step.fromCube}</span>
          <ArrowRightIcon className="dc:w-3 dc:h-3 text-dc-text-muted" />
          <span className="dc:font-mono text-dc-text">{step.toCube}</span>
          <span className="text-dc-text-muted">
            ({step.relationship}, {step.joinType} join)
          </span>
          {step.joinColumns.length > 0 && (
            <span className="text-dc-text-muted">
              on {step.joinColumns.map(jc => `${jc.sourceColumn}=${jc.targetColumn}`).join(', ')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Render the join selection summary line (strategy / rank / score).
 */
const JoinPathSelectionSummary: React.FC<{ jp: JoinPathAnalysis }> = ({ jp }) => {
  const { t } = useTranslation()
  if (!jp.selection) return null

  return (
    <div className="dc:mt-2 dc:ml-2 dc:text-xs text-dc-text-muted">
      <span className="dc:font-medium text-dc-text">{t('queryAnalysis.joinPaths.selection')}</span>
      <span>{` ${formatReason(jp.selection.strategy)}`}</span>
      {typeof jp.selection.selectedRank === 'number' && (
        <span>{`, selected #${jp.selection.selectedRank}`}</span>
      )}
      {typeof jp.selection.selectedScore === 'number' && (
        <span>{`, score ${jp.selection.selectedScore}`}</span>
      )}
    </div>
  )
}

/**
 * Render the collapsible list of candidate join paths.
 */
const JoinPathCandidates: React.FC<{ jp: JoinPathAnalysis; primaryCube: string }> = ({ jp, primaryCube }) => {
  const { t } = useTranslation()
  if (!jp.selection?.candidates || jp.selection.candidates.length === 0) return null

  return (
    <details className="dc:mt-2">
      <summary className="dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text">
        {t('queryAnalysis.joinPaths.pathCandidates', { count: jp.selection.candidates.length })}
      </summary>
      <div className="dc:mt-1 dc:ml-2 dc:space-y-1">
        {jp.selection.preferredCubes && jp.selection.preferredCubes.length > 0 && (
          <div className="dc:text-xs text-dc-text-muted">
            preferred cubes: {jp.selection.preferredCubes.join(', ')}
          </div>
        )}
        {jp.selection.candidates.slice(0, 5).map(candidate => (
          <div key={candidate.rank} className="dc:text-xs text-dc-text-muted">
            <span className="dc:font-medium text-dc-text">
              #{candidate.rank}
            </span>
            <span>{` score ${candidate.score}`}</span>
            <span>{` (preferred+${candidate.scoreBreakdown.preferredJoinBonus + candidate.scoreBreakdown.preferredCubeBonus}, penalty-${candidate.scoreBreakdown.lengthPenalty})`}</span>
            <span>{`: `}</span>
            <span>
              {candidate.path.length > 0
                ? `${candidate.path[0].fromCube} → ${candidate.path.map(step => step.toCube).join(' → ')}`
                : primaryCube}
            </span>
          </div>
        ))}
      </div>
    </details>
  )
}

/**
 * Render the collapsible list of visited cubes (shown only when no path found).
 */
const JoinPathVisitedCubes: React.FC<{ jp: JoinPathAnalysis }> = ({ jp }) => {
  const { t } = useTranslation()
  if (!jp.visitedCubes || jp.visitedCubes.length === 0 || jp.pathFound) return null

  return (
    <details className="dc:mt-1">
      <summary className="dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text">
        {t('queryAnalysis.joinPaths.visitedCubes', { count: jp.visitedCubes.length })}
      </summary>
      <div className="dc:mt-1 dc:text-xs text-dc-text-muted dc:ml-2">
        {jp.visitedCubes.join(' → ')}
      </div>
    </details>
  )
}

/**
 * Render the header row of a join path (primary → target with step count).
 */
const JoinPathHeader: React.FC<{ jp: JoinPathAnalysis; primaryCube: string }> = ({ jp, primaryCube }) => {
  const ArrowRightIcon = getIcon('chevronRight')
  return (
    <div className="dc:flex dc:items-center dc:gap-2 dc:mb-2 dc:flex-wrap">
      <span className="dc:font-mono text-dc-text-secondary">{primaryCube}</span>
      <ArrowRightIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
      <span className="dc:font-mono dc:font-medium text-dc-text">{jp.targetCube}</span>
      {jp.pathFound ? (
        <span className="dc:text-xs dc:px-2 dc:py-0.5 bg-dc-success-bg text-dc-success dc:rounded">
          {jp.pathLength} step{jp.pathLength !== 1 ? 's' : ''}
        </span>
      ) : (
        <span className="dc:text-xs dc:px-2 dc:py-0.5 bg-dc-error-bg text-dc-error dc:rounded">
          No path
        </span>
      )}
    </div>
  )
}

/**
 * Render a single join path entry (header, steps, selection, candidates).
 */
export const JoinPathItem: React.FC<{ jp: JoinPathAnalysis; primaryCube: string }> = ({ jp, primaryCube }) => {
  return (
    <div className="bg-dc-surface dc:p-3 dc:rounded dc:text-sm">
      <JoinPathHeader jp={jp} primaryCube={primaryCube} />
      <JoinPathSteps jp={jp} />
      <JoinPathSelectionSummary jp={jp} />
      <JoinPathCandidates jp={jp} primaryCube={primaryCube} />
      {!jp.pathFound && jp.error && (
        <p className="dc:text-xs text-dc-error dc:mt-1">{jp.error}</p>
      )}
      <JoinPathVisitedCubes jp={jp} />
    </div>
  )
}

/**
 * Render the "Join Paths" section (only when paths are present).
 */
export const JoinPathsSection: React.FC<{ analysis: QueryAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation()
  const LinkIcon = getIcon('link')
  if (analysis.joinPaths.length === 0) return null

  return (
    <div className="dc:border-b border-dc-border dc:pb-3">
      <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
        <LinkIcon className="dc:w-4 dc:h-4 dc:mr-2" />
        {t('queryAnalysis.joinPaths')}
      </h4>
      <div className="dc:space-y-2">
        {analysis.joinPaths.map((jp, idx) => (
          <JoinPathItem key={idx} jp={jp} primaryCube={analysis.primaryCube.selectedCube} />
        ))}
      </div>
    </div>
  )
}

/**
 * Render the "Primary Cube" section.
 */
export const PrimaryCubeSection: React.FC<{ analysis: QueryAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation()
  const TableIcon = getIcon('table')
  const SuccessIcon = getIcon('success')
  const ErrorIcon = getIcon('error')

  return (
    <div className="dc:border-b border-dc-border dc:pb-3">
      <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
        <TableIcon className="dc:w-4 dc:h-4 dc:mr-2" />
        {t('queryAnalysis.primaryCube')}
      </h4>
      <div className="bg-dc-surface dc:p-3 dc:rounded dc:text-sm">
        <div className="dc:flex dc:items-center dc:gap-2 dc:mb-2 dc:flex-wrap">
          <span className="dc:font-mono dc:font-medium text-dc-primary">
            {analysis.primaryCube.selectedCube}
          </span>
          <span className={`dc:text-xs dc:px-2 dc:py-0.5 dc:rounded ${getReasonBadgeClasses(analysis.primaryCube.reason)}`}>
            {formatReason(analysis.primaryCube.reason)}
          </span>
        </div>
        <p className="text-dc-text-secondary dc:text-xs">
          {analysis.primaryCube.explanation}
        </p>
        {analysis.primaryCube.candidates && analysis.primaryCube.candidates.length > 1 && (
          <details className="dc:mt-2">
            <summary className="dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text">
              {t('queryAnalysis.primaryCube.showCandidates', { count: analysis.primaryCube.candidates.length })}
            </summary>
            <div className="dc:mt-2 dc:space-y-1 dc:ml-2">
              {analysis.primaryCube.candidates.map((c, i) => (
                <div key={i} className="dc:text-xs dc:flex dc:items-center dc:gap-2 dc:flex-wrap">
                  <span className={`dc:font-mono ${c.cubeName === analysis.primaryCube.selectedCube ? 'dc:font-bold text-dc-primary' : 'text-dc-text-muted'}`}>
                    {c.cubeName}
                  </span>
                  <span className="text-dc-text-muted">
                    dims: {c.dimensionCount}, joins: {c.joinCount}
                  </span>
                  {c.canReachAll ? (
                      <span className="text-dc-success dc:flex dc:items-center dc:gap-0.5">
                        <SuccessIcon className="dc:w-3 dc:h-3" />
                        {t('queryAnalysis.primaryCube.reachable')}
                      </span>
                    ) : (
                      <span className="text-dc-error dc:flex dc:items-center dc:gap-0.5">
                        <ErrorIcon className="dc:w-3 dc:h-3" />
                        {t('queryAnalysis.primaryCube.cannotReachAll')}
                      </span>
                    )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Render the "Pre-Aggregations" section (only when present).
 */
export const PreAggregationsSection: React.FC<{ analysis: QueryAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation()
  const TableIcon = getIcon('table')
  if (analysis.preAggregations.length === 0) return null

  return (
    <div className="dc:border-b border-dc-border dc:pb-3">
      <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
        <TableIcon className="dc:w-4 dc:h-4 dc:mr-2" />
        {t('queryAnalysis.preAggregations')}
      </h4>
      <div className="dc:space-y-2">
        {analysis.preAggregations.map((pa, idx) => (
          <div key={idx} className="bg-dc-surface dc:p-3 dc:rounded dc:text-sm">
            <div className="dc:flex dc:items-center dc:gap-2 dc:mb-1 dc:flex-wrap">
              <span className="dc:font-mono dc:font-medium text-dc-text">{pa.cubeName}</span>
              <span className="dc:text-xs text-dc-text-muted">as</span>
              <code className="dc:text-xs bg-dc-surface-secondary dc:px-1 dc:rounded dc:font-mono">{pa.cteAlias}</code>
            </div>
            <p className="dc:text-xs text-dc-text-secondary">{pa.reason}</p>
            <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
              <span className="dc:font-medium">{t('queryAnalysis.preAggregations.measures')}</span> {pa.measures.join(', ')}
            </div>
            {pa.joinKeys.length > 0 && (
              <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
                <span className="dc:font-medium">{t('queryAnalysis.preAggregations.joinKeys')}</span> {pa.joinKeys.map(jk => `${jk.sourceColumn}=${jk.targetColumn}`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Render the "Warnings" section (only when present).
 */
export const WarningsSection: React.FC<{ analysis: QueryAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation()
  const WarningIcon = getIcon('warning')
  if (!analysis.warnings || analysis.warnings.length === 0) return null

  return (
    <div>
      <h4 className="dc:text-sm dc:font-semibold text-dc-warning dc:mb-2 dc:flex dc:items-center">
        <WarningIcon className="dc:w-4 dc:h-4 dc:mr-2" />
        {t('queryAnalysis.warnings')}
      </h4>
      <ul className="list-disc dc:list-inside dc:text-xs text-dc-warning dc:space-y-1">
        {analysis.warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  )
}
