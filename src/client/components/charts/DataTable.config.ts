import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the data table type
 */
export const dataTableConfig: ChartTypeConfig = {
  label: 'Data Table',
  description: 'Display detailed tabular data',
  useCase: 'Best for precise values, detailed analysis, sortable/filterable data exploration',
  dropZones: [
    {
      key: 'xAxis',
      label: 'Columns',
      description: 'All fields to display as columns',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop fields to display as columns (or leave empty for all)'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'Value Format',
      type: 'axisFormat',
      description: 'Number formatting for numeric values'
    }
  ]
}