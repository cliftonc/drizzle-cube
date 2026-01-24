# Phase 6: Event Stream & Analysis Mode Support

## Overview

Extend MCP capabilities to support funnel, flow, and retention analysis modes. Currently, MCP endpoints only support standard query mode - cubes with `eventStream` meta are not surfaced to AI agents.

## Design Principles

1. **Keep it simple** - Return data and clear guidance, don't be too clever
2. **AI builds the query** - Suggestion engine guides, doesn't construct complex queries
3. **Progressive discovery** - AI can query dimension values before building analysis queries
4. **Generic schemas** - Teach the AI query structure, let it fill in cube-specific values

---

## Changes Summary

| File | Change |
|------|--------|
| `src/server/ai/schemas.ts` | NEW - Generic query schemas for funnel/flow/retention |
| `src/server/ai/discovery.ts` | Add capabilities, analysisConfig, hints to results |
| `src/server/ai/suggestion.ts` | Add mode detection, return nextSteps guidance |
| `src/server/ai/validation.ts` | Add validation for funnel/flow/retention queries |
| `src/server/ai/index.ts` | Export new types and schemas |
| `src/adapters/utils.ts` | Update handleLoad to route all query types |

---

## 1. Discovery Response Structure

### Updated `CubeDiscoveryResult`

```typescript
interface CubeDiscoveryResult {
  // Existing fields
  cube: string
  title: string
  description?: string
  relevanceScore: number
  matchedOn: ('name' | 'title' | 'description' | 'exampleQuestions' | 'measures' | 'dimensions')[]
  suggestedMeasures: string[]
  suggestedDimensions: string[]

  // NEW: Analysis capabilities
  capabilities: {
    query: true              // Always true
    funnel: boolean
    flow: boolean
    retention: boolean
  }

  // NEW: Config for advanced modes (only present if capabilities exist)
  analysisConfig?: {
    candidateBindingKeys: Array<{
      dimension: string
      description?: string
    }>
    candidateTimeDimensions: Array<{
      dimension: string
      description?: string
    }>
    candidateEventDimensions: Array<{
      dimension: string
      description?: string
    }>
  }

  // NEW: Hints for AI on next steps
  hints?: string[]

  // NEW: Query schemas (included when capabilities.funnel/flow/retention is true)
  querySchemas?: typeof QUERY_SCHEMAS
}
```

### Capability Detection Logic

- `funnel: true` if cube has `meta.eventStream` OR has time dimension + potential binding key
- `flow: true` - same as funnel
- `retention: true` - same as funnel

### Candidate Inference (when not explicit in meta)

- `candidateBindingKeys`: Dimensions marked as primaryKey, or with "id" in name
- `candidateTimeDimensions`: Dimensions with `type: 'time'`
- `candidateEventDimensions`: String dimensions (potential event types/states)

### Example Response

```json
{
  "cube": "PREvents",
  "title": "PR Events",
  "relevanceScore": 0.9,
  "capabilities": {
    "query": true,
    "funnel": true,
    "flow": true,
    "retention": true
  },
  "analysisConfig": {
    "candidateBindingKeys": [
      { "dimension": "PREvents.prNumber", "description": "PR identifier" },
      { "dimension": "PREvents.employeeId", "description": "User who performed action" }
    ],
    "candidateTimeDimensions": [
      { "dimension": "PREvents.timestamp", "description": "Event timestamp" }
    ],
    "candidateEventDimensions": [
      { "dimension": "PREvents.eventType", "description": "Type of PR event" }
    ]
  },
  "hints": [
    "Choose bindingKey based on what entity to track (PRs vs users)",
    "Query PREvents.eventType dimension to discover available values for funnel steps"
  ],
  "querySchemas": { /* see section 2 */ }
}
```

---

## 2. Generic Query Schemas

New file: `src/server/ai/schemas.ts`

```typescript
export const QUERY_SCHEMAS = {
  funnel: {
    description: 'Track conversion through sequential steps. Entities (identified by bindingKey) move through ordered steps.',
    structure: {
      funnel: {
        bindingKey: 'Cube.dimension - identifies entities moving through funnel',
        timeDimension: 'Cube.dimension - time field for ordering events',
        steps: [
          {
            name: 'string - human readable step name',
            filter: {
              member: 'Cube.dimension',
              operator: 'equals | notEquals | contains | ...',
              values: ['array of filter values']
            },
            timeToConvert: 'optional - max time window e.g. "7 days"'
          }
        ],
        dateRange: '[start, end] array OR string like "last 7 days", "last 3 months", "this quarter"'
      }
    }
  },

  flow: {
    description: 'Analyze paths users take before/after a specific event. Shows event sequences.',
    structure: {
      flow: {
        bindingKey: 'Cube.dimension - identifies entities',
        timeDimension: 'Cube.dimension - time field for ordering',
        eventDimension: 'Cube.dimension - the event type field',
        startingStep: {
          filter: { member: 'Cube.dimension', operator: 'equals', values: ['event value'] }
        },
        stepsBefore: 'number - how many steps to show before starting step',
        stepsAfter: 'number - how many steps to show after starting step',
        dateRange: '[start, end] array OR string like "last 7 days", "last 3 months", "this quarter"'
      }
    }
  },

  retention: {
    description: 'Measure how many users return over time periods after initial activity.',
    structure: {
      retention: {
        bindingKey: 'Cube.dimension - identifies entities',
        timeDimension: 'Cube.dimension - time field for cohort assignment',
        granularity: 'day | week | month - period size',
        periods: 'number - how many periods to analyze',
        dateRange: '[start, end] array OR string like "last 7 days", "last 3 months", "this quarter"'
      }
    }
  }
}
```

---

## 3. Suggestion Changes

### Updated `QuerySuggestion` Response

```typescript
interface QuerySuggestion {
  // Existing fields
  query: Partial<SemanticQuery>
  confidence: number
  reasoning: string[]
  warnings?: string[]

  // NEW: Detected analysis mode
  analysisMode: 'query' | 'funnel' | 'flow' | 'retention'

  // NEW: Next steps when mode != 'query'
  nextSteps?: string[]
}
```

### Detection Patterns

```typescript
const funnelPatterns = /\b(funnel|conversion|drop.?off|steps?|journey|pipeline|stages?)\b/i
const flowPatterns = /\b(flow|path|sequence|before|after|next|previous|user.?journey)\b/i
const retentionPatterns = /\b(retention|cohort|return|churn|comeback|retained|day.?\d+)\b/i
```

### Behavior

When analysis mode detected, return guidance instead of building query:

```json
{
  "analysisMode": "funnel",
  "query": {},
  "confidence": 0.8,
  "reasoning": [
    "Detected funnel intent from keyword 'funnel'",
    "Found PREvents cube with funnel capability"
  ],
  "nextSteps": [
    "Use /mcp/discover to get PREvents funnel configuration",
    "Query PREvents.eventType dimension to discover available event types",
    "Build funnel query with discovered values using the schema from discover"
  ]
}
```

For standard queries (no analysis mode detected), behavior stays the same.

---

## 4. Validation Changes

Add validation for funnel/flow/retention query structures:

```typescript
export function aiValidateQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[]
): AIValidationResult {

  if (query.funnel) return validateFunnelQuery(query, metadata)
  if (query.flow) return validateFlowQuery(query, metadata)
  if (query.retention) return validateRetentionQuery(query, metadata)

  return validateStandardQuery(query, metadata)
}
```

Validation checks:
- Required fields present (bindingKey, timeDimension, etc.)
- Referenced dimensions exist in metadata
- Fuzzy match and suggest corrections for typos

---

## 5. MCP `/load` Changes

Update `handleLoad()` to route all query types:

```typescript
export async function handleLoad(
  semanticLayer: SemanticLayerCompiler,
  securityContext: SecurityContext,
  body: LoadRequest
) {
  const query = body.query

  if (query.funnel && query.funnel.steps?.length >= 2) {
    const result = await semanticLayer.executeFunnel(query, securityContext)
    return { data: result.data, annotation: result.annotation, query }
  }

  if (query.flow && query.flow.bindingKey && query.flow.eventDimension) {
    const result = await semanticLayer.executeFlow(query, securityContext)
    return { data: result.data, annotation: result.annotation, query }
  }

  if (query.retention && query.retention.bindingKey && query.retention.timeDimension) {
    const result = await semanticLayer.executeRetention(query, securityContext)
    return { data: result.data, annotation: result.annotation, query }
  }

  // Standard query (existing behavior)
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
  }

  const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
  return { data: result.data, annotation: result.annotation, query }
}
```

---

## AI Workflow Example

```
User: "Show me the PR review funnel"

1. POST /mcp/suggest { naturalLanguage: "PR review funnel" }
   Response: {
     analysisMode: "funnel",
     reasoning: ["Detected funnel intent"],
     nextSteps: ["Use /mcp/discover to get funnel config", "Query eventType dimension..."]
   }

2. POST /mcp/discover { intent: "PR funnel" }
   Response: {
     cubes: [{
       cube: "PREvents",
       capabilities: { funnel: true, ... },
       analysisConfig: { candidateBindingKeys: [...], candidateEventDimensions: [...] },
       hints: ["Query PREvents.eventType to discover event types"],
       querySchemas: { funnel: { ... } }
     }]
   }

3. POST /mcp/load { query: { dimensions: ["PREvents.eventType"], measures: ["PREvents.count"] } }
   Response: { data: [{ "PREvents.eventType": "opened" }, { "PREvents.eventType": "approved" }, ...] }

4. AI constructs funnel query using schema + discovered values

5. POST /mcp/load { query: { funnel: { bindingKey: "PREvents.prNumber", steps: [...] } } }
   Response: { data: [{ step: "Opened", count: 100 }, { step: "Approved", count: 80 }, ...] }
```

---

## Backward Compatibility

- All changes are additive
- Existing queries work unchanged
- `capabilities` and `analysisConfig` are new optional fields
- `analysisMode` defaults to 'query' if not detected
