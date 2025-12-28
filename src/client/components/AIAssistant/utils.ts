/**
 * Utility functions for AI Assistant
 */

import type { 
  AIQueryRequest,
  AIQueryResponse,
  AIConfig
} from './types'
import { 
  AI_STORAGE_KEY,
  DEFAULT_AI_CONFIG
} from './constants'

/**
 * Send a user prompt to AI proxy (server builds system prompt)
 */
export async function sendGeminiMessage(
  apiKey: string,
  userPrompt: string,
  endpoint: string = '/api/ai/generate'
): Promise<AIQueryResponse> {
  const requestBody: AIQueryRequest = {
    text: userPrompt // Send only the user's prompt, server handles system prompt
  }

  // Only add API key header if provided (allow empty string for server key)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (apiKey && apiKey.trim()) {
    headers['X-API-Key'] = apiKey
  }

  console.log('🤖 Client: Sending user prompt to AI proxy')
  console.log('  URL:', endpoint)
  console.log('  Headers:', headers)
  console.log('  User prompt length:', userPrompt.length)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  })

  console.log('📥 Client: Proxy response')
  console.log('  Status:', response.status)
  console.log('  Status Text:', response.statusText)

  if (!response.ok) {
    let errorMessage = `Failed to generate content: ${response.status} ${response.statusText}`
    
    try {
      // Try to parse JSON error response first
      const errorData = await response.json()
      console.error('❌ Client: Proxy error:', errorData)
      
      // Handle rate limit errors specially
      if (response.status === 429 && errorData.error === 'Daily quota exceeded') {
        throw new Error(
          `${errorData.message}\n\n${errorData.suggestion || 'Add your own Gemini API key for unlimited access.'}`
        )
      }
      
      // Handle other structured errors
      if (errorData.error) {
        errorMessage = errorData.message || errorData.error
        if (errorData.suggestion) {
          errorMessage += `\n\n💡 ${errorData.suggestion}`
        }
      }
    } catch {
      // Fallback to text if JSON parsing fails
      try {
        const errorText = await response.text()
        console.error('❌ Client: Proxy text error:', errorText)
        errorMessage = errorText || errorMessage
      } catch {
        console.error('❌ Client: Could not parse error response')
      }
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  console.log('✅ Client: Successfully generated content')
  return data
}

// Removed: buildSystemPrompt and formatCubeSchemaForPrompt 
// These functions are now handled server-side for better security

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save AI config to localStorage:', error)
  }
}

/**
 * Load AI configuration from localStorage
 */
export function loadAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...DEFAULT_AI_CONFIG, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load AI config from localStorage:', error)
  }
  return { ...DEFAULT_AI_CONFIG }
}

/**
 * Extract query text from simplified AI response and clean up formatting
 */
export function extractTextFromResponse(response: AIQueryResponse): string {
  const rawText = response.query || ''

  // Clean up common markdown formatting that might appear
  return rawText
    .replace(/```json\s*/g, '') // Remove ```json
    .replace(/```\s*/g, '')     // Remove ```
    .replace(/^\s*```.*\n/gm, '') // Remove any remaining code block markers
    .trim()
}