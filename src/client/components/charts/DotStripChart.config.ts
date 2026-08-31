import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

/**
 * Configuration for the dot strip (beeswarm) chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 *
 * The zone *keys* are the standard `xAxis` / `yAxis` / `series` (so no
 * `ChartAxisConfig` change is needed), but the visual axes are transposed —
 * bands are rows and the measure runs horizontally — so the labels name the
 * roles rather than the axes.
 */
export const dotStripChartConfig: ChartTypeConfig = {
  displayOptions: ['showGrid', 'showTooltip', 'hideHeader'],
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.dotStrip.dropZone.xAxis.label',
      description: 'chart.dotStrip.dropZone.xAxis.description',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.dotStrip.dropZone.xAxis.empty',
    },
    {
      key: 'yAxis',
      label: 'chart.dotStrip.dropZone.yAxis.label',
      description: 'chart.dotStrip.dropZone.yAxis.description',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.dotStrip.dropZone.yAxis.empty',
    },
    {
      key: 'series',
      label: 'chart.dotStrip.dropZone.series.label',
      description: 'chart.dotStrip.dropZone.series.description',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.dotStrip.dropZone.series.empty',
    },
  ],
  clickableElements: {
    point: true,
  },
  displayOptionsConfig: [
    {
      key: 'showMedianMarker',
      label: 'chart.option.showMedianMarker.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showMedianMarker.description',
    },
    {
      key: 'showBandStats',
      label: 'chart.option.showBandStats.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showBandStats.description',
    },
    {
      key: 'showExtremeLabels',
      label: 'chart.option.showExtremeLabels.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showExtremeLabels.description',
    },
    {
      key: 'dotSize',
      label: 'chart.option.dotSize.label',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'small', label: 'chart.option.dotSize.small' },
        { value: 'medium', label: 'chart.option.dotSize.medium' },
        { value: 'large', label: 'chart.option.dotSize.large' },
      ],
      description: 'chart.option.dotSize.description',
    },
    {
      key: 'bandSort',
      label: 'chart.option.bandSort.label',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'chart.option.bandSort.none' },
        { value: 'valueDesc', label: 'chart.option.bandSort.valueDesc' },
        { value: 'valueAsc', label: 'chart.option.bandSort.valueAsc' },
        { value: 'count', label: 'chart.option.bandSort.count' },
      ],
      description: 'chart.option.bandSort.description',
    },
    {
      key: 'xAxisFormat',
      label: 'chart.option.xAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.option.xAxisFormat.description',
    },
  ],
}
