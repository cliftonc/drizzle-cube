/**
 * Global test setup - runs once before all tests
 * Sets up test databases with migrations and static data that persists across all tests
 */

import { getTestDatabaseType, getDatabaseUtilities, getAllDatabaseUtilities } from '../helpers/test-database'
import { setupPostgresDatabase } from '../helpers/databases/postgres/setup'
import { setupMySQLDatabase } from '../helpers/databases/mysql/setup'

export default async function globalSetup() {
  console.log('Setting up test databases...')
  
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
      
    } else if (dbType === 'both') {
      console.log('Setting up both PostgreSQL and MySQL test databases...')
      
      // Setup PostgreSQL
      const { close: closePostgres } = await setupPostgresDatabase()
      cleanupFunctions.push(closePostgres)
      console.log('PostgreSQL test database setup complete')
      
      // Setup MySQL
      const { close: closeMySQL } = await setupMySQLDatabase()  
      cleanupFunctions.push(closeMySQL)
      console.log('MySQL test database setup complete')
      
      console.log('Both test databases setup complete')
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