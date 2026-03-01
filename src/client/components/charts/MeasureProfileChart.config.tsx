import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the measure profile chart type
 */
export const measureProfileChartConfig: ChartTypeConfig = {
  label: 'Measure Profile',
  icon: getChartTypeIcon('line'),
  description: 'Plot N measures as sequential X-axis points to visualise a profile or shape across intervals',
  useCase:
    'Best for markout interval analysis (e.g. avgMinus2m → avgAtEvent → avgPlus2h), metric profiles, or any pattern across ordered measures',
  dropZones: [
    {
      key: 'yAxis',
      label: 'Measures (X-Axis Order)',
      description: 'Add 2 or more measures — they become the X-axis categories in the order listed',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop 2+ measures here (displayed left → right)',
    },
    {
      key: 'series',
      label: 'Series (Split into Multiple Lines)',
      description: 'Dimension to split data into separate profile lines (e.g. symbol, platform)',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension here to create multiple lines',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showReferenceLineAtZero',
      label: 'Show Zero Reference Line',
      type: 'boolean',
      defaultValue: true,
      description: 'Draw a dashed line at Y = 0',
    },
    {
      key: 'showDataLabels',
      label: 'Show Data Labels',
      type: 'boolean',
      defaultValue: false,
      description: 'Display value at each data point',
    },
    {
      key: 'showLegend',
      label: 'Show Legend',
      type: 'boolean',
      defaultValue: true,
      description: 'Show series legend (only visible with a Series dimension)',
    },
    {
      key: 'lineType',
      label: 'Line Interpolation',
      type: 'select',
      defaultValue: 'monotone',
      options: [
        { value: 'monotone', label: 'Smooth (monotone)' },
        { value: 'linear', label: 'Linear' },
        { value: 'step', label: 'Step' },
      ],
      description: 'How data points are connected',
    },
    {
      key: 'leftYAxisFormat',
      label: 'Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for the Y-axis',
    },
  ],
}
