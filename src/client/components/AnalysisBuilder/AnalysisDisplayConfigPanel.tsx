/**
 * AnalysisDisplayConfigPanel Component
 *
 * A panel for configuring chart display options (legend, grid, tooltip, etc.)
 * Extracted from AnalysisChartConfigPanel to be shown in its own tab.
 */

import { useState, useCallback, useEffect } from 'react'
import SectionHeading from './SectionHeading'
import { useChartConfig } from '../../charts/lazyChartConfigRegistry'
import type { ChartType, ChartDisplayConfig, ColorPalette, AxisFormatConfig } from '../../types'
import { AxisFormatControls } from '../charts/AxisFormatControls'

interface AnalysisDisplayConfigPanelProps {
  chartType: ChartType
  displayConfig: ChartDisplayConfig
  colorPalette?: ColorPalette
  onDisplayConfigChange: (config: ChartDisplayConfig) => void
}

/**
 * StringArrayInput - A textarea that edits an array of strings
 * Uses local state while editing and only updates on blur
 */
function StringArrayInput({
  label,
  value,
  onChange,
  placeholder,
  description,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  description?: string
}) {
  // Local state for textarea editing
  const [localText, setLocalText] = useState(() => value.join('\n'))

  // Sync local state when external value changes (e.g., from undo/redo or load)
  useEffect(() => {
    const externalText = value.join('\n')
    setLocalText(externalText)
  }, [value])

  const handleBlur = useCallback(() => {
    // Convert text to array, filtering empty strings
    const arrayValue = localText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    onChange(arrayValue)
  }, [localText, onChange])

  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{label}</label>
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={4}
        className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text dc:resize-y"
      />
      {description && (
        <p className="dc:text-xs text-dc-text-muted">{description}</p>
      )}
    </div>
  )
}

export default function AnalysisDisplayConfigPanel({
  chartType,
  displayConfig,
  colorPalette,
  onDisplayConfigChange
}: AnalysisDisplayConfigPanelProps) {
  // Get configuration for current chart type
  const { config: chartTypeConfig, loaded: chartConfigLoaded } = useChartConfig(chartType)

  if (!chartConfigLoaded) {
    return (
      <div className="text-center text-dc-text-muted dc:text-sm dc:py-4">
        Loading display options...
      </div>
    )
  }

  // Check if we have any display options to show
  const hasDisplayOptions =
    (chartTypeConfig.displayOptions && chartTypeConfig.displayOptions.length > 0) ||
    (chartTypeConfig.displayOptionsConfig && chartTypeConfig.displayOptionsConfig.length > 0)

  if (!hasDisplayOptions) {
    return (
      <div className="text-center text-dc-text-muted dc:text-sm dc:py-4">
        <p>No display options available for this chart type.</p>
      </div>
    )
  }

  return (
    <div className="dc:space-y-6">
      <div>
        <SectionHeading className="dc:mb-2">Display Options</SectionHeading>
        <div className="dc:space-y-2">
          {/* Backward compatibility: Simple boolean display options */}
          {chartTypeConfig.displayOptions?.includes('showLegend') && (
            <label className="dc:flex dc:items-center dc:space-x-2">
              <input
                type="checkbox"
                checked={displayConfig.showLegend ?? true}
                onChange={(e) =>
                  onDisplayConfigChange({
                    ...displayConfig,
                    showLegend: e.target.checked
                  })
                }
                className="dc:rounded border-dc-border focus:ring-dc-accent"
                style={{ color: 'var(--dc-primary)' }}
              />
              <span className="dc:text-sm text-dc-text">Show Legend</span>
            </label>
          )}

          {chartTypeConfig.displayOptions?.includes('showGrid') && (
            <label className="dc:flex dc:items-center dc:space-x-2">
              <input
                type="checkbox"
                checked={displayConfig.showGrid ?? true}
                onChange={(e) =>
                  onDisplayConfigChange({
                    ...displayConfig,
                    showGrid: e.target.checked
                  })
                }
                className="dc:rounded border-dc-border focus:ring-dc-accent"
                style={{ color: 'var(--dc-primary)' }}
              />
              <span className="dc:text-sm text-dc-text">Show Grid</span>
            </label>
          )}

          {chartTypeConfig.displayOptions?.includes('showTooltip') && (
            <label className="dc:flex dc:items-center dc:space-x-2">
              <input
                type="checkbox"
                checked={displayConfig.showTooltip ?? true}
                onChange={(e) =>
                  onDisplayConfigChange({
                    ...displayConfig,
                    showTooltip: e.target.checked
                  })
                }
                className="dc:rounded border-dc-border focus:ring-dc-accent"
                style={{ color: 'var(--dc-primary)' }}
              />
              <span className="dc:text-sm text-dc-text">Show Tooltip</span>
            </label>
          )}

          {chartTypeConfig.displayOptions?.includes('stacked') && (
            <label className="dc:flex dc:items-center dc:space-x-2">
              <input
                type="checkbox"
                checked={displayConfig.stacked ?? false}
                onChange={(e) =>
                  onDisplayConfigChange({
                    ...displayConfig,
                    stacked: e.target.checked
                  })
                }
                className="dc:rounded border-dc-border focus:ring-dc-accent"
                style={{ color: 'var(--dc-primary)' }}
              />
              <span className="dc:text-sm text-dc-text">Stacked</span>
            </label>
          )}

          {chartTypeConfig.displayOptions?.includes('hideHeader') && (
            <label className="dc:flex dc:items-center dc:space-x-2">
              <input
                type="checkbox"
                checked={displayConfig.hideHeader ?? false}
                onChange={(e) =>
                  onDisplayConfigChange({
                    ...displayConfig,
                    hideHeader: e.target.checked
                  })
                }
                className="dc:rounded border-dc-border focus:ring-dc-accent"
                style={{ color: 'var(--dc-primary)' }}
              />
              <span className="dc:text-sm text-dc-text">Hide Header</span>
            </label>
          )}

          {/* New structured display options */}
          {chartTypeConfig.displayOptionsConfig?.map((option) => (
            <div key={option.key} className={`dc:space-y-1 ${option.type === 'axisFormat' ? 'dc:mt-6 dc:pt-2' : ''}`}>
              {option.type === 'boolean' && (
                <label className="dc:flex dc:items-center dc:space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      (displayConfig[option.key as keyof ChartDisplayConfig] as boolean) ??
                      option.defaultValue ??
                      false
                    }
                    onChange={(e) =>
                      onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.checked
                      })
                    }
                    className="dc:rounded border-dc-border focus:ring-dc-accent"
                    style={{ color: 'var(--dc-primary)' }}
                  />
                  <span className="dc:text-sm text-dc-text">{option.label}</span>
                </label>
              )}

              {option.type === 'string' && (
                <div className="dc:space-y-1">
                  <label className="dc:text-sm text-dc-text-secondary">
                    {option.label}
                    {option.key === 'content' && (
                      <span className="dc:text-xs text-dc-text-muted dc:ml-1">
                        (only headers, lists and links)
                      </span>
                    )}
                  </label>
                  {option.key === 'content' ? (
                    <textarea
                      value={
                        (displayConfig[option.key as keyof ChartDisplayConfig] as string) ??
                        option.defaultValue ??
                        ''
                      }
                      onChange={(e) =>
                        onDisplayConfigChange({
                          ...displayConfig,
                          [option.key]: e.target.value
                        })
                      }
                      placeholder={option.placeholder}
                      rows={8}
                      className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent font-mono dc:resize-y bg-dc-surface text-dc-text"
                    />
                  ) : (
                    <input
                      type="text"
                      value={
                        (displayConfig[option.key as keyof ChartDisplayConfig] as string) ??
                        option.defaultValue ??
                        ''
                      }
                      onChange={(e) =>
                        onDisplayConfigChange({
                          ...displayConfig,
                          [option.key]: e.target.value
                        })
                      }
                      placeholder={option.placeholder}
                      className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
                    />
                  )}
                  {option.description && (
                    <p className="dc:text-xs text-dc-text-muted">{option.description}</p>
                  )}
                </div>
              )}

              {option.type === 'paletteColor' && (
                <div className="dc:space-y-1">
                  <label className="dc:text-sm text-dc-text-secondary">{option.label}</label>
                  <div className="dc:flex dc:flex-wrap dc:gap-2">
                    {colorPalette?.colors.map((color, index) => {
                      const isSelected =
                        ((displayConfig[option.key as keyof ChartDisplayConfig] as number) ??
                          option.defaultValue ??
                          0) === index
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            onDisplayConfigChange({
                              ...displayConfig,
                              [option.key]: index
                            })
                          }
                          className={`dc:w-8 dc:h-8 dc:rounded dc:border-2 dc:transition-all dc:duration-200 dc:hover:scale-110 focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent dc:focus:ring-offset-1 ${
                            isSelected
                              ? 'dc:ring-2 dc:ring-offset-1 dc:scale-110'
                              : 'hover:border-dc-text-muted'
                          }`}
                          style={{
                            backgroundColor: color,
                            borderColor: isSelected ? 'var(--dc-primary)' : 'var(--dc-border)'
                          }}
                          title={`Color ${index + 1}: ${color}`}
                        />
                      )
                    }) || [
                      // Fallback if no palette available
                      <button
                        key={0}
                        type="button"
                        onClick={() =>
                          onDisplayConfigChange({
                            ...displayConfig,
                            [option.key]: 0
                          })
                        }
                        className="dc:w-8 dc:h-8 dc:rounded-sm dc:border-2 dc:ring-2 dc:ring-offset-1"
                        style={{
                          backgroundColor: '#8884d8',
                          borderColor: 'var(--dc-primary)',
                          boxShadow: '0 0 0 2px var(--dc-primary)'
                        }}
                        title="Default Color"
                      />
                    ]}
                  </div>
                  {option.description && (
                    <p className="dc:text-xs text-dc-text-muted">{option.description}</p>
                  )}
                </div>
              )}

              {option.type === 'number' && (
                <div className="dc:space-y-1">
                  <label className="dc:text-sm text-dc-text-secondary">{option.label}</label>
                  <input
                    type="number"
                    value={
                      (displayConfig[option.key as keyof ChartDisplayConfig] as number) ??
                      option.defaultValue ??
                      0
                    }
                    onChange={(e) =>
                      onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.value === '' ? undefined : Number(e.target.value)
                      })
                    }
                    placeholder={option.placeholder}
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
                  />
                  {option.description && (
                    <p className="dc:text-xs text-dc-text-muted">{option.description}</p>
                  )}
                </div>
              )}

              {option.type === 'select' && (
                <div className="dc:space-y-1">
                  <label className="dc:text-sm text-dc-text-secondary">{option.label}</label>
                  <select
                    value={
                      (displayConfig[option.key as keyof ChartDisplayConfig] as string) ??
                      option.defaultValue ??
                      ''
                    }
                    onChange={(e) =>
                      onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.value
                      })
                    }
                    className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
                  >
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {option.description && (
                    <p className="dc:text-xs text-dc-text-muted">{option.description}</p>
                  )}
                </div>
              )}

              {option.type === 'color' && (
                <div className="dc:space-y-1">
                  <label className="dc:text-sm text-dc-text-secondary">{option.label}</label>
                  <div className="dc:flex dc:items-center dc:space-x-2">
                    <input
                      type="color"
                      value={
                        (displayConfig[option.key as keyof ChartDisplayConfig] as string) ??
                        option.defaultValue ??
                        '#8884d8'
                      }
                      onChange={(e) =>
                        onDisplayConfigChange({
                          ...displayConfig,
                          [option.key]: e.target.value
                        })
                      }
                      className="dc:w-12 dc:h-8 dc:border border-dc-border dc:rounded-sm dc:cursor-pointer"
                    />
                    <input
                      type="text"
                      value={
                        (displayConfig[option.key as keyof ChartDisplayConfig] as string) ??
                        option.defaultValue ??
                        '#8884d8'
                      }
                      onChange={(e) =>
                        onDisplayConfigChange({
                          ...displayConfig,
                          [option.key]: e.target.value
                        })
                      }
                      placeholder={option.placeholder || '#8884d8'}
                      className="dc:flex-1 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
                    />
                  </div>
                  {option.description && (
                    <p className="dc:text-xs text-dc-text-muted">{option.description}</p>
                  )}
                </div>
              )}

              {option.type === 'axisFormat' && (
                <AxisFormatControls
                  axisLabel={option.label}
                  value={(displayConfig[option.key as keyof ChartDisplayConfig] as AxisFormatConfig) || {}}
                  onChange={(config) =>
                    onDisplayConfigChange({
                      ...displayConfig,
                      [option.key]: Object.keys(config).length > 0 ? config : undefined
                    })
                  }
                />
              )}

              {option.type === 'stringArray' && (
                <StringArrayInput
                  label={option.label}
                  value={(displayConfig[option.key as keyof ChartDisplayConfig] as string[]) ?? []}
                  onChange={(arrayValue) =>
                    onDisplayConfigChange({
                      ...displayConfig,
                      [option.key]: arrayValue.length > 0 ? arrayValue : undefined
                    })
                  }
                  placeholder={option.placeholder}
                  description={option.description}
                />
              )}

              {option.type === 'buttonGroup' && (
                <div className="dc:space-y-1">
                  <label className="dc:text-sm text-dc-text-secondary">{option.label}</label>
                  <div className="dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden">
                    {option.options?.map((opt) => {
                      const isSelected = (displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue) === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            onDisplayConfigChange({
                              ...displayConfig,
                              [option.key]: opt.value
                            })
                          }
                          className={`dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                            isSelected
                              ? 'bg-dc-primary text-white'
                              : 'bg-dc-surface text-dc-text hover:bg-dc-border'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {option.description && (
                    <p className="dc:text-xs text-dc-text-muted">{option.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
