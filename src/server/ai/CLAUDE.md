# AI-Ready Data Layer Utilities

Schema-aware intelligence utilities for AI agents — pure heuristic and schema-based logic with **no LLM calls**. Provides cube discovery, natural-language query suggestion, query validation/correction, and MCP prompt templates. These utilities are consumed by the `../agent/` module (which adds the LLM layer) and by MCP server integrations.

## Directory Layout

```
src/server/ai/
├── index.ts          Barrel exports
├── discovery.ts      discoverCubes, findBestFieldMatch — schema search and field matching
├── suggestion.ts     suggestQuery — natural-language to SemanticQuery conversion
├── validation.ts     validateQuery — query correctness checking with error/warning output
├── mcp-prompts.ts    MCP_PROMPTS, prompt templates for LLM-based query building
└── schemas.ts        QUERY_SCHEMAS — JSON schemas describing SemanticQuery structure
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `discoverCubes` | `discovery.ts` | Search cubes by name/description; returns matching cubes with measures and dimensions |
| `findBestFieldMatch` | `discovery.ts` | Fuzzy-match a field name against cube schema; returns best candidate with score |
| `suggestQuery` | `suggestion.ts` | Converts natural-language descriptions into `SemanticQuery` objects using heuristics |
| `validateQuery` | `validation.ts` | Validates a query against cube definitions; returns `ValidationResult` with errors and warnings |
| `MCP_PROMPTS` | `mcp-prompts.ts` | Array of 4 prompt templates: guide, query rules, query building, date filtering |
| `MCP_GUIDE_PROMPT` | `mcp-prompts.ts` | Top-level MCP integration guide prompt |
| `QUERY_RULES_PROMPT` | `mcp-prompts.ts` | Rules and constraints for query construction |
| `QUERY_BUILDING_PROMPT` | `mcp-prompts.ts` | Step-by-step query building instructions |
| `DATE_FILTERING_PROMPT` | `mcp-prompts.ts` | Date range and time dimension filtering guidance |
| `getDefaultMCPPrompts` | `mcp-prompts.ts` | Returns the default prompt set |
| `DEFAULT_MCP_INSTRUCTIONS` / `getDefaultMcpInstructions` | `mcp-prompts.ts` | Default `InitializeResult.instructions` string returned by the MCP `initialize` handshake. The only server-authored guidance the spec expects clients to surface to the model — mandates the discover-first workflow and inlines the date-filtering rule. Override via `MCPOptions.instructions` in the adapters. |
| `QUERY_SCHEMAS` | `schemas.ts` | JSON Schema definitions for SemanticQuery and its sub-types |

## Relationship to agent/

This module provides the **data layer** that `../agent/` consumes:

- `agent/system-prompt.ts` imports `MCP_GUIDE_PROMPT`, `QUERY_RULES_PROMPT`, etc. to build the LLM system prompt
- `agent/tools.ts` uses the semantic layer compiler (which internally uses validation logic) for tool execution
- `ai/` has zero LLM dependencies — it can be used in environments without API keys

## How query-construction guidance reaches the model

Most MCP clients (Claude Desktop, Claude Code, …) treat `prompts/*` and `resources/*` as **user-triggered** slash commands — the model itself cannot fetch them. Two channels reliably reach the model on every turn:

1. `InitializeResult.instructions` — set via `DEFAULT_MCP_INSTRUCTIONS` on initialize. Clients merge this into the system prompt. Keep it short (~2 KB) and authoritative.
2. The `discover` tool response — `handleDiscover` (in `src/adapters/utils.ts`) embeds `queryLanguageReference` (the full `QUERY_LANGUAGE_REFERENCE` from `query-schema.ts`) and `dateFilteringGuide` alongside the matched cubes. Because the workflow mandates `discover` as the first call, this guarantees the model receives the DSL before constructing any query — no extra roundtrip required.

The existing `MCP_PROMPTS` are still exposed for clients (and users) that DO consume them, but correctness no longer depends on them.

## Guard Rails

1. No LLM API calls — all intelligence is heuristic/schema-based
2. `validateQuery` returns structured `ValidationError[]` and `ValidationWarning[]` — never throws
3. Field matching uses normalized scoring, not exact string comparison
4. MCP prompts are versioned constants — changes should be backward-compatible
5. `DEFAULT_MCP_INSTRUCTIONS` and the discover-embedded `queryLanguageReference` / `dateFilteringGuide` are the only reliable channels for delivering query rules to the model — do not delete them in favour of `prompts/*`-only guidance
