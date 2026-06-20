import { describe, it, expect } from 'vitest'
import {
  toCamelCase,
  toPascalCase,
  toTitleCase,
  toCubeVar,
  toFileName
} from '../../../src/cli/dbt/naming'

describe('dbt naming helpers', () => {
  it('converts snake_case to camelCase', () => {
    expect(toCamelCase('customer_id')).toBe('customerId')
    expect(toCamelCase('organisation_id')).toBe('organisationId')
    expect(toCamelCase('id')).toBe('id')
    expect(toCamelCase('full_name')).toBe('fullName')
  })

  it('handles already-camel and Pascal input deterministically', () => {
    expect(toCamelCase('customerId')).toBe('customerId')
    expect(toCamelCase('CustomerID')).toBe('customerId')
  })

  it('converts to PascalCase for cube names', () => {
    expect(toPascalCase('orders')).toBe('Orders')
    expect(toPascalCase('order_items')).toBe('OrderItems')
  })

  it('converts to Title Case for titles', () => {
    expect(toTitleCase('customer_id')).toBe('Customer Id')
    expect(toTitleCase('orders')).toBe('Orders')
  })

  it('derives the cube const identifier', () => {
    expect(toCubeVar('Orders')).toBe('ordersCube')
    expect(toCubeVar('OrderItems')).toBe('orderItemsCube')
  })

  it('derives the file name', () => {
    expect(toFileName('order_items')).toBe('orderItems')
    expect(toFileName('orders')).toBe('orders')
  })
})
