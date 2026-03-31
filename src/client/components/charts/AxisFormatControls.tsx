/**
 * AxisFormatControls Component
 *
 * A reusable component for configuring axis number formatting.
 * Provides controls for unit type, abbreviation, decimal places, and custom labels.
 */

import { useMemo } from 'react'
import { t } from '../../../i18n/runtime'
import SectionHeading from '../AnalysisBuilder/SectionHeading'
import type { AxisFormatConfig } from '../../types'
import { formatAxisValue } from '../../utils/chartUtils'

interface AxisFormatControlsProps {
  value: AxisFormatConfig
  onChange: (config: AxisFormatConfig) => void
  axisLabel: string // "X-Axis", "Left Y-Axis", "Right Y-Axis"
  /** Sample value for preview (default: 1250000) */
  previewValue?: number
}

/**
 * Get the currency symbol for the user's locale
 */
function getLocaleCurrencySymbol(): string {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
  // Format a number as currency and extract just the symbol
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: getCurrencyCodeForLocale(locale),
    currencyDisplay: 'narrowSymbol'
  }).format(0)
  // Extract the currency symbol (remove digits, spaces, and common separators)
  return formatted.replace(/[\d.,\s]/g, '').trim() || '$'
}

/**
 * Get the currency code for a given locale (duplicated from chartUtils for component isolation)
 */
function getCurrencyCodeForLocale(locale: string): string {
  const parts = locale.split('-')
  const region = parts[1]?.toUpperCase()
  const currencyMap: Record<string, string> = {
    'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'UK': 'GBP', 'AU': 'AUD', 'NZ': 'NZD',
    'EU': 'EUR', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
    'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'FI': 'EUR',
    'JP': 'JPY', 'CN': 'CNY', 'KR': 'KRW', 'IN': 'INR', 'BR': 'BRL', 'MX': 'MXN',
    'CH': 'CHF', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'PL': 'PLN', 'RU': 'RUB',
    'ZA': 'ZAR', 'SG': 'SGD', 'HK': 'HKD', 'TW': 'TWD', 'TH': 'THB', 'MY': 'MYR',
    'PH': 'PHP', 'ID': 'IDR', 'VN': 'VND', 'AE': 'AED', 'SA': 'SAR', 'IL': 'ILS', 'TR': 'TRY',
  }
  return currencyMap[region] || 'USD'
}

/**
 * Single axis format control section
 */
export function AxisFormatControls({
  value,
  onChange,
  axisLabel,
  previewValue = 1250000
}: AxisFormatControlsProps) {
  const config = useMemo(() => value || {}, [value])

  // Get locale-aware currency symbol for the button
  const currencySymbol = useMemo(() => getLocaleCurrencySymbol(), [])

  // Generate preview of formatted value
  const preview = useMemo(() => {
    return formatAxisValue(previewValue, config)
  }, [previewValue, config])

  const handleChange = (updates: Partial<AxisFormatConfig>) => {
    onChange({ ...config, ...updates })
  }

  const unitButtons: Array<{ value: AxisFormatConfig['unit']; label: string }> = [
    { value: 'currency', label: currencySymbol },
    { value: 'percent', label: '%' },
    { value: 'number', label: '#' },
    { value: 'custom', label: t('chart.runtime.axisFormat.custom') }
  ]

  return (
    <div className="dc:space-y-3 dc:pb-4">
      {/* Axis Header */}
      <SectionHeading>{axisLabel}</SectionHeading>

      {/* Label Input */}
      <div className="dc:space-y-1">
        <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.label')}</label>
        <input
          type="text"
          value={config.label || ''}
          onChange={(e) => handleChange({ label: e.target.value || undefined })}
          placeholder={t('chart.runtime.axisFormat.autoLabel')}
          className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
        />
      </div>

      {/* Unit Type */}
      <div className="dc:space-y-1">
        <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.unit')}</label>
        <div className="dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden">
          {unitButtons.map((btn) => (
            <button
              key={btn.value}
              type="button"
              onClick={() => handleChange({ unit: btn.value })}
              className={`dc:flex-1 dc:px-2 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                config.unit === btn.value
                  ? 'bg-dc-primary text-white'
                  : 'bg-dc-surface text-dc-text hover:bg-dc-border'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prefix/Suffix (only when Custom is selected) */}
      {config.unit === 'custom' && (
        <div className="dc:flex dc:gap-2">
          <div className="dc:flex-1 dc:space-y-1">
            <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.prefix')}</label>
            <input
              type="text"
              value={config.customPrefix || ''}
              onChange={(e) => handleChange({ customPrefix: e.target.value || undefined })}
              placeholder={t('chart.runtime.axisFormat.prefixExample')}
              className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
            />
          </div>
          <div className="dc:flex-1 dc:space-y-1">
            <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.suffix')}</label>
            <input
              type="text"
              value={config.customSuffix || ''}
              onChange={(e) => handleChange({ customSuffix: e.target.value || undefined })}
              placeholder={t('chart.runtime.axisFormat.suffixExample')}
              className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
            />
          </div>
        </div>
      )}

      {/* Abbreviation Toggle */}
      <div className="dc:space-y-1">
        <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.abbreviation')}</label>
        <div className="dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden">
          <button
            type="button"
            onClick={() => handleChange({ abbreviate: true })}
            className={`dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
              config.abbreviate !== false
                ? 'bg-dc-primary text-white'
                : 'bg-dc-surface text-dc-text hover:bg-dc-border'
            }`}
          >
            {t('chart.runtime.axisFormat.yes')}
          </button>
          <button
            type="button"
            onClick={() => handleChange({ abbreviate: false })}
            className={`dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
              config.abbreviate === false
                ? 'bg-dc-primary text-white'
                : 'bg-dc-surface text-dc-text hover:bg-dc-border'
            }`}
          >
            {t('chart.runtime.axisFormat.no')}
          </button>
        </div>
      </div>

      {/* Decimals */}
      <div className="dc:space-y-1">
        <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.decimals')}</label>
        <div className="dc:flex dc:gap-2">
          <button
            type="button"
            onClick={() => {
              const current = config.decimals ?? 2
              if (current > 0) handleChange({ decimals: current - 1 })
            }}
            disabled={(config.decimals ?? 2) <= 0}
            className="dc:flex-1 dc:px-3 dc:py-2 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text hover:bg-dc-border dc:disabled:opacity-40 dc:disabled:cursor-not-allowed dc:transition-colors"
          >
            ← .0
          </button>
          <button
            type="button"
            onClick={() => {
              const current = config.decimals ?? 2
              if (current < 4) handleChange({ decimals: current + 1 })
            }}
            disabled={(config.decimals ?? 2) >= 4}
            className="dc:flex-1 dc:px-3 dc:py-2 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text hover:bg-dc-border dc:disabled:opacity-40 dc:disabled:cursor-not-allowed dc:transition-colors"
          >
            .00 →
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="dc:space-y-1">
        <label className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.axisFormat.preview')}</label>
        <div className="dc:text-sm dc:font-mono text-dc-text">
          {preview}
        </div>
      </div>
    </div>
  )
}

interface MultiAxisFormatControlsProps {
  displayConfig: {
    xAxisFormat?: AxisFormatConfig
    leftYAxisFormat?: AxisFormatConfig
    rightYAxisFormat?: AxisFormatConfig
  }
  onChange: (updates: {
    xAxisFormat?: AxisFormatConfig
    leftYAxisFormat?: AxisFormatConfig
    rightYAxisFormat?: AxisFormatConfig
  }) => void
  /** Which axes to show controls for */
  showAxes?: {
    xAxis?: boolean
    leftYAxis?: boolean
    rightYAxis?: boolean
  }
}

/**
 * Container component for multiple axis format controls
 */
export function MultiAxisFormatControls({
  displayConfig,
  onChange,
  showAxes = { leftYAxis: true, rightYAxis: true }
}: MultiAxisFormatControlsProps) {
  return (
    <div className="dc:space-y-4">
      {showAxes.leftYAxis && (
        <AxisFormatControls
          axisLabel={t('chart.runtime.axisFormat.leftYAxis')}
          value={displayConfig.leftYAxisFormat || {}}
          onChange={(config) =>
            onChange({
              ...displayConfig,
              leftYAxisFormat: Object.keys(config).length > 0 ? config : undefined
            })
          }
        />
      )}

      {showAxes.rightYAxis && (
        <AxisFormatControls
          axisLabel={t('chart.runtime.axisFormat.rightYAxis')}
          value={displayConfig.rightYAxisFormat || {}}
          onChange={(config) =>
            onChange({
              ...displayConfig,
              rightYAxisFormat: Object.keys(config).length > 0 ? config : undefined
            })
          }
        />
      )}

      {showAxes.xAxis && (
        <AxisFormatControls
          axisLabel={t('chart.runtime.axisFormat.xAxis')}
          value={displayConfig.xAxisFormat || {}}
          onChange={(config) =>
            onChange({
              ...displayConfig,
              xAxisFormat: Object.keys(config).length > 0 ? config : undefined
            })
          }
          previewValue={2024} // Use a year-like number for X-axis preview
        />
      )}
    </div>
  )
}

export default AxisFormatControls
