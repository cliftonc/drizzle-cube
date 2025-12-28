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
    <div className="bg-dc-surface-secondary border border-dc-border rounded-lg p-4 space-y-4">
      {/* Query Summary Section */}
      <div className="border-b border-dc-border pb-3">
        <h4 className="text-sm font-semibold text-dc-text mb-2 flex items-center">
          <InfoIcon className="w-4 h-4 mr-2" />
          Query Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-dc-surface p-2 rounded">
            <span className="text-dc-text-muted">Type:</span>
            <span className="ml-1 font-medium text-dc-text">
              {formatReason(analysis.querySummary.queryType)}
            </span>
          </div>
          <div className="bg-dc-surface p-2 rounded">
            <span className="text-dc-text-muted">Cubes:</span>
            <span className="ml-1 font-medium text-dc-text">{analysis.cubeCount}</span>
          </div>
          <div className="bg-dc-surface p-2 rounded">
            <span className="text-dc-text-muted">Joins:</span>
            <span className="ml-1 font-medium text-dc-text">{analysis.querySummary.joinCount}</span>
          </div>
          <div className="bg-dc-surface p-2 rounded">
            <span className="text-dc-text-muted">CTEs:</span>
            <span className="ml-1 font-medium text-dc-text">{analysis.querySummary.cteCount}</span>
          </div>
        </div>
      </div>

      {/* Primary Cube Section */}
      <div className="border-b border-dc-border pb-3">
        <h4 className="text-sm font-semibold text-dc-text mb-2 flex items-center">
          <TableIcon className="w-4 h-4 mr-2" />
          Primary Cube (FROM table)
        </h4>
        <div className="bg-dc-surface p-3 rounded text-sm">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono font-medium text-dc-primary">
              {analysis.primaryCube.selectedCube}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${getReasonBadgeClasses(analysis.primaryCube.reason)}`}>
              {formatReason(analysis.primaryCube.reason)}
            </span>
          </div>
          <p className="text-dc-text-secondary text-xs">
            {analysis.primaryCube.explanation}
          </p>
          {analysis.primaryCube.candidates && analysis.primaryCube.candidates.length > 1 && (
            <details className="mt-2">
              <summary className="text-xs text-dc-text-muted cursor-pointer hover:text-dc-text">
                Show candidates ({analysis.primaryCube.candidates.length})
              </summary>
              <div className="mt-2 space-y-1 ml-2">
                {analysis.primaryCube.candidates.map((c, i) => (
                  <div key={i} className="text-xs flex items-center gap-2 flex-wrap">
                    <span className={`font-mono ${c.cubeName === analysis.primaryCube.selectedCube ? 'font-bold text-dc-primary' : 'text-dc-text-muted'}`}>
                      {c.cubeName}
                    </span>
                    <span className="text-dc-text-muted">
                      dims: {c.dimensionCount}, joins: {c.joinCount}
                    </span>
                    {c.canReachAll ? (
                      <span className="text-dc-success flex items-center gap-0.5">
                        <SuccessIcon className="w-3 h-3" />
                        reachable
                      </span>
                    ) : (
                      <span className="text-dc-error flex items-center gap-0.5">
                        <ErrorIcon className="w-3 h-3" />
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
        <div className="border-b border-dc-border pb-3">
          <h4 className="text-sm font-semibold text-dc-text mb-2 flex items-center">
            <LinkIcon className="w-4 h-4 mr-2" />
            Join Paths
          </h4>
          <div className="space-y-2">
            {analysis.joinPaths.map((jp, idx) => (
              <div key={idx} className="bg-dc-surface p-3 rounded text-sm">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-dc-text-secondary">{analysis.primaryCube.selectedCube}</span>
                  <ArrowRightIcon className="w-4 h-4 text-dc-text-muted" />
                  <span className="font-mono font-medium text-dc-text">{jp.targetCube}</span>
                  {jp.pathFound ? (
                    <span className="text-xs px-2 py-0.5 bg-dc-success-bg text-dc-success rounded">
                      {jp.pathLength} step{jp.pathLength !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-dc-error-bg text-dc-error rounded">
                      No path
                    </span>
                  )}
                </div>
                {jp.pathFound && jp.path && jp.path.length > 0 && (
                  <div className="space-y-1 ml-2">
                    {jp.path.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-center gap-1 text-xs flex-wrap">
                        <span className="font-mono text-dc-text-secondary">{step.fromCube}</span>
                        <ArrowRightIcon className="w-3 h-3 text-dc-text-muted" />
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
                  <p className="text-xs text-dc-error mt-1">{jp.error}</p>
                )}
                {jp.visitedCubes && jp.visitedCubes.length > 0 && !jp.pathFound && (
                  <details className="mt-1">
                    <summary className="text-xs text-dc-text-muted cursor-pointer hover:text-dc-text">
                      Cubes visited during search ({jp.visitedCubes.length})
                    </summary>
                    <div className="mt-1 text-xs text-dc-text-muted ml-2">
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
        <div className="border-b border-dc-border pb-3">
          <h4 className="text-sm font-semibold text-dc-text mb-2 flex items-center">
            <TableIcon className="w-4 h-4 mr-2" />
            Pre-Aggregation CTEs
          </h4>
          <div className="space-y-2">
            {analysis.preAggregations.map((pa, idx) => (
              <div key={idx} className="bg-dc-surface p-3 rounded text-sm">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono font-medium text-dc-text">{pa.cubeName}</span>
                  <span className="text-xs text-dc-text-muted">as</span>
                  <code className="text-xs bg-dc-surface-secondary px-1 rounded font-mono">{pa.cteAlias}</code>
                </div>
                <p className="text-xs text-dc-text-secondary">{pa.reason}</p>
                <div className="mt-1 text-xs text-dc-text-muted">
                  <span className="font-medium">Measures:</span> {pa.measures.join(', ')}
                </div>
                {pa.joinKeys.length > 0 && (
                  <div className="mt-1 text-xs text-dc-text-muted">
                    <span className="font-medium">Join keys:</span> {pa.joinKeys.map(jk => `${jk.sourceColumn}=${jk.targetColumn}`).join(', ')}
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
          <h4 className="text-sm font-semibold text-dc-warning mb-2 flex items-center">
            <WarningIcon className="w-4 h-4 mr-2" />
            Warnings
          </h4>
          <ul className="list-disc list-inside text-xs text-dc-warning space-y-1">
            {analysis.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cubes Involved */}
      {analysis.cubesInvolved.length > 0 && (
        <div className="text-xs text-dc-text-muted pt-2 border-t border-dc-border">
          <span className="font-medium">Cubes involved:</span> {analysis.cubesInvolved.join(', ')}
        </div>
      )}
    </div>
  )
}

export default QueryAnalysisPanel
