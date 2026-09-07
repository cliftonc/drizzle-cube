import { ReactNode } from 'react';
import { TranslationKey, TranslationParams } from '../../i18n/types.js';
export interface I18nContextValue {
    t: (key: TranslationKey, params?: TranslationParams) => string;
    locale: string;
}
export declare const I18nContext: import('react').Context<I18nContextValue>;
interface I18nProviderProps {
    locale?: string;
    translations?: Record<string, string>;
    children: ReactNode;
}
/**
 * I18nProvider — loads the requested locale and optionally merges consumer overrides.
 * Wraps children with a React context providing `t()` and `locale`.
 */
export declare function I18nProvider({ locale, translations, children }: I18nProviderProps): import("react").JSX.Element;
export {};
