import { createTestDatabaseWithData } from './test-database'
import { sql } from 'drizzle-orm'

/**
 * Vitest global setup: prepares the test database before all tests,
 * and cleans up (truncates tables) after all tests.
 */
export default async function globalSetup() {
  // Set up the database and get the db/close handles
  const { db, close } = await createTestDatabaseWithData()

  // Return a teardown function to clean up after all tests
  return async () => {
    // Truncate tables to clean up
    await db.execute(sql`TRUNCATE TABLE employees`)
    await db.execute(sql`TRUNCATE TABLE departments`)
    // Close the DB connection
    await close()
  }
}