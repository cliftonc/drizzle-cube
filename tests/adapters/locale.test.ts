import { describe, it, expect } from 'vitest'
import {
  resolveRequestLocale,
  withLocaleInSecurityContext,
  DC_LOCALE_HEADER,
  DEFAULT_LOCALE,
} from '../../src/adapters/locale'

describe('resolveRequestLocale', () => {
  it('returns locale from x-dc-locale header', () => {
    const result = resolveRequestLocale((name) =>
      name === DC_LOCALE_HEADER ? 'nl-NL' : undefined
    )
    expect(result).toBe('nl-NL')
  })

  it('returns undefined when header is missing', () => {
    const result = resolveRequestLocale(() => undefined)
    expect(result).toBeUndefined()
  })

  it('returns undefined for null header', () => {
    const result = resolveRequestLocale(() => null)
    expect(result).toBeUndefined()
  })

  it('takes first value from array header', () => {
    const result = resolveRequestLocale((name) =>
      name === DC_LOCALE_HEADER ? ['fr-FR', 'en-GB'] : undefined
    )
    expect(result).toBe('fr-FR')
  })

  it('takes first token from comma-separated value', () => {
    const result = resolveRequestLocale((name) =>
      name === DC_LOCALE_HEADER ? 'de-DE, en-GB' : undefined
    )
    expect(result).toBe('de-DE')
  })

  it('rejects invalid BCP-47 values', () => {
    const result = resolveRequestLocale((name) =>
      name === DC_LOCALE_HEADER ? 'not a valid locale!' : undefined
    )
    expect(result).toBeUndefined()
  })

  it('rejects single character values', () => {
    const result = resolveRequestLocale((name) =>
      name === DC_LOCALE_HEADER ? 'x' : undefined
    )
    expect(result).toBeUndefined()
  })

  it('accepts simple two-letter codes', () => {
    const result = resolveRequestLocale((name) =>
      name === DC_LOCALE_HEADER ? 'en' : undefined
    )
    expect(result).toBe('en')
  })
})

describe('withLocaleInSecurityContext', () => {
  it('uses request locale when provided', () => {
    const ctx = withLocaleInSecurityContext({ orgId: '1' }, 'nl-NL')
    expect(ctx).toEqual({ orgId: '1', locale: 'nl-NL' })
  })

  it('uses existing locale from context when no request locale', () => {
    const ctx = withLocaleInSecurityContext({ orgId: '1', locale: 'fr-FR' })
    expect(ctx).toEqual({ orgId: '1', locale: 'fr-FR' })
  })

  it('falls back to default locale when neither provided', () => {
    const ctx = withLocaleInSecurityContext({ orgId: '1' })
    expect(ctx).toEqual({ orgId: '1', locale: DEFAULT_LOCALE })
  })

  it('request locale takes priority over context locale', () => {
    const ctx = withLocaleInSecurityContext({ orgId: '1', locale: 'fr-FR' }, 'de-DE')
    expect(ctx).toEqual({ orgId: '1', locale: 'de-DE' })
  })

  it('returns same context when locale already matches', () => {
    const original = { orgId: '1', locale: 'en-GB' }
    const ctx = withLocaleInSecurityContext(original, 'en-GB')
    expect(ctx).toBe(original)
  })

  it('handles null/undefined security context gracefully', () => {
    const ctx = withLocaleInSecurityContext(null as any, 'nl-NL')
    expect(ctx).toEqual({ locale: 'nl-NL' })
  })
})
