/**
 * Currency formatting: an explicit per-column ISO code overrides the code
 * derived from the viewer's locale, so a GBP column does not render as $ for a
 * US viewer.
 */

import { describe, expect, it } from 'vitest'
import { formatAxisValue } from '../../../src/client/utils/chartUtils'

describe('formatAxisValue — currency', () => {
  it('derives the currency from the locale when no code is set', () => {
    expect(formatAxisValue(1500, { unit: 'currency', abbreviate: false, decimals: 0 }, 'en-US'))
      .toContain('$')
  })

  it('honours an explicit currency code over the locale', () => {
    const formatted = formatAxisValue(1500, { unit: 'currency', currencyCode: 'GBP', abbreviate: false, decimals: 0 }, 'en-US')
    expect(formatted).toContain('£')
    expect(formatted).not.toContain('$')
  })

  it('lower-cases codes are accepted', () => {
    expect(formatAxisValue(1500, { unit: 'currency', currencyCode: 'eur', abbreviate: false, decimals: 0 }, 'en-US'))
      .toContain('€')
  })

  it('falls back to the locale for a half-typed code rather than throwing', () => {
    // Intl.NumberFormat raises RangeError for anything that is not 3 letters,
    // which would take the whole chart down mid-keystroke.
    expect(() => formatAxisValue(1500, { unit: 'currency', currencyCode: 'G', abbreviate: false, decimals: 0 }, 'en-US'))
      .not.toThrow()
    expect(formatAxisValue(1500, { unit: 'currency', currencyCode: 'G', abbreviate: false, decimals: 0 }, 'en-US'))
      .toContain('$')
  })

  it('applies the explicit code to abbreviated values too', () => {
    expect(formatAxisValue(1_250_000, { unit: 'currency', currencyCode: 'GBP', abbreviate: true, decimals: 1 }, 'en-US'))
      .toContain('£')
  })
})
