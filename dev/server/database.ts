/**
 * Database connection for the dev server and its scripts.
 *
 * Shared so the server and the seed agree on how a connection string is
 * interpreted — a Neon URL needs the HTTP driver, everything else the local
 * postgres one.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { schema } from './schema.js'

export function isNeonUrl(url: string): boolean {
  return url.includes('.neon.tech') || url.includes('neon.database')
}

export function createDatabase(databaseUrl: string) {
  if (isNeonUrl(databaseUrl)) {
    console.log('🚀 Connecting to Neon serverless database')
    return drizzleNeon(neon(databaseUrl), { schema })
  }
  console.log('🐘 Connecting to local PostgreSQL database')
  return drizzle(postgres(databaseUrl), { schema })
}
