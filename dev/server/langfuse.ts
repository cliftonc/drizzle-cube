/**
 * Langfuse Tracing — lightweight REST-based tracing for AI/LLM calls.
 *
 * Uses the Langfuse Ingestion API directly via fetch() to avoid heavy SDK deps.
 * Traces are batched in memory and flushed via a single POST per request cycle.
 *
 * Adapted from guidemode's implementation for the drizzle-cube dev server.
 */

import type { AgentObservabilityHooks } from '../../src/server/agent/types.js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface LangfuseConfig {
  publicKey: string
  secretKey: string
  baseUrl?: string
  enabled?: boolean
  /** Runtime environment — shown in Langfuse UI for filtering */
  environment?: string
}

// ---------------------------------------------------------------------------
// Ingestion event types (subset of the Langfuse Ingestion API)
// ---------------------------------------------------------------------------

interface IngestionEvent {
  id: string
  type: 'trace-create' | 'generation-create' | 'span-create' | 'score-create'
  timestamp: string
  body: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// LangfuseTracer — collects events and flushes them in a single batch
// ---------------------------------------------------------------------------

export class LangfuseTracer {
  private batch: IngestionEvent[] = []
  private publicKey: string
  private secretKey: string
  private baseUrl: string
  private environment: string | undefined

  constructor(config: LangfuseConfig) {
    this.publicKey = config.publicKey
    this.secretKey = config.secretKey
    this.baseUrl = (config.baseUrl ?? 'https://cloud.langfuse.com').replace(/\/+$/, '')
    this.environment = config.environment
  }

  createTrace(params: {
    id: string
    name: string
    timestamp?: Date
    input?: unknown
    output?: unknown
    metadata?: Record<string, unknown>
    sessionId?: string
    userId?: string
    tags?: string[]
  }): void {
    this.batch.push({
      id: crypto.randomUUID(),
      type: 'trace-create',
      timestamp: new Date().toISOString(),
      body: {
        id: params.id,
        name: params.name,
        timestamp: (params.timestamp ?? new Date()).toISOString(),
        ...(this.environment && { environment: this.environment }),
        ...(params.input !== undefined && { input: params.input }),
        ...(params.output !== undefined && { output: params.output }),
        ...(params.metadata && { metadata: params.metadata }),
        ...(params.sessionId && { sessionId: params.sessionId }),
        ...(params.userId && { userId: params.userId }),
        ...(params.tags && params.tags.length > 0 && { tags: params.tags }),
      },
    })
  }

  createGeneration(params: {
    traceId: string
    name: string
    model: string
    provider: string
    input?: unknown
    output?: unknown
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
    startTime: Date
    endTime: Date
    level?: 'DEFAULT' | 'ERROR'
    statusMessage?: string
    metadata?: Record<string, unknown>
  }): void {
    this.batch.push({
      id: crypto.randomUUID(),
      type: 'generation-create',
      timestamp: new Date().toISOString(),
      body: {
        id: crypto.randomUUID(),
        traceId: params.traceId,
        name: params.name,
        model: params.model,
        modelParameters: { provider: params.provider },
        ...(params.input !== undefined && { input: params.input }),
        ...(params.output !== undefined && { output: params.output }),
        ...(params.usage && {
          usage: {
            promptTokens: params.usage.promptTokens,
            completionTokens: params.usage.completionTokens,
            totalTokens: params.usage.totalTokens,
          },
        }),
        startTime: params.startTime.toISOString(),
        endTime: params.endTime.toISOString(),
        ...(this.environment && { environment: this.environment }),
        level: params.level ?? 'DEFAULT',
        ...(params.statusMessage && { statusMessage: params.statusMessage }),
        ...(params.metadata && { metadata: params.metadata }),
      },
    })
  }

  createSpan(params: {
    traceId: string
    name: string
    startTime: Date
    endTime: Date
    metadata?: Record<string, unknown>
    level?: 'DEFAULT' | 'ERROR'
    statusMessage?: string
  }): void {
    this.batch.push({
      id: crypto.randomUUID(),
      type: 'span-create',
      timestamp: new Date().toISOString(),
      body: {
        id: crypto.randomUUID(),
        traceId: params.traceId,
        name: params.name,
        startTime: params.startTime.toISOString(),
        endTime: params.endTime.toISOString(),
        ...(this.environment && { environment: this.environment }),
        ...(params.metadata && { metadata: params.metadata }),
        level: params.level ?? 'DEFAULT',
        ...(params.statusMessage && { statusMessage: params.statusMessage }),
      },
    })
  }

  createScore(params: {
    traceId: string
    name: string
    value: number
    dataType?: 'NUMERIC' | 'CATEGORICAL' | 'BOOLEAN'
    comment?: string
  }): void {
    this.batch.push({
      id: crypto.randomUUID(),
      type: 'score-create',
      timestamp: new Date().toISOString(),
      body: {
        id: crypto.randomUUID(),
        traceId: params.traceId,
        name: params.name,
        value: params.value,
        ...(params.dataType && { dataType: params.dataType }),
        ...(params.comment && { comment: params.comment }),
      },
    })
  }

  /**
   * Flush all queued events to Langfuse.
   * Errors are silently swallowed — tracing must never break the app.
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) return

    const events = this.batch.splice(0)
    try {
      const auth = Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64')
      const res = await fetch(`${this.baseUrl}/api/public/ingestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({ batch: events }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '(unreadable)')
        console.warn(`[langfuse] ingestion returned ${res.status}: ${text}`)
      } else {
        const json = await res.json().catch(() => null)
        const errors = (json as Record<string, unknown>)?.errors
        if (Array.isArray(errors) && errors.length > 0) {
          console.warn('[langfuse] ingestion returned event-level errors:', errors)
        }
      }
    } catch (err) {
      console.debug('[langfuse] flush failed (non-blocking):', err)
    }
  }
}

// ---------------------------------------------------------------------------
// Factory: create observability hooks wired to a LangfuseTracer
// ---------------------------------------------------------------------------

export function createLangfuseObservability(tracer: LangfuseTracer): AgentObservabilityHooks {
  return {
    onChatStart(event) {
      tracer.createTrace({
        id: event.traceId,
        name: 'notebook-agent',
        timestamp: new Date(),
        input: { message: event.message },
        sessionId: event.sessionId,
        tags: ['notebook', 'dev'],
        metadata: {
          model: event.model,
          historyLength: event.historyLength,
        },
      })
    },

    onGenerationEnd(event) {
      tracer.createGeneration({
        traceId: event.traceId,
        name: `notebook-turn-${event.turn}`,
        model: event.model,
        provider: 'anthropic',
        usage: {
          promptTokens: event.inputTokens ?? 0,
          completionTokens: event.outputTokens ?? 0,
          totalTokens: (event.inputTokens ?? 0) + (event.outputTokens ?? 0),
        },
        startTime: new Date(Date.now() - event.durationMs),
        endTime: new Date(),
        metadata: { stopReason: event.stopReason },
      })
      // Flush after each generation so we don't lose data
      tracer.flush()
    },

    onToolEnd(event) {
      const endTime = new Date()
      tracer.createSpan({
        traceId: event.traceId,
        name: `tool:${event.toolName}`,
        startTime: new Date(endTime.getTime() - event.durationMs),
        endTime,
        level: event.isError ? 'ERROR' : 'DEFAULT',
        metadata: {
          toolUseId: event.toolUseId,
          turn: event.turn,
        },
      })
    },

    onChatEnd(event) {
      // Update trace output on completion
      tracer.createTrace({
        id: event.traceId,
        name: 'notebook-agent',
        output: {
          totalTurns: event.totalTurns,
          durationMs: event.durationMs,
          ...(event.error && { error: event.error }),
        },
        metadata: {
          totalTurns: event.totalTurns,
          durationMs: event.durationMs,
        },
      })
      // Final flush
      tracer.flush()
    },
  }
}

// ---------------------------------------------------------------------------
// Initializer: create tracer from env vars (returns null if not configured)
// ---------------------------------------------------------------------------

export function initLangfuse(): LangfuseTracer | null {
  const enabled = process.env.LANGFUSE_ENABLED
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY
  const secretKey = process.env.LANGFUSE_SECRET_KEY

  if (enabled !== 'true' || !publicKey || !secretKey) {
    return null
  }

  const tracer = new LangfuseTracer({
    publicKey,
    secretKey,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    enabled: true,
    environment: process.env.NODE_ENV || 'development',
  })

  console.log('🔭 Langfuse tracing enabled')
  return tracer
}
