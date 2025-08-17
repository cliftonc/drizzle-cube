/**
 * Chart Configuration Editor Component
 * Simple form for editing chart configuration
 */

import { useState } from 'react'
import type { ChartAxisConfig, ChartDisplayConfig } from '../types'

interface ChartConfigEditorProps {
  chartConfig: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  onConfigChange: (chartConfig: ChartAxisConfig, displayConfig: ChartDisplayConfig) => void
}

export default function ChartConfigEditor({
  chartConfig,
  displayConfig = {},
  onConfigChange
}: ChartConfigEditorProps) {
  const [config, setConfig] = useState({
    x: chartConfig.x || '',
    y: Array.isArray(chartConfig.y) ? chartConfig.y.join(', ') : (chartConfig.y || ''),
    series: chartConfig.series || '',
    showLegend: displayConfig.showLegend !== false,
    showGrid: displayConfig.showGrid !== false,
    showTooltip: displayConfig.showTooltip !== false,
    stacked: displayConfig.stacked === true
  })

  const handleChange = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)

    // Convert back to proper format and notify parent
    const updatedChartConfig: ChartAxisConfig = {
      x: newConfig.x || undefined,
      y: newConfig.y ? newConfig.y.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      series: newConfig.series || undefined
    }

    const updatedDisplayConfig: ChartDisplayConfig = {
      showLegend: newConfig.showLegend,
      showGrid: newConfig.showGrid,
      showTooltip: newConfig.showTooltip,
      stacked: newConfig.stacked
    }

    onConfigChange(updatedChartConfig, updatedDisplayConfig)
  }

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <h3 className="font-semibold text-sm">Chart Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            X Axis Field
          </label>
          <input
            type="text"
            value={config.x}
            onChange={(e) => handleChange('x', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Y Axis Fields (comma-separated)
          </label>
          <input
            type="text"
            value={config.y}
            onChange={(e) => handleChange('y', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., count, total"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Series Field (optional)
          </label>
          <input
            type="text"
            value={config.series}
            onChange={(e) => handleChange('series', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., category"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-700">Display Options</h4>
        
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showLegend}
              onChange={(e) => handleChange('showLegend', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Show Legend</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showGrid}
              onChange={(e) => handleChange('showGrid', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Show Grid</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.showTooltip}
              onChange={(e) => handleChange('showTooltip', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Show Tooltip</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.stacked}
              onChange={(e) => handleChange('stacked', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Stacked</span>
          </label>
        </div>
      </div>
    </div>
  )
}