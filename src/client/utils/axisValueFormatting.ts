/**
 * Helpers for `formatAxisValue` — currency mapping, abbreviation, and
 * per-unit formatting. Split out of chartUtils to keep each unit small.
 */

import type { AxisFormatConfig } from '../types.js'

/**
 * Get the currency code for a given locale.
 * Maps common locales to their default currency.
 */
export function getCurrencyCodeForLocale(locale: string): string {
  // Extract language and region from locale (e.g., "en-US" -> ["en", "US"])
  const parts = locale.split('-')
  const region = parts[1]?.toUpperCase()

  // Map regions to currencies
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'CA': 'CAD',
    'GB': 'GBP',
    'UK': 'GBP',
    'AU': 'AUD',
    'NZ': 'NZD',
    'EU': 'EUR',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'IE': 'EUR',
    'PT': 'EUR',
    'FI': 'EUR',
    'JP': 'JPY',
    'CN': 'CNY',
    'KR': 'KRW',
    'IN': 'INR',
    'BR': 'BRL',
    'MX': 'MXN',
    'CH': 'CHF',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'RU': 'RUB',
    'ZA': 'ZAR',
    'SG': 'SGD',
    'HK': 'HKD',
    'TW': 'TWD',
    'TH': 'THB',
    'MY': 'MYR',
    'PH': 'PHP',
    'ID': 'IDR',
    'VN': 'VND',
    'AE': 'AED',
    'SA': 'SAR',
    'IL': 'ILS',
    'TR': 'TRY',
  }

  return currencyMap[region] || 'USD'
}

/**
 * Abbreviation result: the (possibly scaled) display value and its suffix.
 */
export interface AbbreviatedValue {
  displayValue: number
  abbreviationSuffix: string
}

/**
 * Scale a number to a K/M/B abbreviation when `abbreviate` is enabled.
 */
export function abbreviateValue(num: number, abbreviate: boolean): AbbreviatedValue {
  if (!abbreviate) {
    return { displayValue: num, abbreviationSuffix: '' }
  }

  const absNum = Math.abs(num)
  if (absNum >= 1_000_000_000) {
    return { displayValue: num / 1_000_000_000, abbreviationSuffix: 'B' }
  }
  if (absNum >= 1_000_000) {
    return { displayValue: num / 1_000_000, abbreviationSuffix: 'M' }
  }
  if (absNum >= 1_000) {
    return { displayValue: num / 1_000, abbreviationSuffix: 'K' }
  }
  return { displayValue: num, abbreviationSuffix: '' }
}

/**
 * Resolved formatting parameters shared by the per-unit formatters.
 */
export interface AxisFormatParams {
  displayValue: number
  abbreviate: boolean
  abbreviationSuffix: string
  decimals: number
  locale: string
  config: AxisFormatConfig
}

function formatCurrency(params: AxisFormatParams): string {
  const { displayValue, abbreviate, abbreviationSuffix, decimals, locale } = params
  // Currency code is determined by locale (USD for en-US, EUR for de-DE, etc.)
  const currencyCode = getCurrencyCodeForLocale(locale)

  if (abbreviate && abbreviationSuffix) {
    // For abbreviated currency, format the number part and add suffix
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(displayValue)
    // Insert abbreviation suffix before any trailing currency symbol or at end
    // Handle both "$1.25" -> "$1.25M" and "1.25 €" -> "1.25M €"
    const intlParts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(displayValue)
    const hasTrailingCurrency = intlParts[intlParts.length - 1]?.type === 'currency'
    if (hasTrailingCurrency) {
      // Currency symbol is at the end (e.g., "1.25 €")
      return formatted.replace(/(\s*[^\d\s]+)$/, abbreviationSuffix + '$1')
    }
    return formatted + abbreviationSuffix
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue)
}

function formatPercent(params: AxisFormatParams): string {
  const { displayValue, abbreviate, abbreviationSuffix, decimals, locale } = params
  // Format as percentage (multiply by 100 if value is 0-1 range, otherwise use as-is)
  // Assume values > 1 are already percentages, values <= 1 need multiplication
  const percentValue = Math.abs(displayValue) <= 1 && !abbreviate ? displayValue * 100 : displayValue
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentValue)
  return formatted + abbreviationSuffix + '%'
}

function formatCustom(params: AxisFormatParams): string {
  const { displayValue, abbreviationSuffix, decimals, locale, config } = params
  // Apply custom prefix/suffix
  const prefix = config.customPrefix || ''
  const suffix = config.customSuffix || ''
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue)
  return prefix + formatted + abbreviationSuffix + suffix
}

function formatNumber(params: AxisFormatParams): string {
  const { displayValue, abbreviationSuffix, decimals, locale } = params
  // Standard number formatting with locale-aware grouping
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue)
  return formatted + abbreviationSuffix
}

const unitFormatters: Record<string, (params: AxisFormatParams) => string> = {
  currency: formatCurrency,
  percent: formatPercent,
  custom: formatCustom,
  number: formatNumber,
}

/**
 * Format an abbreviated/scaled value according to its configured unit type.
 */
export function formatByUnit(params: AxisFormatParams): string {
  const formatter = params.config.unit ? unitFormatters[params.config.unit] : undefined
  return (formatter || formatNumber)(params)
}
