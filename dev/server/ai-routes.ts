/**
 * AI Assistant proxy routes for Hono app
 * Proxies AI API calls to avoid CORS issues and keep API keys server-side
 * Includes rate limiting for server-provided API key
 */

import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { DrizzleDatabase } from '../../src/server/index.js'
import { SemanticLayerCompiler, createDatabaseExecutor } from '../../src/server/index.js'
import {
  buildStep0Prompt,
  buildSystemPrompt,
  buildStep1Prompt,
  buildStep2Prompt,
  buildExplainAnalysisPrompt,
  formatCubeSchemaForExplain,
  formatExistingIndexes
} from '../../src/server/prompts/index.js'
import type { Step0Result, Step1Result } from '../../src/server/prompts/index.js'
import type { ExplainResult, AIExplainAnalysis } from '../../src/server/types/executor.js'
import { settings, schema } from './schema.js'
import { allCubes } from './cubes.js'

interface GeminiMessageRequest {
  contents: Array<{
    parts: Array<{
      text: string
    }>
  }>
}

interface AIGenerateRequest {
  text: string
}

interface GeminiMessageResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
    finishReason: string
    index: number
  }>
  usageMetadata: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

// Default models for each step (can be overridden via GEMINI_MODEL env var)
// Format: "step0,step1,step2" or single model for all steps
// Step 0: Validation (fast/cheap recommended)
// Step 1: Shape analysis (fast/cheap recommended)
// Step 2: Query generation (more capable model recommended)
const DEFAULT_GEMINI_MODELS = {
  step0: 'gemini-2.0-flash-lite',      // Fast validation
  step1: 'gemini-2.0-flash-lite',      // Fast shape analysis
  step2: 'gemini-2.5-flash-preview-05-20'  // Full query generation
}

/**
 * Parse comma-delimited model string into per-step models
 * Format: "step0,step1,step2" or single model for all
 * Examples:
 *   "gemini-2.5-flash" -> all steps use gemini-2.5-flash
 *   "gemini-2.0-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash" -> step0/1 use lite, step2 uses flash
 */
function parseModelConfig(modelEnv: string | undefined): { step0: string; step1: string; step2: string } {
  if (!modelEnv) {
    return DEFAULT_GEMINI_MODELS
  }

  const parts = modelEnv.split(',').map(s => s.trim()).filter(Boolean)

  if (parts.length === 1) {
    // Single model for all steps
    return { step0: parts[0], step1: parts[0], step2: parts[0] }
  }

  if (parts.length === 2) {
    // Two models: first for step0/1, second for step2
    return { step0: parts[0], step1: parts[0], step2: parts[1] }
  }

  if (parts.length >= 3) {
    // Three models: one for each step
    return { step0: parts[0], step1: parts[1], step2: parts[2] }
  }

  return DEFAULT_GEMINI_MODELS
}

// Prompt validation configuration
const MAX_PROMPT_LENGTH = 500
const MIN_PROMPT_LENGTH = 1

// Sanitize prompt by removing potentially harmful content
function sanitizePrompt(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Trim whitespace
  let sanitized = text.trim()

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Normalize excessive whitespace (but preserve single newlines)
  sanitized = sanitized.replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines

  // Remove potentially harmful HTML/script tags (basic sanitization)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  sanitized = sanitized.replace(/&lt;/g, '<')
  sanitized = sanitized.replace(/&gt;/g, '>')
  sanitized = sanitized.replace(/&amp;/g, '&')
  sanitized = sanitized.replace(/&quot;/g, '"')
  sanitized = sanitized.replace(/&#x27;/g, "'")

  return sanitized.trim()
}

// Validate prompt content and length
function validatePrompt(text: string): { isValid: boolean; message?: string } {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      message: 'Prompt cannot be empty'
    }
  }

  const trimmedText = text.trim()

  if (trimmedText.length < MIN_PROMPT_LENGTH) {
    return {
      isValid: false,
      message: 'Prompt is too short (minimum 1 character)'
    }
  }

  if (trimmedText.length > MAX_PROMPT_LENGTH) {
    return {
      isValid: false,
      message: `Prompt is too long (maximum ${MAX_PROMPT_LENGTH} characters, got ${trimmedText.length})`
    }
  }

  // Additional content validation
  const suspiciousPatterns = [
    /system\s*(prompt|override|ignore)/i,
    /ignore\s*(previous|instructions|prompt)/i,
    /you\s*are\s*now/i,
    /forget\s*(everything|all|instructions)/i
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedText)) {
      return {
        isValid: false,
        message: 'Prompt contains potentially harmful content'
      }
    }
  }

  return { isValid: true }
}

// Get cube schema for the AI prompt from the actual semantic layer
function formatCubeSchemaForAI(db: DrizzleDatabase): string {
  try {
    // Create semantic layer to get real metadata
    const semanticLayer = new SemanticLayerCompiler({
      drizzle: db,
      schema,
      engineType: 'postgres'
    })

    // Register all cubes
    allCubes.forEach(cube => {
      semanticLayer.registerCube(cube)
    })

    const metadata = semanticLayer.getMetadata()

    // Format the metadata for AI consumption
    const cubes: Record<string, any> = {}

    for (const cube of metadata) {
      cubes[cube.name] = {
        title: cube.title,
        description: cube.description,
        measures: cube.measures.reduce((acc, measure) => {
          acc[measure.name] = {
            type: measure.type,
            title: measure.title,
            description: measure.description
          }
          return acc
        }, {} as Record<string, any>),
        dimensions: cube.dimensions.reduce((acc, dimension) => {
          acc[dimension.name] = {
            type: dimension.type,
            title: dimension.title,
            description: dimension.description
          }
          return acc
        }, {} as Record<string, any>)
      }

      // Separate time dimensions from regular dimensions for clarity
      const timeDimensions: Record<string, any> = {}
      for (const dimension of cube.dimensions) {
        if (dimension.type === 'time') {
          timeDimensions[dimension.name] = {
            type: dimension.type,
            title: dimension.title,
            description: dimension.description
          }
          // Remove from regular dimensions
          delete cubes[cube.name].dimensions[dimension.name]
        }
      }

      if (Object.keys(timeDimensions).length > 0) {
        cubes[cube.name].timeDimensions = timeDimensions
      }

      // Include eventStream metadata if present (enables funnel analysis)
      if (cube.meta?.eventStream) {
        cubes[cube.name].eventStream = {
          bindingKey: cube.meta.eventStream.bindingKey,
          timeDimension: cube.meta.eventStream.timeDimension
        }
      }
    }

    return JSON.stringify({ cubes }, null, 2)
  } catch (error) {
    console.error('Error loading cube schema for AI:', error)
    // Fallback to basic schema if there's an error
    return JSON.stringify({
      cubes: {
        Employees: {
          measures: { count: { type: "count", title: "Employee Count" } },
          dimensions: { name: { type: "string", title: "Employee Name" } }
        }
      }
    }, null, 2)
  }
}

// Helper to query distinct values for a dimension
async function getDistinctValues(
  db: DrizzleDatabase,
  fieldName: string,
  securityContext: { organisationId: number },
  limit: number = 100
): Promise<string[]> {
  try {
    // Create semantic layer for the query
    const semanticLayer = new SemanticLayerCompiler({
      drizzle: db,
      schema,
      engineType: 'postgres'
    })

    // Register all cubes
    allCubes.forEach(cube => {
      semanticLayer.registerCube(cube)
    })

    // Execute a simple query to get distinct values
    const result = await semanticLayer.execute({
      dimensions: [fieldName],
      limit,
      order: { [fieldName]: 'asc' }
    }, securityContext)

    // Extract unique values from the result
    return result.data
      .map((row: any) => row[fieldName])
      .filter((v: any) => v !== null && v !== undefined && v !== '')
  } catch (err) {
    console.warn(`Failed to get distinct values for ${fieldName}:`, err)
    return []
  }
}

// Helper to extract table names from a SQL query
function extractTableNames(sqlQuery: string): string[] {
  const tablePattern = /(?:FROM|JOIN)\s+["']?(\w+)["']?/gi
  const tables = new Set<string>()
  let match
  while ((match = tablePattern.exec(sqlQuery)) !== null) {
    tables.add(match[1].toLowerCase())
  }
  return Array.from(tables)
}

// Helper to call Gemini API
async function callGemini(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data: GeminiMessageResponse = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response text from Gemini')
  }

  return text
}

// Parse JSON from AI response (handles markdown code blocks)
function parseAIResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  return JSON.parse(cleaned)
}

// Get environment variable helper - works in both Node.js and Worker contexts
function getEnvVar(c: any, key: string, fallback: string = ''): string {
  // Try worker/cloudflare env first
  if (c && c.env && c.env[key]) {
    return c.env[key]
  }
  // Fallback to Node.js process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]
  }
  return fallback
}

const GEMINI_CALLS_KEY = 'gemini-ai-calls'

interface SecurityContext {
  organisationId: number
  userId?: number
}

interface Variables {
  db: DrizzleDatabase
  extractSecurityContext: (c: any) => Promise<SecurityContext>
}

// Extended interface to support both Node.js and Worker environments
interface AiAppEnv {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  MAX_GEMINI_CALLS?: string
}

const aiApp = new Hono<{ Variables: Variables; Bindings: AiAppEnv }>()

// Send message to Gemini
aiApp.post('/generate', async (c) => {
  const db = c.get('db')
  const userApiKey = c.req.header('X-API-Key') || c.req.header('x-api-key')
  const serverApiKey = getEnvVar(c, 'GEMINI_API_KEY')
  const MAX_GEMINI_CALLS = parseInt(getEnvVar(c, 'MAX_GEMINI_CALLS', '100'))

  // Determine which API key to use
  const usingUserKey = !!userApiKey
  const apiKey = userApiKey || serverApiKey

  if (!apiKey) {
    return c.json({
      error: 'No API key available. Either provide X-API-Key header or ensure server has GEMINI_API_KEY configured.',
      suggestion: 'Add your own Gemini API key to bypass daily limits.'
    }, 400)
  }

  try {
    // If using server API key, check rate limits
    if (!usingUserKey && db) {
      try {
        // Get current usage count
        const currentUsage = await db
          .select()
          .from(settings)
          .where(eq(settings.key, GEMINI_CALLS_KEY))
          .limit(1)

        const currentCount = currentUsage.length > 0 ? parseInt(currentUsage[0].value) : 0

        if (currentCount >= MAX_GEMINI_CALLS) {
          return c.json({
            error: 'Daily quota exceeded',
            message: `You've used all ${MAX_GEMINI_CALLS} free AI requests for today. Try again tomorrow or add your own Gemini API key for unlimited access.`,
            quotaInfo: {
              used: currentCount,
              limit: MAX_GEMINI_CALLS,
              resetTime: 'Daily at midnight'
            },
            suggestion: 'Get your free Gemini API key at https://makersuite.google.com/app/apikey'
          }, 429)
        }

        // Increment the counter BEFORE making the API call
        if (currentUsage.length > 0) {
          await db
            .update(settings)
            .set({
              value: (currentCount + 1).toString(),
              updatedAt: new Date()
            })
            .where(eq(settings.key, GEMINI_CALLS_KEY))
        } else {
          // Insert new counter if it doesn't exist
          await db
            .insert(settings)
            .values({
              key: GEMINI_CALLS_KEY,
              value: '1',
              organisationId: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            })
        }
      } catch (dbError) {
        // Log but continue - don't block API calls if rate limiting fails
        console.error('Rate limiting check failed, continuing without limit:', dbError)
      }
    }

    const requestBody: AIGenerateRequest = await c.req.json()

    // Extract user prompt from request body
    if (!requestBody.text) {
      return c.json({
        error: 'Invalid request body. Please provide "text" field with your prompt.'
      }, 400)
    }

    const userPrompt = requestBody.text

    // Sanitize and validate ONLY the user prompt
    const sanitizedUserPrompt = sanitizePrompt(userPrompt)
    const validationResult = validatePrompt(sanitizedUserPrompt)

    if (!validationResult.isValid) {
      return c.json({
        error: 'Invalid prompt',
        message: validationResult.message,
        suggestion: 'Please shorten your prompt and try again.'
      }, 400)
    }

    // Parse model configuration (supports comma-delimited: "step0,step1,step2")
    const modelConfig = parseModelConfig(getEnvVar(c, 'GEMINI_MODEL'))
    const cubeSchema = formatCubeSchemaForAI(db)

    // Get security context for dimension value queries
    const extractSecurityContext = c.get('extractSecurityContext')
    let securityContext: SecurityContext = { organisationId: 1 }
    if (extractSecurityContext) {
      try {
        securityContext = await extractSecurityContext(c)
      } catch (err) {
        console.warn('Failed to extract security context, using default:', err)
      }
    }

    // STEP 0: Validate input for security and relevance
    console.log('[AI] Step 0: Validating input...', { model: modelConfig.step0 })
    const step0Prompt = buildStep0Prompt(sanitizedUserPrompt)
    const step0Response = await callGemini(step0Prompt, apiKey, modelConfig.step0)

    let step0Result: Step0Result
    try {
      step0Result = parseAIResponse(step0Response)
    } catch (err) {
      console.error('[AI] Failed to parse Step 0 response:', step0Response)
      // If validation parsing fails, continue cautiously (already passed basic sanitization)
      step0Result = { isValid: true, explanation: 'Validation parse failed, proceeding with caution' }
    }

    console.log('[AI] Step 0 result:', JSON.stringify(step0Result, null, 2))

    // Reject invalid inputs
    if (!step0Result.isValid) {
      const rejectionMessages: Record<string, string> = {
        injection: 'Your request appears to contain instructions that could compromise the system.',
        security: 'Your request appears to be attempting to access unauthorized data.',
        off_topic: 'Your request doesn\'t appear to be related to data analysis. Try asking about metrics, trends, or reports.',
        unclear: 'Your request is too vague. Please provide more details about what data you\'d like to analyze.'
      }

      return c.json({
        error: 'Request rejected',
        message: rejectionMessages[step0Result.rejectionReason || 'unclear'] || step0Result.explanation,
        rejectionReason: step0Result.rejectionReason,
        suggestion: 'Please rephrase your request to focus on data analysis.'
      }, 400)
    }

    // STEP 1: Determine query shape and what dimensions need values
    console.log('[AI] Step 1: Determining query shape...', { model: modelConfig.step1 })
    const step1Prompt = buildStep1Prompt(cubeSchema, sanitizedUserPrompt)
    const step1Response = await callGemini(step1Prompt, apiKey, modelConfig.step1)

    let step1Result: Step1Result
    try {
      step1Result = parseAIResponse(step1Response)
    } catch (err) {
      console.error('[AI] Failed to parse Step 1 response:', step1Response)
      // Fall back to single-step if Step 1 parsing fails
      const finalPrompt = buildSystemPrompt(cubeSchema, sanitizedUserPrompt)
      const queryText = await callGemini(finalPrompt, apiKey, modelConfig.step2)
      return c.json({
        query: queryText,
        rateLimit: usingUserKey ? undefined : {
          usingServerKey: true,
          dailyLimit: MAX_GEMINI_CALLS
        }
      })
    }

    console.log('[AI] Step 1 result:', JSON.stringify(step1Result, null, 2))

    // If no dimensions need values, use single-step generation
    if (!step1Result.dimensionsNeedingValues?.length) {
      console.log('[AI] No dimensions need values, using single-step generation')
      const finalPrompt = buildSystemPrompt(cubeSchema, sanitizedUserPrompt)
      const queryText = await callGemini(finalPrompt, apiKey, modelConfig.step2)
      return c.json({
        query: queryText,
        rateLimit: usingUserKey ? undefined : {
          usingServerKey: true,
          dailyLimit: MAX_GEMINI_CALLS
        }
      })
    }

    // STEP 2: Fetch actual values for requested dimensions
    console.log('[AI] Step 2: Fetching dimension values for:', step1Result.dimensionsNeedingValues)
    const dimensionValues: Record<string, string[]> = {}

    for (const dim of step1Result.dimensionsNeedingValues) {
      try {
        const values = await getDistinctValues(db, dim, securityContext)
        dimensionValues[dim] = values
        console.log(`[AI] Values for ${dim}:`, values)
      } catch (err) {
        console.warn(`[AI] Failed to get values for ${dim}:`, err)
        dimensionValues[dim] = []
      }
    }

    // STEP 3: Complete query with actual values
    console.log('[AI] Step 3: Completing query with actual values...', { model: modelConfig.step2 })
    const step2Prompt = buildStep2Prompt(cubeSchema, sanitizedUserPrompt, dimensionValues)
    const queryText = await callGemini(step2Prompt, apiKey, modelConfig.step2)

    console.log('[AI] Final query generated successfully')

    // Return simplified format
    return c.json({
      query: queryText,
      rateLimit: usingUserKey ? undefined : {
        usingServerKey: true,
        dailyLimit: MAX_GEMINI_CALLS
      },
      _debug: {
        multiStep: true,
        dimensionsQueried: Object.keys(dimensionValues),
        models: modelConfig
      }
    })
  } catch (error) {
    return c.json({
      error: 'Failed to generate content with Gemini API',
      details: error instanceof Error ? error.message : 'Unknown error',
      usingUserKey
    }, 500)
  }
})

// Analyze EXPLAIN plan with AI recommendations
aiApp.post('/explain/analyze', async (c) => {
  const db = c.get('db')
  const userApiKey = c.req.header('X-API-Key') || c.req.header('x-api-key')
  const serverApiKey = getEnvVar(c, 'GEMINI_API_KEY')
  const MAX_GEMINI_CALLS = parseInt(getEnvVar(c, 'MAX_GEMINI_CALLS', '100'))

  // Determine which API key to use
  const usingUserKey = !!userApiKey
  const apiKey = userApiKey || serverApiKey

  if (!apiKey) {
    return c.json({
      error: 'No API key available. Either provide X-API-Key header or ensure server has GEMINI_API_KEY configured.',
      suggestion: 'Add your own Gemini API key to use AI analysis.'
    }, 400)
  }

  try {
    // If using server API key, check rate limits
    if (!usingUserKey && db) {
      try {
        const currentUsage = await db
          .select()
          .from(settings)
          .where(eq(settings.key, GEMINI_CALLS_KEY))
          .limit(1)

        const currentCount = currentUsage.length > 0 ? parseInt(currentUsage[0].value) : 0

        if (currentCount >= MAX_GEMINI_CALLS) {
          return c.json({
            error: 'Daily quota exceeded',
            message: `You've used all ${MAX_GEMINI_CALLS} free AI requests for today.`,
            suggestion: 'Get your free Gemini API key at https://makersuite.google.com/app/apikey'
          }, 429)
        }

        // Increment the counter
        if (currentUsage.length > 0) {
          await db
            .update(settings)
            .set({
              value: (currentCount + 1).toString(),
              updatedAt: new Date()
            })
            .where(eq(settings.key, GEMINI_CALLS_KEY))
        } else {
          await db
            .insert(settings)
            .values({
              key: GEMINI_CALLS_KEY,
              value: '1',
              organisationId: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            })
        }
      } catch (dbError) {
        console.error('Rate limiting check failed, continuing without limit:', dbError)
      }
    }

    const requestBody = await c.req.json()
    const { explainResult, query } = requestBody as {
      explainResult: ExplainResult
      query: any
    }

    if (!explainResult || !query) {
      return c.json({
        error: 'Invalid request body. Please provide "explainResult" and "query" fields.'
      }, 400)
    }

    // Get cube metadata for context
    const semanticLayer = new SemanticLayerCompiler({
      drizzle: db,
      schema,
      engineType: 'postgres'
    })

    allCubes.forEach(cube => {
      semanticLayer.registerCube(cube)
    })

    const metadata = semanticLayer.getMetadata()
    const cubeSchema = formatCubeSchemaForExplain(metadata)

    // Get existing indexes for tables in the query
    const executor = createDatabaseExecutor(db, schema, 'postgres')
    const tableNames = extractTableNames(explainResult.sql.sql)
    const existingIndexes = await executor.getTableIndexes(tableNames)
    const formattedIndexes = formatExistingIndexes(existingIndexes)

    console.log('[AI] Found existing indexes:', { tables: tableNames, indexCount: existingIndexes.length })

    // Build the analysis prompt
    const modelConfig = parseModelConfig(getEnvVar(c, 'GEMINI_MODEL'))
    const analysisModel = modelConfig.step2 // Use the capable model for analysis

    console.log('[AI] Analyzing EXPLAIN plan...', { model: analysisModel })

    const prompt = buildExplainAnalysisPrompt(
      explainResult.summary.database,
      cubeSchema,
      JSON.stringify(query, null, 2),
      explainResult.sql.sql,
      JSON.stringify(explainResult.operations, null, 2),
      explainResult.raw,
      formattedIndexes
    )

    const response = await callGemini(prompt, apiKey, analysisModel)

    let analysis: AIExplainAnalysis
    try {
      analysis = parseAIResponse(response)
    } catch (err) {
      console.error('[AI] Failed to parse EXPLAIN analysis response:', response)
      return c.json({
        error: 'Failed to parse AI response',
        rawResponse: response.substring(0, 500)
      }, 500)
    }

    console.log('[AI] EXPLAIN analysis completed:', {
      assessment: analysis.assessment,
      issueCount: analysis.issues?.length || 0,
      recommendationCount: analysis.recommendations?.length || 0
    })

    return c.json({
      ...analysis,
      _meta: {
        model: analysisModel,
        usingUserKey
      }
    })
  } catch (error) {
    console.error('[AI] EXPLAIN analysis error:', error)
    return c.json({
      error: 'Failed to analyze EXPLAIN plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Health check for AI routes
aiApp.get('/health', (c) => {
  const hasServerApiKey = !!getEnvVar(c, 'GEMINI_API_KEY')
  const MAX_GEMINI_CALLS = parseInt(getEnvVar(c, 'MAX_GEMINI_CALLS', '100'))
  const modelConfig = parseModelConfig(getEnvVar(c, 'GEMINI_MODEL'))

  return c.json({
    status: 'ok',
    provider: 'Google Gemini',
    models: {
      step0: { model: modelConfig.step0, purpose: 'Input validation (fast/cheap)' },
      step1: { model: modelConfig.step1, purpose: 'Query shape analysis (fast/cheap)' },
      step2: { model: modelConfig.step2, purpose: 'Query generation (capable)' }
    },
    modelConfig: 'Set GEMINI_MODEL as comma-delimited "step0,step1,step2" or single model for all',
    server_key_configured: hasServerApiKey,
    endpoints: {
      'POST /api/ai/generate': 'Generate semantic query from natural language (rate limited without user key)',
      'POST /api/ai/explain/analyze': 'Analyze EXPLAIN plan and provide performance recommendations',
      'GET /api/ai/health': 'This endpoint'
    },
    pipeline: [
      'Step 0: Validate input for security/relevance',
      'Step 1: Analyze query shape, identify dimensions needing values',
      'Step 2: Fetch dimension values from DB (with security context)',
      'Step 3: Generate final query with actual values'
    ],
    rateLimit: {
      dailyLimit: MAX_GEMINI_CALLS,
      note: 'Rate limit applies only when using server API key. Bypass by providing X-API-Key header.'
    },
    validation: {
      maxPromptLength: MAX_PROMPT_LENGTH,
      minPromptLength: MIN_PROMPT_LENGTH,
      sanitization: 'HTML tags, control characters, and suspicious patterns are filtered',
      step0Validation: 'AI-based validation for injection, security, and relevance'
    }
  })
})

export default aiApp
