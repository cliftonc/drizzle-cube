import { LLMProvider, ToolDefinition, InternalMessage, ToolResult, NormalizedEvent } from './types.js';
export declare class OpenAIProvider implements LLMProvider {
    private client;
    private apiKey;
    private baseURL?;
    private initialized;
    constructor(apiKey: string, options?: {
        baseURL?: string;
    });
    private ensureClient;
    createStream(params: {
        model: string;
        maxTokens: number;
        system: string;
        tools: ToolDefinition[];
        messages: InternalMessage[];
    }): Promise<AsyncIterable<unknown>>;
    parseStreamEvents(stream: AsyncIterable<unknown>): AsyncGenerator<NormalizedEvent>;
    formatTools(tools: ToolDefinition[]): unknown[];
    formatMessages(messages: InternalMessage[], system: string): {
        messages: unknown[];
    };
    formatToolResults(results: ToolResult[]): unknown[];
    shouldContinue(stopReason: string): boolean;
    isTruncated(stopReason: string): boolean;
    formatError(error: unknown): string;
}
