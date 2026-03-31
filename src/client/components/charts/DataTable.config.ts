import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the data table type
 */
export const dataTableConfig: ChartTypeConfig = {
  label: t('chart.table.label'),
  description: t('chart.table.description'),
  useCase: t('chart.table.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.columns'),
      description: t('chart.configText.all_fields_to_display_as_columns'),
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop fields to display as columns (or leave empty for all)'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_numeric_values')
    }
  ]
}