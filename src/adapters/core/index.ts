/**
 * Public entry point for the framework-agnostic HTTP handler core.
 *
 * Third parties can build adapters for other frameworks by implementing
 * {@link HttpPort} (REST) / {@link McpHttpPort} (MCP) and driving them with
 * {@link createCubeHttpHandler}.
 */
export type { HttpPort, McpHttpPort } from './http-port.js'
export {
  withLocaleFromHeaders,
  resolveSecurityContext,
  type HeaderReader,
  type BaseSecurityContextThunk
} from './security-context.js'
export {
  createCubeHttpHandler,
  type CubeHttpHandler,
  type CubeHttpHandlerOptions
} from './cube-http-handler.js'
export type { RestHandlers } from './rest-handlers.js'
