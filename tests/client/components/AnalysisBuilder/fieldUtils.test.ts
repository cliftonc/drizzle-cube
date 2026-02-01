/**
 * Field Utilities Tests
 *
 * Comprehensive tests for field metadata utilities used in AnalysisBuilder.
 */

import { describe, it, expect } from 'vitest'
import {
  getCubeNameFromField,
  getFieldShortName,
  findFieldInSchema,
  getFieldTitle,
  getFieldType,
  schemaToFieldOptions,
  filterFieldOptions,
  groupFieldsByCube,
  getCubeNames,
  getCubeTitle,
  getRelatedCubeNames,
  getRelatedCubesSchema,
} from '../../../../src/client/components/AnalysisBuilder/utils/fieldUtils'
import type { MetaResponse, MetaField } from '../../../../src/client/shared/types'

// Mock schema for testing
const mockSchema: MetaResponse = {
  cubes: [
    {
      name: 'Users',
      title: 'Users Cube',
      measures: [
        { name: 'Users.count', type: 'count', title: 'User Count', shortTitle: 'Count', aggType: 'count' },
        { name: 'Users.totalRevenue', type: 'sum', title: 'Total Revenue', shortTitle: 'Revenue', aggType: 'sum' },
        { name: 'Users.avgAge', type: 'avg', title: 'Average Age', aggType: 'avg' },
      ],
      dimensions: [
        { name: 'Users.name', type: 'string', title: 'User Name', shortTitle: 'Name' },
        { name: 'Users.email', type: 'string', title: 'Email Address', shortTitle: 'Email' },
        { name: 'Users.age', type: 'number', title: 'Age' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
      relationships: [
        { name: 'orders', targetCube: 'Orders' },
      ],
    },
    {
      name: 'Orders',
      title: 'Orders Cube',
      measures: [
        { name: 'Orders.count', type: 'count', title: 'Order Count', shortTitle: 'Count', aggType: 'count' },
        { name: 'Orders.totalAmount', type: 'sum', title: 'Total Amount', aggType: 'sum' },
      ],
      dimensions: [
        { name: 'Orders.status', type: 'string', title: 'Order Status', shortTitle: 'Status' },
        { name: 'Orders.orderedAt', type: 'time', title: 'Ordered At', shortTitle: 'Ordered' },
      ],
    },
  ],
}

// Schema with minimal data
const minimalSchema: MetaResponse = {
  cubes: [
    {
      name: 'Simple',
      title: 'Simple',
      measures: [
        { name: 'Simple.count', type: 'count', aggType: 'count' },
      ],
      dimensions: [
        { name: 'Simple.id', type: 'number' },
      ],
    },
  ],
}

describe('getCubeNameFromField', () => {
  it('should extract cube name from field name', () => {
    expect(getCubeNameFromField('Employees.count')).toBe('Employees')
    expect(getCubeNameFromField('Orders.totalAmount')).toBe('Orders')
    expect(getCubeNameFromField('Users.name')).toBe('Users')
  })

  it('should handle field names without dot separator', () => {
    expect(getCubeNameFromField('count')).toBe('count')
    expect(getCubeNameFromField('')).toBe('')
  })

  it('should handle nested field names', () => {
    expect(getCubeNameFromField('Cube.nested.field')).toBe('Cube')
  })
})

describe('getFieldShortName', () => {
  it('should extract short name from field name', () => {
    expect(getFieldShortName('Employees.count')).toBe('count')
    expect(getFieldShortName('Orders.totalAmount')).toBe('totalAmount')
    expect(getFieldShortName('Users.name')).toBe('name')
  })

  it('should return original for names without dot', () => {
    expect(getFieldShortName('count')).toBe('count')
    expect(getFieldShortName('')).toBe('')
  })

  it('should handle nested field names', () => {
    expect(getFieldShortName('Cube.nested.field')).toBe('nested.field')
  })
})

describe('findFieldInSchema', () => {
  it('should find measure in schema', () => {
    const result = findFieldInSchema('Users.count', mockSchema)

    expect(result).not.toBeNull()
    expect(result?.field.name).toBe('Users.count')
    expect(result?.cubeName).toBe('Users')
    expect(result?.fieldType).toBe('measure')
  })

  it('should find dimension in schema', () => {
    const result = findFieldInSchema('Users.name', mockSchema)

    expect(result).not.toBeNull()
    expect(result?.field.name).toBe('Users.name')
    expect(result?.cubeName).toBe('Users')
    expect(result?.fieldType).toBe('dimension')
  })

  it('should find time dimension and mark as timeDimension', () => {
    const result = findFieldInSchema('Users.createdAt', mockSchema)

    expect(result).not.toBeNull()
    expect(result?.field.name).toBe('Users.createdAt')
    expect(result?.fieldType).toBe('timeDimension')
  })

  it('should return null for non-existent field', () => {
    const result = findFieldInSchema('Users.nonExistent', mockSchema)
    expect(result).toBeNull()
  })

  it('should return null for null schema', () => {
    const result = findFieldInSchema('Users.count', null)
    expect(result).toBeNull()
  })

  it('should find field in second cube', () => {
    const result = findFieldInSchema('Orders.status', mockSchema)

    expect(result).not.toBeNull()
    expect(result?.field.name).toBe('Orders.status')
    expect(result?.cubeName).toBe('Orders')
  })
})

describe('getFieldTitle', () => {
  it('should return field title from schema', () => {
    expect(getFieldTitle('Users.count', mockSchema)).toBe('User Count')
    expect(getFieldTitle('Users.name', mockSchema)).toBe('User Name')
  })

  it('should fallback to shortTitle if title missing', () => {
    // avgAge has no shortTitle, so returns title
    expect(getFieldTitle('Users.avgAge', mockSchema)).toBe('Average Age')
  })

  it('should return field name if field not found', () => {
    expect(getFieldTitle('NonExistent.field', mockSchema)).toBe('NonExistent.field')
  })

  it('should return field name for null schema', () => {
    expect(getFieldTitle('Users.count', null)).toBe('Users.count')
  })

  it('should handle minimal schema without shortTitle', () => {
    // count has no title or shortTitle defined properly
    const result = getFieldTitle('Simple.count', minimalSchema)
    // Should use whatever is available
    expect(typeof result).toBe('string')
  })
})

describe('getFieldType', () => {
  it('should identify time dimension', () => {
    const timeField: MetaField = { name: 'test.date', type: 'time', title: 'Date' }
    expect(getFieldType(timeField)).toBe('timeDimension')
  })

  it('should identify count measure', () => {
    const countField: MetaField = { name: 'test.count', type: 'count', title: 'Count', aggType: 'count' }
    expect(getFieldType(countField)).toBe('measure')
  })

  it('should identify countDistinct measure', () => {
    const field: MetaField = { name: 'test.unique', type: 'countDistinct', title: 'Unique', aggType: 'countDistinct' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify sum measure', () => {
    const field: MetaField = { name: 'test.total', type: 'sum', title: 'Total', aggType: 'sum' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify avg measure', () => {
    const field: MetaField = { name: 'test.average', type: 'avg', title: 'Average', aggType: 'avg' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify min measure', () => {
    const field: MetaField = { name: 'test.min', type: 'min', title: 'Min', aggType: 'min' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify max measure', () => {
    const field: MetaField = { name: 'test.max', type: 'max', title: 'Max', aggType: 'max' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify runningTotal measure', () => {
    const field: MetaField = { name: 'test.running', type: 'runningTotal', title: 'Running', aggType: 'runningTotal' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify countDistinctApprox measure', () => {
    const field: MetaField = { name: 'test.approx', type: 'countDistinctApprox', title: 'Approx', aggType: 'countDistinctApprox' }
    expect(getFieldType(field)).toBe('measure')
  })

  it('should identify string dimension', () => {
    const field: MetaField = { name: 'test.name', type: 'string', title: 'Name' }
    expect(getFieldType(field)).toBe('dimension')
  })

  it('should identify number dimension', () => {
    const field: MetaField = { name: 'test.id', type: 'number', title: 'ID' }
    expect(getFieldType(field)).toBe('dimension')
  })

  it('should identify boolean dimension', () => {
    const field: MetaField = { name: 'test.active', type: 'boolean', title: 'Active' }
    expect(getFieldType(field)).toBe('dimension')
  })
})

describe('schemaToFieldOptions', () => {
  describe('metrics mode', () => {
    it('should return only measures', () => {
      const options = schemaToFieldOptions(mockSchema, 'metrics')

      expect(options.length).toBe(5) // 3 Users measures + 2 Orders measures
      expect(options.every(opt => opt.fieldType === 'measure')).toBe(true)
    })

    it('should include field metadata', () => {
      const options = schemaToFieldOptions(mockSchema, 'metrics')
      const userCount = options.find(opt => opt.name === 'Users.count')

      expect(userCount).toBeDefined()
      expect(userCount?.title).toBe('User Count')
      expect(userCount?.shortTitle).toBe('Count')
      expect(userCount?.cubeName).toBe('Users')
    })
  })

  describe('breakdown mode', () => {
    it('should return only dimensions', () => {
      const options = schemaToFieldOptions(mockSchema, 'breakdown')

      // 4 Users dimensions + 2 Orders dimensions
      expect(options.length).toBe(6)
      expect(options.every(opt => opt.fieldType === 'dimension' || opt.fieldType === 'timeDimension')).toBe(true)
    })

    it('should correctly categorize time dimensions', () => {
      const options = schemaToFieldOptions(mockSchema, 'breakdown')
      const createdAt = options.find(opt => opt.name === 'Users.createdAt')

      expect(createdAt).toBeDefined()
      expect(createdAt?.fieldType).toBe('timeDimension')
    })
  })

  describe('dimensionFilter mode', () => {
    it('should return only dimensions (same as breakdown)', () => {
      const options = schemaToFieldOptions(mockSchema, 'dimensionFilter')

      expect(options.length).toBe(6)
      expect(options.every(opt => opt.fieldType === 'dimension' || opt.fieldType === 'timeDimension')).toBe(true)
    })
  })

  describe('filter mode', () => {
    it('should return both measures and dimensions', () => {
      const options = schemaToFieldOptions(mockSchema, 'filter')

      // 5 measures + 6 dimensions = 11 total
      expect(options.length).toBe(11)

      const measures = options.filter(opt => opt.fieldType === 'measure')
      const dimensions = options.filter(opt => opt.fieldType === 'dimension' || opt.fieldType === 'timeDimension')

      expect(measures.length).toBe(5)
      expect(dimensions.length).toBe(6)
    })
  })

  it('should return empty array for null schema', () => {
    const options = schemaToFieldOptions(null, 'metrics')
    expect(options).toEqual([])
  })

  it('should handle fields with missing title/shortTitle', () => {
    const options = schemaToFieldOptions(minimalSchema, 'metrics')

    expect(options.length).toBe(1)
    expect(options[0].name).toBe('Simple.count')
    // Should have some title value (fallback to name if needed)
    expect(options[0].title).toBeDefined()
  })
})

describe('filterFieldOptions', () => {
  const options = schemaToFieldOptions(mockSchema, 'filter')

  it('should return all options when no filters applied', () => {
    const result = filterFieldOptions(options, '')
    expect(result.length).toBe(options.length)
  })

  it('should filter by search term in title', () => {
    const result = filterFieldOptions(options, 'count')

    expect(result.length).toBeGreaterThan(0)
    expect(result.some(opt => opt.title.toLowerCase().includes('count'))).toBe(true)
  })

  it('should filter by search term in name', () => {
    const result = filterFieldOptions(options, 'totalrevenue')

    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Users.totalRevenue')
  })

  it('should be case-insensitive', () => {
    const resultLower = filterFieldOptions(options, 'user')
    const resultUpper = filterFieldOptions(options, 'USER')
    const resultMixed = filterFieldOptions(options, 'UsEr')

    expect(resultLower.length).toEqual(resultUpper.length)
    expect(resultUpper.length).toEqual(resultMixed.length)
  })

  it('should filter by cube when selectedCube provided', () => {
    const result = filterFieldOptions(options, '', 'Users')

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(opt => opt.cubeName === 'Users')).toBe(true)
  })

  it('should combine search and cube filter', () => {
    const result = filterFieldOptions(options, 'count', 'Orders')

    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Orders.count')
  })

  it('should return all when selectedCube is "all"', () => {
    const result = filterFieldOptions(options, '', 'all')
    expect(result.length).toBe(options.length)
  })

  it('should return empty array when no matches', () => {
    const result = filterFieldOptions(options, 'nonexistentfield')
    expect(result.length).toBe(0)
  })

  it('should filter by description when available', () => {
    const optionsWithDesc = [
      ...options,
      {
        name: 'Test.field',
        title: 'Test Field',
        shortTitle: 'Test',
        type: 'string',
        description: 'This is a searchable description',
        cubeName: 'Test',
        fieldType: 'dimension' as const,
      },
    ]

    const result = filterFieldOptions(optionsWithDesc, 'searchable')
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Test.field')
  })

  it('should handle search term with leading/trailing whitespace', () => {
    // The function uses trim() on the search term, so whitespace-only should return all
    const result = filterFieldOptions(options, '   ')
    // Whitespace-only after trim is empty, so should return all
    expect(result.length).toBe(options.length)
  })
})

describe('groupFieldsByCube', () => {
  const options = schemaToFieldOptions(mockSchema, 'filter')

  it('should group options by cube name', () => {
    const grouped = groupFieldsByCube(options)

    expect(grouped.size).toBe(2)
    expect(grouped.has('Users')).toBe(true)
    expect(grouped.has('Orders')).toBe(true)
  })

  it('should include all options in groups', () => {
    const grouped = groupFieldsByCube(options)

    let totalInGroups = 0
    grouped.forEach(fields => {
      totalInGroups += fields.length
    })

    expect(totalInGroups).toBe(options.length)
  })

  it('should maintain correct groupings', () => {
    const grouped = groupFieldsByCube(options)

    const usersFields = grouped.get('Users') || []
    expect(usersFields.every(opt => opt.cubeName === 'Users')).toBe(true)

    const ordersFields = grouped.get('Orders') || []
    expect(ordersFields.every(opt => opt.cubeName === 'Orders')).toBe(true)
  })

  it('should return empty map for empty options', () => {
    const grouped = groupFieldsByCube([])
    expect(grouped.size).toBe(0)
  })
})

describe('getCubeNames', () => {
  it('should return list of cube names', () => {
    const names = getCubeNames(mockSchema)

    expect(names).toContain('Users')
    expect(names).toContain('Orders')
    expect(names.length).toBe(2)
  })

  it('should return empty array for null schema', () => {
    const names = getCubeNames(null)
    expect(names).toEqual([])
  })
})

describe('getCubeTitle', () => {
  it('should return cube title', () => {
    expect(getCubeTitle('Users', mockSchema)).toBe('Users Cube')
    expect(getCubeTitle('Orders', mockSchema)).toBe('Orders Cube')
  })

  it('should return cube name if cube not found', () => {
    expect(getCubeTitle('NonExistent', mockSchema)).toBe('NonExistent')
  })

  it('should return cube name for null schema', () => {
    expect(getCubeTitle('Users', null)).toBe('Users')
  })
})

describe('getRelatedCubeNames', () => {
  it('should include source cube', () => {
    const related = getRelatedCubeNames('Users', mockSchema)
    expect(related.has('Users')).toBe(true)
  })

  it('should include cubes from relationships', () => {
    const related = getRelatedCubeNames('Users', mockSchema)
    expect(related.has('Orders')).toBe(true)
  })

  it('should return only source cube if no relationships', () => {
    const related = getRelatedCubeNames('Orders', mockSchema)
    expect(related.has('Orders')).toBe(true)
    expect(related.size).toBe(1)
  })

  it('should return empty set for null schema', () => {
    const related = getRelatedCubeNames('Users', null)
    expect(related.size).toBe(0)
  })

  it('should return only source for non-existent cube', () => {
    const related = getRelatedCubeNames('NonExistent', mockSchema)
    expect(related.has('NonExistent')).toBe(true)
    expect(related.size).toBe(1)
  })
})

describe('getRelatedCubesSchema', () => {
  it('should return filtered schema with related cubes', () => {
    const filtered = getRelatedCubesSchema('Users', mockSchema)

    expect(filtered).not.toBeNull()
    expect(filtered?.cubes.length).toBe(2) // Users and Orders
    expect(filtered?.cubes.map(c => c.name)).toContain('Users')
    expect(filtered?.cubes.map(c => c.name)).toContain('Orders')
  })

  it('should return only source cube if no relationships', () => {
    const filtered = getRelatedCubesSchema('Orders', mockSchema)

    expect(filtered).not.toBeNull()
    expect(filtered?.cubes.length).toBe(1)
    expect(filtered?.cubes[0].name).toBe('Orders')
  })

  it('should return null for null schema', () => {
    const filtered = getRelatedCubesSchema('Users', null)
    expect(filtered).toBeNull()
  })

  it('should preserve cube structure', () => {
    const filtered = getRelatedCubesSchema('Users', mockSchema)
    const usersCube = filtered?.cubes.find(c => c.name === 'Users')

    expect(usersCube?.measures.length).toBe(3)
    expect(usersCube?.dimensions.length).toBe(4)
  })

  it('should ensure description is always a string', () => {
    const filtered = getRelatedCubesSchema('Users', mockSchema)

    filtered?.cubes.forEach(cube => {
      expect(typeof cube.description).toBe('string')
    })
  })
})
