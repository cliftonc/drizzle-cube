/**
 * Debug script to reproduce the exact filter issue
 */

import { 
  createTestDatabase,   
  testSchema
} from './tests/helpers/test-database.js'
import { 
  createPostgresExecutor
} from './src/server/index.js'

import { QueryExecutor } from './src/server/executor.js'
import { getTestCubes } from './tests/helpers/test-cubes.js'

const { db } = createTestDatabase()
const dbExecutor = createPostgresExecutor(db, testSchema)
const executor = new QueryExecutor(dbExecutor)
const cubes = getTestCubes(['Employees', 'Productivity'])

const query = {
  "measures": [
    "Productivity.recordCount"  // Using the correct measure name
  ],
  "dimensions": [
    "Employees.name",
    "Productivity.happinessIndex"
  ],
  "timeDimensions": [
    {
      "dimension": "Productivity.date",
      "granularity": "year"
    }
  ],
  "filters": [
    {
      "and": [
        {
          "member": "Productivity.happinessIndex",
          "operator": "equals",
          "values": [
            5
          ]
        },
        {
          "member": "Employees.name",
          "operator": "equals",
          "values": [
            "Alex Chen"
          ]
        }
      ]
    }
  ]
}

const securityContext = { organisationId: 1 }

try {
  console.log('=== Debugging Filter Issue ===')
  console.log('Query:', JSON.stringify(query, null, 2))
  
  // Generate SQL to see what's happening
  const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, securityContext)
  console.log('\n=== Generated SQL ===')
  console.log(generatedSQL.sql)
  console.log('\n=== Generated Params ===')
  console.log(generatedSQL.params)
  
  // Execute the query
  const result = await executor.execute(cubes, query, securityContext)
  console.log('\n=== Query Result ===')
  console.log('Data rows:', result.data.length)
  if (result.data.length > 0) {
    console.log('Sample row:', result.data[0])
  }
  
} catch (error) {
  console.error('Error:', error.message)
} finally {
  process.exit(0)
}