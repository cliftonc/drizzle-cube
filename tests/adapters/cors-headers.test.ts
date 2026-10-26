import { describe, it, expect } from 'vitest'
import { ensureClientRequestHeaders } from '../../src/adapters/cors-headers'

describe('ensureClientRequestHeaders', () => {
  it('adds the locale and cache headers to a header list', () => {
    const headers = ensureClientRequestHeaders(['Content-Type', 'Authorization'])
    expect(headers).toEqual([
      'Content-Type',
      'Authorization',
      'X-DC-Locale',
      'X-Cache-Max-Age',
      'X-Cache-Control'
    ])
  })

  it('does not duplicate a header already present, in any casing', () => {
    const headers = ensureClientRequestHeaders(['Content-Type', 'x-dc-locale', 'X-CACHE-MAX-AGE'])
    expect(headers).toEqual(['Content-Type', 'x-dc-locale', 'X-CACHE-MAX-AGE', 'X-Cache-Control'])
  })

  it('handles comma-separated string input', () => {
    const headers = ensureClientRequestHeaders('Content-Type, Authorization')
    expect(headers).toEqual([
      'Content-Type',
      'Authorization',
      'X-DC-Locale',
      'X-Cache-Max-Age',
      'X-Cache-Control'
    ])
  })

  it('handles empty input', () => {
    expect(ensureClientRequestHeaders()).toEqual(['X-DC-Locale', 'X-Cache-Max-Age', 'X-Cache-Control'])
  })
})
