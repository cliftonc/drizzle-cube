import { describe, expect, it } from 'vitest'
import { humanizeName, makeUniqueName, quoteTsString, toCamelCase, toFileName, toPascalCase, toSafeIdentifier } from '../../../src/cli/dbt/naming.js'

describe('dbt naming helpers', () => {
  it('converts sql names deterministically', () => {
    expect(toCamelCase('customer_id')).toBe('customerId')
    expect(toCamelCase('Customer ID')).toBe('customerId')
    expect(toPascalCase('order-items')).toBe('OrderItems')
    expect(toFileName('Order Items')).toBe('order-items')
    expect(humanizeName('ordered_at')).toBe('Ordered At')
  })

  it('produces safe TypeScript identifiers', () => {
    expect(toSafeIdentifier('123 total', 'model')).toBe('model123Total')
    expect(toSafeIdentifier('__proto__', 'column')).toBe('columnProto')
    expect(toSafeIdentifier('constructor', 'column')).toBe('columnConstructor')
    expect(toSafeIdentifier('', 'model')).toBe('model')
  })

  it('deduplicates names and quotes strings', () => {
    const used = new Set<string>(['orders'])
    expect(makeUniqueName('orders', used)).toBe('orders2')
    expect(used.has('orders2')).toBe(true)
    expect(quoteTsString("Bob's \"Order\"")).toBe(JSON.stringify("Bob's \"Order\""))
  })
})
