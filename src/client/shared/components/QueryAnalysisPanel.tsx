/**
 * QueryAnalysisPanel Component
 * Displays query planning analysis for debugging and transparency
 */

import React from 'react'
import { getIcon } from '../../icons'
import type { QueryAnalysis } from '../types'

interface QueryAnalysisPanelProps {
  analysis: QueryAnalysis
}

/**
 * Format reason string for display
 */
function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ')
}

/**
 * Get badge color based on reason
 */
function getReasonBadgeClasses(reason: string): string {
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

const QueryAnalysisPanel: React.FC<QueryAnalysisPanelProps> = ({ analysis }) => {
  const InfoIcon = getIcon('info')
  const ArrowRightIcon = getIcon('chevronRight')
  const WarningIcon = getIcon('warning')
  const TableIcon = getIcon('table')
  const LinkIcon = getIcon('link')
  const SuccessIcon = getIcon('success')
  const ErrorIcon = getIcon('error')

  return (
    <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded-lg dc:p-4 dc:space-y-4">
      {/* Query Summary Section */}
      <div className="dc:border-b border-dc-border dc:pb-3">
        <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
          <InfoIcon className="dc:w-4 dc:h-4 dc:mr-2" />
          Query Summary
        </h4>
        <div className="dc:grid dc:grid-cols-2 dc:md:grid-cols-4 dc:gap-2 dc:text-xs">
          <div className="bg-dc-surface dc:p-2 dc:rounded">
            <span className="text-dc-text-muted">Type:</span>
            <span className="dc:ml-1 dc:font-medium text-dc-text">
              {formatReason(analysis.querySummary.queryType)}
            </span>
          </div>
          <div className="bg-dc-surface dc:p-2 dc:rounded">
            <span className="text-dc-text-muted">Cubes:</span>
            <span className="dc:ml-1 dc:font-medium text-dc-text">{analysis.cubeCount}</span>
          </div>
          <div className="bg-dc-surface dc:p-2 dc:rounded">
            <span className="text-dc-text-muted">Joins:</span>
            <span className="dc:ml-1 dc:font-medium text-dc-text">{analysis.querySummary.joinCount}</span>
          </div>
          <div className="bg-dc-surface dc:p-2 dc:rounded">
            <span className="text-dc-text-muted">CTEs:</span>
            <span className="dc:ml-1 dc:font-medium text-dc-text">{analysis.querySummary.cteCount}</span>
          </div>
        </div>
      </div>

      {/* Primary Cube Section */}
      <div className="dc:border-b border-dc-border dc:pb-3">
        <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
          <TableIcon className="dc:w-4 dc:h-4 dc:mr-2" />
          Primary Cube (FROM table)
        </h4>
        <div className="bg-dc-surface dc:p-3 dc:rounded dc:text-sm">
          <div className="dc:flex dc:items-center dc:gap-2 dc:mb-2 dc:flex-wrap">
            <span className="font-mono dc:font-medium text-dc-primary">
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
                Show candidates ({analysis.primaryCube.candidates.length})
              </summary>
              <div className="dc:mt-2 dc:space-y-1 dc:ml-2">
                {analysis.primaryCube.candidates.map((c, i) => (
                  <div key={i} className="dc:text-xs dc:flex dc:items-center dc:gap-2 dc:flex-wrap">
                    <span className={`font-mono ${c.cubeName === analysis.primaryCube.selectedCube ? 'dc:font-bold text-dc-primary' : 'text-dc-text-muted'}`}>
                      {c.cubeName}
                    </span>
                    <span className="text-dc-text-muted">
                      dims: {c.dimensionCount}, joins: {c.joinCount}
                    </span>
                    {c.canReachAll ? (
                      <span className="text-dc-success dc:flex dc:items-center dc:gap-0.5">
                        <SuccessIcon className="dc:w-3 dc:h-3" />
                        reachable
                      </span>
                    ) : (
                      <span className="text-dc-error dc:flex dc:items-center dc:gap-0.5">
                        <ErrorIcon className="dc:w-3 dc:h-3" />
                        cannot reach all
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Join Paths Section */}
      {analysis.joinPaths.length > 0 && (
        <div className="dc:border-b border-dc-border dc:pb-3">
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
            <LinkIcon className="dc:w-4 dc:h-4 dc:mr-2" />
            Join Paths
          </h4>
          <div className="dc:space-y-2">
            {analysis.joinPaths.map((jp, idx) => (
              <div key={idx} className="bg-dc-surface dc:p-3 dc:rounded dc:text-sm">
                <div className="dc:flex dc:items-center dc:gap-2 dc:mb-2 dc:flex-wrap">
                  <span className="font-mono text-dc-text-secondary">{analysis.primaryCube.selectedCube}</span>
                  <ArrowRightIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
                  <span className="font-mono dc:font-medium text-dc-text">{jp.targetCube}</span>
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
                {jp.pathFound && jp.path && jp.path.length > 0 && (
                  <div className="dc:space-y-1 dc:ml-2">
                    {jp.path.map((step, stepIdx) => (
                      <div key={stepIdx} className="dc:flex dc:items-center dc:gap-1 dc:text-xs dc:flex-wrap">
                        <span className="font-mono text-dc-text-secondary">{step.fromCube}</span>
                        <ArrowRightIcon className="dc:w-3 dc:h-3 text-dc-text-muted" />
                        <span className="font-mono text-dc-text">{step.toCube}</span>
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
                )}
                {!jp.pathFound && jp.error && (
                  <p className="dc:text-xs text-dc-error dc:mt-1">{jp.error}</p>
                )}
                {jp.visitedCubes && jp.visitedCubes.length > 0 && !jp.pathFound && (
                  <details className="dc:mt-1">
                    <summary className="dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text">
                      Cubes visited during search ({jp.visitedCubes.length})
                    </summary>
                    <div className="dc:mt-1 dc:text-xs text-dc-text-muted dc:ml-2">
                      {jp.visitedCubes.join(' → ')}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Aggregations Section */}
      {analysis.preAggregations.length > 0 && (
        <div className="dc:border-b border-dc-border dc:pb-3">
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
            <TableIcon className="dc:w-4 dc:h-4 dc:mr-2" />
            Pre-Aggregation CTEs
          </h4>
          <div className="dc:space-y-2">
            {analysis.preAggregations.map((pa, idx) => (
              <div key={idx} className="bg-dc-surface dc:p-3 dc:rounded dc:text-sm">
                <div className="dc:flex dc:items-center dc:gap-2 dc:mb-1 dc:flex-wrap">
                  <span className="font-mono dc:font-medium text-dc-text">{pa.cubeName}</span>
                  <span className="dc:text-xs text-dc-text-muted">as</span>
                  <code className="dc:text-xs bg-dc-surface-secondary dc:px-1 dc:rounded font-mono">{pa.cteAlias}</code>
                </div>
                <p className="dc:text-xs text-dc-text-secondary">{pa.reason}</p>
                <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
                  <span className="dc:font-medium">Measures:</span> {pa.measures.join(', ')}
                </div>
                {pa.joinKeys.length > 0 && (
                  <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
                    <span className="dc:font-medium">Join keys:</span> {pa.joinKeys.map(jk => `${jk.sourceColumn}=${jk.targetColumn}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div>
          <h4 className="dc:text-sm dc:font-semibold text-dc-warning dc:mb-2 dc:flex dc:items-center">
            <WarningIcon className="dc:w-4 dc:h-4 dc:mr-2" />
            Warnings
          </h4>
          <ul className="list-disc dc:list-inside dc:text-xs text-dc-warning dc:space-y-1">
            {analysis.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cubes Involved */}
      {analysis.cubesInvolved.length > 0 && (
        <div className="dc:text-xs text-dc-text-muted dc:pt-2 dc:border-t border-dc-border">
          <span className="dc:font-medium">Cubes involved:</span> {analysis.cubesInvolved.join(', ')}
        </div>
      )}
    </div>
  )
}

export default QueryAnalysisPanel
