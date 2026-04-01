import { describe, expect, it } from 'vitest'
import en from '../../src/i18n/locales/en.json'
import enUS from '../../src/i18n/locales/en-US.json'
import nlNL from '../../src/i18n/locales/nl-NL.json'
import { chartConfigRegistry } from '../../src/client/charts/chartConfigRegistry'

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

describe('chart config translation keys exist in en.json', () => {
  const enKeys = new Set(Object.keys(en as Record<string, string>))

  function assertKeyExists(key: string | undefined, context: string) {
    if (key && key.includes('.')) {
      expect(enKeys.has(key), `Missing key "${key}" (${context})`).toBe(true)
    }
  }

  for (const [chartType, config] of Object.entries(chartConfigRegistry)) {
    it(`${chartType} config keys all exist`, () => {
      assertKeyExists(config.label, `${chartType}.label`)
      assertKeyExists(config.description, `${chartType}.description`)
      assertKeyExists(config.useCase, `${chartType}.useCase`)

      for (const zone of config.dropZones) {
        assertKeyExists(zone.label, `${chartType}.dropZone.${zone.key}.label`)
        assertKeyExists(zone.description, `${chartType}.dropZone.${zone.key}.description`)
        assertKeyExists(zone.emptyText, `${chartType}.dropZone.${zone.key}.emptyText`)
      }

      for (const opt of config.displayOptionsConfig ?? []) {
        assertKeyExists(opt.label, `${chartType}.displayOption.${opt.key}.label`)
        assertKeyExists(opt.description, `${chartType}.displayOption.${opt.key}.description`)
        for (const o of opt.options ?? []) {
          assertKeyExists(o.label, `${chartType}.displayOption.${opt.key}.option.${o.value}`)
        }
      }
    })
  }
})
