/**
 * Types for AI Assistant functionality
 */

export interface GeminiMessageRequest {
  text?: string
  contents?: Array<{
    parts: Array<{
      text: string
    }>
  }>
}

export interface GeminiMessageResponse {
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

export interface AIConfig {
  provider: 'gemini'
  apiKey: string
}

export interface AIAssistantState {
  step: 'api-key' | 'query'
  apiKey: string
  systemPromptTemplate: string
  userPrompt: string
  isSubmitting: boolean
  response: string | null
  responseError: string | null
  isValidating: boolean
  validationResult: 'valid' | 'invalid' | null
  validationError: string | null
}

export interface SystemPromptVariables {
  CUBE_SCHEMA: string
  USER_PROMPT: string
}