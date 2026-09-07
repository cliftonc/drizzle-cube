/**
 * Notebook-agent prompt fragments.
 *
 * The agent used to inline `MCP_GUIDE_PROMPT` from `../ai/mcp-prompts.js`, which
 * documents the MCP transport's `discover` / `validate` / `load` tools. Those
 * are real tools — over MCP. The notebook agent has a different set entirely, so
 * the guide was naming tools it cannot call.
 *
 * `MCP_GUIDE_PROMPT` stays as it is: it is a public export and is served through
 * `ALL_PROMPTS`, so real MCP clients depend on it. This is the agent's own copy.
 * `QUERY_LANGUAGE_PROMPT` and `DATE_FILTERING_PROMPT` remain shared — they name
 * no tools and are correct for both.
 */
export declare const AGENT_WORKFLOW_GUIDE: string;
