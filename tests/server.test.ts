import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { 
  createTestSemanticLayer, 
  testEmployeesCube, 
  testDepartmentsCube,
  testSecurityContext,
  altSecurityContext 
} from './helpers/test-database'

describe('Semantic Layer Server', () => {
  let closeFn
  let semanticLayerFn

  beforeAll(async () => {
    const { semanticLayer, close } = await createTestSemanticLayer()
    semanticLayerFn = semanticLayer   
    closeFn = close 
  })

  afterAll(async () => {
    if (closeFn) {
      await closeFn()
      closeFn = null
    }
  })

  it('should create and register cubes', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    expect(cube).toBeDefined()
    expect(cube?.name).toBe('Employees')
  })

  it('should generate metadata', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    semanticLayerFn.registerCube(testDepartmentsCube)
    
    const metadata = semanticLayerFn.getMetadata()
    expect(metadata).toHaveLength(2)
    expect(metadata[0].name).toBe('Employees')
    expect(metadata[1].name).toBe('Departments')
    
    // Check metadata structure
    const employeeMeta = metadata[0]
    expect(employeeMeta.measures).toHaveLength(4) // count, activeCount, totalSalary, avgSalary
    expect(employeeMeta.dimensions).toHaveLength(6) // id, name, email, departmentName, isActive, createdAt
  })

  it('should execute queries with real database', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    const result = await cube?.queryFn(
      { 
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentName'] 
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result?.data).toBeDefined()
    expect(Array.isArray(result?.data)).toBe(true)
    
    // Should have results for organisation 1
    expect(result?.data.length).toBeGreaterThan(0)
  })

  it('should respect security context filtering', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    
    // Query with organisation 1 context
    const result1 = await cube?.queryFn(
      { measures: ['Employees.count'] },
      testSecurityContext // organisationId: 1
    )
    
    // Query with organisation 2 context
    const result2 = await cube?.queryFn(
      { measures: ['Employees.count'] },
      altSecurityContext // organisationId: 2
    )
    
    expect(result1?.data).toBeDefined()
    expect(result2?.data).toBeDefined()
    
    // Results should be different due to security filtering
    // Org 1 has 2 employees, Org 2 has 1 employee
    const org1Count = result1?.data[0]?.['Employees.count']
    const org2Count = result2?.data[0]?.['Employees.count']
    
    expect(org1Count).toBe(2)
    expect(org2Count).toBe(1)
  })

  it('should handle measure filters correctly', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    
    // Query all employees
    const allResult = await cube?.queryFn(
      { measures: ['Employees.count'] },
      testSecurityContext
    )
    
    // Query only active employees
    const activeResult = await cube?.queryFn(
      { measures: ['Employees.activeCount'] },
      testSecurityContext
    )
    
    const totalCount = allResult?.data[0]?.['Employees.count']
    const activeCount = activeResult?.data[0]?.['Employees.activeCount']
    
    // Should have 2 total employees for org 1, but only 2 active (both are active)
    expect(totalCount).toBe(2)
    expect(activeCount).toBe(2)
  })

  it('should execute queries with filters', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    const result = await cube?.queryFn(
      {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [{
          member: 'Employees.name',
          operator: 'contains',
          values: ['John']
        }]
      },
      testSecurityContext
    )
    
    expect(result?.data).toBeDefined()
    expect(result?.data.length).toBe(1)
    expect(result?.data[0]['Employees.name']).toContain('John')
  })

  it('should handle aggregation queries', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    const result = await cube?.queryFn(
      {
        measures: ['Employees.avgSalary', 'Employees.totalSalary'],
        dimensions: ['Employees.departmentName']
      },
      testSecurityContext
    )
    
    expect(result?.data).toBeDefined()
    expect(result?.data.length).toBeGreaterThan(0)
    
    // Check that aggregation results are numbers
    const firstRow = result?.data[0]
    expect(typeof firstRow['Employees.avgSalary']).toBe('number')
    expect(typeof firstRow['Employees.totalSalary']).toBe('number')
  })

  it('should generate proper annotations', async () => {
    
    semanticLayerFn.registerCube(testEmployeesCube)
    
    const cube = semanticLayerFn.getCube('Employees')
    const result = await cube?.queryFn(
      {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      },
      testSecurityContext
    )
    
    expect(result?.annotation).toBeDefined()
    expect(result?.annotation.measures['Employees.count']).toBeDefined()
    expect(result?.annotation.dimensions['Employees.name']).toBeDefined()
    
    // Check annotation structure
    const countAnnotation = result?.annotation.measures['Employees.count']
    expect(countAnnotation.title).toBe('Total Employees')
    expect(countAnnotation.type).toBe('count')
    
    const nameAnnotation = result?.annotation.dimensions['Employees.name']
    expect(nameAnnotation.title).toBe('Employee Name')
    expect(nameAnnotation.type).toBe('string')
  })
})