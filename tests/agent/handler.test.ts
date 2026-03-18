/**
 * Tests for Agent Chat Handler
 * Tests handleAgentChat() from src/server/agent/handler.ts
 * Mocks the dynamic @anthropic-ai/sdk import.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dynamic import of @anthropic-ai/sdk
// The handler does: const sdk = await import('@anthropic-ai/sdk')
let mockMessagesCreate: ReturnType<typeof vi.fn>
vi.mock('@anthropic-ai/sdk', () => {
  // The handler does: Anthropic = sdk.default || sdk.Anthropic || sdk
  // so we return a constructor that has a messages.create method
  return {
    default: class MockAnthropic {
      constructor() {
        // no-op
      }
      messages = {
        create: (...args: unknown[]) => (mockMessagesCreate as any)(...args),
      }
    },
  }
})

import { handleAgentChat } from '../../src/server/agent/handler'

// Also mock adapter utils used by tools.ts (which is called inside handler)
vi.mock('../../src/adapters/utils', () => ({
  handleDiscover: vi.fn().mockResolvedValue({ cubes: [] }),
  handleLoad: vi.fn().mockResolvedValue({ data: [], annotation: {} }),
}))

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a mock Anthropic streaming response (async iterable of SSE-like events)
 */
function createMockStream(events: Array<{ type: string; [key: string]: unknown }>) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) {
        yield event
      }
    },
  }
}

/**
 * Build a simple text-only response stream (no tool_use)
 */
function createTextResponseStream(text: string) {
  return createMockStream([
    {
      type: 'content_block_start',
      content_block: { type: 'text', text: '' },
    },
    {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text },
    },
    {
      type: 'content_block_stop',
    },
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
    },
  ])
}

/**
 * Build a tool_use response stream
 */
function createToolUseResponseStream(
  toolName: string,
  toolId: string,
  inputJson: string
) {
  return createMockStream([
    // First a text block
    {
      type: 'content_block_start',
      content_block: { type: 'text', text: '' },
    },
    {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'Let me look into that.' },
    },
    {
      type: 'content_block_stop',
    },
    // Then a tool_use block
    {
      type: 'content_block_start',
      content_block: { type: 'tool_use', id: toolId, name: toolName },
    },
    {
      type: 'content_block_delta',
      delta: { type: 'input_json_delta', partial_json: inputJson },
    },
    {
      type: 'content_block_stop',
    },
    {
      type: 'message_delta',
      delta: { stop_reason: 'tool_use' },
    },
  ])
}

/**
 * Collect all events from the async generator
 */
async function collectEvents(
  gen: AsyncGenerator<{ type: string; data?: unknown }>
) {
  const events: Array<{ type: string; data?: unknown }> = []
  for await (const event of gen) {
    events.push(event)
  }
  return events
}

function createBaseOptions(overrides?: Record<string, unknown>) {
  return {
    message: 'Show me employee data',
    semanticLayer: {
      getMetadata: vi.fn().mockReturnValue([]),
      validateQuery: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    } as any,
    securityContext: { organisationId: 'org-test' },
    agentConfig: {},
    apiKey: 'test-api-key',
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('handleAgentChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMessagesCreate = vi.fn()
  })

  it('should yield done event with sessionId after no-tool-use completion', async () => {
    mockMessagesCreate.mockResolvedValue(
      createTextResponseStream('Here is the data.')
    )

    const events = await collectEvents(
      handleAgentChat(createBaseOptions({ sessionId: 'session-123' }))
    )

    const doneEvent = events.find((e) => e.type === 'done')
    expect(doneEvent).toBeDefined()
    expect((doneEvent!.data as { sessionId: string }).sessionId).toBe(
      'session-123'
    )
  })

  it('should yield text_delta events for text content', async () => {
    mockMessagesCreate.mockResolvedValue(
      createTextResponseStream('Hello, world!')
    )

    const events = await collectEvents(
      handleAgentChat(createBaseOptions())
    )

    const textDeltas = events.filter((e) => e.type === 'text_delta')
    expect(textDeltas.length).toBeGreaterThan(0)
    expect(textDeltas[0].data).toBe('Hello, world!')
  })

  it('should yield tool_use_start + tool_use_result events for tool calls', async () => {
    // First call returns tool_use, second call returns text (end of loop)
    mockMessagesCreate
      .mockResolvedValueOnce(
        createToolUseResponseStream(
          'get_cube_metadata',
          'tool-1',
          '{}'
        )
      )
      .mockResolvedValueOnce(createTextResponseStream('Done.'))

    const events = await collectEvents(
      handleAgentChat(createBaseOptions())
    )

    const toolStart = events.find((e) => e.type === 'tool_use_start')
    expect(toolStart).toBeDefined()
    expect(
      (toolStart!.data as { id: string; name: string }).name
    ).toBe('get_cube_metadata')

    const toolResult = events.find((e) => e.type === 'tool_use_result')
    expect(toolResult).toBeDefined()
    expect(
      (toolResult!.data as { id: string; name: string }).name
    ).toBe('get_cube_metadata')
  })

  it('should emit sideEffect events (add_portlet) from tool execution', async () => {
    const queryJson = JSON.stringify({ measures: ['Employees.count'], dimensions: ['Employees.name'] })
    const toolInput = JSON.stringify({
      title: 'Employee Count',
      query: queryJson,
      chartType: 'bar',
    })

    mockMessagesCreate
      .mockResolvedValueOnce(
        createToolUseResponseStream('add_portlet', 'tool-2', toolInput)
      )
      .mockResolvedValueOnce(createTextResponseStream('Chart added.'))

    const events = await collectEvents(
      handleAgentChat(createBaseOptions())
    )

    const portletEvent = events.find((e) => e.type === 'add_portlet')
    expect(portletEvent).toBeDefined()
    expect(
      (portletEvent!.data as { title: string }).title
    ).toBe('Employee Count')
  })

  it('should respect maxTurns limit', async () => {
    // Always return tool_use to force looping
    mockMessagesCreate.mockResolvedValue(
      createToolUseResponseStream(
        'get_cube_metadata',
        'tool-loop',
        '{}'
      )
    )

    const events = await collectEvents(
      handleAgentChat(
        createBaseOptions({ agentConfig: { maxTurns: 2 } })
      )
    )

    // Should have been called exactly maxTurns times
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2)

    // Should still yield done event
    const doneEvent = events.find((e) => e.type === 'done')
    expect(doneEvent).toBeDefined()
  })

  it('should handle unknown tool names gracefully', async () => {
    mockMessagesCreate
      .mockResolvedValueOnce(
        createToolUseResponseStream(
          'nonexistent_tool',
          'tool-unknown',
          '{}'
        )
      )
      .mockResolvedValueOnce(createTextResponseStream('OK'))

    const events = await collectEvents(
      handleAgentChat(createBaseOptions())
    )

    const toolResult = events.find(
      (e) =>
        e.type === 'tool_use_result' &&
        (e.data as { name: string }).name === 'nonexistent_tool'
    )
    expect(toolResult).toBeDefined()
    expect(
      (toolResult!.data as { result: string }).result
    ).toContain('Unknown tool')
  })

  it('should yield error event when API throws', async () => {
    mockMessagesCreate.mockRejectedValue(new Error('API rate limit exceeded'))

    const events = await collectEvents(
      handleAgentChat(createBaseOptions())
    )

    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(
      (errorEvent!.data as { message: string }).message
    ).toContain('API rate limit exceeded')
  })

  it('should use default model claude-sonnet-4-6 when not specified', async () => {
    mockMessagesCreate.mockResolvedValue(
      createTextResponseStream('Hi')
    )

    await collectEvents(
      handleAgentChat(createBaseOptions({ agentConfig: {} }))
    )

    expect(mockMessagesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
      })
    )
  })

  it('should pass sessionId through to done event', async () => {
    mockMessagesCreate.mockResolvedValue(
      createTextResponseStream('Done')
    )

    const events = await collectEvents(
      handleAgentChat(createBaseOptions({ sessionId: 'my-session' }))
    )

    const doneEvent = events.find((e) => e.type === 'done')
    expect(
      (doneEvent!.data as { sessionId: string }).sessionId
    ).toBe('my-session')
  })

  it('should emit turn_complete between agentic turns', async () => {
    mockMessagesCreate
      .mockResolvedValueOnce(
        createToolUseResponseStream(
          'get_cube_metadata',
          'tool-tc',
          '{}'
        )
      )
      .mockResolvedValueOnce(createTextResponseStream('All done'))

    const events = await collectEvents(
      handleAgentChat(createBaseOptions())
    )

    const turnCompleteEvents = events.filter(
      (e) => e.type === 'turn_complete'
    )
    expect(turnCompleteEvents.length).toBe(1)
  })

  it('should generate a sessionId when none provided', async () => {
    mockMessagesCreate.mockResolvedValue(
      createTextResponseStream('Hello')
    )

    const events = await collectEvents(
      handleAgentChat(createBaseOptions({ sessionId: undefined }))
    )

    const doneEvent = events.find((e) => e.type === 'done')
    const sessionId = (doneEvent!.data as { sessionId: string }).sessionId
    // Should generate a UUID when no sessionId is provided
    expect(sessionId).toBeTruthy()
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })
})
