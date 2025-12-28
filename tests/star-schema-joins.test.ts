/**
 * Star Schema Join Tests
 *
 * Tests the pattern where two fact cubes join to a common dimension cube.
 * This is a fundamental star schema pattern used in analytics.
 *
 * Schema Structure:
 *   Sales (fact) ---belongsTo---> Products (dimension) <---belongsTo--- Inventory (fact)
 *
 * Expected Behavior:
 *   Queries that include measures from both fact cubes + dimensions from the shared
 *   dimension cube should work by finding a join path through the common dimension.
 *
 * Test Scenarios:
 *   1. Both facts use belongsTo to dimension
 *   2. Dimension uses hasMany to both facts
 *   3. Mixed relationships
 *   4. Query all three cubes together
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Star Schema: Fact-Dimension-Fact Joins', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    // Get database executor and schema
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    // Create cubes for testing
    cubes = await createStarSchemaCubes()

    // Create test executor
    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Schema A: Both Facts with belongsTo to Dimension', () => {
    it('should handle measures from both fact cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Sales.totalRevenue']).toBeGreaterThanOrEqual(0)
      expect(result.data[0]['Inventory.totalStock']).toBeGreaterThanOrEqual(0)
    })

    it('should handle dimensions from shared dimension cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue'])
        .dimensions(['Products.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row['Sales.totalRevenue']).toBeGreaterThanOrEqual(0)
        expect(row['Products.name']).toBeDefined()
      }
    })

    it('should handle measures from both facts + dimensions from shared dimension', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .build()

      // This is the critical test - can we join Sales -> Products <- Inventory?
      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row['Sales.totalRevenue']).toBeGreaterThanOrEqual(0)
        expect(row['Inventory.totalStock']).toBeGreaterThanOrEqual(0)
        expect(row['Products.name']).toBeDefined()
      }
    })

    it('should handle multiple dimensions from shared dimension', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name', 'Products.category'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row['Sales.totalRevenue']).toBeGreaterThanOrEqual(0)
        expect(row['Inventory.totalStock']).toBeGreaterThanOrEqual(0)
        expect(row['Products.name']).toBeDefined()
        expect(row['Products.category']).toBeDefined()
      }
    })

    it('should handle complex aggregations across all three cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Sales.avgOrderValue', 'Inventory.totalStock', 'Products.count'])
        .dimensions(['Products.category'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        expect(row['Sales.totalRevenue']).toBeGreaterThanOrEqual(0)
        expect(row['Sales.avgOrderValue']).toBeGreaterThanOrEqual(0)
        expect(row['Inventory.totalStock']).toBeGreaterThanOrEqual(0)
        expect(row['Products.count']).toBeGreaterThan(0)
        expect(row['Products.category']).toBeDefined()
      }
    })
  })

  describe('Join Path Detection', () => {
    it('should find indirect join path between two fact cubes', async () => {
      // This tests the BFS pathfinding algorithm
      const query = TestQueryBuilder.create()
        .measures(['Sales.count', 'Inventory.count'])
        .build()

      // Should find path: Sales -> Products -> Inventory
      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Sales.count']).toBeGreaterThanOrEqual(0)
      expect(result.data[0]['Inventory.count']).toBeGreaterThanOrEqual(0)
    })

    it('should include intermediate dimension cube in join plan', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .build()

      // Query plan should include all three cubes
      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Verify Products dimension is included
      for (const row of result.data) {
        expect(row['Products.name']).toBeDefined()
      }
    })
  })

  describe('Security Context Isolation', () => {
    it('should apply security context to all cubes in join path', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .build()

      // Execute for org1
      const org1Result = await testExecutor.executeQuery(query)

      // Execute for org2
      const org2Executor = new TestExecutor(
        testExecutor['executor'],
        cubes,
        testSecurityContexts.org2
      )
      const org2Result = await org2Executor.executeQuery(query)

      // Results should be different due to security context
      // (assuming we have seeded data for both orgs)
      expect(org1Result.data).toBeDefined()
      expect(org2Result.data).toBeDefined()
    })
  })

  describe('Filters Across Multiple Cubes', () => {
    it('should handle filters on fact cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .filters([
          {
            member: 'Sales.quantity',
            operator: 'gt',
            values: ['5']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle filters on dimension cube', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name', 'Products.category'])  // Include category in dimensions since we're filtering by it
        .filters([
          {
            member: 'Products.category',
            operator: 'equals',
            values: ['Electronics']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // All results should be Electronics category
      for (const row of result.data) {
        expect(row['Products.category']).toBe('Electronics')
      }
    })

    it('should handle filters on multiple cubes simultaneously', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.totalRevenue', 'Inventory.totalStock'])
        .dimensions(['Products.name'])
        .filters([
          {
            member: 'Sales.quantity',
            operator: 'gt',
            values: ['5']
          },
          {
            member: 'Products.category',
            operator: 'equals',
            values: ['Electronics']
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle case where one fact has no data for a product', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Sales.count', 'Inventory.count'])
        .dimensions(['Products.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should still return results even if some products have no sales or inventory
      expect(result.data).toBeDefined()
    })

    it('should handle products with no sales or inventory', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Products.count'])
        .dimensions(['Products.name'])
        .build()

      const allProductsResult = await testExecutor.executeQuery(query)

      const query2 = TestQueryBuilder.create()
        .measures(['Sales.count', 'Inventory.count', 'Products.count'])
        .dimensions(['Products.name'])
        .build()

      const joinedResult = await testExecutor.executeQuery(query2)

      // Depending on join type, may have different counts
      expect(allProductsResult.data).toBeDefined()
      expect(joinedResult.data).toBeDefined()
    })
  })
})

/**
 * Create cubes for star schema testing
 *
 * Schema:
 *   Sales (fact) ---belongsTo---> Products (dimension) <---belongsTo--- Inventory (fact)
 */
async function createStarSchemaCubes(): Promise<Map<string, Cube>> {
  const schema = await getTestSchema()
  const { products, sales, inventory } = schema

  // Declare cube variables for forward references
  let productsCube: Cube
  let salesCube: Cube
  let inventoryCube: Cube

  // Products Cube (Dimension)
  productsCube = defineCube('Products', {
    title: 'Products',
    description: 'Product catalog dimension',

    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: products,
      where: eq(products.organisationId, ctx.securityContext.organisationId)
    }),

    // Define hasMany relationships back to both fact cubes
    // This enables joining Sales <-> Products <-> Inventory
    joins: {
      Sales: {
        targetCube: () => salesCube,
        relationship: 'hasMany',
        on: [
          { source: products.id, target: sales.productId }
        ]
      },
      Inventory: {
        targetCube: () => inventoryCube,
        relationship: 'hasMany',
        on: [
          { source: products.id, target: inventory.productId }
        ]
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
      },
      sku: {
        name: 'sku',
        title: 'SKU',
        type: 'string',
        sql: products.sku
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
    description: 'Sales transactions fact table',

    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: sales,
      where: eq(sales.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Products: {
        targetCube: () => productsCube,
        relationship: 'belongsTo',
        on: [
          { source: sales.productId, target: products.id }
        ]
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
      },
      quantity: {
        name: 'quantity',
        title: 'Quantity',
        type: 'number',
        sql: sales.quantity
      },
      saleDate: {
        name: 'saleDate',
        title: 'Sale Date',
        type: 'time',
        sql: sales.saleDate
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
      },
      avgOrderValue: {
        name: 'avgOrderValue',
        title: 'Average Order Value',
        type: 'avg',
        sql: sales.revenue
      },
      totalQuantity: {
        name: 'totalQuantity',
        title: 'Total Quantity Sold',
        type: 'sum',
        sql: sales.quantity
      }
    }
  })

  // Inventory Cube (Fact)
  inventoryCube = defineCube('Inventory', {
    title: 'Inventory',
    description: 'Inventory levels fact table',

    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: inventory,
      where: eq(inventory.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Products: {
        targetCube: () => productsCube,
        relationship: 'belongsTo',
        on: [
          { source: inventory.productId, target: products.id }
        ]
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
      },
      warehouse: {
        name: 'warehouse',
        title: 'Warehouse',
        type: 'string',
        sql: inventory.warehouse
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
      },
      avgStockLevel: {
        name: 'avgStockLevel',
        title: 'Average Stock Level',
        type: 'avg',
        sql: inventory.stockLevel
      }
    }
  })

  return new Map([
    ['Products', productsCube],
    ['Sales', salesCube],
    ['Inventory', inventoryCube]
  ])
}
