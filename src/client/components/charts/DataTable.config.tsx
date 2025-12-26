import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the data table type
 */
export const dataTableConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('table'),
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
  displayOptions: ['hideHeader']
}