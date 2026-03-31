import { describe, expect, it } from 'vitest'
import en from '../../src/i18n/locales/en.json'
import enUS from '../../src/i18n/locales/en-US.json'
import nlNL from '../../src/i18n/locales/nl-NL.json'

describe('i18n locale coverage', () => {
  const enDict = en as Record<string, string>
  const enUSDict = enUS as Record<string, string>
  const nlDict = nlNL as Record<string, string>

  it('nl-NL has full key coverage of en', () => {
    const enKeys = Object.keys(enDict).sort()
    const nlKeys = Object.keys(nlDict).sort()

    expect(nlKeys).toEqual(enKeys)
  })

  it('en-US is a valid override subset of en', () => {
    const enKeys = new Set(Object.keys(enDict))
    const invalid = Object.keys(enUSDict).filter(key => !enKeys.has(key))

    expect(invalid).toEqual([])
  })

  it('nl-NL is not just an unchanged copy of en', () => {
    const total = Object.keys(enDict).length
    const unchanged = Object.keys(enDict).filter(key => enDict[key] === nlDict[key]).length

    expect(unchanged).toBeLessThan(Math.floor(total * 0.1))
  })
})
