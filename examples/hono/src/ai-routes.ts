/**
 * AI Assistant proxy routes for Hono app
 * Proxies AI API calls to avoid CORS issues and keep API keys server-side
 */

import { Hono } from 'hono'

interface GeminiMessageRequest {
  contents: Array<{
    parts: Array<{
      text: string
    }>
  }>
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
const GEMINI_MODEL = 'gemini-2.0-flash'

// Get environment variable helper
function getEnvVar(key: string, fallback: string = ''): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback
  }
  return fallback
}

const aiApp = new Hono()

// Send message to Gemini
aiApp.post('/generate', async (c) => {
  const apiKey = c.req.header('X-API-Key') || c.req.header('x-api-key') || getEnvVar('GEMINI_API_KEY')
  
  if (!apiKey) {
    return c.json({
      error: 'API key required. Provide X-API-Key header or set GEMINI_API_KEY environment variable.'
    }, 400)
  }

  try {
    const requestBody = await c.req.json()
    
    // Simple validation - expect either text directly or Gemini format
    let geminiBody: GeminiMessageRequest
    
    if (typeof requestBody === 'string' || requestBody.text) {
      // Simple text input
      const text = typeof requestBody === 'string' ? requestBody : requestBody.text
      geminiBody = {
        contents: [{
          parts: [{ text }]
        }]
      }
    } else if (requestBody.contents) {
      // Already in Gemini format
      geminiBody = requestBody
    } else {
      return c.json({
        error: 'Invalid request body. Provide either "text" or "contents" in Gemini format'
      }, 400)
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
        details: errorText
      }, response.status as any)
    }

    const data: GeminiMessageResponse = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({
      error: 'Failed to generate content with Gemini API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Health check for AI routes
aiApp.get('/health', (c) => {
  const hasApiKey = !!(c.req.header('X-API-Key') || c.req.header('x-api-key') || getEnvVar('GEMINI_API_KEY'))
  
  return c.json({
    status: 'ok',
    provider: 'Google Gemini',
    model: GEMINI_MODEL,
    gemini_configured: hasApiKey,
    endpoints: {
      'POST /ai/generate': 'Generate content with Gemini',
      'GET /ai/health': 'This endpoint'
    },
    note: hasApiKey 
      ? 'Gemini API key configured' 
      : 'API key required: set GEMINI_API_KEY env var or pass X-API-Key header'
  })
})

export default aiApp