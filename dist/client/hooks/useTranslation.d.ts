import { TranslationParams } from '../../i18n/types.js';
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
export declare function useTranslation(namespace?: string): {
    t: (key: string, params?: TranslationParams) => string;
    locale: string;
};
