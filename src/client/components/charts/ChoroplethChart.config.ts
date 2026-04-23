import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the choropleth chart type.
 *
 * Choropleth maps visualise a measure as colour-coded geographic regions.
 * Users must supply GeoJSON feature data (as a JSON string or URL) via displayConfig.
 * Best for showing per-country or per-region breakdowns of a measure.
 */
export const choroplethChartConfig: ChartTypeConfig = {
  label: 'chart.choropleth.label',
  description: 'chart.choropleth.description',
  useCase: 'chart.choropleth.useCase',
  // Choropleth requires at least one map dataset registered by the developer
  // via features.choropleth.maps. Without one, there's nothing to render, so
  // the chart type is hidden from the picker.
  isAvailable: ({ features }) => {
    const mapCount = Object.keys(features?.choropleth?.maps ?? {}).length
    if (mapCount === 0) {
      return { available: false, reason: 'chart.choropleth.unavailable.noMaps' }
    }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.region_field',
      description: 'chart.choropleth.dropZone.xAxis.description',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.choropleth.dropZone.xAxis.empty',
    },
    {
      key: 'valueField',
      label: 'chart.configText.value_color_intensity',
      description: 'chart.choropleth.dropZone.valueField.description',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.choropleth.dropZone.valueField.empty',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'mapId',
      label: 'chart.option.choroplethMap.label',
      type: 'select',
      optionsSource: 'choroplethMaps',
      description: 'chart.option.choroplethMap.description',
    },
    {
      key: 'geoProjection',
      label: 'chart.option.geoProjection.label',
      type: 'select',
      defaultValue: 'naturalEarth1',
      options: [
        { value: 'mercator', label: 'chart.option.geoProjection.mercator' },
        { value: 'naturalEarth1', label: 'chart.option.geoProjection.naturalEarth1' },
        { value: 'equalEarth', label: 'chart.option.geoProjection.equalEarth' },
        { value: 'equirectangular', label: 'chart.option.geoProjection.equirectangular' },
      ],
      description: 'chart.option.geoProjection.description',
    },
    {
      key: 'showGraticule',
      label: 'chart.option.showGraticule.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showGraticule.description',
    },
    {
      key: 'showLegend',
      label: 'chart.option.showLegend.label',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  validate: (config) => {
    if (!config.xAxis?.length) return { isValid: false, message: 'chart.choropleth.validation.regionRequired' }
    if (!config.valueField?.length) return { isValid: false, message: 'chart.choropleth.validation.valueRequired' }
    return { isValid: true }
  },
  clickableElements: {
    area: true,
  },
}
