/**
 * Agent-chat handler helpers for the Hono adapter.
 *
 * Extracted from the `POST /agent/chat` route to keep API-key resolution,
 * per-request provider overrides, and SSE streaming out of a single
 * high-complexity arrow. Behaviour (status codes, headers, SSE framing) is
 * identical to the inlined implementation.
 */

import type { Context } from 'hono'
import type { SemanticLayerCompiler } from '../../server/compiler'
import type { SecurityContext } from '../../server'
import type { AgentConfig, AgentHistoryMessage } from '../../server/agent/types'

interface AgentChatBody {
  message: string
  sessionId?: string
  history?: AgentHistoryMessage[]
}

/** Resolve the effective API key: server config, optionally overridden by client header. */
function resolveApiKey(c: Context, agentConfig: AgentConfig): string {
  let apiKey = (agentConfig.apiKey || '').trim()
  if (agentConfig.allowClientApiKey) {
    const clientKey = c.req.header('x-agent-api-key')
    if (clientKey) {
      apiKey = clientKey.trim()
    }
  }
  return apiKey
}

/** Read per-request provider overrides from client headers (only when allowed). */
function resolveProviderOverrides(c: Context, agentConfig: AgentConfig): {
  providerOverride?: string
  modelOverride?: string
  baseURLOverride?: string
} {
  if (!agentConfig.allowClientApiKey) return {}
  return {
    providerOverride: c.req.header('x-agent-provider'),
    modelOverride: c.req.header('x-agent-model'),
    baseURLOverride: c.req.header('x-agent-provider-endpoint')
  }
}

/** Build the SSE `Response` that streams agent events as they are produced. */
function buildAgentSseResponse(
  events: AsyncIterable<unknown>
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
      } catch (error) {
        const errorEvent = {
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Stream failed' }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

/**
 * Handle a `POST /agent/chat` request: validate input, resolve the API key and
 * overrides, then stream agent events as SSE. Mirrors the previous inline route.
 */
export async function handleAgentChatRequest(
  c: Context,
  agentConfig: AgentConfig,
  semanticLayer: SemanticLayerCompiler,
  extractSecurityContext: (c: Context) => Promise<SecurityContext>
): Promise<Response> {
  try {
    const { handleAgentChat } = await import('../../server/agent/handler')

    const body = await c.req.json()
    const { message, sessionId, history } = body as AgentChatBody

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message is required and must be a string' }, 400)
    }

    const apiKey = resolveApiKey(c, agentConfig)
    if (!apiKey) {
      return c.json({
        error: 'No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header.'
      }, 401)
    }

    const { providerOverride, modelOverride, baseURLOverride } = resolveProviderOverrides(c, agentConfig)

    // Extract security context (required for all queries)
    const securityContext = await extractSecurityContext(c)

    // Build per-request system context from the callback (if configured)
    const systemContext = agentConfig.buildSystemContext?.(securityContext)

    const events = handleAgentChat({
      message,
      sessionId,
      history,
      semanticLayer,
      securityContext,
      agentConfig,
      apiKey,
      systemContext,
      providerOverride,
      modelOverride,
      baseURLOverride,
    })

    return buildAgentSseResponse(events)
  } catch (error) {
    console.error('Agent chat error:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Agent chat failed'
    }, 500)
  }
}
