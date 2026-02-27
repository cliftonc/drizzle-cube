import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the waterfall chart type.
 * Use for decomposing a total into incremental positive/negative contributions.
 */
export const waterfallChartConfig: ChartTypeConfig = {
  label: 'Waterfall Chart',
  icon: getChartTypeIcon('bar'),
  description: 'Show cumulative effect of sequential positive and negative values',
  useCase:
    'Best for P&L decomposition, cash flow analysis, budget variance, or any sequential contribution breakdown',
  clickableElements: { bar: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Categories)',
      description: 'Dimension labels for each bar segment (e.g. symbol, transaction type)',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension here',
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Value)',
      description: 'Single measure whose values are summed cumulatively',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showTotal',
      label: 'Show Total Bar',
      type: 'boolean',
      defaultValue: true,
      description: 'Append a final bar showing the running total',
    },
    {
      key: 'showConnectorLine',
      label: 'Show Connector Line',
      type: 'boolean',
      defaultValue: true,
      description: 'Draw a dashed step-line connecting bar tops',
    },
    {
      key: 'showDataLabels',
      label: 'Show Data Labels',
      type: 'boolean',
      defaultValue: false,
      description: 'Display the value above each bar segment',
    },
    {
      key: 'leftYAxisFormat',
      label: 'Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for the Y-axis',
    },
  ],
}
