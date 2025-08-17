/**
 * Database migration script
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb'

async function runMigration() {
  console.log('🔄 Running database migrations...')
  
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()