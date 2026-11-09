// The adapter compiles for a TypeScript Express app without @types/cors.
// skipLibCheck is on, as drizzle-orm's own declarations need; check.mjs
// checks separately that the adapter's .d.ts does not import 'cors'.
import { createCubeRouter, type CorsOptions, type ExpressAdapterOptions } from 'drizzle-cube/adapters/express'
import type { SemanticLayerCompiler } from 'drizzle-cube/server'

const corsOptions: CorsOptions = { origin: ['https://app.example.com'], credentials: true }

export function router(db: ExpressAdapterOptions['drizzle'], semanticLayer: SemanticLayerCompiler) {
  return createCubeRouter({
    drizzle: db,
    semanticLayer,
    extractSecurityContext: async () => ({ organisationId: 1 }),
    cors: corsOptions
  })
}
