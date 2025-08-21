import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the data table type
 */
export const dataTableConfig: ChartTypeConfig = {
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
  displayOptions: []
}