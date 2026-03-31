import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the line chart type
 */
export const lineChartConfig: ChartTypeConfig = {
  label: t('chart.line.label'),
  description: t('chart.line.description'),
  useCase: t('chart.line.useCase'),
  clickableElements: { point: true },
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.x_axis_time_categories'),
      description: t('chart.configText.time_dimensions_or_dimensions_for_x_axis'),
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop time dimensions or dimensions here'
    },
    {
      key: 'yAxis',
      label: t('chart.dropZone.yAxis.label'),
      description: t('chart.configText.measures_for_line_values'),
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: t('chart.configText.series_multiple_lines'),
      description: t('chart.configText.dimensions_to_create_separate_lines'),
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here for multiple lines'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'connectNulls',
      label: t('chart.option.connectNulls.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.connectNulls.description')
    },
    {
      key: 'target',
      label: t('chart.option.target.label'),
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: t('chart.option.target.description')
    },
    {
      key: 'priorPeriodStyle',
      label: t('chart.option.priorPeriodStyle.label'),
      type: 'select',
      defaultValue: 'dashed',
      options: [
        { value: 'dashed', label: t('chart.option.priorPeriodStyle.dashed') },
        { value: 'dotted', label: t('chart.option.priorPeriodStyle.dotted') },
        { value: 'solid', label: t('chart.option.priorPeriodStyle.solid') }
      ],
      description: t('chart.option.priorPeriodStyle.description')
    },
    {
      key: 'priorPeriodOpacity',
      label: t('chart.option.priorPeriodOpacity.label'),
      type: 'number',
      defaultValue: 0.5,
      min: 0.1,
      max: 1,
      step: 0.1,
      description: t('chart.option.priorPeriodOpacity.description')
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.leftYAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.leftYAxisFormat.description')
    },
    {
      key: 'rightYAxisFormat',
      label: t('chart.option.rightYAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.rightYAxisFormat.description')
    }
  ]
}