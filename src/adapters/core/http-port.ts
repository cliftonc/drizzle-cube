/**
 * Framework port for the HTTP handler core.
 *
 * Captures the minimal transport surface a handler needs, generically over the
 * framework's response type `TRes` so the same core works for adapters that
 * mutate a response object (Express) and adapters that return a `Response`
 * (Hono/Next.js). Implementations are constructed per request by each adapter.
 *
 * This interface is public — third parties implement it to build adapters for
 * other frameworks. Add new capabilities as optional members or via a separate
 * extension interface; a new required member is a breaking change.
 */
export interface HttpPort<TRes> {
  /** Read a request header by (case-insensitive) name. Synchronous. */
  getHeader(name: string): string | undefined
  /** Resolve the parsed request body. Async (Express resolves `req.body`; others await `.json()`). */
  getBody(): Promise<unknown>
  /** Read a raw query-string value by name (used by GET). */
  getQueryParam(name: string): string | undefined
  /** Send a response with the given status and JSON body; returns the framework's response value. */
  send(status: number, body: unknown): TRes
}
