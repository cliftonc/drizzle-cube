/**
 * MCP Prompts for AI Agents
 *
 * These prompts provide guidance for AI agents using the Drizzle Cube MCP server.
 * They help prevent common query mistakes and ensure correct query construction.
 *
 * Structure: 3 focused prompts (down from 4 redundant ones):
 * - MCP_GUIDE_PROMPT: Workflow (discover -> validate -> load) + cross-cube joins
 * - QUERY_LANGUAGE_PROMPT: TS DSL reference (single source of truth from query-schema.ts)
 * - DATE_FILTERING_PROMPT: Decision tree for the #1 mistake
 *
 * QUERY_RULES_PROMPT and QUERY_BUILDING_PROMPT are kept as backward-compatible aliases.
 */
export interface MCPPrompt {
    name: string;
    description: string;
    messages: Array<{
        role: 'user' | 'assistant';
        content: {
            type: 'text';
            text: string;
        };
    }>;
}
/**
 * Main workflow guide for using drizzle-cube MCP tools
 */
export declare const MCP_GUIDE_PROMPT: MCPPrompt;
/**
 * Query language reference — imports the TypeScript DSL from query-schema.ts
 * Replaces both QUERY_RULES_PROMPT and QUERY_BUILDING_PROMPT
 */
export declare const QUERY_LANGUAGE_PROMPT: MCPPrompt;
/**
 * Critical guide specifically for date filtering vs time grouping — the #1 mistake
 */
export declare const DATE_FILTERING_PROMPT: MCPPrompt;
/**
 * Backward-compatible alias — now references the unified query language prompt
 */
export declare const QUERY_RULES_PROMPT: MCPPrompt;
/**
 * Backward-compatible alias — now references the unified query language prompt
 */
export declare const QUERY_BUILDING_PROMPT: MCPPrompt;
/**
 * All MCP prompts for the Drizzle Cube server
 */
export declare const MCP_PROMPTS: MCPPrompt[];
/**
 * Get all default MCP prompts
 */
export declare function getDefaultMCPPrompts(): MCPPrompt[];
/**
 * Default instructions returned in the MCP `initialize` result.
 *
 * Per the MCP spec (InitializeResult.instructions), this string is the only
 * server-authored guidance that clients are expected to surface to the model
 * (e.g. by adding it to the system prompt). `prompts/*` and `resources/*` are
 * pull-based and are usually invoked by the *user* (slash commands) — not by
 * the model — so we cannot rely on them for correctness.
 *
 * The instructions therefore:
 *  1. Mandate the discover → (validate) → load workflow.
 *  2. Tell the model that the `discover` tool response itself contains the
 *     full query language reference (`queryLanguageReference`) and the date
 *     filtering decision tree (`dateFilteringGuide`). The model MUST read
 *     those fields before constructing any query — they are the source of
 *     truth for syntax, operators, and analysis modes.
 *  3. Inline the single most-violated rule (aggregated totals vs time
 *     series) so that even a model that ignores the discover payload still
 *     sees it once in its system prompt.
 *
 * Keep this body short (< ~2 KB) — long instructions get truncated or
 * deprioritised by some clients.
 */
export declare const DEFAULT_MCP_INSTRUCTIONS: string;
/**
 * Get the default MCP instructions string returned in the `initialize` result.
 * Exposed as a function (not just a const) so consumers can wrap or extend it
 * via the `instructions` resolver in `MCPOptions`.
 */
export declare function getDefaultMcpInstructions(): string;
