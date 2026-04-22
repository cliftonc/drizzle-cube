import type { ChartTypeConfig } from '@drizzle-cube/client'

export const horizontalBarConfig: ChartTypeConfig = {
  label: 'Horizontal Bar',
  description: 'Horizontal bars comparing values across categories',
  useCase: 'Great for ranked lists, category comparisons, and data with long labels',
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'Categories',
      description: 'Dimension for bar labels',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension here',
    },
    {
      key: 'yAxis',
      label: 'Values',
      description: 'Measure for bar lengths',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showValues',
      label: 'Show Values',
      type: 'boolean',
      defaultValue: true,
      description: 'Show numeric values next to bars',
    },
    {
      key: 'showGrid',
      label: 'Show Track',
      type: 'boolean',
      defaultValue: true,
      description: 'Show background track behind bars',
    },
  ],
}
