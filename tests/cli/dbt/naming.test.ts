import { describe, expect, it } from 'vitest'
import {
  humanizeTitle,
  makeUniqueIdentifier,
  quoteStringLiteral,
  sanitizeIdentifier,
  toCamelCase,
  toKebabCase,
  toPascalCase,
} from '../../../src/cli/dbt/naming.js'

describe('naming', () => {
  describe('toCamelCase', () => {
    it('converts snake_case to lowerCamelCase', () => {
      expect(toCamelCase('customer_id')).toBe('customerId')
    })
    it('converts kebab-case to lowerCamelCase', () => {
      expect(toCamelCase('order-lines')).toBe('orderLines')
    })
    it('converts dotted names to lowerCamelCase', () => {
      expect(toCamelCase('orders.total')).toBe('ordersTotal')
    })
    it('handles names with spaces', () => {
      expect(toCamelCase('first name')).toBe('firstName')
    })
    it('returns empty string for empty input', () => {
      expect(toCamelCase('')).toBe('')
    })
  })

  describe('toPascalCase', () => {
    it('converts snake_case to PascalCase', () => {
      expect(toPascalCase('customer_id')).toBe('CustomerId')
    })
    it('converts kebab-case to PascalCase', () => {
      expect(toPascalCase('order_lines')).toBe('OrderLines')
    })
  })

  describe('toKebabCase', () => {
    it('converts snake_case to kebab-case', () => {
      expect(toKebabCase('order_lines')).toBe('order-lines')
    })
    it('lowercases PascalCase', () => {
      expect(toKebabCase('OrderLines')).toBe('order-lines')
    })
  })

  describe('humanizeTitle', () => {
    it('title-cases snake_case words', () => {
      // Non-acronym words are title-cased; acronyms are handled separately.
      expect(humanizeTitle('customer_name')).toBe('Customer Name')
    })
    it('uppercases acronym allowlist entries (id)', () => {
      expect(humanizeTitle('id')).toBe('ID')
    })
    it('uppercases url acronym', () => {
      expect(humanizeTitle('website_url')).toBe('Website URL')
    })
    it('title-cases from arbitrary casing', () => {
      expect(humanizeTitle('CREATED_AT')).toBe('Created At')
    })
  })

  describe('quoteStringLiteral', () => {
    it('doubles internal single quotes', () => {
      expect(quoteStringLiteral("o'reilly")).toBe("o''reilly")
    })
    it('leaves quotes-free strings untouched', () => {
      expect(quoteStringLiteral('orders')).toBe('orders')
    })
  })

  describe('sanitizeIdentifier', () => {
    it('strips non-identifier characters', () => {
      expect(sanitizeIdentifier('order-total!')).toBe('ordertotal')
    })
    it('prefixes names starting with a digit', () => {
      expect(sanitizeIdentifier('1st_order')).toBe('_1st_order')
    })
    it('suffixes reserved TypeScript keywords', () => {
      expect(sanitizeIdentifier('class')).toBe('class_')
      expect(sanitizeIdentifier('return')).toBe('return_')
    })
    it('returns _ for empty/invalid input', () => {
      expect(sanitizeIdentifier('')).toBe('_')
      expect(sanitizeIdentifier('!!!')).toBe('_')
    })
  })

  describe('makeUniqueIdentifier', () => {
    it('returns the base when unused', () => {
      const used = new Set<string>()
      expect(makeUniqueIdentifier('orders', used)).toBe('orders')
      expect(used.has('orders')).toBe(true)
    })
    it('suffixes with a counter on collision', () => {
      const used = new Set<string>(['orders'])
      expect(makeUniqueIdentifier('orders', used)).toBe('orders2')
      expect(used.has('orders2')).toBe(true)
    })
    it('increments counter until a free name is found', () => {
      const used = new Set<string>(['orders', 'orders2', 'orders3'])
      expect(makeUniqueIdentifier('orders', used)).toBe('orders4')
    })
  })
})
