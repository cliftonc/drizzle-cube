import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { getCubeTools } from 'drizzle-cube/mcp'

const semanticLayer = new SemanticLayerCompiler({ engineType: 'sqlite' })
const tools = getCubeTools({ semanticLayer, getSecurityContext: async () => ({ organisationId: 1 }) })
if (!tools.toolNames.includes('drizzle_cube_load')) throw new Error('getCubeTools returned no load tool')
console.log('server entry ok:', tools.toolNames.join(', '))
