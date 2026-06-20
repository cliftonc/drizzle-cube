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

describe('naming helpers', () => {
  describe('toCamelCase', () => {
    it('converts snake_case', () => {
      expect(toCamelCase('customer_id')).toBe('customerId')
    })
    it('converts kebab-case', () => {
      expect(toCamelCase('order-lines')).toBe('orderLines')
    })
    it('converts dotted names', () => {
      expect(toCamelCase('orders.total')).toBe('ordersTotal')
    })
    it('converts PascalCase boundaries', () => {
      expect(toCamelCase('OrderLines')).toBe('orderLines')
    })
  })

  describe('toPascalCase', () => {
    it('converts snake_case', () => {
      expect(toPascalCase('customer_id')).toBe('CustomerId')
    })
    it('converts kebab-case', () => {
      expect(toPascalCase('order-lines')).toBe('OrderLines')
    })
  })

  describe('toKebabCase', () => {
    it('is used for file names', () => {
      expect(toKebabCase('order_lines')).toBe('order-lines')
    })
    it('handles camelCase', () => {
      expect(toKebabCase('orderLines')).toBe('order-lines')
    })
  })

  describe('humanizeTitle', () => {
    it('uppercases acronym tokens', () => {
      expect(humanizeTitle('customer_id')).toBe('Customer ID')
    })
    it('uppercases SKU', () => {
      expect(humanizeTitle('sku')).toBe('SKU')
    })
    it('title-cases regular words', () => {
      expect(humanizeTitle('created_at')).toBe('Created At')
    })
    it('is case-agnostic', () => {
      expect(humanizeTitle('CustomerID')).toBe('Customer ID')
    })
  })

  describe('sanitizeIdentifier', () => {
    it('strips non-word characters', () => {
      expect(sanitizeIdentifier('order-id')).toBe('orderid')
    })
    it('prefixes leading digits', () => {
      expect(sanitizeIdentifier('123abc')).toBe('_123abc')
    })
    it('appends underscore to reserved keywords', () => {
      expect(sanitizeIdentifier('class')).toBe('class_')
    })
    it('returns underscore for empty input', () => {
      expect(sanitizeIdentifier('')).toBe('_')
    })
  })

  describe('makeUniqueIdentifier', () => {
    it('returns base when unused', () => {
      const used = new Set<string>()
      expect(makeUniqueIdentifier('orders', used)).toBe('orders')
      expect(used.has('orders')).toBe(true)
    })
    it('suffixes a numeric counter on collision', () => {
      const used = new Set<string>(['orders'])
      expect(makeUniqueIdentifier('orders', used)).toBe('orders1')
      expect(used.has('orders1')).toBe(true)
    })
  })

  describe('quoteStringLiteral', () => {
    it('doubles internal single quotes', () => {
      expect(quoteStringLiteral("o'reilly")).toBe("'o''reilly'")
    })
  })
})
