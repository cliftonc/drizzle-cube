import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

/**
 * Configuration for the records table.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry — see `src/client/charts/chartRegistry.ts`. This
 * file owns the lazy-loaded shape: drop zones, display options, clickable
 * elements, validation.
 */
export const recordsTableConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'columns',
      label: 'chart.recordsTable.dropZone.columns.label',
      description: 'chart.recordsTable.dropZone.columns.description',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'chart.recordsTable.dropZone.columns.empty'
    },
    {
      key: 'hiddenColumns',
      label: 'chart.recordsTable.dropZone.hiddenColumns.label',
      description: 'chart.recordsTable.dropZone.hiddenColumns.description',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'chart.recordsTable.dropZone.hiddenColumns.empty',
      // Hiding is a deliberate choice: auto-filling this from the query would
      // hide every column and render an empty table.
      excludeFromInference: true
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'columnFormats',
      label: 'chart.recordsTable.option.columnFormats.label',
      type: 'columnFormats',
      description: 'chart.recordsTable.option.columnFormats.description'
    },
    {
      key: 'rowLink',
      label: 'chart.recordsTable.option.rowLink.label',
      type: 'rowLink',
      description: 'chart.recordsTable.option.rowLink.description'
    },
    {
      key: 'pageSize',
      label: 'chart.recordsTable.option.pageSize.label',
      type: 'select',
      defaultValue: 25,
      description: 'chart.recordsTable.option.pageSize.description',
      options: [
        { value: 25, label: 'chart.recordsTable.option.pageSize.option.25' },
        { value: 50, label: 'chart.recordsTable.option.pageSize.option.50' },
        { value: 100, label: 'chart.recordsTable.option.pageSize.option.100' }
      ]
    }
  ],
  clickableElements: { row: true },
  // A record-grain listing: its query must be ungrouped, or the rows collapse
  // into aggregates and generated attribute dimensions stop being legal SQL.
  recordGrain: true
}
