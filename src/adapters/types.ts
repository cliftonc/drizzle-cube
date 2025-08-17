/**
 * Common adapter interfaces for different frameworks
 * This allows consistent adapter patterns across frameworks
 */

import type { SemanticLayerCompiler, SecurityContext, DatabaseExecutor } from '../server'

/**
 * Base adapter configuration
 */
export interface BaseAdapterOptions {
  semanticLayer: SemanticLayerCompiler
  databaseExecutor?: DatabaseExecutor
  basePath?: string
}

/**
 * Framework-specific context extractor
 * Each framework adapter will provide their own context type
 */
export interface ContextExtractor<TContext = any> {
  (context: TContext): SecurityContext | Promise<SecurityContext>
}

/**
 * Standard CORS configuration
 */
export interface CorsConfig {
  origin?: string | string[] | ((origin: string) => boolean)
  allowMethods?: string[]
  allowHeaders?: string[]
  credentials?: boolean
}

/**
 * Standard adapter response format
 */
export interface AdapterResponse {
  data?: any
  error?: string
  status?: number
}

/**
 * Future adapter interface (for Express, Fastify, etc.)
 */
export interface AdapterFactory<TOptions extends BaseAdapterOptions, TApp = any> {
  createRoutes(options: TOptions): TApp
  mountRoutes?(app: TApp, options: TOptions): TApp
  createApp?(options: TOptions): TApp
}