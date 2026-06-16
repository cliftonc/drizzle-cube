/**
 * FlowDepthControls Component
 *
 * Steps-before / steps-after depth sliders plus performance warning for flow
 * mode. Extracted from FlowModeContent to keep its render body flat.
 */

import { memo } from 'react'
import type { ChartType } from '../../types.js'
import { FLOW_MIN_DEPTH, FLOW_MAX_DEPTH } from '../../types/flow.js'
import SectionHeading from './SectionHeading.js'
import { useTranslation } from '../../hooks/useTranslation.js'

interface FlowDepthControlsProps {
  chartType: ChartType
  stepsBefore: number
  stepsAfter: number
  onStepsBeforeChange: (count: number) => void
  onStepsAfterChange: (count: number) => void
}

const FlowDepthControls = memo(function FlowDepthControls({
  chartType,
  stepsBefore,
  stepsAfter,
  onStepsBeforeChange,
  onStepsAfterChange
}: FlowDepthControlsProps) {
  const { t } = useTranslation()
  const isSunburst = chartType === 'sunburst'
  const showWarning = (!isSunburst && stepsBefore >= 4) || stepsAfter >= 4

  return (
    <div>
      <SectionHeading>{t('flow.depth.title')}</SectionHeading>
      <p className="dc:text-xs text-dc-text-muted dc:mb-3">
        {isSunburst
          ? t('flow.depth.descriptionSunburst')
          : t('flow.depth.descriptionSankey')}
      </p>

      <div className="dc:grid dc:grid-cols-2 dc:gap-4">
        {/* Steps Before - disabled for sunburst */}
        <div className={isSunburst ? 'dc:opacity-50' : ''}>
          <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
            {t('flow.depth.stepsBefore')}
            {isSunburst && (
              <span className="dc:ml-1 text-dc-text-muted">{t('flow.depth.stepsBeforeNA')}</span>
            )}
          </label>
          <div className="dc:flex dc:items-center dc:gap-2">
            <input
              type="range"
              min={FLOW_MIN_DEPTH}
              max={FLOW_MAX_DEPTH}
              value={stepsBefore}
              onChange={(e) => onStepsBeforeChange(parseInt(e.target.value, 10))}
              disabled={isSunburst}
              className="dc:flex-1 dc:disabled:cursor-not-allowed"
            />
            <span className="dc:w-6 dc:text-sm dc:font-medium text-dc-text dc:text-center">
              {isSunburst ? '-' : stepsBefore}
            </span>
          </div>
        </div>

        {/* Steps After */}
        <div>
          <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
            {t('flow.depth.stepsAfter')}
          </label>
          <div className="dc:flex dc:items-center dc:gap-2">
            <input
              type="range"
              min={FLOW_MIN_DEPTH}
              max={FLOW_MAX_DEPTH}
              value={stepsAfter}
              onChange={(e) => onStepsAfterChange(parseInt(e.target.value, 10))}
              className="dc:flex-1"
            />
            <span className="dc:w-6 dc:text-sm dc:font-medium text-dc-text dc:text-center">
              {stepsAfter}
            </span>
          </div>
        </div>
      </div>

      {/* Performance warning for high depth */}
      {showWarning && (
        <div className="dc:mt-3 dc:px-3 dc:py-2 bg-dc-warning-bg dc:rounded dc:border border-dc-warning dc:text-xs text-dc-warning">
          {t('flow.depth.performanceWarning')}
        </div>
      )}
    </div>
  )
})

export default FlowDepthControls
