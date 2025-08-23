import { setupSQLiteDatabase } from './tests/helpers/databases/sqlite/setup.js'
import { createSQLiteExecutor } from './src/server/index.js'
import { sqliteTestSchema } from './tests/helpers/databases/sqlite/schema.js'

async function debug() {
  try {
    console.log('Setting up SQLite database...')
    const { db, close } = await setupSQLiteDatabase()
    
    console.log('Creating executor...')
    const executor = createSQLiteExecutor(db, sqliteTestSchema)
    
    console.log('Testing simple query...')
    const testQuery = {
      measures: ['Employees.count'],
      filters: [
        {
          member: 'Employees.createdAt',
          operator: 'inDateRange',
          values: ['2022-01-01', '2023-12-31']
        }
      ]
    }
    
    console.log('Executing query:', JSON.stringify(testQuery, null, 2))
    const result = await executor.executeQuery(testQuery, { organisationId: 1 })
    console.log('Result:', result)
    
    close()
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

debug()
