/**
 * Database migration script
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { migrate as migrateNeon } from 'drizzle-orm/neon-http/migrator'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54821/drizzle_cube_db'

// Auto-detect Neon vs local PostgreSQL based on connection string
function isNeonUrl(url: string): boolean {
  return url.includes('.neon.tech') || url.includes('neon.database')
}

async function waitForDatabase(maxRetries = 30, retryDelay = 1000) {
  console.log('⏳ Waiting for database to be ready...')

  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = postgres(connectionString, { max: 1, connect_timeout: 5 })
      await client`SELECT 1`
      await client.end()
      console.log('✅ Database is ready!')
      return
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`⏳ Database not ready yet, retrying... (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        throw new Error(`Database did not become ready after ${maxRetries} attempts`)
      }
    }
  }
}

async function runMigration() {
  console.log('🔄 Running database migrations...')

  if (isNeonUrl(connectionString)) {
    console.log('🚀 Using Neon serverless database for migrations')
    const sql = neon(connectionString)
    const db = drizzleNeon(sql)

    try {
      await migrateNeon(db, { migrationsFolder: './drizzle' })
      console.log('✅ Migrations completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
  } else {
    console.log('🐘 Using local PostgreSQL database for migrations')

    // Wait for database to be ready before attempting migration
    try {
      await waitForDatabase()
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      process.exit(1)
    }

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
}

runMigration()