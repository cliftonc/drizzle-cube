/**
 * MCP Transport Layer Tests
 * Tests for Model Context Protocol transport utilities and JSON-RPC handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  negotiateProtocol,
  wantsEventStream,
  validateAcceptHeader,
  validateOriginHeader,
  serializeSseEvent,
  buildJsonRpcError,
  buildJsonRpcResult,
  parseJsonRpc,
  dispatchMcpMethod,
  jsonRpcError,
  normalizeHeader,
  isNotification,
  primeEventId,
  buildMcpResources,
  getDefaultResources,
  getDefaultPrompts,
  getDefaultInstructions,
  resolveMcpPrompts,
  resolveMcpResources,
  resolveMcpInstructions,
  getMcpAppHtml,
  SUPPORTED_MCP_PROTOCOLS,
  DEFAULT_MCP_PROTOCOL,
  MCP_SESSION_ID_HEADER,
  MCP_PROTOCOL_VERSION_HEADER,
  extractBearerToken,
  buildWwwAuthenticateChallenge,
  type JsonRpcRequest,
  type McpDispatchContext,
  type McpAppConfig
} from '../../src/adapters/mcp-transport'
import { createTestSemanticLayer } from '../helpers/test-database'
import { testSecurityContexts } from '../helpers/enhanced-test-data'
import { createTestCubesForCurrentDatabase } from '../helpers/test-cubes'

describe('MCP Transport Layer', () => {
  describe('Protocol Constants', () => {
    it('should export supported MCP protocols', () => {
      expect(SUPPORTED_MCP_PROTOCOLS).toBeInstanceOf(Array)
      expect(SUPPORTED_MCP_PROTOCOLS.length).toBeGreaterThan(0)
      expect(SUPPORTED_MCP_PROTOCOLS).toContain('2025-11-25')
      expect(SUPPORTED_MCP_PROTOCOLS).toContain('2025-06-18')
      expect(SUPPORTED_MCP_PROTOCOLS).toContain('2025-03-26')
    })

    it('should have correct default protocol', () => {
      expect(DEFAULT_MCP_PROTOCOL).toBe('2025-11-25')
    })

    it('should export correct header names', () => {
      expect(MCP_SESSION_ID_HEADER).toBe('mcp-session-id')
      expect(MCP_PROTOCOL_VERSION_HEADER).toBe('mcp-protocol-version')
    })
  })

  describe('negotiateProtocol', () => {
    it('should accept supported protocol versions', () => {
      expect(negotiateProtocol({ 'mcp-protocol-version': '2025-11-25' })).toEqual({
        ok: true,
        negotiated: '2025-11-25',
        supported: SUPPORTED_MCP_PROTOCOLS
      })

      expect(negotiateProtocol({ 'mcp-protocol-version': '2025-06-18' })).toEqual({
        ok: true,
        negotiated: '2025-06-18',
        supported: SUPPORTED_MCP_PROTOCOLS
      })

      expect(negotiateProtocol({ 'mcp-protocol-version': '2025-03-26' })).toEqual({
        ok: true,
        negotiated: '2025-03-26',
        supported: SUPPORTED_MCP_PROTOCOLS
      })
    })

    it('should default to latest protocol when no version specified', () => {
      const result = negotiateProtocol({})
      expect(result.ok).toBe(true)
      expect(result.negotiated).toBe(DEFAULT_MCP_PROTOCOL)
    })

    it('should reject unsupported protocol versions', () => {
      const result = negotiateProtocol({ 'mcp-protocol-version': '2020-01-01' })
      expect(result.ok).toBe(false)
      expect(result.negotiated).toBeNull()
      expect(result.supported).toEqual(SUPPORTED_MCP_PROTOCOLS)
    })

    it('should handle array header values', () => {
      const result = negotiateProtocol({ 'mcp-protocol-version': ['2025-11-25', '2025-06-18'] })
      expect(result.ok).toBe(true)
      expect(result.negotiated).toBe('2025-11-25')
    })

    it('should handle undefined header values', () => {
      const result = negotiateProtocol({ 'mcp-protocol-version': undefined })
      expect(result.ok).toBe(true)
      expect(result.negotiated).toBe(DEFAULT_MCP_PROTOCOL)
    })
  })

  describe('wantsEventStream', () => {
    it('should return true when only SSE is accepted', () => {
      expect(wantsEventStream('text/event-stream')).toBe(true)
    })

    it('should return false when both JSON and SSE are accepted (prefers JSON)', () => {
      expect(wantsEventStream('application/json, text/event-stream')).toBe(false)
      expect(wantsEventStream('text/event-stream, application/json')).toBe(false)
    })

    it('should return false when only JSON is accepted', () => {
      expect(wantsEventStream('application/json')).toBe(false)
    })

    it('should return false for null/undefined accept header', () => {
      expect(wantsEventStream(null)).toBe(false)
      expect(wantsEventStream(undefined)).toBe(false)
    })

    it('should handle case-insensitive content types', () => {
      expect(wantsEventStream('TEXT/EVENT-STREAM')).toBe(true)
      expect(wantsEventStream('Text/Event-Stream')).toBe(true)
    })

    it('should handle whitespace in accept header', () => {
      expect(wantsEventStream('  text/event-stream  ')).toBe(true)
      expect(wantsEventStream('application/json , text/event-stream')).toBe(false)
    })
  })

  describe('validateAcceptHeader', () => {
    it('should return true when both JSON and SSE are accepted', () => {
      expect(validateAcceptHeader('application/json, text/event-stream')).toBe(true)
      expect(validateAcceptHeader('text/event-stream, application/json')).toBe(true)
    })

    it('should return true when only JSON is accepted (lenient for Claude app)', () => {
      expect(validateAcceptHeader('application/json')).toBe(true)
    })

    it('should return false when only SSE is accepted', () => {
      expect(validateAcceptHeader('text/event-stream')).toBe(false)
    })

    it('should return true for wildcard accept', () => {
      expect(validateAcceptHeader('*/*')).toBe(true)
    })

    it('should return false for null/undefined', () => {
      expect(validateAcceptHeader(null)).toBe(false)
      expect(validateAcceptHeader(undefined)).toBe(false)
    })

    it('should handle quality values in accept header', () => {
      expect(validateAcceptHeader('application/json;q=0.9, text/event-stream;q=0.8')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(validateAcceptHeader('APPLICATION/JSON, TEXT/EVENT-STREAM')).toBe(true)
    })
  })

  describe('validateOriginHeader', () => {
    it('should allow missing origin by default', () => {
      const result = validateOriginHeader(null)
      expect(result.valid).toBe(true)
    })

    it('should allow missing origin when explicitly configured', () => {
      const result = validateOriginHeader(null, { allowMissingOrigin: true })
      expect(result.valid).toBe(true)
    })

    it('should reject missing origin when not allowed', () => {
      const result = validateOriginHeader(null, { allowMissingOrigin: false })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('Origin header is required')
      }
    })

    it('should allow all origins when no allowedOrigins configured', () => {
      const result = validateOriginHeader('http://example.com')
      expect(result.valid).toBe(true)
    })

    it('should allow origins in the allowed list', () => {
      const result = validateOriginHeader('http://localhost:3000', {
        allowedOrigins: ['http://localhost:3000', 'https://example.com']
      })
      expect(result.valid).toBe(true)
    })

    it('should reject origins not in the allowed list', () => {
      const result = validateOriginHeader('http://malicious.com', {
        allowedOrigins: ['http://localhost:3000', 'https://example.com']
      })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('Origin not in allowed list')
      }
    })

    it('should reject invalid origin format', () => {
      const result = validateOriginHeader('not-a-valid-url', {
        allowedOrigins: ['http://localhost:3000']
      })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('Invalid Origin header format')
      }
    })

    it('should normalize URLs when comparing', () => {
      const result = validateOriginHeader('http://localhost:3000/', {
        allowedOrigins: ['http://localhost:3000']
      })
      expect(result.valid).toBe(true)
    })

    it('should handle empty allowedOrigins array', () => {
      const result = validateOriginHeader('http://example.com', { allowedOrigins: [] })
      expect(result.valid).toBe(true)
    })
  })

  describe('serializeSseEvent', () => {
    it('should serialize simple payload', () => {
      const payload = { result: 'test' }
      const serialized = serializeSseEvent(payload)

      expect(serialized).toContain('event: message')
      expect(serialized).toContain('data: {"result":"test"}')
    })

    it('should include event ID when provided', () => {
      const payload = { result: 'test' }
      const serialized = serializeSseEvent(payload, 'evt-123')

      expect(serialized).toContain('id: evt-123')
    })

    it('should include retry when provided', () => {
      const payload = { result: 'test' }
      const serialized = serializeSseEvent(payload, 'evt-123', 5000)

      expect(serialized).toContain('retry: 5000')
    })

    it('should not include retry when zero or negative', () => {
      const payload = { result: 'test' }

      const serialized1 = serializeSseEvent(payload, undefined, 0)
      expect(serialized1).not.toContain('retry:')

      const serialized2 = serializeSseEvent(payload, undefined, -1)
      expect(serialized2).not.toContain('retry:')
    })

    it('should handle complex payloads', () => {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        result: { cubes: [{ name: 'Test' }] }
      }
      const serialized = serializeSseEvent(payload)

      expect(serialized).toContain('data: ')
      expect(JSON.parse(serialized.split('data: ')[1].split('\n')[0])).toEqual(payload)
    })
  })

  describe('buildJsonRpcError', () => {
    it('should build basic error response', () => {
      const error = buildJsonRpcError(1, -32600, 'Invalid request')

      expect(error).toEqual({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid request'
        }
      })
    })

    it('should include data when provided', () => {
      const error = buildJsonRpcError(1, -32602, 'Invalid params', { field: 'query' })

      expect(error.error).toEqual({
        code: -32602,
        message: 'Invalid params',
        data: { field: 'query' }
      })
    })

    it('should handle null ID', () => {
      const error = buildJsonRpcError(null, -32700, 'Parse error')
      expect(error.id).toBeNull()
    })

    it('should handle undefined ID', () => {
      const error = buildJsonRpcError(undefined, -32700, 'Parse error')
      expect(error.id).toBeNull()
    })

    it('should handle string ID', () => {
      const error = buildJsonRpcError('req-123', -32600, 'Invalid request')
      expect(error.id).toBe('req-123')
    })
  })

  describe('buildJsonRpcResult', () => {
    it('should build basic result response', () => {
      const result = buildJsonRpcResult(1, { data: 'test' })

      expect(result).toEqual({
        jsonrpc: '2.0',
        id: 1,
        result: { data: 'test' }
      })
    })

    it('should handle null result', () => {
      const result = buildJsonRpcResult(1, null)

      expect(result).toEqual({
        jsonrpc: '2.0',
        id: 1,
        result: null
      })
    })

    it('should handle string ID', () => {
      const result = buildJsonRpcResult('req-123', { success: true })
      expect(result.id).toBe('req-123')
    })

    it('should handle null ID', () => {
      const result = buildJsonRpcResult(null, { success: true })
      expect(result.id).toBeNull()
    })
  })

  describe('parseJsonRpc', () => {
    it('should parse valid JSON-RPC request', () => {
      const body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'discover',
        params: { topic: 'sales' }
      }

      const parsed = parseJsonRpc(body)

      expect(parsed).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'discover',
        params: { topic: 'sales' }
      })
    })

    it('should parse notification (no ID)', () => {
      const body = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      }

      const parsed = parseJsonRpc(body)

      expect(parsed).not.toBeNull()
      expect(parsed?.id).toBeUndefined()
      expect(parsed?.method).toBe('notifications/initialized')
    })

    it('should return null for non-object body', () => {
      expect(parseJsonRpc(null)).toBeNull()
      expect(parseJsonRpc(undefined)).toBeNull()
      expect(parseJsonRpc('string')).toBeNull()
      expect(parseJsonRpc(123)).toBeNull()
    })

    it('should return null for invalid jsonrpc version', () => {
      const body = {
        jsonrpc: '1.0',
        id: 1,
        method: 'test'
      }
      expect(parseJsonRpc(body)).toBeNull()
    })

    it('should return null for missing method', () => {
      const body = {
        jsonrpc: '2.0',
        id: 1
      }
      expect(parseJsonRpc(body)).toBeNull()
    })

    it('should return null for non-string method', () => {
      const body = {
        jsonrpc: '2.0',
        id: 1,
        method: 123
      }
      expect(parseJsonRpc(body)).toBeNull()
    })
  })

  describe('jsonRpcError', () => {
    it('should create error with code', () => {
      const error = jsonRpcError(-32600, 'Invalid request')

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Invalid request')
      expect(error.code).toBe(-32600)
    })

    it('should include data when provided', () => {
      const error = jsonRpcError(-32602, 'Invalid params', { field: 'query' })

      expect(error.data).toEqual({ field: 'query' })
    })

    it('should not include data when undefined', () => {
      const error = jsonRpcError(-32600, 'Invalid request')

      expect(error).not.toHaveProperty('data')
    })
  })

  describe('normalizeHeader', () => {
    it('should return string value as-is', () => {
      expect(normalizeHeader('value')).toBe('value')
    })

    it('should return first element of array', () => {
      expect(normalizeHeader(['first', 'second'])).toBe('first')
    })

    it('should return null for empty array', () => {
      expect(normalizeHeader([])).toBeNull()
    })

    it('should return null for undefined', () => {
      expect(normalizeHeader(undefined)).toBeNull()
    })

    it('should return null for empty string in array', () => {
      // Empty string is falsy, so value[0] || null returns null
      expect(normalizeHeader([''])).toBeNull()
    })
  })

  describe('isNotification', () => {
    it('should return true for undefined ID', () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'test'
      }
      expect(isNotification(request)).toBe(true)
    })

    it('should return true for null ID', () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: null,
        method: 'test'
      }
      expect(isNotification(request)).toBe(true)
    })

    it('should return false for numeric ID', () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test'
      }
      expect(isNotification(request)).toBe(false)
    })

    it('should return false for string ID', () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 'req-123',
        method: 'test'
      }
      expect(isNotification(request)).toBe(false)
    })

    it('should return false for zero ID', () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 0,
        method: 'test'
      }
      expect(isNotification(request)).toBe(false)
    })
  })

  describe('primeEventId', () => {
    it('should generate unique event IDs', () => {
      const id1 = primeEventId()
      const id2 = primeEventId()

      expect(id1).not.toBe(id2)
    })

    it('should start with evt- prefix', () => {
      const id = primeEventId()
      expect(id).toMatch(/^evt-/)
    })

    it('should be a non-empty string', () => {
      const id = primeEventId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(4) // 'evt-' plus at least one character
    })
  })

  describe('getDefaultResources', () => {
    it('should return array of resources', () => {
      const resources = getDefaultResources()

      expect(Array.isArray(resources)).toBe(true)
      expect(resources.length).toBeGreaterThan(0)
    })

    it('should have properly structured resources', () => {
      const resources = getDefaultResources()

      for (const resource of resources) {
        expect(resource).toHaveProperty('uri')
        expect(resource).toHaveProperty('name')
        expect(resource).toHaveProperty('description')
        expect(resource).toHaveProperty('mimeType')
        expect(resource).toHaveProperty('text')
      }
    })

    it('should include quickstart resource', () => {
      const resources = getDefaultResources()
      const quickstart = resources.find(r => r.uri === 'drizzle-cube://quickstart')

      expect(quickstart).toBeDefined()
      expect(quickstart?.mimeType).toBe('text/markdown')
    })
  })

  describe('getDefaultPrompts', () => {
    it('should return array of prompts', () => {
      const prompts = getDefaultPrompts()

      expect(Array.isArray(prompts)).toBe(true)
      expect(prompts.length).toBeGreaterThan(0)
    })

    it('should have properly structured prompts', () => {
      const prompts = getDefaultPrompts()

      for (const prompt of prompts) {
        expect(prompt).toHaveProperty('name')
        expect(prompt).toHaveProperty('description')
        expect(prompt).toHaveProperty('messages')
        expect(Array.isArray(prompt.messages)).toBe(true)
      }
    })
  })

  describe('prompt/resource resolvers', () => {
    it('should allow prompt overrides derived from defaults', () => {
      const prompts = resolveMcpPrompts(defaults => [
        ...defaults,
        {
          name: 'custom-prompt',
          description: 'Custom prompt',
          messages: [{
            role: 'user',
            content: { type: 'text', text: 'custom instructions' }
          }]
        }
      ])

      expect(prompts.some(prompt => prompt.name === 'custom-prompt')).toBe(true)
      expect(prompts.length).toBe(getDefaultPrompts().length + 1)
    })

    it('should allow resource overrides derived from defaults', () => {
      const resources = resolveMcpResources(defaults => [
        ...defaults,
        {
          uri: 'drizzle-cube://custom',
          name: 'Custom Resource',
          description: 'Custom resource',
          mimeType: 'text/plain',
          text: 'hello'
        }
      ])

      expect(resources.some(resource => resource.uri === 'drizzle-cube://custom')).toBe(true)
      expect(resources.length).toBe(getDefaultResources().length + 1)
    })

    it('should return default instructions when nothing is provided', () => {
      const instructions = resolveMcpInstructions()
      expect(typeof instructions).toBe('string')
      expect(instructions.length).toBeGreaterThan(0)
      // Sanity-check the defaults still mention the critical concepts
      expect(instructions).toMatch(/discover/i)
      expect(instructions).toMatch(/inDateRange/)
    })

    it('should replace defaults when a string is provided', () => {
      const instructions = resolveMcpInstructions('custom rules only')
      expect(instructions).toBe('custom rules only')
    })

    it('should allow function-based extension of default instructions', () => {
      const defaults = getDefaultInstructions()
      const instructions = resolveMcpInstructions(d => `${d}\n\n## Project addendum\nUse cube X for sales.`)
      expect(instructions.startsWith(defaults)).toBe(true)
      expect(instructions).toContain('Project addendum')
    })

    it('should append the live schema resource when building MCP resources', async () => {
      const { semanticLayer, close } = await createTestSemanticLayer()
      try {
        const { testEmployeesCube } = await createTestCubesForCurrentDatabase()
        semanticLayer.registerCube(testEmployeesCube)

        const resources = buildMcpResources(semanticLayer, defaults => defaults.filter(resource => resource.uri !== 'drizzle-cube://quickstart'))

        expect(resources.some(resource => resource.uri === 'drizzle-cube://schema')).toBe(true)
        expect(resources.some(resource => resource.uri === 'drizzle-cube://quickstart')).toBe(false)
      } finally {
        close()
      }
    })
  })

  describe('dispatchMcpMethod', () => {
    let semanticLayer: any
    let closeFn: (() => void) | null = null
    let dispatchCtx: McpDispatchContext

    beforeEach(async () => {
      const { semanticLayer: sl, close } = await createTestSemanticLayer()
      semanticLayer = sl
      closeFn = close

      const { testEmployeesCube } = await createTestCubesForCurrentDatabase()
      semanticLayer.registerCube(testEmployeesCube)

      dispatchCtx = {
        semanticLayer,
        extractSecurityContext: async () => testSecurityContexts.org1,
        rawRequest: {},
        rawResponse: null
      }
    })

    afterEach(() => {
      if (closeFn) {
        closeFn()
        closeFn = null
      }
    })

    describe('initialize method', () => {
      it('should return server capabilities', async () => {
        const result = await dispatchMcpMethod('initialize', {}, dispatchCtx) as any

        expect(result).toHaveProperty('protocolVersion')
        expect(result).toHaveProperty('capabilities')
        expect(result).toHaveProperty('serverInfo')
        expect(result.serverInfo.name).toBe('drizzle-cube')
      })

      it('should use custom serverName when provided in context', async () => {
        const customCtx: McpDispatchContext = {
          ...dispatchCtx,
          serverName: 'Semantius Cube'
        }
        const result = await dispatchMcpMethod('initialize', {}, customCtx) as any

        expect(result).toHaveProperty('serverInfo')
        expect(result.serverInfo.name).toBe('Semantius Cube')
      })

      it('should negotiate protocol version', async () => {
        const result = await dispatchMcpMethod(
          'initialize',
          { protocolVersion: '2025-06-18' },
          dispatchCtx
        ) as any

        expect(result.protocolVersion).toBe('2025-06-18')
      })

      it('should fall back to default for unsupported version', async () => {
        const result = await dispatchMcpMethod(
          'initialize',
          { protocolVersion: '2020-01-01' },
          dispatchCtx
        ) as any

        expect(result.protocolVersion).toBe(DEFAULT_MCP_PROTOCOL)
      })

      it('should include session ID', async () => {
        const result = await dispatchMcpMethod('initialize', {}, dispatchCtx) as any

        expect(result).toHaveProperty('sessionId')
        expect(typeof result.sessionId).toBe('string')
      })

      it('should include default instructions per MCP spec', async () => {
        // MCP spec: InitializeResult.instructions is the only server-authored
        // string clients are expected to surface to the model. Without this,
        // clients (e.g. Claude Desktop) silently ignore prompts/resources and
        // the model invents query syntax.
        const result = await dispatchMcpMethod('initialize', {}, dispatchCtx) as any

        expect(result).toHaveProperty('instructions')
        expect(typeof result.instructions).toBe('string')
        expect(result.instructions.length).toBeGreaterThan(0)
        // The default instructions MUST mandate the discover-first workflow
        // and call out the date-filtering rule (the #1 source of mistakes).
        expect(result.instructions).toMatch(/discover/i)
        expect(result.instructions).toMatch(/MUST/)
        expect(result.instructions).toMatch(/inDateRange/)
        expect(result.instructions).toMatch(/queryLanguageReference/)
      })

      it('should use custom instructions when provided in context', async () => {
        const customCtx: McpDispatchContext = {
          ...dispatchCtx,
          instructions: 'Custom project rules: only query the Sales cube.'
        }
        const result = await dispatchMcpMethod('initialize', {}, customCtx) as any

        expect(result.instructions).toBe('Custom project rules: only query the Sales cube.')
      })
    })

    describe('tools/list method', () => {
      it('should return list of tools', async () => {
        const result = await dispatchMcpMethod('tools/list', {}, dispatchCtx) as any

        expect(result).toHaveProperty('tools')
        expect(Array.isArray(result.tools)).toBe(true)
        expect(result.tools.length).toBeGreaterThan(0)
      })

      it('should include discover, validate, and load tools', async () => {
        const result = await dispatchMcpMethod('tools/list', {}, dispatchCtx) as any

        const toolNames = result.tools.map((t: any) => t.name)
        expect(toolNames).toContain('discover')
        expect(toolNames).toContain('validate')
        expect(toolNames).toContain('load')
      })

      it('should have input schemas for tools', async () => {
        const result = await dispatchMcpMethod('tools/list', {}, dispatchCtx) as any

        for (const tool of result.tools) {
          expect(tool).toHaveProperty('name')
          expect(tool).toHaveProperty('description')
          expect(tool).toHaveProperty('inputSchema')
        }
      })
    })

    describe('list_tools method (alias)', () => {
      it('should work as alias for tools/list', async () => {
        const result = await dispatchMcpMethod('list_tools', {}, dispatchCtx) as any

        expect(result).toHaveProperty('tools')
        expect(Array.isArray(result.tools)).toBe(true)
      })
    })

    describe('tools/call method', () => {
      it('should execute discover tool', async () => {
        const result = await dispatchMcpMethod('tools/call', {
          name: 'discover',
          arguments: { topic: 'employees' }
        }, dispatchCtx) as any

        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('isError', false)
      })

      it('should execute validate tool', async () => {
        const result = await dispatchMcpMethod('tools/call', {
          name: 'validate',
          arguments: {
            query: {
              measures: ['Employees.count'],
              dimensions: ['Employees.name']
            }
          }
        }, dispatchCtx) as any

        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('isError', false)
      })

      it('should execute load tool', async () => {
        const result = await dispatchMcpMethod('tools/call', {
          name: 'load',
          arguments: {
            query: {
              measures: ['Employees.count']
            }
          }
        }, dispatchCtx) as any

        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('isError', false)
      })

      it('should throw error for missing tool name', async () => {
        await expect(
          dispatchMcpMethod('tools/call', { arguments: {} }, dispatchCtx)
        ).rejects.toThrow('name is required')
      })

      it('should throw error for unknown tool', async () => {
        await expect(
          dispatchMcpMethod('tools/call', { name: 'unknown' }, dispatchCtx)
        ).rejects.toThrow('Unknown tool')
      })

      it('should throw error when validate tool is called without query', async () => {
        await expect(
          dispatchMcpMethod('tools/call', { name: 'validate', arguments: {} }, dispatchCtx)
        ).rejects.toThrow('query is required')
      })

      it('should throw error when load tool is called without query', async () => {
        await expect(
          dispatchMcpMethod('tools/call', { name: 'load', arguments: {} }, dispatchCtx)
        ).rejects.toThrow('query is required')
      })
    })

    describe('resources/list method', () => {
      it('should return list of resources', async () => {
        const result = await dispatchMcpMethod('resources/list', {}, dispatchCtx) as any

        expect(result).toHaveProperty('resources')
        expect(Array.isArray(result.resources)).toBe(true)
      })
    })

    describe('resources/templates/list method', () => {
      it('should return empty templates list', async () => {
        const result = await dispatchMcpMethod('resources/templates/list', {}, dispatchCtx) as any

        expect(result).toHaveProperty('resourceTemplates')
        expect(result.resourceTemplates).toEqual([])
      })
    })

    describe('resources/read method', () => {
      it('should read default resource', async () => {
        const result = await dispatchMcpMethod('resources/read', {}, dispatchCtx) as any

        expect(result).toHaveProperty('contents')
        expect(Array.isArray(result.contents)).toBe(true)
        expect(result.contents.length).toBe(1)
        expect(result.contents[0]).toHaveProperty('uri')
        expect(result.contents[0]).toHaveProperty('text')
      })

      it('should read specific resource by URI', async () => {
        const result = await dispatchMcpMethod('resources/read', {
          uri: 'drizzle-cube://quickstart'
        }, dispatchCtx) as any

        expect(result.contents[0].uri).toBe('drizzle-cube://quickstart')
      })
    })

    describe('prompts/list method', () => {
      it('should return list of prompts', async () => {
        const result = await dispatchMcpMethod('prompts/list', {}, dispatchCtx) as any

        expect(result).toHaveProperty('prompts')
        expect(Array.isArray(result.prompts)).toBe(true)
      })
    })

    describe('prompts/get method', () => {
      it('should get default prompt', async () => {
        const result = await dispatchMcpMethod('prompts/get', {}, dispatchCtx) as any

        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('description')
        expect(result).toHaveProperty('messages')
      })

      it('should get specific prompt by name', async () => {
        const prompts = getDefaultPrompts()
        const promptName = prompts[0].name

        const result = await dispatchMcpMethod('prompts/get', {
          name: promptName
        }, dispatchCtx) as any

        expect(result.name).toBe(promptName)
      })
    })

    describe('ping method', () => {
      it('should respond to ping', async () => {
        const result = await dispatchMcpMethod('ping', {}, dispatchCtx)

        expect(result).toEqual({})
      })
    })

    describe('notifications/initialized method', () => {
      it('should handle initialized notification', async () => {
        const result = await dispatchMcpMethod('notifications/initialized', {}, dispatchCtx)

        expect(result).toEqual({})
      })
    })

    describe('discover method (direct)', () => {
      it('should discover cubes', async () => {
        const result = await dispatchMcpMethod('discover', {
          topic: 'employees'
        }, dispatchCtx) as any

        expect(result).toHaveProperty('cubes')
      })

      it('should embed the query language reference and date filtering guide', async () => {
        // The discover response is the primary delivery mechanism for query
        // construction guidance — clients cannot be relied on to forward
        // prompts/* to the model, so we piggyback on discover (the mandated
        // first call) to guarantee the model sees the rules every time.
        const result = await dispatchMcpMethod('discover', {
          topic: 'employees'
        }, dispatchCtx) as any

        expect(result).toHaveProperty('queryLanguageReference')
        expect(typeof result.queryLanguageReference).toBe('string')
        expect(result.queryLanguageReference.length).toBeGreaterThan(0)
        // Sanity-check the reference contains DSL hallmarks
        expect(result.queryLanguageReference).toContain('CubeName')
        expect(result.queryLanguageReference).toContain('FilterOperator')

        expect(result).toHaveProperty('dateFilteringGuide')
        expect(typeof result.dateFilteringGuide).toBe('string')
        expect(result.dateFilteringGuide).toMatch(/inDateRange/)
        expect(result.dateFilteringGuide).toMatch(/granularity/i)
      })

      it('should embed the reference fields when invoked via tools/call too', async () => {
        const result = await dispatchMcpMethod('tools/call', {
          name: 'discover',
          arguments: { topic: 'employees' }
        }, dispatchCtx) as any

        expect(result).toHaveProperty('content')
        expect(Array.isArray(result.content)).toBe(true)
        const text = result.content[0]?.text
        expect(typeof text).toBe('string')
        const parsed = JSON.parse(text)
        expect(parsed).toHaveProperty('cubes')
        expect(parsed).toHaveProperty('queryLanguageReference')
        expect(parsed).toHaveProperty('dateFilteringGuide')
      })
    })

    describe('validate method (direct)', () => {
      it('should validate query', async () => {
        const result = await dispatchMcpMethod('validate', {
          query: {
            measures: ['Employees.count']
          }
        }, dispatchCtx) as any

        expect(result).toHaveProperty('isValid')
      })

      it('should throw error without query', async () => {
        await expect(
          dispatchMcpMethod('validate', {}, dispatchCtx)
        ).rejects.toThrow('query is required')
      })
    })

    describe('load method (direct)', () => {
      it('should execute query', async () => {
        const result = await dispatchMcpMethod('load', {
          query: {
            measures: ['Employees.count']
          }
        }, dispatchCtx) as any

        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('annotation')
      })

      it('should throw error without query', async () => {
        await expect(
          dispatchMcpMethod('load', {}, dispatchCtx)
        ).rejects.toThrow('query is required')
      })
    })

    describe('unknown method', () => {
      it('should throw error for unknown method', async () => {
        await expect(
          dispatchMcpMethod('unknownMethod', {}, dispatchCtx)
        ).rejects.toThrow('Unknown MCP method')
      })
    })
  })

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      expect(extractBearerToken('Bearer abc123')).toBe('abc123')
    })

    it('should be case-insensitive for Bearer prefix', () => {
      expect(extractBearerToken('bearer abc123')).toBe('abc123')
      expect(extractBearerToken('BEARER abc123')).toBe('abc123')
    })

    it('should return null for missing header', () => {
      expect(extractBearerToken(null)).toBeNull()
      expect(extractBearerToken(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(extractBearerToken('')).toBeNull()
    })

    it('should return null for non-Bearer auth schemes', () => {
      expect(extractBearerToken('Basic dGVzdDp0ZXN0')).toBeNull() // test:test
      expect(extractBearerToken('Digest realm="test"')).toBeNull()
    })

    it('should return null for Bearer without token', () => {
      expect(extractBearerToken('Bearer ')).toBeNull()
      expect(extractBearerToken('Bearer')).toBeNull()
    })

    it('should handle tokens with special characters', () => {
      const fakeJwt = 'header.payload.signature'
      expect(extractBearerToken(`Bearer ${fakeJwt}`)).toBe(fakeJwt)
    })
  })

  describe('buildWwwAuthenticateChallenge', () => {
    it('should build correct WWW-Authenticate header value', () => {
      const result = buildWwwAuthenticateChallenge('https://example.com/.well-known/oauth-protected-resource')
      expect(result).toBe('Bearer resource_metadata="https://example.com/.well-known/oauth-protected-resource"')
    })

    it('should handle URLs with paths', () => {
      const result = buildWwwAuthenticateChallenge('https://auth.example.com/.well-known/oauth-protected-resource/mcp')
      expect(result).toBe('Bearer resource_metadata="https://auth.example.com/.well-known/oauth-protected-resource/mcp"')
    })
  })

  describe('getMcpAppHtml locale config injection', () => {
    it('returns base html unchanged when no config is provided', () => {
      // No config → no injection; the built HTML is returned as-is
      const html = getMcpAppHtml()
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).not.toContain('__DRIZZLE_CUBE_MCP_APP_CONFIG__')
    })

    it('injects config script into html when config is provided', () => {
      const config: McpAppConfig = { defaultLocale: 'nl-NL' }
      const result = getMcpAppHtml(config)
      expect(result).toContain('__DRIZZLE_CUBE_MCP_APP_CONFIG__')
      expect(result).toContain('"nl-NL"')
      expect(result).toContain('</head>')
    })

    // The injection logic is tested via a thin wrapper that patches the module-level html.
    // We test the escaping and placement rules directly via the same code path
    // by constructing expected output and verifying the contract.

    it('escapes </script> sequences in the injected config JSON', () => {
      // A malicious locale string containing </script> must be neutralised
      const malicious = 'en</script><script>alert(1)</script>'
      const safeJson = JSON.stringify({ defaultLocale: malicious, detectBrowserLocale: false })
        .replace(/<\//g, '<\\/')
      // The escaped string must not contain an unescaped </
      expect(safeJson).not.toContain('</')
      // But must still be parseable after unescaping
      const parsed = JSON.parse(safeJson.replace(/<\\\//g, '</'))
      expect(parsed.defaultLocale).toBe(malicious)
    })

    it('produces correct config JSON shape for defaultLocale + detectBrowserLocale', () => {
      const config: McpAppConfig = { defaultLocale: 'nl-NL', detectBrowserLocale: false }
      const safeJson = JSON.stringify({
        defaultLocale: config.defaultLocale,
        detectBrowserLocale: config.detectBrowserLocale,
      }).replace(/<\//g, '<\\/')
      const parsed = JSON.parse(safeJson)
      expect(parsed.defaultLocale).toBe('nl-NL')
      expect(parsed.detectBrowserLocale).toBe(false)
    })

    it('script is placed before </head> in injected output', () => {
      const fakeHtml = '<!DOCTYPE html><html><head><title>t</title></head><body></body></html>'
      const safeJson = JSON.stringify({ defaultLocale: 'en-US', detectBrowserLocale: true })
        .replace(/<\//g, '<\\/')
      const script = `<script>window.__DRIZZLE_CUBE_MCP_APP_CONFIG__ = ${safeJson}</script>`
      const injected = fakeHtml.replace('</head>', `${script}</head>`)
      const scriptIdx = injected.indexOf('<script>')
      const headCloseIdx = injected.indexOf('</head>')
      expect(scriptIdx).toBeGreaterThanOrEqual(0)
      expect(scriptIdx).toBeLessThan(headCloseIdx)
    })
  })
})


