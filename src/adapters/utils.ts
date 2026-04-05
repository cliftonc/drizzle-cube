/**
 * Shared utilities for framework adapters
 * Common functions used across Express, Fastify, Next.js, and Hono adapters
 */

import { format } from 'sql-formatter'
import type {
  SemanticLayerCompiler,
  SemanticQuery,
  SecurityContext,
  QueryAnalysis,
  CubeDiscoveryResult,
  QuerySuggestion,
  AIValidationResult
} from '../server'
import {
  discoverCubes,
  suggestQuery,
  aiValidateQuery
} from '../server'
import type {
  MCPPromptResolver,
  MCPResourceResolver
} from './mcp-transport'
