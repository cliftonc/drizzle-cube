/**
 * QueryAnalysisPanel Component
 * Displays query planning analysis for debugging and transparency
 */

import React from 'react'
import { getIcon } from '../../icons'
import type { QueryAnalysis } from '../types'
import { useTranslation } from '../../hooks/useTranslation'
import {
  formatReason,
  PrimaryCubeSection,
  JoinPathsSection,
  PreAggregationsSection,
  WarningsSection,
} from './QueryAnalysisPanel.sections'

interface QueryAnalysisPanelProps {
  analysis: QueryAnalysis
}

/**
 * Render the top "Query Summary" cards section.
 */
const QuerySummarySection: React.FC<{ analysis: QueryAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation()
  const InfoIcon = getIcon('info')

  const summaryCards = [
    {
      label: t('queryAnalysis.summary.type'),
      value: formatReason(analysis.querySummary.queryType),
    },
    {
      label: t('queryAnalysis.summary.cubes'),
      value: String(analysis.cubeCount),
    },
    {
      label: t('queryAnalysis.summary.joins'),
      value: String(analysis.querySummary.joinCount),
    },
    {
      label: t('queryAnalysis.summary.ctes'),
      value: String(analysis.querySummary.cteCount),
    },
    ...(analysis.querySummary.measureStrategy
      ? [
          {
            label: t('queryAnalysis.summary.strategy'),
            value: formatReason(analysis.querySummary.measureStrategy),
          },
        ]
      : []),
  ]

  return (
    <div className="dc:border-b border-dc-border dc:pb-3">
      <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center">
        <InfoIcon className="dc:w-4 dc:h-4 dc:mr-2" />
        {t('queryAnalysis.summary')}
      </h4>
      <div
        className="dc:grid dc:gap-2 dc:text-xs"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        {summaryCards.map(card => (
          <div key={card.label} className="bg-dc-surface dc:p-2 dc:rounded">
            <span className="text-dc-text-muted">{card.label}:</span>
            <span className="dc:ml-1 dc:font-medium text-dc-text">{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Render the "Cubes Involved" footer (only when present).
 */
const CubesInvolvedSection: React.FC<{ analysis: QueryAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation()
  if (analysis.cubesInvolved.length === 0) return null

  return (
    <div className="dc:text-xs text-dc-text-muted dc:pt-2 dc:border-t border-dc-border">
      <span className="dc:font-medium">{t('queryAnalysis.cubesInvolved')}</span> {analysis.cubesInvolved.join(', ')}
    </div>
  )
}

const QueryAnalysisPanel: React.FC<QueryAnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded-lg dc:p-4 dc:space-y-4">
      <QuerySummarySection analysis={analysis} />
      <PrimaryCubeSection analysis={analysis} />
      <JoinPathsSection analysis={analysis} />
      <PreAggregationsSection analysis={analysis} />
      <WarningsSection analysis={analysis} />
      <CubesInvolvedSection analysis={analysis} />
    </div>
  )
}

export default QueryAnalysisPanel
