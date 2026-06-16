/**
 * AnalysisDisplayConfigPanel Component
 *
 * A panel for configuring chart display options (legend, grid, tooltip, etc.)
 * Extracted from AnalysisChartConfigPanel to be shown in its own tab.
 */

import SectionHeading from './SectionHeading.js'
import DisplayOptionControl from './DisplayOptionControl.js'
import LegacyBooleanOptions from './LegacyBooleanOptions.js'
import { useChartConfig } from '../../charts/lazyChartConfigRegistry.js'
import type { ChartType, ChartDisplayConfig, ColorPalette } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

interface AnalysisDisplayConfigPanelProps {
  chartType: ChartType
  displayConfig: ChartDisplayConfig
  colorPalette?: ColorPalette
  onDisplayConfigChange: (config: ChartDisplayConfig) => void
  /** Keys to exclude from displayOptionsConfig rendering (e.g., ['content'] when content is managed elsewhere) */
  excludeKeys?: string[]
}

export default function AnalysisDisplayConfigPanel({
  chartType,
  displayConfig,
  colorPalette,
  onDisplayConfigChange,
  excludeKeys,
}: AnalysisDisplayConfigPanelProps) {
  const { t } = useTranslation()

  // Get configuration for current chart type
  const { config: chartTypeConfig, loaded: chartConfigLoaded } = useChartConfig(chartType)

  if (!chartConfigLoaded) {
    return (
      <div className="dc:text-center text-dc-text-muted dc:text-sm dc:py-4">
        {t('display.loading')}
      </div>
    )
  }

  // Check if we have any display options to show
  const hasDisplayOptions =
    (chartTypeConfig.displayOptions && chartTypeConfig.displayOptions.length > 0) ||
    (chartTypeConfig.displayOptionsConfig && chartTypeConfig.displayOptionsConfig.length > 0)

  if (!hasDisplayOptions) {
    return (
      <div className="dc:text-center text-dc-text-muted dc:text-sm dc:py-4">
        <p>{t('display.noOptions')}</p>
      </div>
    )
  }

  return (
    <div className="dc:space-y-6">
      <div>
        <SectionHeading className="dc:mb-2">{t('display.heading')}</SectionHeading>
        <div className="dc:space-y-2">
          {/* Backward compatibility: Simple boolean display options */}
          <LegacyBooleanOptions
            displayOptions={chartTypeConfig.displayOptions}
            displayConfig={displayConfig}
            onDisplayConfigChange={onDisplayConfigChange}
          />

          {/* New structured display options */}
          {chartTypeConfig.displayOptionsConfig?.filter(option => !excludeKeys?.includes(option.key)).map((option) => (
            <div key={option.key} className={`dc:space-y-1 ${option.type === 'axisFormat' ? 'dc:mt-6 dc:pt-2' : ''}`}>
              <DisplayOptionControl
                option={option}
                displayConfig={displayConfig}
                colorPalette={colorPalette}
                onDisplayConfigChange={onDisplayConfigChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
