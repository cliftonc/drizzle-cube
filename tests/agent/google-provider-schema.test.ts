/**
 * Tests for Gemini tool-schema conversion
 *
 * Gemini's function declarations take an OpenAPI 3.0 subset, and a single
 * unsupported construct rejects the whole request — every tool, not just the
 * offending one. These tests walk the formatted payload for constructs Gemini
 * cannot parse.
 */

import { describe, it, expect } from 'vitest'
import { GoogleProvider } from '../../src/server/agent/providers/google'
import { getToolDefinitions } from '../../src/server/agent/tools'

interface Violation {
  kind: string
  path: string
}

/** Collect constructs Gemini rejects, anywhere in the formatted tool payload. */
function findUnsupported(node: unknown, path = 'tools'): Violation[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) {
    return node.flatMap((entry, index) => findUnsupported(entry, `${path}[${index}]`))
  }

  const found: Violation[] = []
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'additionalProperties') {
      found.push({ kind: 'additionalProperties', path })
    }
    if (key === 'enum' && Array.isArray(value) && value.some(entry => typeof entry !== 'string')) {
      found.push({ kind: 'non-string enum', path })
    }
    if (key === 'type' && typeof value === 'string' && value !== value.toUpperCase()) {
      found.push({ kind: `lowercase type "${value}"`, path })
    }
    found.push(...findUnsupported(value, `${path}.${key}`))
  }
  return found
}

function formatAgentTools() {
  return new GoogleProvider('test-key').formatTools(getToolDefinitions())
}

describe('GoogleProvider.formatTools', () => {
  it('emits no construct Gemini rejects across every agent tool', () => {
    expect(findUnsupported(formatAgentTools())).toEqual([])
  })

  it('keeps an unrepresentable map shape as prose on the description', () => {
    const tools = formatAgentTools() as any[]
    const addPortlet = tools.find(tool => tool.name === 'add_portlet')
    const columnFormats = addPortlet.parameters.properties.displayConfig.properties.columnFormats

    expect(columnFormats.type).toBe('OBJECT')
    expect(columnFormats.additionalProperties).toBeUndefined()
    // The per-column shape is what makes the records table usable — it has to
    // survive the conversion in some form.
    expect(columnFormats.description).toContain('kind')
    // Not just the key names: the nested shape has to survive, or the model
    // invents one (an object map keyed by value is the tempting wrong guess).
    expect(columnFormats.description).toContain(
      'badgeColors: array of { value: string (required), colorIndex: number (required) }'
    )
    expect(columnFormats.description).toContain('"text"|"number"|"date"|"badge"|"progress"')
  })

  it('keeps a numeric enum as prose on the description', () => {
    const tools = formatAgentTools() as any[]
    const addPortlet = tools.find(tool => tool.name === 'add_portlet')
    const pageSize = addPortlet.parameters.properties.displayConfig.properties.pageSize

    expect(pageSize.type).toBe('NUMBER')
    expect(pageSize.enum).toBeUndefined()
    expect(pageSize.description).toContain('25, 50, 100')
  })

  it('converts branches inside anyOf, not just top-level properties', () => {
    const tools = formatAgentTools() as any[]
    const saveDashboard = tools.find(tool => tool.name === 'save_as_dashboard')
    const mapping = saveDashboard.parameters.properties.portlets.items.properties.dashboardFilterMapping

    expect(mapping.items.anyOf.map((branch: any) => branch.type)).toEqual(['STRING', 'OBJECT'])
  })
})
