# Phase 6: Event Stream & Analysis Mode Support - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend MCP endpoints to expose funnel/flow/retention capabilities and guide AI agents through multi-step analysis workflows.

**Architecture:** Discovery returns capabilities + candidates + hints + schemas. Suggestion detects analysis mode and returns nextSteps. Validation handles all query types. MCP /load routes to appropriate executors.

**Tech Stack:** TypeScript, Vitest for testing, existing drizzle-cube AI utilities.

---

## Task 1: Create Query Schemas File

**Files:**
- Create: `src/server/ai/schemas.ts`

**Step 1: Create the schemas file with funnel/flow/retention structures**

```typescript
/**
 * Generic query schemas for AI agents
 * Teaches AI how to construct analysis queries
 */

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
} as const

export type QuerySchemas = typeof QUERY_SCHEMAS
```

**Step 2: Verify file created correctly**

Run: `cat src/server/ai/schemas.ts | head -20`
Expected: See the file header and start of QUERY_SCHEMAS

**Step 3: Commit**

```bash
git add src/server/ai/schemas.ts
git commit -m "feat(ai): add generic query schemas for funnel/flow/retention"
```

---

## Task 2: Update Discovery Types

**Files:**
- Modify: `src/server/ai/discovery.ts`

**Step 1: Add new interfaces after existing CubeDiscoveryResult**

Add after line 19 (after `suggestedDimensions: string[]`):

```typescript
  // Analysis capabilities
  capabilities: {
    query: true
    funnel: boolean
    flow: boolean
    retention: boolean
  }

  // Config for advanced modes (only present if capabilities exist)
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

  // Hints for AI on next steps
  hints?: string[]

  // Query schemas (included when capabilities.funnel/flow/retention is true)
  querySchemas?: typeof import('./schemas').QUERY_SCHEMAS
```

**Step 2: Add import at top of file**

```typescript
import { QUERY_SCHEMAS } from './schemas'
```

**Step 3: Verify types compile**

Run: `npm run typecheck`
Expected: No errors related to discovery.ts

**Step 4: Commit**

```bash
git add src/server/ai/discovery.ts
git commit -m "feat(ai): add capabilities and analysisConfig types to discovery"
```

---

## Task 3: Implement Capability Detection in Discovery

**Files:**
- Modify: `src/server/ai/discovery.ts`

**Step 1: Add helper function to detect capabilities from cube metadata**

Add before `discoverCubes` function:

```typescript
/**
 * Detect analysis capabilities from cube metadata
 */
function detectCapabilities(cube: CubeMetadata): CubeDiscoveryResult['capabilities'] {
  // Check if cube has explicit eventStream meta
  const hasEventStream = !!(cube.meta?.eventStream)

  // Check if cube has time dimensions (needed for analysis modes)
  const hasTimeDimension = cube.dimensions.some(d => d.type === 'time')

  // Check for potential binding keys (dimensions that could identify entities)
  const hasPotentialBindingKey = cube.dimensions.some(d =>
    d.name.toLowerCase().includes('id') ||
    d.type === 'number' ||
    (cube.meta?.eventStream?.bindingKey && d.name === cube.meta.eventStream.bindingKey)
  )

  // Analysis modes available if explicit eventStream OR has needed dimensions
  const supportsAnalysisModes = hasEventStream || (hasTimeDimension && hasPotentialBindingKey)

  return {
    query: true,
    funnel: supportsAnalysisModes,
    flow: supportsAnalysisModes,
    retention: supportsAnalysisModes
  }
}
```

**Step 2: Add helper to build analysisConfig**

Add after `detectCapabilities`:

```typescript
/**
 * Build analysis config with candidate dimensions
 */
function buildAnalysisConfig(cube: CubeMetadata): CubeDiscoveryResult['analysisConfig'] | undefined {
  const capabilities = detectCapabilities(cube)

  // Only include config if analysis modes are available
  if (!capabilities.funnel && !capabilities.flow && !capabilities.retention) {
    return undefined
  }

  // Candidate binding keys: explicit from meta, or inferred from dimension names
  const candidateBindingKeys: Array<{ dimension: string; description?: string }> = []

  // Check explicit eventStream config first
  if (cube.meta?.eventStream?.bindingKey) {
    const bindingDim = cube.dimensions.find(d => d.name === cube.meta?.eventStream?.bindingKey)
    candidateBindingKeys.push({
      dimension: cube.meta.eventStream.bindingKey,
      description: bindingDim?.description || 'Configured binding key'
    })
  }

  // Add dimensions with 'id' in name as candidates
  for (const dim of cube.dimensions) {
    const dimShortName = dim.name.split('.').pop()?.toLowerCase() || ''
    if (dimShortName.includes('id') && !candidateBindingKeys.some(c => c.dimension === dim.name)) {
      candidateBindingKeys.push({
        dimension: dim.name,
        description: dim.description || `Potential entity identifier`
      })
    }
  }

  // Candidate time dimensions
  const candidateTimeDimensions: Array<{ dimension: string; description?: string }> = []

  // Check explicit eventStream config first
  if (cube.meta?.eventStream?.timeDimension) {
    const timeDim = cube.dimensions.find(d => d.name === cube.meta?.eventStream?.timeDimension)
    candidateTimeDimensions.push({
      dimension: cube.meta.eventStream.timeDimension,
      description: timeDim?.description || 'Configured time dimension'
    })
  }

  // Add all time dimensions as candidates
  for (const dim of cube.dimensions) {
    if (dim.type === 'time' && !candidateTimeDimensions.some(c => c.dimension === dim.name)) {
      candidateTimeDimensions.push({
        dimension: dim.name,
        description: dim.description
      })
    }
  }

  // Candidate event dimensions (string dimensions that could represent event types)
  const candidateEventDimensions: Array<{ dimension: string; description?: string }> = []
  for (const dim of cube.dimensions) {
    const dimShortName = dim.name.split('.').pop()?.toLowerCase() || ''
    if (dim.type === 'string' && (
      dimShortName.includes('type') ||
      dimShortName.includes('event') ||
      dimShortName.includes('status') ||
      dimShortName.includes('state') ||
      dimShortName.includes('action')
    )) {
      candidateEventDimensions.push({
        dimension: dim.name,
        description: dim.description || 'Potential event type dimension'
      })
    }
  }

  return {
    candidateBindingKeys,
    candidateTimeDimensions,
    candidateEventDimensions
  }
}
```

**Step 3: Add helper to generate hints**

```typescript
/**
 * Generate hints for AI on next steps
 */
function generateHints(cube: CubeMetadata, analysisConfig?: CubeDiscoveryResult['analysisConfig']): string[] {
  const hints: string[] = []

  if (!analysisConfig) {
    return hints
  }

  // Hint about choosing binding key if multiple options
  if (analysisConfig.candidateBindingKeys.length > 1) {
    hints.push('Choose bindingKey based on what entity to track through the analysis')
  }

  // Hint about discovering event types
  if (analysisConfig.candidateEventDimensions.length > 0) {
    const eventDim = analysisConfig.candidateEventDimensions[0].dimension
    hints.push(`Query ${eventDim} dimension to discover available values for funnel steps`)
  }

  // General workflow hint
  hints.push('Use /mcp/load with a standard query to discover dimension values before building analysis queries')

  return hints
}
```

**Step 4: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add src/server/ai/discovery.ts
git commit -m "feat(ai): add capability detection and analysis config builders"
```

---

## Task 4: Update discoverCubes to Return New Fields

**Files:**
- Modify: `src/server/ai/discovery.ts`

**Step 1: Update the result building in discoverCubes function**

Find the section in `discoverCubes` where results are pushed (around line 291-300). Update to include new fields:

```typescript
    if (score >= minScore) {
      const capabilities = detectCapabilities(cube)
      const analysisConfig = buildAnalysisConfig(cube)
      const hints = generateHints(cube, analysisConfig)

      // Only include schemas if analysis modes are available
      const hasAnalysisModes = capabilities.funnel || capabilities.flow || capabilities.retention

      results.push({
        cube: cube.name,
        title: cube.title,
        description: cube.description,
        relevanceScore: score,
        matchedOn,
        suggestedMeasures,
        suggestedDimensions,
        capabilities,
        analysisConfig,
        hints: hints.length > 0 ? hints : undefined,
        querySchemas: hasAnalysisModes ? QUERY_SCHEMAS : undefined
      })
    }
```

**Step 2: Also update the "no search criteria" branch (around line 269-278)**

```typescript
    // Return all cubes with basic info if no search criteria
    return metadata.slice(0, limit).map(cube => {
      const capabilities = detectCapabilities(cube)
      const analysisConfig = buildAnalysisConfig(cube)
      const hints = generateHints(cube, analysisConfig)
      const hasAnalysisModes = capabilities.funnel || capabilities.flow || capabilities.retention

      return {
        cube: cube.name,
        title: cube.title,
        description: cube.description,
        relevanceScore: 1,
        matchedOn: [],
        suggestedMeasures: cube.measures.slice(0, 5).map(m => m.name),
        suggestedDimensions: cube.dimensions.slice(0, 5).map(d => d.name),
        capabilities,
        analysisConfig,
        hints: hints.length > 0 ? hints : undefined,
        querySchemas: hasAnalysisModes ? QUERY_SCHEMAS : undefined
      }
    })
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/server/ai/discovery.ts
git commit -m "feat(ai): include capabilities and config in discovery results"
```

---

## Task 5: Update Suggestion Types

**Files:**
- Modify: `src/server/ai/suggestion.ts`

**Step 1: Update QuerySuggestion interface**

Find the `QuerySuggestion` interface (around line 13) and update:

```typescript
/**
 * Suggested query result
 */
export interface QuerySuggestion {
  query: Partial<SemanticQuery>
  confidence: number
  reasoning: string[]
  warnings?: string[]
  /** Detected analysis mode */
  analysisMode: 'query' | 'funnel' | 'flow' | 'retention'
  /** Next steps when mode != 'query' */
  nextSteps?: string[]
}
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: Error about missing `analysisMode` in return - this is expected, we'll fix in next task

**Step 3: Commit**

```bash
git add src/server/ai/suggestion.ts
git commit -m "feat(ai): add analysisMode and nextSteps to QuerySuggestion"
```

---

## Task 6: Implement Analysis Mode Detection in Suggestion

**Files:**
- Modify: `src/server/ai/suggestion.ts`

**Step 1: Add mode detection patterns after time expressions (around line 180)**

```typescript
/**
 * Analysis mode detection patterns
 */
const ANALYSIS_MODE_PATTERNS = {
  funnel: /\b(funnel|conversion|drop.?off|steps?|journey|pipeline|stages?)\b/i,
  flow: /\b(flow|path|sequence|before|after|next|previous|user.?journey)\b/i,
  retention: /\b(retention|cohort|return|churn|comeback|retained|day.?\d+)\b/i
}

/**
 * Detect analysis mode from natural language
 */
function detectAnalysisMode(text: string): 'query' | 'funnel' | 'flow' | 'retention' {
  const lowerText = text.toLowerCase()

  if (ANALYSIS_MODE_PATTERNS.funnel.test(lowerText)) {
    return 'funnel'
  }
  if (ANALYSIS_MODE_PATTERNS.flow.test(lowerText)) {
    return 'flow'
  }
  if (ANALYSIS_MODE_PATTERNS.retention.test(lowerText)) {
    return 'retention'
  }

  return 'query'
}

/**
 * Generate next steps for analysis modes
 */
function generateNextSteps(mode: 'funnel' | 'flow' | 'retention', cubeName?: string): string[] {
  const cubeRef = cubeName ? cubeName : 'the relevant cube'

  switch (mode) {
    case 'funnel':
      return [
        `Use /mcp/discover to get ${cubeRef} funnel configuration and schema`,
        `Query the event dimension to discover available event types for funnel steps`,
        'Build funnel query with discovered values using the schema from discover'
      ]
    case 'flow':
      return [
        `Use /mcp/discover to get ${cubeRef} flow configuration and schema`,
        `Query the event dimension to discover available event types`,
        'Build flow query specifying the starting event and steps before/after'
      ]
    case 'retention':
      return [
        `Use /mcp/discover to get ${cubeRef} retention configuration and schema`,
        'Build retention query specifying granularity (day/week/month) and number of periods'
      ]
  }
}
```

**Step 2: Update suggestQuery function to use mode detection**

Find the `suggestQuery` function and update the beginning and end:

At the start (after `const warnings: string[] = []`), add:

```typescript
  // Detect analysis mode
  const analysisMode = detectAnalysisMode(naturalLanguage)
```

Before the final return statement, add handling for non-query modes:

```typescript
  // For analysis modes, return guidance instead of building query
  if (analysisMode !== 'query') {
    const primaryCubeName = relevantCubes.length > 0 ? relevantCubes[0].name : undefined
    return {
      query: {},
      confidence: 0.7,
      reasoning: [
        `Detected ${analysisMode} intent from natural language`,
        ...(primaryCubeName ? [`Found relevant cube: ${primaryCubeName}`] : [])
      ],
      warnings: warnings.length > 0 ? warnings : undefined,
      analysisMode,
      nextSteps: generateNextSteps(analysisMode, primaryCubeName)
    }
  }
```

Update the final return to include `analysisMode: 'query'`:

```typescript
  return {
    query,
    confidence,
    reasoning,
    warnings: warnings.length > 0 ? warnings : undefined,
    analysisMode: 'query'
  }
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/server/ai/suggestion.ts
git commit -m "feat(ai): implement analysis mode detection in suggestQuery"
```

---

## Task 7: Add Validation for Analysis Query Types

**Files:**
- Modify: `src/server/ai/validation.ts`

**Step 1: Add validation functions for funnel/flow/retention after existing helpers**

Add before the main `validateQuery` function:

```typescript
/**
 * Validate funnel query structure
 */
function validateFunnelQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  const funnel = query.funnel
  if (!funnel) return

  // Required fields
  if (!funnel.bindingKey) {
    errors.push({
      type: 'syntax_error',
      message: 'funnel.bindingKey is required'
    })
  } else if (typeof funnel.bindingKey === 'string') {
    validateDimension(funnel.bindingKey, metadata, errors, corrections)
  }

  if (!funnel.timeDimension) {
    errors.push({
      type: 'syntax_error',
      message: 'funnel.timeDimension is required'
    })
  } else if (typeof funnel.timeDimension === 'string') {
    validateDimension(funnel.timeDimension, metadata, errors, corrections)
  }

  if (!funnel.steps || !Array.isArray(funnel.steps)) {
    errors.push({
      type: 'syntax_error',
      message: 'funnel.steps array is required'
    })
  } else if (funnel.steps.length < 2) {
    errors.push({
      type: 'syntax_error',
      message: 'funnel requires at least 2 steps'
    })
  } else {
    // Validate each step's filter
    for (let i = 0; i < funnel.steps.length; i++) {
      const step = funnel.steps[i]
      if (!step.name) {
        warnings.push({
          type: 'best_practice',
          message: `Step ${i + 1} is missing a name`,
          suggestion: 'Add descriptive names to funnel steps'
        })
      }
      if (step.filter && 'member' in step.filter) {
        validateFilters([step.filter], metadata, errors, corrections)
      }
    }
  }
}

/**
 * Validate flow query structure
 */
function validateFlowQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  const flow = query.flow
  if (!flow) return

  if (!flow.bindingKey) {
    errors.push({
      type: 'syntax_error',
      message: 'flow.bindingKey is required'
    })
  } else if (typeof flow.bindingKey === 'string') {
    validateDimension(flow.bindingKey, metadata, errors, corrections)
  }

  if (!flow.timeDimension) {
    errors.push({
      type: 'syntax_error',
      message: 'flow.timeDimension is required'
    })
  } else if (typeof flow.timeDimension === 'string') {
    validateDimension(flow.timeDimension, metadata, errors, corrections)
  }

  if (!flow.eventDimension) {
    errors.push({
      type: 'syntax_error',
      message: 'flow.eventDimension is required'
    })
  } else if (typeof flow.eventDimension === 'string') {
    validateDimension(flow.eventDimension, metadata, errors, corrections)
  }

  if (flow.stepsBefore === undefined && flow.stepsAfter === undefined) {
    warnings.push({
      type: 'best_practice',
      message: 'Neither stepsBefore nor stepsAfter specified',
      suggestion: 'Set stepsBefore and/or stepsAfter to see event sequences'
    })
  }
}

/**
 * Validate retention query structure
 */
function validateRetentionQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  const retention = query.retention
  if (!retention) return

  if (!retention.bindingKey) {
    errors.push({
      type: 'syntax_error',
      message: 'retention.bindingKey is required'
    })
  } else if (typeof retention.bindingKey === 'string') {
    validateDimension(retention.bindingKey, metadata, errors, corrections)
  }

  if (!retention.timeDimension) {
    errors.push({
      type: 'syntax_error',
      message: 'retention.timeDimension is required'
    })
  } else if (typeof retention.timeDimension === 'string') {
    validateDimension(retention.timeDimension, metadata, errors, corrections)
  }

  if (!retention.granularity) {
    warnings.push({
      type: 'best_practice',
      message: 'retention.granularity not specified',
      suggestion: 'Specify granularity: "day", "week", or "month"'
    })
  }

  if (!retention.periods) {
    warnings.push({
      type: 'best_practice',
      message: 'retention.periods not specified',
      suggestion: 'Specify number of periods to analyze'
    })
  }
}
```

**Step 2: Update validateQuery to handle all query types**

Find the main `validateQuery` function and add detection for analysis query types at the beginning (after initializing errors, warnings, corrections):

```typescript
  // Detect query type and validate accordingly
  if (query.funnel) {
    validateFunnelQuery(query, metadata, errors, warnings, corrections)
    // Skip standard validation for funnel queries
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined // Funnel corrections not implemented yet
    }
  }

  if (query.flow) {
    validateFlowQuery(query, metadata, errors, warnings, corrections)
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined
    }
  }

  if (query.retention) {
    validateRetentionQuery(query, metadata, errors, warnings, corrections)
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined
    }
  }
```

**Step 3: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/server/ai/validation.ts
git commit -m "feat(ai): add validation for funnel/flow/retention queries"
```

---

## Task 8: Update MCP handleLoad to Route All Query Types

**Files:**
- Modify: `src/adapters/utils.ts`

**Step 1: Update handleLoad function to detect and route query types**

Find the `handleLoad` function (around line 736) and replace the body:

```typescript
export async function handleLoad(
  semanticLayer: SemanticLayerCompiler,
  securityContext: SecurityContext,
  body: LoadRequest
): Promise<{
  data: Record<string, unknown>[]
  annotation: any
  query: SemanticQuery
}> {
  const query = body.query

  // Detect and execute appropriate query type
  if (query.funnel && query.funnel.steps?.length >= 2) {
    const result = await semanticLayer.executeFunnel(query, securityContext)
    return {
      data: result.data,
      annotation: result.annotation,
      query
    }
  }

  if (query.flow && query.flow.bindingKey && query.flow.eventDimension) {
    const result = await semanticLayer.executeFlow(query, securityContext)
    return {
      data: result.data,
      annotation: result.annotation,
      query
    }
  }

  if (query.retention && query.retention.bindingKey && query.retention.timeDimension) {
    const result = await semanticLayer.executeRetention(query, securityContext)
    return {
      data: result.data,
      annotation: result.annotation,
      query
    }
  }

  // Standard query (existing behavior)
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
  }

  const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
  return {
    data: result.data,
    annotation: result.annotation,
    query
  }
}
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/adapters/utils.ts
git commit -m "feat(mcp): route handleLoad to funnel/flow/retention executors"
```

---

## Task 9: Update AI Index Exports

**Files:**
- Modify: `src/server/ai/index.ts`

**Step 1: Add exports for schemas**

```typescript
/**
 * AI-Ready Data Layer Utilities
 * Schema-aware intelligence for AI agents - no server-side LLM required
 */

export {
  discoverCubes,
  findBestFieldMatch,
  type CubeDiscoveryResult,
  type DiscoveryOptions
} from './discovery'

export {
  suggestQuery,
  type QuerySuggestion
} from './suggestion'

export {
  validateQuery,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning
} from './validation'

export {
  QUERY_SCHEMAS,
  type QuerySchemas
} from './schemas'
```

**Step 2: Verify compilation**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/server/ai/index.ts
git commit -m "feat(ai): export QUERY_SCHEMAS from ai index"
```

---

## Task 10: Write Unit Tests for Discovery Capabilities

**Files:**
- Create: `tests/ai-discovery.test.ts`

**Step 1: Create test file**

```typescript
/**
 * Tests for AI discovery with capabilities and analysis config
 */

import { describe, it, expect } from 'vitest'
import { discoverCubes, type CubeDiscoveryResult } from '../src/server/ai'
import type { CubeMetadata } from '../src/server/types/metadata'

// Mock cube metadata for testing
const mockCubeWithEventStream: CubeMetadata = {
  name: 'PREvents',
  title: 'PR Events',
  description: 'Pull request events',
  measures: [
    { name: 'PREvents.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'PREvents.prNumber', title: 'PR Number', shortTitle: 'PR', type: 'number' },
    { name: 'PREvents.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
    { name: 'PREvents.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' },
    { name: 'PREvents.employeeId', title: 'Employee ID', shortTitle: 'Emp', type: 'number' }
  ],
  segments: [],
  meta: {
    eventStream: {
      bindingKey: 'PREvents.prNumber',
      timeDimension: 'PREvents.timestamp'
    }
  }
}

const mockCubeWithoutEventStream: CubeMetadata = {
  name: 'Employees',
  title: 'Employees',
  description: 'Employee data',
  measures: [
    { name: 'Employees.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'Employees.name', title: 'Name', shortTitle: 'Name', type: 'string' },
    { name: 'Employees.createdAt', title: 'Created', shortTitle: 'Created', type: 'time' }
  ],
  segments: []
}

const mockMetadata = [mockCubeWithEventStream, mockCubeWithoutEventStream]

describe('AI Discovery Capabilities', () => {
  describe('capabilities detection', () => {
    it('should detect funnel/flow/retention capabilities for cube with eventStream', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      expect(prResult!.capabilities.query).toBe(true)
      expect(prResult!.capabilities.funnel).toBe(true)
      expect(prResult!.capabilities.flow).toBe(true)
      expect(prResult!.capabilities.retention).toBe(true)
    })

    it('should infer capabilities for cube with time dimension and id fields', () => {
      const results = discoverCubes(mockMetadata, { topic: 'employees' })
      const empResult = results.find(r => r.cube === 'Employees')

      expect(empResult).toBeDefined()
      expect(empResult!.capabilities.query).toBe(true)
      // May or may not have analysis capabilities depending on inference
    })
  })

  describe('analysisConfig', () => {
    it('should include candidateBindingKeys from eventStream', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult!.analysisConfig).toBeDefined()
      expect(prResult!.analysisConfig!.candidateBindingKeys).toContainEqual({
        dimension: 'PREvents.prNumber',
        description: expect.any(String)
      })
    })

    it('should include candidateTimeDimensions', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult!.analysisConfig!.candidateTimeDimensions).toContainEqual({
        dimension: 'PREvents.timestamp',
        description: expect.any(String)
      })
    })

    it('should include candidateEventDimensions for string dimensions with event-like names', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult!.analysisConfig!.candidateEventDimensions).toContainEqual({
        dimension: 'PREvents.eventType',
        description: expect.any(String)
      })
    })
  })

  describe('hints', () => {
    it('should include hints when analysis modes available', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult!.hints).toBeDefined()
      expect(prResult!.hints!.length).toBeGreaterThan(0)
    })

    it('should hint about querying dimension values', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR' })
      const prResult = results.find(r => r.cube === 'PREvents')

      const hasQueryHint = prResult!.hints!.some(h =>
        h.includes('Query') && h.includes('dimension')
      )
      expect(hasQueryHint).toBe(true)
    })
  })

  describe('querySchemas', () => {
    it('should include query schemas when analysis modes available', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult!.querySchemas).toBeDefined()
      expect(prResult!.querySchemas!.funnel).toBeDefined()
      expect(prResult!.querySchemas!.flow).toBeDefined()
      expect(prResult!.querySchemas!.retention).toBeDefined()
    })

    it('should not include schemas for cubes without analysis capabilities', () => {
      // Create a cube with no time dimensions and no id fields
      const basicCube: CubeMetadata = {
        name: 'Settings',
        title: 'Settings',
        measures: [],
        dimensions: [
          { name: 'Settings.key', title: 'Key', shortTitle: 'Key', type: 'string' },
          { name: 'Settings.value', title: 'Value', shortTitle: 'Val', type: 'string' }
        ],
        segments: []
      }

      const results = discoverCubes([basicCube], { topic: 'settings' })
      const result = results[0]

      // Should not have analysis capabilities
      if (!result.capabilities.funnel) {
        expect(result.querySchemas).toBeUndefined()
      }
    })
  })
})
```

**Step 2: Run test to verify it works**

Run: `npm test tests/ai-discovery.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/ai-discovery.test.ts
git commit -m "test(ai): add unit tests for discovery capabilities"
```

---

## Task 11: Write Unit Tests for Suggestion Mode Detection

**Files:**
- Create: `tests/ai-suggestion.test.ts`

**Step 1: Create test file**

```typescript
/**
 * Tests for AI suggestion with mode detection
 */

import { describe, it, expect } from 'vitest'
import { suggestQuery } from '../src/server/ai'
import type { CubeMetadata } from '../src/server/types/metadata'

const mockCubeWithEventStream: CubeMetadata = {
  name: 'PREvents',
  title: 'PR Events',
  description: 'Pull request events for funnel analysis',
  exampleQuestions: ['Show PR conversion funnel'],
  measures: [
    { name: 'PREvents.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'PREvents.prNumber', title: 'PR Number', shortTitle: 'PR', type: 'number' },
    { name: 'PREvents.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
    { name: 'PREvents.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' }
  ],
  segments: [],
  meta: {
    eventStream: {
      bindingKey: 'PREvents.prNumber',
      timeDimension: 'PREvents.timestamp'
    }
  }
}

const mockMetadata = [mockCubeWithEventStream]

describe('AI Suggestion Mode Detection', () => {
  describe('funnel mode detection', () => {
    it('should detect funnel mode from "funnel" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Show me the PR funnel')

      expect(result.analysisMode).toBe('funnel')
      expect(result.nextSteps).toBeDefined()
      expect(result.nextSteps!.length).toBeGreaterThan(0)
    })

    it('should detect funnel mode from "conversion" keyword', () => {
      const result = suggestQuery(mockMetadata, 'What is the PR conversion rate?')

      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel mode from "drop-off" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Where is the biggest drop-off?')

      expect(result.analysisMode).toBe('funnel')
    })
  })

  describe('flow mode detection', () => {
    it('should detect flow mode from "flow" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Show me the user flow')

      expect(result.analysisMode).toBe('flow')
      expect(result.nextSteps).toBeDefined()
    })

    it('should detect flow mode from "path" keyword', () => {
      const result = suggestQuery(mockMetadata, 'What paths do users take?')

      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow mode from "before/after" keywords', () => {
      const result = suggestQuery(mockMetadata, 'What happens before merge?')

      expect(result.analysisMode).toBe('flow')
    })
  })

  describe('retention mode detection', () => {
    it('should detect retention mode from "retention" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Show user retention')

      expect(result.analysisMode).toBe('retention')
      expect(result.nextSteps).toBeDefined()
    })

    it('should detect retention mode from "cohort" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Cohort analysis by week')

      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention mode from "churn" keyword', () => {
      const result = suggestQuery(mockMetadata, 'What is the churn rate?')

      expect(result.analysisMode).toBe('retention')
    })
  })

  describe('standard query mode', () => {
    it('should default to query mode for standard requests', () => {
      const result = suggestQuery(mockMetadata, 'How many PRs were created last month?')

      expect(result.analysisMode).toBe('query')
      expect(result.nextSteps).toBeUndefined()
    })

    it('should build query for standard mode', () => {
      const result = suggestQuery(mockMetadata, 'Count PRs')

      expect(result.analysisMode).toBe('query')
      expect(result.query.measures).toBeDefined()
    })
  })

  describe('nextSteps guidance', () => {
    it('should include discover step for funnel mode', () => {
      const result = suggestQuery(mockMetadata, 'PR funnel')

      const hasDiscoverStep = result.nextSteps!.some(s => s.includes('discover'))
      expect(hasDiscoverStep).toBe(true)
    })

    it('should mention cube name in nextSteps when found', () => {
      const result = suggestQuery(mockMetadata, 'PR funnel')

      const hasCubeName = result.nextSteps!.some(s => s.includes('PREvents'))
      expect(hasCubeName).toBe(true)
    })
  })
})
```

**Step 2: Run test**

Run: `npm test tests/ai-suggestion.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/ai-suggestion.test.ts
git commit -m "test(ai): add unit tests for suggestion mode detection"
```

---

## Task 12: Write Unit Tests for Validation

**Files:**
- Create: `tests/ai-validation.test.ts`

**Step 1: Create test file**

```typescript
/**
 * Tests for AI validation of funnel/flow/retention queries
 */

import { describe, it, expect } from 'vitest'
import { validateQuery } from '../src/server/ai'
import type { CubeMetadata } from '../src/server/types/metadata'
import type { SemanticQuery } from '../src/server/types/query'

const mockMetadata: CubeMetadata[] = [{
  name: 'PREvents',
  title: 'PR Events',
  measures: [
    { name: 'PREvents.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'PREvents.prNumber', title: 'PR Number', shortTitle: 'PR', type: 'number' },
    { name: 'PREvents.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
    { name: 'PREvents.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' }
  ],
  segments: []
}]

describe('AI Validation - Funnel Queries', () => {
  it('should pass valid funnel query', () => {
    const query: SemanticQuery = {
      funnel: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Opened', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['opened'] } },
          { name: 'Merged', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['merged'] } }
        ]
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail funnel without bindingKey', () => {
    const query: SemanticQuery = {
      funnel: {
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Step 1', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['a'] } },
          { name: 'Step 2', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['b'] } }
        ]
      }
    } as any

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('bindingKey'))).toBe(true)
  })

  it('should fail funnel with less than 2 steps', () => {
    const query: SemanticQuery = {
      funnel: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Only One', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['a'] } }
        ]
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('2 steps'))).toBe(true)
  })

  it('should validate dimension references in funnel', () => {
    const query: SemanticQuery = {
      funnel: {
        bindingKey: 'PREvents.invalidDimension',
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Step 1', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['a'] } },
          { name: 'Step 2', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['b'] } }
        ]
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
  })
})

describe('AI Validation - Flow Queries', () => {
  it('should pass valid flow query', () => {
    const query: SemanticQuery = {
      flow: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        eventDimension: 'PREvents.eventType',
        stepsBefore: 2,
        stepsAfter: 2
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(true)
  })

  it('should fail flow without eventDimension', () => {
    const query: SemanticQuery = {
      flow: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        stepsBefore: 2
      }
    } as any

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('eventDimension'))).toBe(true)
  })

  it('should warn when no steps specified', () => {
    const query: SemanticQuery = {
      flow: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        eventDimension: 'PREvents.eventType'
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.warnings.some(w => w.message.includes('stepsBefore') || w.message.includes('stepsAfter'))).toBe(true)
  })
})

describe('AI Validation - Retention Queries', () => {
  it('should pass valid retention query', () => {
    const query: SemanticQuery = {
      retention: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        granularity: 'week',
        periods: 8
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(true)
  })

  it('should fail retention without timeDimension', () => {
    const query: SemanticQuery = {
      retention: {
        bindingKey: 'PREvents.prNumber',
        granularity: 'week'
      }
    } as any

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('timeDimension'))).toBe(true)
  })

  it('should warn when granularity not specified', () => {
    const query: SemanticQuery = {
      retention: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp'
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.warnings.some(w => w.message.includes('granularity'))).toBe(true)
  })
})
```

**Step 2: Run test**

Run: `npm test tests/ai-validation.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/ai-validation.test.ts
git commit -m "test(ai): add unit tests for funnel/flow/retention validation"
```

---

## Task 13: Run Full Test Suite and Fix Issues

**Files:**
- Various fixes as needed

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Fix any issues found**

Address any compilation or test failures.

**Step 4: Commit fixes if needed**

```bash
git add -A
git commit -m "fix: address test failures from phase 6 implementation"
```

---

## Task 14: Update Plan Document Status

**Files:**
- Modify: `docs/ai-ready-data-layer-plan.md`

**Step 1: Update Phase 6 status from "NOT STARTED" to "COMPLETED"**

Change line 219 from:
```
## Phase 6: Event Stream & Analysis Mode Support ⏳ NOT STARTED
```
to:
```
## Phase 6: Event Stream & Analysis Mode Support ✅ COMPLETED
```

**Step 2: Commit**

```bash
git add docs/ai-ready-data-layer-plan.md
git commit -m "docs: mark phase 6 as completed"
```

---

## Summary

After completing all tasks:

1. **New file created:** `src/server/ai/schemas.ts` - Generic query schemas
2. **Updated:** `src/server/ai/discovery.ts` - Capabilities, analysisConfig, hints
3. **Updated:** `src/server/ai/suggestion.ts` - Mode detection, nextSteps
4. **Updated:** `src/server/ai/validation.ts` - Funnel/flow/retention validation
5. **Updated:** `src/server/ai/index.ts` - Export schemas
6. **Updated:** `src/adapters/utils.ts` - Route handleLoad to all executors
7. **New tests:** `tests/ai-discovery.test.ts`, `tests/ai-suggestion.test.ts`, `tests/ai-validation.test.ts`

All changes are backward compatible - existing queries continue to work unchanged.
