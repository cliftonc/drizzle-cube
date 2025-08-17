import { describe, it, expect } from 'vitest'
import { SemanticLayerCompiler, employeesCube } from '../src/server'

// Mock database executor for testing
const mockDbExecutor = {
  async execute(sql: string, params?: any[]) {
    return [
      { id: '1', name: 'John Doe', department_name: 'Engineering', active: true, fte_basis: 1.0 },
      { id: '2', name: 'Jane Smith', department_name: 'Marketing', active: true, fte_basis: 0.8 }
    ]
  }
}

describe('Semantic Layer Server', () => {
  it('should create and register cubes', () => {
    const compiler = new SemanticLayerCompiler(mockDbExecutor)
    compiler.registerCube(employeesCube)
    
    const cube = compiler.getCube('Employees')
    expect(cube).toBeDefined()
    expect(cube?.name).toBe('Employees')
  })

  it('should generate metadata', () => {
    const compiler = new SemanticLayerCompiler(mockDbExecutor)
    compiler.registerCube(employeesCube)
    
    const metadata = compiler.getMetadata()
    expect(metadata).toHaveLength(1)
    expect(metadata[0].name).toBe('Employees')
  })

  it('should execute queries', async () => {
    const compiler = new SemanticLayerCompiler(mockDbExecutor)
    compiler.registerCube(employeesCube)
    
    const cube = compiler.getCube('Employees')
    const result = await cube?.queryFn(
      { measures: ['count'], dimensions: ['departmentName'] },
      { organisation: 'test-org' }
    )
    
    expect(result).toBeDefined()
    expect(result?.data).toHaveLength(2)
  })
})