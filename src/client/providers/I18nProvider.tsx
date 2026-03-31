import { createContext, useEffect, useState, type ReactNode } from 'react'
import { loadLocale, setTranslations, getLocale, getMessages, t as globalT } from '../../i18n/runtime'
import type { TranslationKey, TranslationParams } from '../../i18n/types'

export interface I18nContextValue {
  t: (key: TranslationKey, params?: TranslationParams) => string
  locale: string
}

export const I18nContext = createContext<I18nContextValue>({
  t: globalT,
  locale: 'en-GB',
})

interface I18nProviderProps {
  locale?: string
  translations?: Record<string, string>
  children: ReactNode
}

/**
 * I18nProvider — loads the requested locale and optionally merges consumer overrides.
 * Wraps children with a React context providing `t()` and `locale`.
 */
export function I18nProvider({ locale = 'en-GB', translations, children }: I18nProviderProps) {
  const [ready, setReady] = useState(false)
  const [currentLocale, setCurrentLocale] = useState(getLocale())

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      await loadLocale(locale)
      if (translations && !cancelled) {
        // Merge consumer overrides on top of the loaded locale
        const merged = { ...getMessages(), ...translations }
        setTranslations(locale, merged)
      }
      if (!cancelled) {
        setCurrentLocale(getLocale())
        setReady(true)
      }
    }
    init()

    return () => { cancelled = true }
  }, [locale, translations])

  // Render children immediately with current translations — no loading spinner.
  // The default locale (en-GB) is statically bundled and always available.
  const value: I18nContextValue = {
    t: globalT,
    locale: ready ? currentLocale : locale,
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
