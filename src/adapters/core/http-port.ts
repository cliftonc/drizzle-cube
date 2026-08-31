/**
 * Framework port for the HTTP handler core.
 *
 * Captures the minimal transport surface a handler needs, generically over the
 * framework's response type `TRes` so the same core works for adapters that
 * mutate a response object (Express) and adapters that return a `Response`
 * (Hono/Next.js). Implementations are constructed per request by each adapter.
 *
 * This interface is public — third parties implement it to build adapters for
 * other frameworks. Prefer optional members or a separate extension interface
 * for new capabilities, because a new required member is a breaking change for
 * those adapters.
 *
 * `setHeader` was promoted from {@link McpHttpPort} to this interface in the
 * per-tenant cube sets release, so that the core can stamp `Cache-Control` on
 * every REST response (see {@link withRestCacheHeaders}). Every REST body is now
 * tenant-scoped, and that guarantee cannot be left to each adapter. The break is
 * accepted for this release: third-party REST-only adapters must add
 * `setHeader`, which all four first-party adapters already implemented.
 */
export interface HttpPort<TRes> {
  /** Read a request header by (case-insensitive) name. Synchronous. */
  getHeader(name: string): string | undefined
  /** Resolve the parsed request body. Async (Express resolves `req.body`; others await `.json()`). */
  getBody(): Promise<unknown>
  /** Read a raw query-string value by name (used by GET). */
  getQueryParam(name: string): string | undefined
  /** Set a response header. Must be called before `send`/`sendSse`/`sendEmpty`. */
  setHeader(name: string, value: string): void
  /** Send a response with the given status and JSON body; returns the framework's response value. */
  send(status: number, body: unknown): TRes
}

/**
 * Extension of {@link HttpPort} for the MCP POST handler, which needs to emit a
 * single-event SSE response and send an empty-body acknowledgement (202 for
 * notifications).
 *
 * Kept separate from the minimal REST port so third-party adapters only
 * implement these when they wire up MCP. New required members on this interface
 * are still a breaking change for MCP-capable adapters.
 */
export interface McpHttpPort<TRes> extends HttpPort<TRes> {
  /** Send a single-event SSE response (status 200): write the pre-serialized body, then end. */
  sendSse(status: number, body: string): TRes
  /** Send an empty-body response (no JSON), e.g. a 202 notification acknowledgement. */
  sendEmpty(status: number): TRes
}

/**
 * `Cache-Control` stamped on every REST response.
 *
 * Every REST body varies by tenant: `/meta` returns the caller's cube set, and
 * `/load`, `/sql`, `/dry-run`, `/batch` and `/explain` return that tenant's data
 * or SQL. With no `Cache-Control` a shared cache may store and reuse these
 * responses heuristically, which would cross-serve one tenant's cubes to
 * another. `private` bars shared caches; `no-store` bars storage entirely.
 */
export const REST_CACHE_CONTROL = 'private, no-store'

/**
 * Wrap a port so every response it sends carries {@link REST_CACHE_CONTROL}.
 *
 * Applied once over the whole REST surface in `createCubeHttpHandler`, not per
 * route, so no endpoint can forget it — including the 400/500 error paths.
 * Deliberately NOT applied to MCP: its SSE responses set their own
 * `Cache-Control`, and JSON-RPC POSTs are not heuristically cacheable.
 */
export function withRestCacheHeaders<TRes>(port: HttpPort<TRes>): HttpPort<TRes> {
  return {
    getHeader: (name) => port.getHeader(name),
    getBody: () => port.getBody(),
    getQueryParam: (name) => port.getQueryParam(name),
    setHeader: (name, value) => port.setHeader(name, value),
    send: (status, body) => {
      port.setHeader('Cache-Control', REST_CACHE_CONTROL)
      return port.send(status, body)
    }
  }
}
