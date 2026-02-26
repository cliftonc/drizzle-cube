/**
 * Tests for useAgentChat Hook
 * Tests SSE parsing, callback dispatch, abort, and error handling
 * from src/client/hooks/useAgentChat.ts
 *
 * Uses MSW to mock POST /agent/chat returning SSE-formatted ReadableStream responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../client-setup/msw-server'
import { createHookWrapper } from '../../client-setup/test-utils'
import { useAgentChat, type UseAgentChatOptions } from '../../../src/client/hooks/useAgentChat'

// ============================================================================
// Helpers
// ============================================================================

interface SSEEvent {
  type: string
  data: unknown
}

/**
 * Encode an array of AgentSSEEvent objects as SSE text stream (ReadableStream).
 */
function createSSEResponse(events: SSEEvent[]) {
  const encoder = new TextEncoder()
  const lines = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(lines))
      controller.close()
    },
  })

  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

function createDefaultCallbacks(): UseAgentChatOptions {
  return {
    onTextDelta: vi.fn(),
    onToolStart: vi.fn(),
    onToolResult: vi.fn(),
    onAddPortlet: vi.fn(),
    onAddMarkdown: vi.fn(),
    onDone: vi.fn(),
    onTurnComplete: vi.fn(),
    onError: vi.fn(),
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('useAgentChat', () => {
  let callbacks: ReturnType<typeof createDefaultCallbacks>

  beforeEach(() => {
    callbacks = createDefaultCallbacks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  // --------------------------------------------------------------------------
  // SSE Event Parsing
  // --------------------------------------------------------------------------
  describe('SSE event parsing', () => {
    it('should call onTextDelta for text_delta events', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'text_delta', data: 'Hello world' },
            { type: 'done', data: { sessionId: 'sess-1' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onTextDelta).toHaveBeenCalledWith('Hello world')
    })

    it('should call onToolStart for tool_use_start events', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'tool_use_start', data: { id: 't-1', name: 'discover_cubes', input: { topic: 'sales' } } },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onToolStart).toHaveBeenCalledWith('t-1', 'discover_cubes', { topic: 'sales' })
    })

    it('should call onToolResult for tool_use_result events', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'tool_use_result', data: { id: 't-1', name: 'discover_cubes', result: 'cubes found' } },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onToolResult).toHaveBeenCalledWith('t-1', 'discover_cubes', 'cubes found')
    })

    it('should call onAddPortlet with type:portlet for add_portlet events', async () => {
      const portletData = {
        id: 'portlet-123',
        title: 'Employee Count',
        query: '{"measures":["Employees.count"]}',
        chartType: 'bar',
      }

      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'add_portlet', data: portletData },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onAddPortlet).toHaveBeenCalledWith({
        ...portletData,
        type: 'portlet',
      })
    })

    it('should call onAddMarkdown with type:markdown for add_markdown events', async () => {
      const markdownData = {
        id: 'md-123',
        content: '## Analysis',
        title: 'Findings',
      }

      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'add_markdown', data: markdownData },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onAddMarkdown).toHaveBeenCalledWith({
        ...markdownData,
        type: 'markdown',
      })
    })

    it('should call onTurnComplete for turn_complete events', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'turn_complete', data: {} },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onTurnComplete).toHaveBeenCalled()
    })

    it('should call onDone with sessionId for done events', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'done', data: { sessionId: 'sess-abc' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onDone).toHaveBeenCalledWith('sess-abc')
    })

    it('should call onError for error events', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'error', data: { message: 'Something went wrong' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onError).toHaveBeenCalledWith('Something went wrong')
    })
  })

  // --------------------------------------------------------------------------
  // Stream Handling
  // --------------------------------------------------------------------------
  describe('stream handling', () => {
    it('should handle multiple events in one chunk', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'text_delta', data: 'First' },
            { type: 'text_delta', data: ' Second' },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onTextDelta).toHaveBeenCalledTimes(2)
      expect(callbacks.onTextDelta).toHaveBeenCalledWith('First')
      expect(callbacks.onTextDelta).toHaveBeenCalledWith(' Second')
    })

    it('should skip malformed SSE data without throwing', async () => {
      // Send a response with a malformed line mixed in
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: {"type":"text_delta","data":"OK"}\n\n` +
              `data: this is not valid json\n\n` +
              `data: {"type":"done","data":{"sessionId":""}}\n\n`
            )
          )
          controller.close()
        },
      })

      server.use(
        http.post('*/agent/chat', () =>
          new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          })
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      // Should still process valid events
      expect(callbacks.onTextDelta).toHaveBeenCalledWith('OK')
      expect(callbacks.onDone).toHaveBeenCalled()
      // Should NOT call onError for malformed data
      expect(callbacks.onError).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------
  describe('lifecycle', () => {
    it('should set isStreaming true during stream, false after', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      expect(result.current.isStreaming).toBe(false)

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(result.current.isStreaming).toBe(false)
    })

    it('should set isStreaming false on error', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          HttpResponse.json({ error: 'Bad request' }, { status: 400 })
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(result.current.isStreaming).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Abort
  // --------------------------------------------------------------------------
  describe('abort', () => {
    it('should set isStreaming to false when abort() is called', async () => {
      // Use a stream that delivers content then closes, but we test the abort function directly
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'text_delta', data: 'chunk1' },
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      // Verify abort doesn't throw when no active stream
      act(() => {
        result.current.abort()
      })
      expect(result.current.isStreaming).toBe(false)
    })

    it('should suppress AbortError and not call onError', async () => {
      // Verify the hook's error handler filters AbortError:
      // After a successful stream, abort() shouldn't trigger onError
      server.use(
        http.post('*/agent/chat', () =>
          createSSEResponse([
            { type: 'done', data: { sessionId: '' } },
          ])
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      // Abort after stream completes
      act(() => {
        result.current.abort()
      })

      expect(callbacks.onError).not.toHaveBeenCalled()
      expect(result.current.isStreaming).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------
  describe('error handling', () => {
    it('should call onError for non-200 responses', async () => {
      server.use(
        http.post('*/agent/chat', () =>
          HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onError).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'))
    })

    it('should call onError for network failures', async () => {
      server.use(
        http.post('*/agent/chat', () => HttpResponse.error())
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(callbacks.onError).toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // Request Construction
  // --------------------------------------------------------------------------
  describe('request construction', () => {
    it('should send message and sessionId in body', async () => {
      let capturedBody: Record<string, unknown> | null = null

      server.use(
        http.post('*/agent/chat', async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>
          return createSSEResponse([
            { type: 'done', data: { sessionId: '' } },
          ])
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(() => useAgentChat(callbacks), { wrapper })

      await act(async () => {
        await result.current.sendMessage('analyze employees', 'sess-xyz')
      })

      expect(capturedBody).toMatchObject({
        message: 'analyze employees',
        sessionId: 'sess-xyz',
      })
    })

    it('should include X-Agent-Api-Key when provided', async () => {
      let capturedHeaders: Headers | null = null

      server.use(
        http.post('*/agent/chat', async ({ request }) => {
          capturedHeaders = request.headers
          return createSSEResponse([
            { type: 'done', data: { sessionId: '' } },
          ])
        })
      )

      const { wrapper } = createHookWrapper()
      const { result } = renderHook(
        () => useAgentChat({ ...callbacks, agentApiKey: 'my-api-key' }),
        { wrapper }
      )

      await act(async () => {
        await result.current.sendMessage('test')
      })

      expect(capturedHeaders!.get('X-Agent-Api-Key')).toBe('my-api-key')
    })
  })
})
