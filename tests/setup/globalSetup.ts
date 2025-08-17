/**
 * Global test setup - runs once before all tests
 * Sets up the test database with static data that persists across all tests
 */

import { createTestDatabase, setupTestDatabase } from '../helpers/test-database'

export default async function globalSetup() {
  console.log('Setting up test database...')
  
  const { db, close } = createTestDatabase()
  
  try {
    // Setup the database with static test data
    await setupTestDatabase(db)
    console.log('Test database setup complete')
  } catch (error) {
    console.error('Failed to setup test database:', error)
    await close()
    throw error
  }
  
  // Don't close the connection here - it will be used by tests
  // The database will be cleaned up in globalTeardown
  
  return async () => {
    // This function will be called at the end of all tests
    console.log('Cleaning up test database...')
    await close()
  }
}