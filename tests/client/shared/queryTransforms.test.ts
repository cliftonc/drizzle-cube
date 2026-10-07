import { describe, it, expect } from 'vitest'
import { cleanQuery } from '../../../src/client/shared/queryTransforms'
import { cleanQueryForServer } from '../../../src/client/shared/utils'

describe('cleanQuery', () => {
  it('keeps total, so a server-paged records table learns its row count', () => {
    expect(cleanQuery({ dimensions: ['Employees.name'], limit: 25, total: true }))
      .toEqual({ dimensions: ['Employees.name'], limit: 25, total: true })
  })

  it('leaves total out when the query does not ask for it', () => {
    expect(cleanQuery({ dimensions: ['Employees.name'], limit: 25 }))
      .toEqual({ dimensions: ['Employees.name'], limit: 25 })
  })

  it('keeps ungrouped, so a records table lists rows instead of grouping them', () => {
    expect(cleanQuery({ dimensions: ['Employees.name'], ungrouped: true }))
      .toEqual({ dimensions: ['Employees.name'], ungrouped: true })
  })

  it('leaves ungrouped out when the query does not ask for it', () => {
    expect(cleanQuery({ dimensions: ['Employees.name'], ungrouped: false }))
      .toEqual({ dimensions: ['Employees.name'] })
  })
})

describe('cleanQueryForServer', () => {
  it('sends a server-paged records table query with its row count and row grain', () => {
    expect(cleanQueryForServer({
      dimensions: ['Employees.name'],
      ungrouped: true,
      limit: 25,
      offset: 75,
      total: true
    })).toEqual({
      dimensions: ['Employees.name'],
      ungrouped: true,
      limit: 25,
      offset: 75,
      total: true
    })
  })
})
