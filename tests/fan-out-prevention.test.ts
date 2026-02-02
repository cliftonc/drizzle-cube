/**
 * Fan-Out Prevention Tests
 *
 * Tests for issue #363 - preventing row multiplication (fan-out) in multi-cube queries
 * when hasMany relationships cause measures to be inflated.
 *
 * These tests validate that SUM aggregations are NOT inflated when:
 * 1. A cube's measures are queried alongside dimensions from a hasMany relationship
 * 2. Multiple cubes with measures are joined through a shared dimension
 *
 * Key insight: ANY measure that participates in a query with hasMany joins will be
 * inflated UNLESS it's pre-aggregated into a CTE first.
 *
 * Test Strategy:
 * - Query baseline values (e.g., Departments.totalBudget alone)
 * - Query same values with hasMany relationship in path (e.g., with Productivity)
 * - Verify values match exactly - if they don't, fan-out is occurring
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Fan-Out Prevention', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  // Expected department budgets for Organization 1 (from enhanced-test-data.ts)
  // These are the known correct values we should see
  const expectedBudgetsByDepartment: Record<string, number> = {
    'Engineering': 500000,
    'Marketing': 250000,
    'Sales': 300000,
    'HR': 150000,
    'Finance': 200000,
    'Operations': 180000,
    'R&D': 400000,
    'Quality Assurance': 120000,
    'Customer Success': 90000,
    'Legal & Compliance': 100000,
    // 'Consulting' and 'Temporary Projects' have null budgets
  }

  // Departments that have employees in Org 1 (from enhanced-test-data.ts)
  // Engineering (id=1): 5 employees, Marketing (id=2): 3, Sales (id=3): 2,
  // HR (id=4): 2, Finance (id=5): 2, Operations (id=6): 1, R&D (id=7): 2, QA (id=8): 1
  const departmentsWithEmployees = new Set([
    'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'R&D', 'Quality Assurance'
  ])

  beforeAll(async () => {
    // Get database executor and schema
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    // Get test cubes that already exist in the test infrastructure
    cubes = await createFanOutTestCubes()

    // Create test executor
    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Department Budget Aggregation', () => {
    /**
     * Test: Baseline - verify department budgets match expected values
     * This establishes that our test data is correct
     */
    it('should return correct baseline department budgets (no joins)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Departments.totalBudget'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Verify we got results
      expect(result.data.length).toBeGreaterThan(0)

      // Build map of actual budgets
      const actualBudgets = new Map<string, number>()
      for (const row of result.data) {
        const name = row['Departments.name'] as string
        const budget = Number(row['Departments.totalBudget'] || 0)
        actualBudgets.set(name, budget)
      }

      // Verify each department with a known budget
      for (const [deptName, expectedBudget] of Object.entries(expectedBudgetsByDepartment)) {
        const actualBudget = actualBudgets.get(deptName)
        expect(actualBudget, `Budget for ${deptName} should be ${expectedBudget}`).toBe(expectedBudget)
      }
    })

    /**
     * Test: Fan-out prevention with Employees join
     *
     * When joining Departments with Employees:
     * - Each department has multiple employees
     * - Without CTE pre-aggregation, budget would be multiplied by employee count
     * - With proper fan-out prevention, budget should remain unchanged
     *
     * Example:
     * - Engineering has 5 employees and budget 500,000
     * - Without prevention: SUM would be 5 * 500,000 = 2,500,000 (WRONG)
     * - With prevention: SUM should be 500,000 (CORRECT)
     */
    it('should NOT inflate Departments.totalBudget when joined with Employees', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Departments.totalBudget', 'Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Verify we got results for departments with employees
      expect(result.data.length).toBeGreaterThan(0)

      // Verify each department's budget matches expected value
      for (const row of result.data) {
        const name = row['Departments.name'] as string
        const budget = Number(row['Departments.totalBudget'] || 0)
        const expectedBudget = expectedBudgetsByDepartment[name]

        // Only check departments we have expected values for
        if (expectedBudget !== undefined) {
          expect(budget, `${name} budget should be ${expectedBudget}, not ${budget}`).toBe(expectedBudget)
        }
      }
    })

    /**
     * Test: Fan-out prevention with Productivity join (hasMany)
     *
     * This is the critical test. Productivity has a hasMany relationship from Employees:
     * - Employees hasMany → Productivity
     * - This creates row multiplication
     *
     * Example scenario:
     * - Engineering dept has 5 employees, budget 500,000
     * - Those 5 employees have ~365 productivity records each (daily data)
     * - Total rows: 5 * 365 = 1,825 rows
     * - Without prevention: SUM(budget) = 1,825 * 500,000 = massive inflation
     * - With prevention: SUM(budget) = 500,000 (correct)
     */
    it('should NOT inflate Departments.totalBudget when Productivity is in the query', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Departments.totalBudget', 'Productivity.recordCount'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Verify each department's budget is correct (not inflated)
      let foundValidDepartment = false
      for (const row of result.data) {
        const name = row['Departments.name'] as string
        const budget = Number(row['Departments.totalBudget'] || 0)
        const expectedBudget = expectedBudgetsByDepartment[name]

        if (expectedBudget !== undefined && departmentsWithEmployees.has(name)) {
          foundValidDepartment = true
          expect(budget, `${name} budget should be ${expectedBudget} (not inflated by Productivity rows)`).toBe(expectedBudget)
        }
      }

      // Ensure we actually tested something
      expect(foundValidDepartment, 'Should have found at least one department to validate').toBe(true)
    })

    /**
     * Test: Per-department budgets are correct when grouped by department
     *
     * This tests that when we group by department name and include a hasMany measure,
     * each department's budget is correct (not inflated by row multiplication).
     *
     * We validate each department's budget individually rather than checking totals,
     * as the set of departments with productivity data may vary.
     */
    it('should return correct per-department budgets when grouped by department with Productivity', async () => {
      // Query with dimensions - this is the recommended approach
      const query = TestQueryBuilder.create()
        .measures(['Departments.totalBudget', 'Productivity.recordCount'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Verify each department's budget is correct (not inflated)
      let validatedCount = 0
      for (const row of result.data) {
        const deptName = row['Departments.name'] as string
        const actualBudget = Number(row['Departments.totalBudget'] || 0)
        const expectedBudget = expectedBudgetsByDepartment[deptName]

        // Only check departments we have expected values for
        if (expectedBudget !== undefined) {
          expect(actualBudget,
            `${deptName} budget should be ${expectedBudget}, not ${actualBudget}`
          ).toBe(expectedBudget)
          validatedCount++
        }
      }

      // Ensure we validated at least some departments
      expect(validatedCount).toBeGreaterThan(0)
    })
  })

  describe('Productivity Aggregation (hasMany target)', () => {
    /**
     * Test: Productivity measures should be correctly aggregated
     *
     * When Productivity is the hasMany target, it should be pre-aggregated via CTE.
     * This test verifies the CTE is working correctly.
     */
    it('should correctly aggregate Productivity measures per Employee', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Each employee should appear once with their aggregated productivity
      const employeeNames = new Set<string>()
      for (const row of result.data) {
        const name = row['Employees.name'] as string

        // Should not have duplicates
        expect(employeeNames.has(name), `Employee ${name} should not appear multiple times`).toBe(false)
        employeeNames.add(name)

        // Should have productivity data
        expect(row['Productivity.totalLinesOfCode']).toBeDefined()
      }
    })

    /**
     * Test: Verify hasMany CTE prevents row multiplication in outer query
     *
     * When we query Employees.count with Productivity dimensions,
     * we should get one row per employee, not one row per productivity record.
     */
    it('should return one row per employee when grouping by employee with Productivity', async () => {
      // Query employee count grouped by employee name
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.recordCount'])
        .dimensions(['Employees.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Each employee should have count = 1 (one row per employee)
      for (const row of result.data) {
        const employeeCount = Number(row['Employees.count'] || 0)
        const employeeName = row['Employees.name']

        expect(employeeCount, `${employeeName} count should be 1, not ${employeeCount}`).toBe(1)
      }
    })
  })

  describe('Star Schema (Fact-Dimension-Fact)', () => {
    /**
     * Test: Two fact cubes through shared dimension
     *
     * Pattern: Sales → Products ← Inventory
     * Both Sales and Inventory have belongsTo → Products
     * Products has hasMany → Sales and hasMany → Inventory
     *
     * Without proper CTE handling, both fact measures would be inflated.
     */
    it('should correctly aggregate Sales and Inventory measures through Products', async () => {
      // Skip if cubes not available
      if (!cubes.has('Sales') || !cubes.has('Inventory') || !cubes.has('Products')) {
        console.log('Star schema cubes not available, skipping test')
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Each product should appear once with correct aggregated values
      const productNames = new Set<string>()
      for (const row of result.data) {
        const name = row['Products.name'] as string

        expect(productNames.has(name), `Product ${name} should not appear multiple times`).toBe(false)
        productNames.add(name)

        // Both measures should be present
        expect(row['Sales.totalRevenue']).toBeDefined()
        expect(row['Inventory.totalStock']).toBeDefined()
      }
    })

    /**
     * Test: Verify each fact cube's measures are not inflated by the other
     *
     * This test specifically checks that Sales.totalRevenue is not multiplied
     * by the number of Inventory records for the same product.
     */
    it('should not inflate Sales revenue by Inventory record count', async () => {
      if (!cubes.has('Sales') || !cubes.has('Inventory') || !cubes.has('Products')) {
        console.log('Star schema cubes not available, skipping test')
        return
      }

      // Get baseline sales revenue per product
      const salesOnlyQuery = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue'])
        .dimensions(['Products.name'])
        .build()

      const salesOnlyResult = await testExecutor.executeQuery(salesOnlyQuery)

      // Build map of expected revenue per product
      const expectedRevenueByProduct = new Map<string, number>()
      for (const row of salesOnlyResult.data) {
        const name = row['Products.name'] as string
        const revenue = Number(row['Sales.totalRevenue'] || 0)
        expectedRevenueByProduct.set(name, revenue)
      }

      // Now query with both Sales and Inventory
      const combinedQuery = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .build()

      const combinedResult = await testExecutor.executeQuery(combinedQuery)

      // Verify revenue matches baseline for each product
      for (const row of combinedResult.data) {
        const name = row['Products.name'] as string
        const revenueWithInventory = Number(row['Sales.totalRevenue'] || 0)
        const expectedRevenue = expectedRevenueByProduct.get(name)

        if (expectedRevenue !== undefined) {
          expect(revenueWithInventory,
            `${name} revenue should be ${expectedRevenue}, not ${revenueWithInventory}`
          ).toBe(expectedRevenue)
        }
      }
    })
  })

  describe('Multi-Hop Join Paths (Fan-Out Prevention)', () => {
    /**
     * Test: Multi-hop CTE with intermediate hasMany
     *
     * Pattern: Departments → Employees → EmployeeTeams
     * - Departments hasMany → Employees
     * - Employees hasMany → EmployeeTeams
     *
     * Without multi-hop fan-out prevention:
     * - EmployeeTeams CTE groups by employee_id
     * - Main query joins: Departments → Employees → EmployeeTeams CTE
     * - Each department has multiple employees → fan-out occurs
     *
     * With multi-hop fan-out prevention:
     * - EmployeeTeams CTE includes JOIN to Employees and groups by employees.department_id
     * - Main query joins: Departments → EmployeeTeams CTE (directly!)
     * - No intermediate Employees join in main query → no fan-out
     *
     * This test verifies that Productivity values are NOT multiplied when
     * EmployeeTeams is also in the query.
     */
    it('should NOT cause fan-out when CTE joins through intermediate hasMany', async () => {
      // Skip if EmployeeTeams cube not available
      if (!cubes.has('EmployeeTeams')) {
        console.log('EmployeeTeams cube not available, skipping multi-hop test')
        return
      }

      // Baseline: Query Productivity alone with Departments dimension
      const baselineQuery = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Departments.name'])
        .build()

      const baselineResult = await testExecutor.executeQuery(baselineQuery)

      // Build map of expected LOC per department from baseline
      const expectedLOCByDepartment = new Map<string, number>()
      for (const row of baselineResult.data) {
        const deptName = row['Departments.name'] as string
        const loc = Number(row['Productivity.totalLinesOfCode'] || 0)
        expectedLOCByDepartment.set(deptName, loc)
      }

      // Multi-hop query: Productivity + EmployeeTeams with Departments dimension
      // This is the scenario that causes fan-out without the fix
      const multiHopQuery = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'EmployeeTeams.count'])
        .dimensions(['Departments.name'])
        .build()

      const multiHopResult = await testExecutor.executeQuery(multiHopQuery)

      // Verify Productivity values match baseline (not multiplied)
      let foundValidDepartment = false
      for (const row of multiHopResult.data) {
        const deptName = row['Departments.name'] as string
        const actualLOC = Number(row['Productivity.totalLinesOfCode'] || 0)
        const expectedLOC = expectedLOCByDepartment.get(deptName)

        if (expectedLOC !== undefined && expectedLOC > 0) {
          foundValidDepartment = true
          expect(actualLOC,
            `${deptName} Productivity.totalLinesOfCode should be ${expectedLOC}, got ${actualLOC} (fan-out detected!)`
          ).toBe(expectedLOC)
        }
      }

      // Ensure we actually tested something
      expect(foundValidDepartment, 'Should have found at least one department with productivity data').toBe(true)
    })

    /**
     * Test: Verify both CTE measures are correctly aggregated in multi-hop scenario
     */
    it('should correctly aggregate both Productivity and EmployeeTeams measures', async () => {
      if (!cubes.has('EmployeeTeams')) {
        console.log('EmployeeTeams cube not available, skipping test')
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'EmployeeTeams.count'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Each department should appear once
      const deptNames = new Set<string>()
      for (const row of result.data) {
        const deptName = row['Departments.name'] as string
        expect(deptNames.has(deptName), `Department ${deptName} should not appear multiple times`).toBe(false)
        deptNames.add(deptName)

        // Both measures should be defined
        expect(row['Productivity.totalLinesOfCode']).toBeDefined()
        expect(row['EmployeeTeams.count']).toBeDefined()
      }
    })
  })

  describe('Edge Cases', () => {
    /**
     * Test: Empty results should be handled gracefully
     */
    it('should handle queries with no matching data', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Departments.totalBudget'])
        .dimensions(['Departments.name'])
        .filters([{
          member: 'Departments.name',
          operator: 'equals',
          values: ['NonexistentDepartment']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return empty result, not error
      expect(result.data).toBeDefined()
      expect(result.data.length).toBe(0)
    })

    /**
     * Test: Null budget handling
     *
     * Some departments have null budgets. These should be handled correctly
     * and not cause issues with the CTE/aggregation logic.
     */
    it('should handle departments with null budgets correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Departments.totalBudget', 'Departments.count'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Find departments with null budgets (Consulting, Temporary Projects)
      const nullBudgetDepts = result.data.filter(row => {
        const name = row['Departments.name'] as string
        return name === 'Consulting' || name === 'Temporary Projects'
      })

      // These should have null/0 budget but still be counted
      for (const dept of nullBudgetDepts) {
        const budget = dept['Departments.totalBudget']
        // Budget should be null or 0
        expect(budget === null || budget === 0 || budget === undefined,
          `${dept['Departments.name']} should have null/0 budget`
        ).toBe(true)
      }
    })
  })
})

/**
 * Create cubes for fan-out testing
 * Uses the existing test schema tables
 */
async function createFanOutTestCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, productivity, products, sales, inventory, teams, employeeTeams } = await getTestSchema()

  // Declare cube variables first to handle forward references
  let employeesCube: Cube
  let departmentsCube: Cube
  let productivityCube: Cube
  let productsCube: Cube
  let salesCube: Cube
  let inventoryCube: Cube
  let teamsCube: Cube
  let employeeTeamsCube: Cube

  // Employees Cube - primary cube in many queries
  employeesCube = defineCube('Employees', {
    title: 'Employees',
    description: 'Employee data',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Productivity: {
        targetCube: () => productivityCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: productivity.employeeId }]
      },
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }]
      },
      EmployeeTeams: {
        targetCube: () => employeeTeamsCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: employeeTeams.employeeId }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Employee ID',
        type: 'number',
        sql: employees.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Employee Name',
        type: 'string',
        sql: employees.name
      },
      departmentId: {
        name: 'departmentId',
        title: 'Department ID',
        type: 'number',
        sql: employees.departmentId
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Employee Count',
        type: 'count',
        sql: employees.id
      }
    }
  })

  // Departments Cube - dimension cube with budget measure
  // Important: Must have hasMany joins to Employees and Productivity for multi-hop tests
  departmentsCube = defineCube('Departments', {
    title: 'Departments',
    description: 'Department data with budget',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Department ID',
        type: 'number',
        sql: departments.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Department Name',
        type: 'string',
        sql: departments.name
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Department Count',
        type: 'count',
        sql: departments.id
      },
      totalBudget: {
        name: 'totalBudget',
        title: 'Total Budget',
        type: 'sum',
        sql: departments.budget
      }
    }
  })

  // Productivity Cube - fact cube with hasMany from Employees
  productivityCube = defineCube('Productivity', {
    title: 'Productivity',
    description: 'Productivity metrics',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: [{ source: productivity.employeeId, target: employees.id }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Record ID',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      },
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: productivity.employeeId
      },
      linesOfCode: {
        name: 'linesOfCode',
        title: 'Lines of Code',
        type: 'number',
        sql: productivity.linesOfCode
      }
    },

    measures: {
      recordCount: {
        name: 'recordCount',
        title: 'Record Count',
        type: 'count',
        sql: productivity.id
      },
      totalLinesOfCode: {
        name: 'totalLinesOfCode',
        title: 'Total Lines of Code',
        type: 'sum',
        sql: productivity.linesOfCode
      }
    }
  })

  // Products Cube (Dimension) - for star schema tests
  productsCube = defineCube('Products', {
    title: 'Products',
    description: 'Product catalog dimension',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: products,
      where: eq(products.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Sales: {
        targetCube: () => salesCube,
        relationship: 'hasMany',
        on: [{ source: products.id, target: sales.productId }]
      },
      Inventory: {
        targetCube: () => inventoryCube,
        relationship: 'hasMany',
        on: [{ source: products.id, target: inventory.productId }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Product ID',
        type: 'number',
        sql: products.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Product Name',
        type: 'string',
        sql: products.name
      },
      category: {
        name: 'category',
        title: 'Category',
        type: 'string',
        sql: products.category
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Product Count',
        type: 'count',
        sql: products.id
      }
    }
  })

  // Sales Cube (Fact)
  salesCube = defineCube('Sales', {
    title: 'Sales',
    description: 'Sales transactions',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: sales,
      where: eq(sales.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Products: {
        targetCube: () => productsCube,
        relationship: 'belongsTo',
        on: [{ source: sales.productId, target: products.id }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Sale ID',
        type: 'number',
        sql: sales.id,
        primaryKey: true
      },
      productId: {
        name: 'productId',
        title: 'Product ID',
        type: 'number',
        sql: sales.productId
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Sales Count',
        type: 'count',
        sql: sales.id
      },
      totalRevenue: {
        name: 'totalRevenue',
        title: 'Total Revenue',
        type: 'sum',
        sql: sales.revenue
      }
    }
  })

  // Inventory Cube (Fact)
  inventoryCube = defineCube('Inventory', {
    title: 'Inventory',
    description: 'Inventory levels',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: inventory,
      where: eq(inventory.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Products: {
        targetCube: () => productsCube,
        relationship: 'belongsTo',
        on: [{ source: inventory.productId, target: products.id }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Inventory ID',
        type: 'number',
        sql: inventory.id,
        primaryKey: true
      },
      productId: {
        name: 'productId',
        title: 'Product ID',
        type: 'number',
        sql: inventory.productId
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Inventory Records',
        type: 'count',
        sql: inventory.id
      },
      totalStock: {
        name: 'totalStock',
        title: 'Total Stock',
        type: 'sum',
        sql: inventory.stockLevel
      }
    }
  })

  // Teams Cube - for multi-hop testing
  teamsCube = defineCube('Teams', {
    title: 'Teams',
    description: 'Team structure',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: teams,
      where: eq(teams.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      EmployeeTeams: {
        targetCube: () => employeeTeamsCube,
        relationship: 'hasMany',
        on: [{ source: teams.id, target: employeeTeams.teamId }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Team ID',
        type: 'number',
        sql: teams.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Team Name',
        type: 'string',
        sql: teams.name
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Team Count',
        type: 'count',
        sql: teams.id
      }
    }
  })

  // EmployeeTeams Cube - junction table for multi-hop join testing
  // This cube has only employeeId, NOT departmentId - requires multi-hop
  // join through Employees to reach Departments
  employeeTeamsCube = defineCube('EmployeeTeams', {
    title: 'Employee Teams',
    description: 'Employee team assignments',

    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employeeTeams,
      where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId as any)
    }),

    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'belongsTo',
        on: [{ source: employeeTeams.employeeId, target: employees.id }]
      },
      Teams: {
        targetCube: () => teamsCube,
        relationship: 'belongsTo',
        on: [{ source: employeeTeams.teamId, target: teams.id }]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Membership ID',
        type: 'number',
        sql: employeeTeams.id,
        primaryKey: true
      },
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: employeeTeams.employeeId
      },
      teamId: {
        name: 'teamId',
        title: 'Team ID',
        type: 'number',
        sql: employeeTeams.teamId
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Membership Count',
        type: 'count',
        sql: employeeTeams.id
      }
    }
  })

  return new Map([
    ['Employees', employeesCube],
    ['Departments', departmentsCube],
    ['Productivity', productivityCube],
    ['Products', productsCube],
    ['Sales', salesCube],
    ['Inventory', inventoryCube],
    ['Teams', teamsCube],
    ['EmployeeTeams', employeeTeamsCube]
  ])
}
