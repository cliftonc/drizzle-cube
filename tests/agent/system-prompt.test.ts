/**
 * Tests for Agent System Prompt Builder
 * Tests buildAgentSystemPrompt() from src/server/agent/system-prompt.ts
 * Pure function — no mocks needed.
 */

import { describe, it, expect } from 'vitest'
import { buildAgentSystemPrompt } from '../../src/server/agent/system-prompt'
import type { CubeMetadata } from '../../src/server/types'

// ============================================================================
// Test Data
// ============================================================================

const singleCubeMetadata: CubeMetadata[] = [
  {
    name: 'Employees',
    measures: [
      { name: 'count', type: 'count' },
      { name: 'avgSalary', type: 'avg' },
    ],
    dimensions: [
      { name: 'name', type: 'string' },
      { name: 'createdAt', type: 'time' },
    ],
    relationships: [
      { targetCube: 'Departments', relationship: 'belongsTo' },
    ],
  },
]

const cubeWithDescription: CubeMetadata[] = [
  {
    name: 'Sales',
    description: 'Revenue and order data',
    measures: [{ name: 'totalRevenue', type: 'sum' }],
    dimensions: [{ name: 'region', type: 'string' }],
    relationships: [],
  },
]

const multipleCubesMetadata: CubeMetadata[] = [
  {
    name: 'Employees',
    measures: [{ name: 'count', type: 'count' }],
    dimensions: [{ name: 'name', type: 'string' }],
    relationships: [
      { targetCube: 'Productivity', relationship: 'hasMany' },
    ],
  },
  {
    name: 'Productivity',
    measures: [{ name: 'totalLines', type: 'sum' }],
    dimensions: [{ name: 'date', type: 'time' }],
    relationships: [
      { targetCube: 'Employees', relationship: 'belongsTo' },
    ],
  },
]

const eventStreamCubeMetadata: CubeMetadata[] = [
  {
    name: 'UserEvents',
    description: 'User interaction events',
    measures: [{ name: 'count', type: 'count' }],
    dimensions: [
      { name: 'userId', type: 'number' },
      { name: 'eventName', type: 'string' },
      { name: 'timestamp', type: 'time' },
    ],
    relationships: [],
    meta: {
      eventStream: {
        bindingKey: 'userId',
        timeDimension: 'timestamp',
      },
    },
  },
]

const eventStreamNoKeysMetadata: CubeMetadata[] = [
  {
    name: 'PageViews',
    measures: [{ name: 'count', type: 'count' }],
    dimensions: [{ name: 'url', type: 'string' }],
    relationships: [],
    meta: {
      eventStream: {},
    },
  },
]

// ============================================================================
// Tests
// ============================================================================

describe('buildAgentSystemPrompt', () => {
  it('should contain agent identity header', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('Drizzle Cube Analytics Agent')
  })

  it('should contain workflow section', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('Your Workflow')
    expect(prompt).toContain('Discover')
    expect(prompt).toContain('Query')
    expect(prompt).toContain('Visualize')
  })

  it('should include cube metadata when cubes provided', () => {
    const prompt = buildAgentSystemPrompt(singleCubeMetadata)
    expect(prompt).toContain('Employees')
    expect(prompt).toContain('count')
    expect(prompt).toContain('avgSalary')
    expect(prompt).toContain('name')
    expect(prompt).toContain('createdAt')
  })

  it('should handle empty metadata array', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('No cubes are currently available')
  })

  it('should include MCP guide content', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('CROSS-CUBE JOINS')
  })

  it('should include query rules content', () => {
    const prompt = buildAgentSystemPrompt([])
    // QUERY_RULES_PROMPT contains field validation rules
    expect(prompt.length).toBeGreaterThan(500)
  })

  it('should include date filtering content', () => {
    const prompt = buildAgentSystemPrompt([])
    // DATE_FILTERING_PROMPT contains date range guidance
    expect(prompt).toMatch(/date|inDateRange|timeDimensions/i)
  })

  it('should format measures as CubeName.measureName (type)', () => {
    const prompt = buildAgentSystemPrompt(singleCubeMetadata)
    expect(prompt).toContain('`Employees.count` (count)')
    expect(prompt).toContain('`Employees.avgSalary` (avg)')
  })

  it('should format dimensions as CubeName.dimensionName (type)', () => {
    const prompt = buildAgentSystemPrompt(singleCubeMetadata)
    expect(prompt).toContain('`Employees.name` (string)')
    expect(prompt).toContain('`Employees.createdAt` (time)')
  })

  it('should include relationship info', () => {
    const prompt = buildAgentSystemPrompt(singleCubeMetadata)
    expect(prompt).toContain('`Departments` (belongsTo)')
  })

  it('should handle cube with description', () => {
    const prompt = buildAgentSystemPrompt(cubeWithDescription)
    expect(prompt).toContain('Sales')
    expect(prompt).toContain('Revenue and order data')
  })

  it('should handle multiple cubes', () => {
    const prompt = buildAgentSystemPrompt(multipleCubesMetadata)
    expect(prompt).toContain('### Employees')
    expect(prompt).toContain('### Productivity')
    expect(prompt).toContain('`Employees.count` (count)')
    expect(prompt).toContain('`Productivity.totalLines` (sum)')
    expect(prompt).toContain('`Productivity` (hasMany)')
    expect(prompt).toContain('`Employees` (belongsTo)')
  })

  // ============================================================================
  // Chart Selection Guide
  // ============================================================================

  it('should include chart selection guide section', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('## Chart Selection Guide')
    expect(prompt).toContain('kpiNumber')
    expect(prompt).toContain('kpiDelta')
    expect(prompt).toContain('heatmap')
    expect(prompt).toContain('boxPlot')
  })

  it('should include analysis-mode-specific chart types in the guide', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('Analysis-mode-specific chart types')
    expect(prompt).toContain('`funnel`')
    expect(prompt).toContain('`sankey`')
    expect(prompt).toContain('`sunburst`')
    expect(prompt).toContain('`retentionHeatmap`')
    expect(prompt).toContain('`retentionCombined`')
  })

  it('should include analysis mode decision tree', () => {
    const prompt = buildAgentSystemPrompt([])
    expect(prompt).toContain('## Analysis Mode Decision Tree')
    expect(prompt).toContain('Funnel mode')
    expect(prompt).toContain('Flow mode')
    expect(prompt).toContain('Retention mode')
    expect(prompt).toContain('capabilities')
    expect(prompt).toContain('discover_cubes')
  })

  // ============================================================================
  // Event Stream Metadata
  // ============================================================================

  it('should surface eventStream metadata with binding key and time dimension', () => {
    const prompt = buildAgentSystemPrompt(eventStreamCubeMetadata)
    expect(prompt).toContain('**Event Stream:** Yes')
    expect(prompt).toContain('`UserEvents.userId`')
    expect(prompt).toContain('`UserEvents.timestamp`')
  })

  it('should surface eventStream metadata without keys when not configured', () => {
    const prompt = buildAgentSystemPrompt(eventStreamNoKeysMetadata)
    expect(prompt).toContain('**Event Stream:** Yes')
    expect(prompt).not.toContain('Binding key')
    expect(prompt).not.toContain('Time dimension')
  })

  it('should not show eventStream section for cubes without it', () => {
    const prompt = buildAgentSystemPrompt(singleCubeMetadata)
    expect(prompt).not.toContain('**Event Stream:**')
  })
})
