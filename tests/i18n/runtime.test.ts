import { describe, it, expect, beforeEach } from 'vitest'
import { t, loadLocale, setTranslations, getLocale, getMessages, createTranslator } from '../../src/i18n/runtime'

describe('i18n runtime', () => {
  beforeEach(async () => {
    // Reset to default locale before each test
    await loadLocale('en-GB')
  })

  describe('t()', () => {
    it('returns translated string for valid key', () => {
      expect(t('analysis.modes.query.label')).toBe('Query')
    })

    it('returns the key itself for missing keys', () => {
      expect(t('nonexistent.key' as any)).toBe('nonexistent.key')
    })

    it('interpolates {var} parameters', () => {
      expect(t('server.errors.cubeNotFound', { cubeName: 'Orders' }))
        .toBe("Cube 'Orders' not found")
    })

    it('leaves unreplaced params as {name}', () => {
      expect(t('server.errors.cubeNotFound', {}))
        .toBe("Cube '{cubeName}' not found")
    })

    it('returns template without params when none provided', () => {
      expect(t('common.actions.save')).toBe('Save')
    })

    it('handles multiple interpolation params', () => {
      expect(t('server.errors.cubeRefUnresolved', {
        cubeName: 'Orders',
        joinName: 'products',
        targetCube: 'Products'
      })).toBe("Orders.joins.products: target cube 'Products' is not registered")
    })
  })

  describe('getLocale()', () => {
    it('defaults to en-GB', () => {
      expect(getLocale()).toBe('en-GB')
    })
  })

  describe('loadLocale()', () => {
    it('loads en-US and merges with en-GB defaults', async () => {
      await loadLocale('en-US')
      expect(getLocale()).toBe('en-US')
      // en-US override
      expect(t('analysis.modes.flow.description'))
        .toBe('Bidirectional path analysis with Sankey visualization')
      // Falls back to en-GB for keys not in en-US
      expect(t('common.actions.save')).toBe('Save')
    })

    it('treats "en" as en-GB', async () => {
      await loadLocale('en')
      expect(getLocale()).toBe('en-GB')
    })

    it('falls back to en-GB for unknown locale', async () => {
      await loadLocale('xx-UNKNOWN')
      expect(getLocale()).toBe('en-GB')
      expect(t('common.actions.save')).toBe('Save')
    })

    it('loads nl-NL translations', async () => {
      await loadLocale('nl-NL')
      expect(getLocale()).toBe('nl-NL')
      expect(t('common.actions.save')).toBe('Opslaan')
      expect(t('chart.runtime.noData')).toBe('Geen gegevens beschikbaar')
    })

    it('treats "nl" as nl-NL', async () => {
      await loadLocale('nl')
      expect(getLocale()).toBe('nl-NL')
      expect(t('common.actions.cancel')).toBe('Annuleren')
    })
  })

  describe('setTranslations()', () => {
    it('sets custom translations merged with en-GB defaults', () => {
      setTranslations('de', { 'common.actions.save': 'Speichern' } as any)
      expect(getLocale()).toBe('de')
      expect(t('common.actions.save')).toBe('Speichern')
      // Falls back to en-GB
      expect(t('common.actions.cancel')).toBe('Cancel')
    })
  })

  describe('getMessages()', () => {
    it('returns current messages object', () => {
      const msgs = getMessages()
      expect(msgs['common.actions.save']).toBe('Save')
    })
  })

  describe('createTranslator()', () => {
    it('creates namespace-scoped translator', () => {
      const tc = createTranslator('chart.bar')
      expect(tc('label')).toBe('Bar Chart')
      expect(tc('description')).toBe('Compare values across categories')
    })

    it('supports params in scoped translator', () => {
      const tc = createTranslator('server.errors')
      expect(tc('cubeNotFound', { cubeName: 'Users' }))
        .toBe("Cube 'Users' not found")
    })
  })

  describe('en-GB vs en-US spelling differences', () => {
    it('en-GB uses British spellings', async () => {
      await loadLocale('en-GB')
      expect(t('chart.area.description')).toContain('Emphasise')
      expect(t('chart.heatmap.description')).toContain('Visualise')
      expect(t('chart.option.bullColor.label')).toContain('Colour')
    })

    it('en-US uses American spellings', async () => {
      await loadLocale('en-US')
      expect(t('chart.area.description')).toContain('Emphasize')
      expect(t('chart.heatmap.description')).toContain('Visualize')
      expect(t('chart.option.bullColor.label')).toContain('Color')
    })
  })
})
