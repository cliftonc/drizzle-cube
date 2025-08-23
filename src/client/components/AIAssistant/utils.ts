/**
 * Utility functions for AI Assistant
 */

import type { 
  GeminiMessageRequest,
  GeminiMessageResponse,
  SystemPromptVariables,
  AIConfig
} from './types'
import { 
  AI_PROXY_BASE_URL, 
  AI_STORAGE_KEY,
  DEFAULT_AI_CONFIG
} from './constants'

/**
 * Send a message to Gemini API via proxy
 */
export async function sendGeminiMessage(
  apiKey: string,
  message: string
): Promise<GeminiMessageResponse> {
  const requestBody: GeminiMessageRequest = {
    text: message
  }

  const headers = {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }

  console.log('🤖 Client: Sending message to Gemini via proxy')
  console.log('  URL:', `${AI_PROXY_BASE_URL}/generate`)
  console.log('  Headers:', headers)
  console.log('  Body:', requestBody)

  const response = await fetch(`${AI_PROXY_BASE_URL}/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  })

  console.log('📥 Client: Proxy response')
  console.log('  Status:', response.status)
  console.log('  Status Text:', response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Client: Proxy error:', errorText)
    throw new Error(`Failed to generate content: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  console.log('✅ Client: Successfully generated content')
  return data
}

/**
 * Replace placeholders in system prompt template
 */
export function buildSystemPrompt(
  template: string, 
  variables: SystemPromptVariables
): string {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })
  
  return result
}

/**
 * Format cube schema for AI prompt
 */
export function formatCubeSchemaForPrompt(schema: any): string {
  if (!schema || !schema.cubes) {
    return 'No cube schema available'
  }

  return JSON.stringify(schema, null, 2)
}

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
 * Extract text from Gemini message response and clean up formatting
 */
export function extractTextFromResponse(response: GeminiMessageResponse): string {
  const rawText = response.candidates?.[0]?.content?.parts
    ?.filter(part => part.text)
    ?.map(part => part.text)
    ?.join('') || ''

  // Clean up common markdown formatting that might appear
  return rawText
    .replace(/```json\s*/g, '') // Remove ```json
    .replace(/```\s*/g, '')     // Remove ```
    .replace(/^\s*```.*\n/gm, '') // Remove any remaining code block markers
    .trim()
}