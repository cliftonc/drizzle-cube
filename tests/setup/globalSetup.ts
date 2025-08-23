/**
 * Global test setup - runs once before all tests
 * Sets up test databases with migrations and static data that persists across all tests
 */

import { getTestDatabaseType, getDatabaseUtilities, getAllDatabaseUtilities } from '../helpers/test-database'
import { setupPostgresDatabase } from '../helpers/databases/postgres/setup'
import { setupMySQLDatabase } from '../helpers/databases/mysql/setup'
import { setupSQLiteDatabase } from '../helpers/databases/sqlite/setup'

export default async function globalSetup() {  
  const dbType = getTestDatabaseType()
  const cleanupFunctions: Array<() => Promise<void> | void> = []

  try {
    if (dbType === 'postgres') {
      console.log('Setting up PostgreSQL test database...')
      const { close } = await setupPostgresDatabase()
      cleanupFunctions.push(close)
      console.log('PostgreSQL test database setup complete')
      
    } else if (dbType === 'mysql') {
      console.log('Setting up MySQL test database...')
      const { close } = await setupMySQLDatabase()
      cleanupFunctions.push(close)
      console.log('MySQL test database setup complete')
      
    } else if (dbType === 'sqlite') {
      console.log('Setting up SQLite test database...')
      const { close } = await setupSQLiteDatabase()
      cleanupFunctions.push(close)
      console.log('SQLite test database setup complete')
      
    }
    
  } catch (error) {
    console.error('Failed to setup test databases:', error)
    // Cleanup any connections that were opened
    for (const cleanup of cleanupFunctions) {
      try {
        await cleanup()
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError)
      }
    }
    throw error
  }
  
  // Return cleanup function to be called at the end of all tests
  return async () => {
    console.log('Cleaning up test databases...')
    for (const cleanup of cleanupFunctions) {
      try {
        await cleanup()
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError)
      }
    }
  }
}