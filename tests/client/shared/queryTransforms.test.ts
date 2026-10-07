import { describe, it, expect } from 'vitest'
import { cleanQuery } from '../../../src/client/shared/queryTransforms'

describe('cleanQuery', () => {
  it('keeps total, so a server-paged records table learns its row count', () => {
    expect(cleanQuery({ dimensions: ['Employees.name'], limit: 25, total: true }))
      .toEqual({ dimensions: ['Employees.name'], limit: 25, total: true })
  })

  it('leaves total out when the query does not ask for it', () => {
    expect(cleanQuery({ dimensions: ['Employees.name'], limit: 25 }))
      .toEqual({ dimensions: ['Employees.name'], limit: 25 })
  })
})
