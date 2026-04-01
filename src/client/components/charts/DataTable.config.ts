import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the data table type
 */
export const dataTableConfig: ChartTypeConfig = {
  label: 'chart.table.label',
  description: 'chart.table.description',
  useCase: 'chart.table.useCase',
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.columns',
      description: 'chart.configText.all_fields_to_display_as_columns',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'chart.table.dropZone.xAxis.empty'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_numeric_values'
    }
  ]
}