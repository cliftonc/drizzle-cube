/**
 * Tests for single-step-prompt.ts
 *
 * These tests verify the single-step AI query generation prompt,
 * which is used when no dimension values need to be fetched from the database.
 */

import { describe, it, expect } from 'vitest'
import {
  buildSystemPrompt,
  SYSTEM_PROMPT_TEMPLATE
} from '../../../src/server/prompts/single-step-prompt.js'

describe('SYSTEM_PROMPT_TEMPLATE constant', () => {
  it('should contain required placeholders', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('{CUBE_SCHEMA}')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('{USER_PROMPT}')
  })

  it('should describe response format', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"query"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"chartType"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"chartConfig"')
  })

  it('should document query structure', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('dimensions')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('measures')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('timeDimensions')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('filters')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('order')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('limit')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('offset')
  })

  it('should document filter operators', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('equals')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('notEquals')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('contains')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('notContains')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('startsWith')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('endsWith')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('gt')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('gte')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('lt')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('lte')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('inDateRange')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('notInDateRange')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('beforeDate')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('afterDate')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('set')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('notSet')
  })

  it('should document valid dateRange strings', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'today'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'yesterday'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'last 7 days'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'last 30 days'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'last week'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'last month'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'last quarter'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'last year'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'this week'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'this month'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'this quarter'")
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("'this year'")
  })

  it('should emphasize lowercase dateRange requirement', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('MUST be lower case')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('lowercase')
  })

  it('should document funnel query structure', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"funnel"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"bindingKey"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"timeDimension"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"steps"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"timeToConvert"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"includeTimeMetrics"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"globalTimeWindow"')
  })

  it('should document funnel detection keywords', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('funnel')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('conversion')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('journey')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('flow')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('drop off')
  })

  it('should document chart types', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"line"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"bar"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"area"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"pie"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"scatter"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"bubble"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"table"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"funnel"')
  })

  it('should document correlation detection keywords', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('correlation')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('relationship')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('versus')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('compare')
  })

  it('should document chart configuration fields', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"xAxis"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"yAxis"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"series"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"sizeField"')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('"colorField"')
  })

  it('should document dimension selection rules', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('.name fields')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('.id fields')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('NEVER use fields ending with "Id"')
  })

  it('should specify JSON-only response requirement', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('ONLY valid JSON')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('no explanations or markdown')
  })

  it('should document eventStream metadata requirement for funnels', () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('eventStream')
    expect(SYSTEM_PROMPT_TEMPLATE).toContain('Funnel queries can ONLY be used for cubes that have "eventStream" metadata')
  })
})

describe('buildSystemPrompt', () => {
  it('should replace CUBE_SCHEMA placeholder', () => {
    const cubeSchema = '{"cubes": {"Employees": {"measures": {"count": {}}}}}'
    const userPrompt = 'Show me employee count'

    const result = buildSystemPrompt(cubeSchema, userPrompt)

    expect(result).toContain(cubeSchema)
    expect(result).not.toContain('{CUBE_SCHEMA}')
  })

  it('should replace USER_PROMPT placeholder', () => {
    const cubeSchema = '{}'
    const userPrompt = 'Show me sales by region'

    const result = buildSystemPrompt(cubeSchema, userPrompt)

    expect(result).toContain(userPrompt)
    expect(result).not.toContain('{USER_PROMPT}')
  })

  it('should include both cube schema and user prompt in output', () => {
    const cubeSchema = '{"cubes": {"Sales": {"measures": {"revenue": {"type": "sum"}}}}}'
    const userPrompt = 'What is the total revenue by category?'

    const result = buildSystemPrompt(cubeSchema, userPrompt)

    expect(result).toContain(cubeSchema)
    expect(result).toContain(userPrompt)
  })

  it('should preserve template structure', () => {
    const result = buildSystemPrompt('{}', 'test query')

    // Should still contain the template instructions
    expect(result).toContain('You are a helpful AI assistant')
    expect(result).toContain('RESPONSE FORMAT')
    expect(result).toContain('QUERY STRUCTURE')
    expect(result).toContain('CHART TYPE SELECTION')
  })

  it('should handle complex cube schema with special characters', () => {
    const cubeSchema = JSON.stringify({
      cubes: {
        Users: {
          measures: {
            count: { type: 'count' },
            'active-users': { type: 'count' }
          },
          dimensions: {
            email: { type: 'string' },
            'created_at': { type: 'time' }
          }
        }
      }
    }, null, 2)
    const userPrompt = 'Show active users'

    const result = buildSystemPrompt(cubeSchema, userPrompt)

    expect(result).toContain('active-users')
    expect(result).toContain('created_at')
  })

  it('should handle user prompts with quotes and special characters', () => {
    const cubeSchema = '{}'
    const userPrompt = 'Show me users where status = "active" and name contains \'John\''

    const result = buildSystemPrompt(cubeSchema, userPrompt)

    expect(result).toContain(userPrompt)
  })

  it('should handle empty cube schema', () => {
    const result = buildSystemPrompt('{}', 'test')

    expect(result).toContain('CUBE SCHEMA:\n{}')
  })

  it('should handle multi-line user prompts', () => {
    const userPrompt = `Show me:
    1. Total revenue
    2. By month
    3. For last year`

    const result = buildSystemPrompt('{}', userPrompt)

    expect(result).toContain(userPrompt)
  })
})
