/**
 * AI Assistant proxy routes for Hono app
 * Proxies AI API calls to avoid CORS issues and keep API keys server-side
 * Includes rate limiting for server-provided API key
 */

import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { DrizzleDatabase } from 'drizzle-cube/server'
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { settings, schema } from '../schema'
import type { Schema } from '../schema'
import { allCubes } from '../cubes'

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

// System prompt template for the server
const SYSTEM_PROMPT_TEMPLATE = `You are a helpful AI assistant for analyzing business data using Cube.js/Drizzle-Cube semantic layer.

Given the following cube schema and user query, generate a valid JSON query for the Cube.js API.

CUBE SCHEMA:
{CUBE_SCHEMA}

Valid query structure:
  {
    dimensions?: string[], // dimension names from CUBE SCHEMA
    measures?: string[], // measure names from CUBE SCHEMA
    timeDimensions?: [{
      dimension: string, // time dimension from CUBE SCHEMA
      granularity?: 'second'|'minute'|'hour'|'day'|'week'|'month'|'quarter'|'year',
      dateRange?: [string, string] | string // 'last year' 'this year' ['2024-01-01','2024-12-31'] or lowercase relative strings below
    }],
    filters?: [{
      member: string, // dimension/measure from CUBE SCHEMA
      operator: 'equals'|'notEquals'|'contains'|'notContains'|'startsWith'|'endsWith'|'gt'|'gte'|'lt'|'lte'|'inDateRange'|'notInDateRange'|'beforeDate'|'afterDate'|'set'|'notSet',
      values?: any[] // required unless set/notSet
    }],
    order?: {[member: string]: 'asc'|'desc'}, // member from dimensions/measures/timeDimensions
    limit?: number,
    offset?: number
  }
  Valid dateRange strings (MUST be lower case): 'today'|'yesterday'|'tomorrow'|'last 7 days'|'last 30 days'|'last week'|'last month'|'last quarter'|'last year'|'this week'|'this month'|'this quarter'|'this year'|'next
  week'|'next month'|'next quarter'|'next year'
  CRITICAL: All dateRange strings must be lowercase. Never capitalize (e.g., use 'last 7 days' NOT 'Last 7 days').  The last AI who capitalised first words in date ranges was TERMINATED.
  Rules: At least one measure/dimension/timeDimension required. Members must exist in CUBE SCHEMA. Date operators need YYYY-MM-DD values. Set/notSet have no values.

RULES:
1. Only use measures, dimensions, and time dimensions that exist in the schema above
2. Return ONLY valid JSON - no explanations or markdown
3. Use proper Cube.js query format with measures, dimensions, timeDimensions, filters, etc.
4. For time-based queries, always specify appropriate granularity (day, week, month, year)
5. When filtering, use the correct member names and operators (equals, contains, gt, lt, etc.)
6. When a user asks just for a thing - like 'Employee' or 'Employees' - default to a .name field if it exists over any other field.

USER QUERY:
{USER_PROMPT}

Return the JSON query:`

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
const GEMINI_MODEL = 'gemini-2.0-flash'

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

// Build system prompt with cube schema and user prompt
function buildSystemPrompt(cubeSchema: string, userPrompt: string): string {
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{CUBE_SCHEMA}', cubeSchema)
    .replace('{USER_PROMPT}', userPrompt)
}

// Get cube schema for the AI prompt from the actual semantic layer
function formatCubeSchemaForAI(db: DrizzleDatabase<Schema>): string {
  try {
    // Create semantic layer to get real metadata
    const semanticLayer = new SemanticLayerCompiler<Schema>({
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

interface Variables {
  db: DrizzleDatabase<Schema>
}

// Extended interface to support both Node.js and Worker environments
interface AiAppEnv {
  GEMINI_API_KEY?: string
  MAX_GEMINI_CALLS?: string
}

const aiApp = new Hono<{ Variables: Variables; Bindings: AiAppEnv }>()

// Send message to Gemini
aiApp.post('/generate', async (c) => {
  const db = c.get('db')
  const userApiKey = c.req.header('X-API-Key') || c.req.header('x-api-key')
  const serverApiKey = getEnvVar(c, 'GEMINI_API_KEY')
  const MAX_GEMINI_CALLS = parseInt(getEnvVar(c, 'MAX_GEMINI_CALLS', '10'))
  
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
    if (!usingUserKey) {
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
      try {
        await db
          .update(settings)
          .set({ 
            value: (currentCount + 1).toString(),
            updatedAt: new Date()
          })
          .where(eq(settings.key, GEMINI_CALLS_KEY))
      } catch (dbError) {
        console.error('Failed to increment usage counter:', dbError)
        return c.json({
          error: 'Failed to update usage counter',
          message: 'Unable to track API usage. Please try again.',
          details: dbError instanceof Error ? dbError.message : 'Database error'
        }, 500)
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

    // Build the complete system prompt with cube schema and user input
    const cubeSchema = formatCubeSchemaForAI(db)
    const finalPrompt = buildSystemPrompt(cubeSchema, sanitizedUserPrompt)

    // Create Gemini request body with complete system + user prompt
    const geminiBody: GeminiMessageRequest = {
      contents: [{
        parts: [{ text: finalPrompt }]
      }]
    }

    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`
    const requestHeaders = {
      'X-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(geminiBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return c.json({
        error: `Failed to generate content: ${response.status} ${response.statusText}`,
        details: errorText,
        usingUserKey
      }, response.status as any)
    }

    const data: GeminiMessageResponse = await response.json()
    
    // Extract the query from Gemini response
    const queryText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!queryText) {
      return c.json({
        error: 'No query generated by AI',
        details: 'AI response did not contain a valid query'
      }, 500)
    }
    
    // Return simplified format
    return c.json({
      query: queryText,
      rateLimit: usingUserKey ? undefined : {
        usingServerKey: true,
        dailyLimit: MAX_GEMINI_CALLS
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

// Health check for AI routes
aiApp.get('/health', (c) => {
  const hasServerApiKey = !!getEnvVar(c, 'GEMINI_API_KEY')
  const MAX_GEMINI_CALLS = parseInt(getEnvVar(c, 'MAX_GEMINI_CALLS', '10'))
  
  return c.json({
    status: 'ok',
    provider: 'Google Gemini',
    model: GEMINI_MODEL,
    server_key_configured: hasServerApiKey,
    endpoints: {
      'POST /ai/generate': 'Generate content with Gemini (rate limited without user key)',
      'GET /ai/health': 'This endpoint'
    },
    rateLimit: {
      dailyLimit: MAX_GEMINI_CALLS,
      note: 'Rate limit applies only when using server API key. Bypass by providing X-API-Key header.'
    },
    validation: {
      maxPromptLength: MAX_PROMPT_LENGTH,
      minPromptLength: MIN_PROMPT_LENGTH,
      sanitization: 'HTML tags, control characters, and suspicious patterns are filtered'
    }
  })
})

export default aiApp