import { FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { useTranslation } from '../../hooks/useTranslation'
import type { FunnelChartData } from '../../types/funnel'
import { getStepColor, getTimeMetricsLines, type FunnelDisplayOptions } from './FunnelChart.helpers'

interface FunnelViewProps {
  funnelData: FunnelChartData[]
  firstStepValue: number
  paletteColors: string[]
  options: FunnelDisplayOptions
  height: string | number
}

/** Shared summary footer (steps count, overall conversion, completed ratio). */
function FunnelSummaryFooter({
  funnelData,
  firstStepValue
}: {
  funnelData: FunnelChartData[]
  firstStepValue: number
}) {
  const { t } = useTranslation()
  const lastValue = funnelData[funnelData.length - 1]?.value || 0
  return (
    <div className="dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary">
      <div className="dc:flex dc:items-center dc:justify-between dc:text-sm">
        <div className="text-dc-text-muted">
          <span className="dc:font-medium">{funnelData.length}</span> steps
        </div>
        <div className="text-dc-text">
          <span className="text-dc-text-muted">{t('chart.runtime.funnel.overall')}</span>{' '}
          <span className="dc:font-medium">
            {firstStepValue > 0 ? `${(lastValue / firstStepValue * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
        <div className="text-dc-text-muted">
          {lastValue.toLocaleString() || 0} / {firstStepValue.toLocaleString()} completed
        </div>
      </div>
    </div>
  )
}

/** Per-step conversion + time-metrics block (shared by vertical/horizontal views). */
function StepMetrics({
  stepConversionRate,
  arrow,
  showConversion,
  timeMetricsLines
}: {
  stepConversionRate: number | null
  arrow: string
  showConversion: boolean
  timeMetricsLines: string[]
}) {
  if (stepConversionRate === null) {
    return <div className="dc:text-xs text-dc-text-muted">—</div>
  }
  return (
    <div className="dc:text-xs text-dc-text-secondary">
      {showConversion && <span>{arrow} {stepConversionRate.toFixed(1)}%</span>}
      {timeMetricsLines.length > 0 && (
        <div className="text-dc-text-muted dc:mt-0.5 dc:space-y-0.5">
          {timeMetricsLines.map((line, i) => (
            <div key={i}>⏱ {line}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Recharts trapezoid funnel style. */
export function FunnelShapeView({ funnelData, firstStepValue, paletteColors, options, height }: FunnelViewProps) {
  // Recharts FunnelChart layout: 'horizontal' = funnel flows left-to-right,
  // 'vertical' = top-to-bottom (default). Our 'vertical' orientation maps to
  // a left-to-right Recharts funnel.
  const rechartsLayout: 'horizontal' | 'vertical' = options.isVertical ? 'horizontal' : 'vertical'

  return (
    <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col" style={{ height }}>
      <div className="dc:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsFunnelChart layout={rechartsLayout} accessibilityLayer={false}>
            <Tooltip
              formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value)}
              contentStyle={{
                backgroundColor: 'var(--dc-surface)',
                border: '1px solid var(--dc-border)',
                borderRadius: '4px',
              }}
            />
            <Funnel dataKey="value" nameKey="name" data={funnelData} isAnimationActive>
              {funnelData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getStepColor(index, paletteColors)} />
              ))}
              <LabelList position="right" dataKey="name" fill="var(--dc-text)" style={{ fontSize: '12px' }} />
              <LabelList
                position="center"
                dataKey="percentage"
                formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)}%` : String(v)}
                fill="#fff"
                style={{ fontSize: '11px', fontWeight: 500 }}
              />
            </Funnel>
          </RechartsFunnelChart>
        </ResponsiveContainer>
      </div>
      {!options.hideSummaryFooter && (
        <FunnelSummaryFooter funnelData={funnelData} firstStepValue={firstStepValue} />
      )}
    </div>
  )
}

/** Vertical bars (steps laid out horizontally, bars grow bottom-to-top). */
export function FunnelVerticalView({ funnelData, firstStepValue, paletteColors, options, height }: FunnelViewProps) {
  return (
    <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col" style={{ height }}>
      <div className="dc:flex-1 dc:flex dc:items-end dc:justify-center dc:gap-4 dc:px-4 dc:py-3 dc:overflow-hidden">
        {funnelData.map((step, index) => {
          const heightPercent = firstStepValue > 0 ? (step.value / firstStepValue) * 100 : 0
          const prevStep = index > 0 ? funnelData[index - 1] : null
          const stepConversionRate = prevStep && prevStep.value > 0 ? (step.value / prevStep.value) * 100 : null
          const displayName = options.customStepLabels?.[index] || step.name
          const timeMetricsLines = getTimeMetricsLines(step, options.showAvgTime, options.showMedianTime, options.showP90Time)
          const metricsCount = timeMetricsLines.length

          return (
            <div key={step.name} className="dc:flex dc:flex-col dc:items-center dc:gap-2 dc:flex-1 dc:max-w-32 dc:h-full">
              <div className={`${metricsCount > 0 ? (metricsCount > 1 ? 'dc:min-h-16' : 'dc:min-h-10') : 'dc:h-5'} dc:flex-shrink-0 dc:text-center`}>
                <StepMetrics
                  stepConversionRate={stepConversionRate}
                  arrow="→"
                  showConversion={options.showConversion}
                  timeMetricsLines={timeMetricsLines}
                />
              </div>

              <div className="dc:flex-1 dc:w-full dc:relative dc:min-h-12">
                <div className="dc:absolute dc:inset-0 bg-dc-surface-secondary dc:rounded-sm" />
                <div
                  className="dc:absolute dc:bottom-0 dc:left-0 dc:right-0 dc:rounded-sm dc:transition-all dc:duration-300"
                  style={{ height: `${Math.max(heightPercent, 5)}%`, backgroundColor: getStepColor(index, paletteColors) }}
                />
                <div
                  className="dc:absolute dc:bottom-0 dc:left-0 dc:right-0 dc:flex dc:items-end dc:justify-center dc:pb-1 dc:pointer-events-none"
                  style={{ height: `${Math.max(heightPercent, 20)}%` }}
                >
                  <span className="dc:text-xs dc:font-medium text-white dc:drop-shadow-sm">
                    {step.percentage?.toFixed(1) ?? heightPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="dc:flex-shrink-0 dc:text-center">
                <div className="dc:text-sm dc:font-medium text-dc-text dc:truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="dc:text-xs text-dc-text-muted">
                  {step.value.toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!options.hideSummaryFooter && (
        <FunnelSummaryFooter funnelData={funnelData} firstStepValue={firstStepValue} />
      )}
    </div>
  )
}

/** Horizontal bars (default - steps stacked vertically, bars grow left-to-right). */
export function FunnelHorizontalView({ funnelData, firstStepValue, paletteColors, options, height }: FunnelViewProps) {
  return (
    <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col" style={{ height }}>
      <div className="dc:flex-1 dc:flex dc:flex-col dc:justify-center dc:gap-2 dc:px-4 dc:py-3 dc:overflow-hidden">
        {funnelData.map((step, index) => {
          const widthPercent = firstStepValue > 0 ? (step.value / firstStepValue) * 100 : 0
          const prevStep = index > 0 ? funnelData[index - 1] : null
          const stepConversionRate = prevStep && prevStep.value > 0 ? (step.value / prevStep.value) * 100 : null
          const displayName = options.customStepLabels?.[index] || step.name
          const timeMetricsLines = getTimeMetricsLines(step, options.showAvgTime, options.showMedianTime, options.showP90Time)
          const metricsCount = timeMetricsLines.length

          return (
            <div key={step.name} className="dc:flex dc:items-center dc:gap-3">
              <div className="dc:w-24 dc:flex-shrink-0 dc:text-right">
                <div className="dc:text-sm dc:font-medium text-dc-text dc:truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="dc:text-xs text-dc-text-muted">
                  {step.value.toLocaleString()}
                </div>
              </div>

              <div className="dc:flex-1 dc:relative">
                <div className="dc:w-full dc:h-8 bg-dc-surface-secondary dc:rounded-sm" />
                <div
                  className="dc:absolute dc:top-0 dc:left-0 dc:h-8 dc:rounded-sm dc:transition-all dc:duration-300"
                  style={{ width: `${Math.max(widthPercent, 2)}%`, backgroundColor: getStepColor(index, paletteColors) }}
                />
                <div
                  className="dc:absolute dc:top-0 dc:left-0 dc:h-8 dc:flex dc:items-center dc:px-2 dc:pointer-events-none"
                  style={{ width: `${Math.max(widthPercent, 20)}%` }}
                >
                  <span className="dc:text-xs dc:font-medium text-white dc:drop-shadow-sm">
                    {step.percentage?.toFixed(1) ?? widthPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className={`${metricsCount > 0 ? (metricsCount > 1 ? 'dc:w-36' : 'dc:w-28') : 'dc:w-16'} dc:flex-shrink-0 dc:text-left`}>
                <StepMetrics
                  stepConversionRate={stepConversionRate}
                  arrow="↓"
                  showConversion={options.showConversion}
                  timeMetricsLines={timeMetricsLines}
                />
              </div>
            </div>
          )
        })}
      </div>

      {!options.hideSummaryFooter && (
        <FunnelSummaryFooter funnelData={funnelData} firstStepValue={firstStepValue} />
      )}
    </div>
  )
}
