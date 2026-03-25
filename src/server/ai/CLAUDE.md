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
| `QUERY_SCHEMAS` | `schemas.ts` | JSON Schema definitions for SemanticQuery and its sub-types |

## Relationship to agent/

This module provides the **data layer** that `../agent/` consumes:

- `agent/system-prompt.ts` imports `MCP_GUIDE_PROMPT`, `QUERY_RULES_PROMPT`, etc. to build the LLM system prompt
- `agent/tools.ts` uses the semantic layer compiler (which internally uses validation logic) for tool execution
- `ai/` has zero LLM dependencies — it can be used in environments without API keys

## Guard Rails

1. No LLM API calls — all intelligence is heuristic/schema-based
2. `validateQuery` returns structured `ValidationError[]` and `ValidationWarning[]` — never throws
3. Field matching uses normalized scoring, not exact string comparison
4. MCP prompts are versioned constants — changes should be backward-compatible
