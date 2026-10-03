/**
 * Row link construction and URL validation.
 *
 * The author writes the template, so the interesting attack surface is what a
 * *value* can do to it, plus the schemes and near-miss forms that must never
 * become a live link.
 */

import { describe, expect, it } from 'vitest'
import { buildRowUrl, isSafeUrl } from '../../../src/client/utils/rowLinkUtils'

const ORIGIN = 'https://dash.example.com'

const row = {
  'Employees.id': 42,
  'Employees.name': 'Ada Lovelace',
  'Employees.department': null
}

describe('buildRowUrl', () => {
  it('substitutes tokens from the row', () => {
    expect(buildRowUrl('/employees/{Employees.id}', row, ORIGIN)).toBe('/employees/42')
  })

  it('percent-encodes values', () => {
    expect(buildRowUrl('/search?q={Employees.name}', row, ORIGIN))
      .toBe('/search?q=Ada%20Lovelace')
  })

  it('reads hidden columns, which is the point of fetching them', () => {
    const hidden = { 'Employees.id': 7 }
    expect(buildRowUrl('/employees/{Employees.id}', hidden, ORIGIN)).toBe('/employees/7')
  })

  it('renders no link when a token has no value', () => {
    expect(buildRowUrl('/d/{Employees.department}', row, ORIGIN)).toBeNull()
    expect(buildRowUrl('/d/{Employees.missing}', row, ORIGIN)).toBeNull()
  })

  it('returns null for an empty or absent template', () => {
    expect(buildRowUrl(undefined, row, ORIGIN)).toBeNull()
    expect(buildRowUrl('', row, ORIGIN)).toBeNull()
  })

  it('allows an absolute http(s) link to another host', () => {
    expect(buildRowUrl('https://docs.example.org/{Employees.id}', row, ORIGIN))
      .toBe('https://docs.example.org/42')
  })

  it('rejects an unsafe template outright', () => {
    expect(buildRowUrl('javascript:alert(1)', row, ORIGIN)).toBeNull()
  })

  it('does not let a value escape into a scheme or a new host', () => {
    const hostile = { 'Employees.id': 'javascript:alert(1)', 'Employees.name': '//evil.example' }

    // Encoded, both stay inert path segments.
    expect(buildRowUrl('/e/{Employees.id}', hostile, ORIGIN))
      .toBe('/e/javascript%3Aalert(1)')
    expect(buildRowUrl('/e/{Employees.name}', hostile, ORIGIN))
      .toBe('/e/%2F%2Fevil.example')
  })
})

describe('isSafeUrl', () => {
  it.each([
    ['/employees/42', 'a same-origin path'],
    ['/employees/42?tab=1#top', 'a path with query and fragment'],
    ['employees/42', 'a relative path'],
    ['https://dash.example.com/x', 'an absolute URL on this origin'],
    ['http://other.example.org/x', 'an absolute http URL elsewhere'],
    ['https://other.example.org/x', 'an absolute https URL elsewhere']
  ])('accepts %s (%s)', (url) => {
    expect(isSafeUrl(url, ORIGIN)).toBe(true)
  })

  it.each([
    ['javascript:alert(1)', 'the javascript scheme'],
    ['JavaScript:alert(1)', 'the javascript scheme in mixed case'],
    ['  javascript:alert(1)  ', 'the javascript scheme behind whitespace'],
    ['java\tscript:alert(1)', 'the javascript scheme split by a control character'],
    ['data:text/html,<script>alert(1)</script>', 'a data URL'],
    ['vbscript:msgbox(1)', 'the vbscript scheme'],
    ['file:///etc/passwd', 'a file URL'],
    ['//evil.example/path', 'a protocol-relative URL'],
    ['\\\\evil.example\\path', 'a UNC-style backslash path'],
    ['/\\evil.example', 'a slash-backslash protocol-relative variant'],
    ['', 'an empty string'],
    ['   ', 'whitespace only']
  ])('rejects %s (%s)', (url) => {
    expect(isSafeUrl(url, ORIGIN)).toBe(false)
  })

  it('does not throw on malformed input', () => {
    expect(() => isSafeUrl('http://[', ORIGIN)).not.toThrow()
    expect(isSafeUrl('http://[', ORIGIN)).toBe(false)
  })
})
