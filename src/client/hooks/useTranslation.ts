import { useContext, useCallback } from 'react'
import { I18nContext } from '../providers/I18nProvider'
import type { TranslationKey, TranslationParams } from '../../i18n/types'

/**
 * Hook to access translations within React components.
 *
 * @param namespace - Optional namespace prefix for scoped translations.
 *   When provided, keys are prefixed: `useTranslation('chart.bar')` →
 *   `t('label')` resolves to `chart.bar.label`.
 *
 * @example
 * ```tsx
 * const { t, locale } = useTranslation()
 * t('common.actions.save') // → "Save"
 *
 * const { t } = useTranslation('chart.bar')
 * t('label') // → "Bar Chart"
 * ```
 */
export function useTranslation(namespace?: string) {
  const { t: globalT, locale } = useContext(I18nContext)

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      return globalT(fullKey as TranslationKey, params)
    },
    [globalT, namespace]
  )

  return { t, locale }
}
