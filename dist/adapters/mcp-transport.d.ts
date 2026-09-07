import { SemanticLayerCompiler, SecurityContext } from '../server/index.js';
import { MCPPrompt } from '../server/ai/mcp-prompts.js';
import { McpAppConfig } from './utils.js';
export type { McpAppConfig };
export { type MCPPrompt };
export declare const MCP_APP_RESOURCE_URI = "ui://drizzle-cube/visualization.html";
export declare const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app";
/** Get the bundled MCP App HTML, optionally with locale config injected. Returns empty string if not yet built. */
export declare function getMcpAppHtml(config?: McpAppConfig): string;
export type JsonRpcId = string | number | null | undefined;
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: JsonRpcId;
    method: string;
    params?: unknown;
}
export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: JsonRpcId;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
export interface McpDispatchContext {
    semanticLayer: SemanticLayerCompiler;
    extractSecurityContext: (req: any, res: any) => SecurityContext | Promise<SecurityContext>;
    rawRequest: unknown;
    rawResponse: unknown;
    negotiatedProtocol?: string | null;
    resources?: MCPResource[];
    prompts?: MCPPrompt[];
    /**
     * Pre-resolved instructions string returned in the `initialize` result
     * (`InitializeResult.instructions` per MCP spec). When omitted, falls
     * back to `getDefaultMcpInstructions()`. Adapters resolve this from the
     * `MCPOptions.instructions` resolver before calling `dispatchMcpMethod`.
     */
    instructions?: string;
    /** Enable MCP App visualization for load tool */
    appEnabled?: boolean;
    /** Locale configuration for the MCP App (only used when appEnabled is true) */
    appConfig?: McpAppConfig;
    /** Optional name for the MCP serverInfo.name field. Defaults to 'drizzle-cube'. */
    serverName?: string;
}
export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    text: string;
}
export type MCPPromptResolver = MCPPrompt[] | ((defaults: MCPPrompt[]) => MCPPrompt[]);
export type MCPResourceResolver = MCPResource[] | ((defaults: MCPResource[]) => MCPResource[]);
export type MCPInstructionsResolver = string | ((defaults: string) => string);
export interface ProtocolNegotiation {
    ok: boolean;
    negotiated: string | null;
    supported: string[];
}
export declare const SUPPORTED_MCP_PROTOCOLS: string[];
export declare const DEFAULT_MCP_PROTOCOL = "2025-11-25";
export declare function negotiateProtocol(headers: Record<string, string | string[] | undefined>): ProtocolNegotiation;
export declare function wantsEventStream(accept: string | null | undefined): boolean;
/**
 * MCP Session ID header name (per 2025-11-25 spec)
 */
export declare const MCP_SESSION_ID_HEADER = "mcp-session-id";
/**
 * MCP Protocol Version header name (per 2025-11-25 spec)
 */
export declare const MCP_PROTOCOL_VERSION_HEADER = "mcp-protocol-version";
/**
 * Validate the Accept header per MCP 2025-11-25 spec.
 * Client MUST include both `application/json` and `text/event-stream` as supported content types.
 *
 * @returns true if valid, false if invalid
 */
export declare function validateAcceptHeader(accept: string | null | undefined): boolean;
export interface OriginValidationOptions {
    /**
     * List of allowed origins (e.g., ['http://localhost:3000', 'https://myapp.com']).
     * If not provided, the default policy admits loopback origins (localhost / 127.x /
     * [::1]) plus non-browser clients that send no Origin header; any other browser
     * Origin is rejected. Include the wildcard `'*'` to allow ALL origins (permissive
     * mode — discouraged; prefer listing exact origins or enabling auth).
     */
    allowedOrigins?: string[];
    /**
     * If true, allows requests without an Origin header (non-browser / server-to-server
     * clients such as the Claude MCP connector, curl, Postman).
     * @default true
     */
    allowMissingOrigin?: boolean;
}
/**
 * Validate the Origin header per MCP 2025-11-25 spec.
 * Servers MUST validate Origin to prevent DNS rebinding attacks.
 * If Origin is present and invalid, MUST respond with 403 Forbidden.
 *
 * Default policy (no `allowedOrigins`): admit loopback origins and requests with no
 * Origin header (non-browser / server-to-server clients); reject every other browser
 * Origin. Configure `allowedOrigins` to expose a browser front-end, or include `'*'`
 * to restore fully-permissive behavior.
 *
 * @returns { valid: true } if allowed, or { valid: false, reason: string } if blocked
 */
export declare function validateOriginHeader(origin: string | null | undefined, options?: OriginValidationOptions): {
    valid: true;
} | {
    valid: false;
    reason: string;
};
/**
 * Build {@link OriginValidationOptions} from an MCP config, forwarding the
 * configured allowlist (if any) so `validateOriginHeader` applies the same policy
 * for POST, GET, and DELETE `/mcp` across every adapter. When `allowedOrigins` is
 * absent, the loopback-only default policy applies.
 */
export declare function originOptionsFromMcp(mcp: {
    allowedOrigins?: string[];
}): OriginValidationOptions;
/**
 * Extract a Bearer token from an Authorization header.
 * Returns the token string if present and well-formed, or null otherwise.
 */
export declare function extractBearerToken(authHeader: string | null | undefined): string | null;
/**
 * Build a WWW-Authenticate challenge header value per MCP / RFC 9728.
 * Points the client to the Protected Resource Metadata document so it can
 * discover the authorization server and begin the OAuth 2.1 flow.
 */
export declare function buildWwwAuthenticateChallenge(resourceMetadataUrl: string): string;
export declare function serializeSseEvent(payload: unknown, eventId?: string, retryMs?: number): string;
export declare function buildJsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse;
export declare function buildJsonRpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse;
export declare function parseJsonRpc(body: unknown): JsonRpcRequest | null;
export declare function dispatchMcpMethod(method: string, params: unknown, ctx: McpDispatchContext): Promise<unknown>;
export declare function jsonRpcError(code: number, message: string, data?: unknown): Error & {
    code: number;
    data?: unknown;
};
export declare function normalizeHeader(value: string | string[] | undefined): string | null;
export declare function isNotification(request: JsonRpcRequest): boolean;
export declare function primeEventId(): string;
export declare function buildToolList(options?: {
    appEnabled?: boolean;
}): {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    _meta?: unknown;
}[];
export declare function getDefaultResources(): MCPResource[];
export declare function getDefaultPrompts(): MCPPrompt[];
/**
 * Default instructions string returned in `InitializeResult.instructions`.
 * Re-exported here so adapter consumers don't need to reach into `server/ai`.
 */
export declare function getDefaultInstructions(): string;
export declare function resolveMcpPrompts(prompts?: MCPPromptResolver): MCPPrompt[];
export declare function resolveMcpResources(resources?: MCPResourceResolver): MCPResource[];
/**
 * Resolve the MCP instructions string for the `initialize` response.
 *
 * - `undefined` → returns the built-in defaults.
 * - `string`    → replaces the defaults entirely.
 * - `(defaults) => string` → derive from / extend the defaults (e.g. append
 *   project-specific guidance like custom cube semantics).
 */
export declare function resolveMcpInstructions(instructions?: MCPInstructionsResolver): string;
/**
 * The `drizzle-cube://schema` resource: this caller's cube metadata as JSON.
 *
 * Its body is tenant-specific, so it must be built per request under the
 * caller's security context. Building it once at handler construction — as this
 * used to be — would freeze every tenant's view to the base set.
 */
export declare function buildMcpSchemaResource(semanticLayer: SemanticLayerCompiler, securityContext: SecurityContext): MCPResource;
/**
 * Static resources plus this caller's schema resource. Call per request, never
 * at setup time — see {@link buildMcpSchemaResource}.
 */
export declare function buildMcpResources(semanticLayer: SemanticLayerCompiler, securityContext: SecurityContext, resources?: MCPResourceResolver): MCPResource[];
