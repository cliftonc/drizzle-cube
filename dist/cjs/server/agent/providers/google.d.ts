import { LLMProvider, ToolDefinition, InternalMessage, ToolResult, NormalizedEvent } from './types.js';
export declare class GoogleProvider implements LLMProvider {
    private apiKey;
    private sdk;
    private initialized;
    constructor(apiKey: string);
    private ensureSDK;
    createStream(params: {
        model: string;
        maxTokens: number;
        system: string;
        tools: ToolDefinition[];
        messages: InternalMessage[];
    }): Promise<AsyncIterable<unknown>>;
    parseStreamEvents(stream: AsyncIterable<unknown>): AsyncGenerator<NormalizedEvent>;
    formatTools(tools: ToolDefinition[]): unknown[];
    formatMessages(messages: InternalMessage[], _system: string): {
        messages: unknown[];
    };
    formatToolResults(results: ToolResult[]): unknown;
    shouldContinue(stopReason: string): boolean;
    isTruncated(stopReason: string): boolean;
    formatError(error: unknown): string;
}
