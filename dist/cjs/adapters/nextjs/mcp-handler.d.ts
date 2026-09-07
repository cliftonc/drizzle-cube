import { NextRequest, NextResponse } from 'next/server';
/** Applies adapter CORS headers to an outgoing header set (no-op when CORS is disabled). */
export type ApplyCors = (request: NextRequest, headers: Headers) => void;
/**
 * Build the SSE `Response` for a GET (streaming connection open) request,
 * emitting the initial `mcp/ready` event.
 */
export declare function buildMcpGetResponse(request: NextRequest, applyCors: ApplyCors): NextResponse;
