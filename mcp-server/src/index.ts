#!/usr/bin/env node

/**
 * Drizzle Cube MCP Server
 *
 * Provides tools for interacting with a Drizzle Cube API:
 * - drizzle_cube_meta: Fetch cube metadata
 * - drizzle_cube_dry_run: Validate query and preview SQL
 * - drizzle_cube_explain: Get query execution plan
 * - drizzle_cube_load: Execute a query
 * - drizzle_cube_batch: Execute multiple queries in parallel
 *
 * Configuration priority:
 * 1. .drizzle-cube.json in current directory (project config)
 * 2. ~/.drizzle-cube/config.json (global config)
 * 3. Environment variables (DRIZZLE_CUBE_API_URL, DRIZZLE_CUBE_API_TOKEN)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Configuration interface
interface Config {
  apiUrl: string
  apiToken: string
}

// Load configuration from file
function loadConfigFile(path: string): Partial<Config> | null {
  try {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8')
      const config = JSON.parse(content)
      return {
        apiUrl: config.apiUrl,
        apiToken: config.apiToken,
      }
    }
  } catch (error) {
    console.error(`Warning: Failed to read config from ${path}:`, error)
  }
  return null
}

// Load configuration with priority
function loadConfig(): Config {
  // Priority 1: Project config (.drizzle-cube.json in current directory)
  const projectConfigPath = join(process.cwd(), '.drizzle-cube.json')
  const projectConfig = loadConfigFile(projectConfigPath)

  // Priority 2: Global config (~/.drizzle-cube/config.json)
  const globalConfigPath = join(homedir(), '.drizzle-cube', 'config.json')
  const globalConfig = loadConfigFile(globalConfigPath)

  // Priority 3: Environment variables (fallback)
  const envConfig: Partial<Config> = {
    apiUrl: process.env.DRIZZLE_CUBE_API_URL,
    apiToken: process.env.DRIZZLE_CUBE_API_TOKEN,
  }

  // Merge configs (project > global > env > defaults)
  const config: Config = {
    apiUrl:
      projectConfig?.apiUrl ||
      globalConfig?.apiUrl ||
      envConfig.apiUrl ||
      'http://localhost:3001/cubejs-api/v1',
    apiToken:
      projectConfig?.apiToken ||
      globalConfig?.apiToken ||
      envConfig.apiToken ||
      '',
  }

  // Log configuration source (for debugging)
  const source = projectConfig?.apiUrl
    ? 'project (.drizzle-cube.json)'
    : globalConfig?.apiUrl
      ? 'global (~/.drizzle-cube/config.json)'
      : envConfig.apiUrl
        ? 'environment variables'
        : 'defaults'

  console.error(`Configuration loaded from: ${source}`)

  return config
}

// Load config
const config = loadConfig()

// Helper to make API requests
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: unknown
): Promise<unknown> {
  const url = `${config.apiUrl}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API error (${response.status}): ${error}`)
  }

  return response.json()
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'drizzle_cube_meta',
    description:
      'Fetch cube metadata including measures, dimensions, and relationships from the Drizzle Cube API',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'drizzle_cube_dry_run',
    description:
      'Validate a query and preview the generated SQL without executing it',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to validate',
          properties: {
            measures: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of measure names (e.g., ["Sales.totalRevenue"])',
            },
            dimensions: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of dimension names (e.g., ["Products.category"])',
            },
            timeDimensions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dimension: { type: 'string' },
                  granularity: { type: 'string' },
                  dateRange: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'array', items: { type: 'string' } },
                    ],
                  },
                },
              },
              description: 'Array of time dimension configurations',
            },
            filters: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of filter objects',
            },
            order: {
              type: 'object',
              description:
                'Order configuration (e.g., {"Sales.revenue": "desc"})',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of rows to return',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_explain',
    description: 'Get the query execution plan with performance analysis',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to explain',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_load',
    description: 'Execute a query and return the results',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to execute',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_batch',
    description: 'Execute multiple queries in parallel and return all results',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of CubeQuery objects to execute',
        },
      },
      required: ['queries'],
    },
  },
  {
    name: 'drizzle_cube_config',
    description:
      'Get current configuration status (API URL and whether token is configured)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

// Create MCP server
const server = new Server(
  {
    name: 'drizzle-cube-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}))

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'drizzle_cube_meta': {
        const result = await apiRequest('/meta', 'GET')
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_dry_run': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/dry-run', 'POST', query)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_explain': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/explain', 'POST', query)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_load': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/load', 'POST', query)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_batch': {
        const queries = (args as { queries: unknown[] }).queries
        const result = await apiRequest('/batch', 'POST', { queries })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_config': {
        // Return current configuration status (without exposing the token)
        const projectConfigPath = join(process.cwd(), '.drizzle-cube.json')
        const globalConfigPath = join(homedir(), '.drizzle-cube', 'config.json')

        const status = {
          apiUrl: config.apiUrl,
          tokenConfigured: !!config.apiToken,
          configSources: {
            projectConfig: existsSync(projectConfigPath)
              ? projectConfigPath
              : null,
            globalConfig: existsSync(globalConfigPath) ? globalConfigPath : null,
            environmentVariables: {
              DRIZZLE_CUBE_API_URL: !!process.env.DRIZZLE_CUBE_API_URL,
              DRIZZLE_CUBE_API_TOKEN: !!process.env.DRIZZLE_CUBE_API_TOKEN,
            },
          },
          help: {
            setup:
              'Run /drizzle-cube setup to configure interactively',
            projectConfig:
              'Create .drizzle-cube.json in your project directory',
            globalConfig: `Create ${globalConfigPath}`,
            envVars:
              'Set DRIZZLE_CUBE_API_URL and DRIZZLE_CUBE_API_TOKEN environment variables',
          },
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Drizzle Cube MCP server started')
  console.error(`API URL: ${config.apiUrl}`)
  console.error(`Auth: ${config.apiToken ? 'Configured' : 'Not configured'}`)
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
