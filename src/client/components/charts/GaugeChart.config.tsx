import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the gauge chart type.
 * Renders a half-circle arc gauge showing a single KPI value vs a target/max.
 */
export const gaugeChartConfig: ChartTypeConfig = {
  label: 'Gauge Chart',
  icon: getChartTypeIcon('kpiNumber'),
  description: 'Half-circle arc gauge for a single KPI value versus a maximum target',
  useCase:
    'Best for high-water marks vs equity, margin utilisation, or any single value progress toward a goal',
  clickableElements: {},
  dropZones: [
    {
      key: 'yAxis',
      label: 'Value Measure',
      description: 'Current value to display on the gauge (e.g. current equity, margin used)',
      mandatory: true,
      maxItems: 2,
      acceptTypes: ['measure'],
      emptyText: 'Drop 1 measure here (optional 2nd for dynamic max)',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'minValue',
      label: 'Minimum Value',
      type: 'number',
      defaultValue: 0,
      description: 'Lower bound of the gauge arc (default 0)',
    },
    {
      key: 'maxValue',
      label: 'Maximum Value (static)',
      type: 'number',
      description: 'Upper bound of the gauge. Leave empty to use yAxis[1] or default 100',
    },
    {
      key: 'thresholds',
      label: 'Threshold Bands',
      type: 'string',
      placeholder: '[{"value":0.33,"color":"#22c55e"},{"value":0.66,"color":"#f59e0b"},{"value":1,"color":"#ef4444"}]',
      description: 'Array of {value (0–1 fraction), color} bands shown as outer arc markers',
    },
    {
      key: 'showCenterLabel',
      label: 'Show Centre Label',
      type: 'boolean',
      defaultValue: true,
      description: 'Display current value and field name in the centre of the gauge',
    },
    {
      key: 'showPercentage',
      label: 'Show as Percentage',
      type: 'boolean',
      defaultValue: false,
      description: 'Display value as % of max instead of raw number',
    },
    {
      key: 'leftYAxisFormat',
      label: 'Value Format',
      type: 'axisFormat',
      description: 'Number formatting for the displayed value and axis labels',
    },
  ],
}
