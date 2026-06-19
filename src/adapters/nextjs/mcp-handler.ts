/**
 * MCP GET-stream helper for the Next.js adapter.
 *
 * The MCP POST flow (validation, dispatch, JSON/SSE response, error formatting)
 * now lives in the framework-agnostic core (`src/adapters/core`). The only piece
 * that stays here is the long-lived GET streaming connection, which is inherently
 * transport-bound.
 */

import { NextRequest, NextResponse } from 'next/server'
import { primeEventId, serializeSseEvent } from '../mcp-transport.js'

/** Applies adapter CORS headers to an outgoing header set (no-op when CORS is disabled). */
export type ApplyCors = (request: NextRequest, headers: Headers) => void

/**
 * Build the SSE `Response` for a GET (streaming connection open) request,
 * emitting the initial `mcp/ready` event.
 */
export function buildMcpGetResponse(request: NextRequest, applyCors: ApplyCors): NextResponse {
  const encoder = new TextEncoder()
  const eventId = primeEventId()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(serializeSseEvent({
        jsonrpc: '2.0',
        method: 'mcp/ready',
        params: { protocol: 'streamable-http' }
      }, eventId, 15000)))
    }
  })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  applyCors(request, headers)
  return new NextResponse(stream, { status: 200, headers })
}
