/**
 * LLM Provider Factory
 * Creates the appropriate provider instance based on configuration.
 */

import type { LLMProvider } from './types'

export type ProviderName = 'anthropic' | 'openai' | 'google'

/**
 * Create an LLM provider instance.
 *
 * @param provider - Provider name ('anthropic', 'openai', 'google')
 * @param apiKey - API key for the provider
 * @param options - Optional configuration (e.g. baseURL for OpenAI-compatible services)
 */
export async function createProvider(
  provider: ProviderName,
  apiKey: string,
  options?: { baseURL?: string }
): Promise<LLMProvider> {
  switch (provider) {
    case 'anthropic': {
      const { AnthropicProvider } = await import('./anthropic')
      return new AnthropicProvider(apiKey)
    }

    case 'openai': {
      const { OpenAIProvider } = await import('./openai')
      return new OpenAIProvider(apiKey, options)
    }

    case 'google': {
      const { GoogleProvider } = await import('./google')
      return new GoogleProvider(apiKey)
    }

    default:
      throw new Error(
        `Unknown LLM provider: "${provider}". Supported providers: anthropic, openai, google`
      )
  }
}
