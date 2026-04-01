import en from './locales/en.json'
import type { TranslationKey, TranslationParams } from './types'

let currentLocale = 'en-GB'
let messages: Record<string, string> = en

/**
 * Translate a key, optionally interpolating ICU {var} parameters.
 * Returns the key path itself if no translation is found (debuggable).
 */
export function t(key: TranslationKey, params?: TranslationParams): string {
  const template = messages[key as string]
  if (!template) return key
  if (!params) return template
  // Simple ICU {var} interpolation — sufficient for Phase 1.
  // For plurals/gender, upgrade to Intl.MessageFormat later.
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const val = params[name]
    return val !== undefined ? String(val) : `{${name}}`
  })
}

/**
 * Load a locale dynamically. Each locale JSON becomes a separate chunk
 * via dynamic import() — only the active locale is fetched at runtime.
 * Falls back silently to en-GB if the locale file doesn't exist.
 */
export async function loadLocale(locale: string): Promise<void> {
  if (locale === 'nl') {
    locale = 'nl-NL'
  }
  if (locale === 'en-GB' || locale === 'en') {
    currentLocale = 'en-GB'
    messages = en
    return
  }
  try {
    const dict = await import(`./locales/${locale}.json`)
    currentLocale = locale
    messages = { ...en, ...dict.default }
  } catch {
    if (typeof console !== 'undefined') {
      console.warn(`[drizzle-cube] Failed to load locale "${locale}", falling back to en-GB`)
    }
    currentLocale = 'en-GB'
    messages = en
  }
}

/**
 * Set translations directly — for consumer-provided overrides or
 * fully custom locales not shipped with drizzle-cube.
 */
export function setTranslations(locale: string, dict: Record<string, string>): void {
  currentLocale = locale
  messages = { ...en, ...dict }
}

/** Get the current active locale string */
export function getLocale(): string {
  return currentLocale
}

/** Get the current merged messages (for React context) */
export function getMessages(): Record<string, string> {
  return messages
}

/**
 * Create a namespace-scoped translator. Keys are prefix-filtered:
 * `createTranslator('chart.bar')` → `t('label')` resolves to `chart.bar.label`
 */
export function createTranslator(ns: string) {
  return (key: string, params?: TranslationParams): string =>
    t(`${ns}.${key}` as TranslationKey, params)
}
