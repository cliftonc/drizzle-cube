import { AIQueryResponse, AIConfig } from './types.js';
/**
 * Send a user prompt to AI proxy (server builds system prompt)
 */
export declare function sendGeminiMessage(apiKey: string, userPrompt: string, endpoint?: string, providerHeaders?: Record<string, string>): Promise<AIQueryResponse>;
/**
 * Save AI configuration to localStorage
 */
export declare function saveAIConfig(config: AIConfig): void;
/**
 * Load AI configuration from localStorage
 */
export declare function loadAIConfig(): AIConfig;
/**
 * Extract query text from simplified AI response and clean up formatting
 */
export declare function extractTextFromResponse(response: AIQueryResponse): string;
