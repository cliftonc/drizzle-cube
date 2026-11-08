/**
 * CORS preflight through each adapter's `cors` option.
 *
 * With no allow-list configured, a preflight must be answered with the headers
 * the browser asked for (each CORS library's default). Before this was fixed,
 * the adapters replaced a missing list with only the drizzle-cube client
 * headers (X-DC-*), so `cors: { origin }` alone blocked Content-Type and
 * Authorization and every cross-origin JSON POST failed its preflight.
 */
import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import Fastify from 'fastify'
import { NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { SemanticLayerCompiler } from '../../src/server'
import { createCubeApp as createHonoApp } from '../../src/adapters/hono'
import { createCubeRouter } from '../../src/adapters/express'
import { cubePlugin } from '../../src/adapters/fastify'
import { createCubeHandlers, createOptionsHandler } from '../../src/adapters/nextjs'

const ORIGIN = 'https://app.example.com'
const REQUESTED = 'content-type,authorization'
const CLIENT_HEADERS = ['x-dc-locale', 'x-cache-max-age', 'x-cache-control']

// A preflight never reaches the database; the adapters still require one.
const db = drizzle(new Database(':memory:'))
function semanticLayer() {
  return new SemanticLayerCompiler({ drizzle: db, engineType: 'sqlite' })
}
const extractSecurityContext = async () => ({ organisationId: 1 })

function headerList(value: string | null | undefined): string[] {
  return (value ?? '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
}

const preflightHeaders = {
  Origin: ORIGIN,
  'Access-Control-Request-Method': 'POST',
  'Access-Control-Request-Headers': REQUESTED
}

type Preflight = (allowHeaders?: string[]) => Promise<string | null | undefined>

const adapters: Record<string, Preflight> = {
  hono: async (allowHeaders) => {
    const app = createHonoApp({
      drizzle: db,
      semanticLayer: semanticLayer(),
      extractSecurityContext,
      cors: { origin: ORIGIN, ...(allowHeaders ? { allowHeaders } : {}) }
    })
    const res = await app.fetch(
      new Request('http://localhost/cubejs-api/v1/load', { method: 'OPTIONS', headers: preflightHeaders })
    )
    return res.headers.get('access-control-allow-headers')
  },
  express: async (allowHeaders) => {
    const app = express()
    app.use(
      createCubeRouter({
        drizzle: db,
        semanticLayer: semanticLayer(),
        extractSecurityContext,
        cors: { origin: ORIGIN, ...(allowHeaders ? { allowedHeaders: allowHeaders } : {}) }
      })
    )
    const res = await request(app).options('/cubejs-api/v1/load').set(preflightHeaders)
    return res.headers['access-control-allow-headers']
  },
  fastify: async (allowHeaders) => {
    const app = Fastify()
    await app.register(cubePlugin, {
      drizzle: db,
      semanticLayer: semanticLayer(),
      extractSecurityContext,
      cors: { origin: ORIGIN, ...(allowHeaders ? { allowedHeaders: allowHeaders } : {}) }
    })
    const res = await app.inject({ method: 'OPTIONS', url: '/cubejs-api/v1/load', headers: preflightHeaders })
    await app.close()
    const value = res.headers['access-control-allow-headers']
    return Array.isArray(value) ? value.join(',') : value
  },
  'nextjs (createOptionsHandler)': async (allowHeaders) => {
    const handler = createOptionsHandler({ origin: ORIGIN, ...(allowHeaders ? { allowedHeaders: allowHeaders } : {}) })
    const res = await handler(
      new NextRequest('http://localhost/cubejs-api/v1/load', { method: 'OPTIONS', headers: preflightHeaders })
    )
    return res.headers.get('access-control-allow-headers')
  },
  'nextjs (createCubeHandlers)': async (allowHeaders) => {
    const handlers = createCubeHandlers({
      drizzle: db,
      semanticLayer: semanticLayer(),
      extractSecurityContext,
      cors: { origin: ORIGIN, ...(allowHeaders ? { allowedHeaders: allowHeaders } : {}) }
    })
    // The CORS headers the handlers attach to every response, here on a
    // request that fails validation before reaching the database.
    const res = await handlers.load(
      new NextRequest('http://localhost/cubejs-api/v1/load', {
        method: 'POST',
        headers: { ...preflightHeaders, 'Content-Type': 'application/json' },
        body: '{'
      })
    )
    return res.headers.get('access-control-allow-headers')
  }
}

describe.each(Object.entries(adapters))('%s CORS preflight', (_name, preflight) => {
  it('allows the requested headers when no allow-list is configured', async () => {
    const allowed = headerList(await preflight())
    expect(allowed).toEqual(expect.arrayContaining(['content-type', 'authorization']))
  })

  it('adds the drizzle-cube client headers to a configured allow-list', async () => {
    const allowed = headerList(await preflight(['Content-Type', 'Authorization']))
    expect(allowed).toEqual(['content-type', 'authorization', ...CLIENT_HEADERS])
  })
})
