/**
 * Dynamic schema types for test utilities
 * This file provides type definitions that work across database types
 */

import type { TestSchema as PostgresTestSchema } from './databases/postgres/schema'
import type { MySQLTestSchema } from './databases/mysql/schema'

// Union type for all supported test schemas
export type TestSchema = PostgresTestSchema | MySQLTestSchema

// Re-export specific schema types for backwards compatibility
export type { TestSchema as PostgresTestSchema } from './databases/postgres/schema'
export type { MySQLTestSchema } from './databases/mysql/schema'

/**
 * Get the correct test schema type for the current database type
 * This is a type-only export for TypeScript inference
 */
export type DynamicTestSchema<T extends 'postgres' | 'mysql'> = 
  T extends 'postgres' ? PostgresTestSchema : MySQLTestSchema