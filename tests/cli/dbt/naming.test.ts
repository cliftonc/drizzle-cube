import { describe, expect, it } from 'vitest'
import { humanizeTitle, makeUniqueIdentifier, quoteStringLiteral, sanitizeIdentifier, toCamelCase, toKebabCase, toPascalCase } from '../../../src/cli/dbt/naming'

describe('dbt naming helpers', () => {
  it('normalizes snake, kebab, dotted, and spaced names', () => {
    expect(toCamelCase('orders.total_amount')).toBe('ordersTotalAmount')
    expect(toPascalCase('customer-orders')).toBe('CustomerOrders')
    expect(toKebabCase('Customer Orders.total_amount')).toBe('customer-orders-total-amount')
    expect(humanizeTitle('created_at')).toBe('Created At')
  })

  it('sanitizes reserved words and invalid identifiers', () => {
    expect(sanitizeIdentifier('123 name')).toBe('_123Name')
    expect(sanitizeIdentifier('class')).toBe('classValue')
    expect(quoteStringLiteral("O'Hare")).toBe("'O\\'Hare'")
  })

  it('returns deterministic unique identifiers and collision warnings', () => {
    const first = makeUniqueIdentifier('total amount', new Set(), 'measure')
    const second = makeUniqueIdentifier('total_amount', new Set([first.identifier]), 'measure')
    expect(first.identifier).toBe('totalAmount')
    expect(second.identifier).toBe('totalAmount2')
    expect(second.warning?.code).toBe('identifier_collision')
  })
})
