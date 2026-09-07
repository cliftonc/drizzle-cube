import { LLMProvider } from './types.js';
export type ProviderName = 'anthropic' | 'openai' | 'google';
/**
 * Create an LLM provider instance.
 *
 * @param provider - Provider name ('anthropic', 'openai', 'google')
 * @param apiKey - API key for the provider
 * @param options - Optional configuration (e.g. baseURL for OpenAI-compatible services)
 */
export declare function createProvider(provider: ProviderName, apiKey: string, options?: {
    baseURL?: string;
}): Promise<LLMProvider>;
