import type en from './locales/en.json'

/** Union of all valid translation keys, derived from the en.json source of truth */
export type TranslationKey = keyof typeof en

/** A partial translation dictionary for overrides or additional locales */
export type TranslationDictionary = Partial<Record<TranslationKey, string>>

/** Parameters for ICU interpolation */
export type TranslationParams = Record<string, unknown>
