/**
 * Database migration script
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { migrate as migrateNeon } from 'drizzle-orm/neon-http/migrator'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54921/drizzle_cube_db'

// Auto-detect Neon vs local PostgreSQL based on connection string
function isNeonUrl(url: string): boolean {
  return url.includes('.neon.tech') || url.includes('neon.database')
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