/**
 * Join reachability utilities for dashboard filter field mapping
 *
 * Used to determine which fields a dashboard filter can be remapped to for a
 * given portlet: only dimensions of cubes that are join-reachable from the
 * cubes the portlet already queries are guaranteed to execute (the server
 * auto-joins cubes referenced only in filters).
 */

import type { CubeMeta, CubeMetaDimension, PortletConfig } from '../types.js'
import { ensureAnalysisConfig } from './configMigration.js'

/**
 * Compute the set of cubes reachable from the given start cubes via join
 * relationships. Relationships are treated as undirected, mirroring the
 * server's bidirectional join resolution. Start cubes are included.
 */
export function getReachableCubes(
  meta: CubeMeta | null,
  startCubes: string[]
): Set<string> {
  const reachable = new Set<string>(startCubes)
  if (!meta?.cubes || startCubes.length === 0) {
    return reachable
  }

  // Build an undirected adjacency map from all declared relationships
  const adjacency = new Map<string, Set<string>>()
  const addEdge = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
  }
  meta.cubes.forEach(cube => {
    cube.relationships?.forEach(rel => addEdge(cube.name, rel.targetCube))
  })

  // BFS from the start cubes
  const queue = [...startCubes]
  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbours = adjacency.get(current)
    if (!neighbours) continue
    neighbours.forEach(neighbour => {
      if (!reachable.has(neighbour)) {
        reachable.add(neighbour)
        queue.push(neighbour)
      }
    })
  }

  return reachable
}

/**
 * Extract the cube name from a fully-qualified field name ("Cube.field")
 */
function cubeNameOf(field: string): string | null {
  const dotIndex = field.indexOf('.')
  return dotIndex > 0 ? field.substring(0, dotIndex) : null
}

/**
 * Get the cube names referenced by a portlet's query (measures, dimensions,
 * timeDimensions) across single-query, multi-query, and funnel shapes.
 */
export function getPortletQueryCubes(portlet: PortletConfig): string[] {
  const cubes = new Set<string>()
  const addField = (field: unknown) => {
    if (typeof field === 'string') {
      const cube = cubeNameOf(field)
      if (cube) cubes.add(cube)
    }
  }

  const extractFromCubeQuery = (cubeQuery: any) => {
    if (Array.isArray(cubeQuery?.measures)) cubeQuery.measures.forEach(addField)
    if (Array.isArray(cubeQuery?.dimensions)) cubeQuery.dimensions.forEach(addField)
    if (Array.isArray(cubeQuery?.timeDimensions)) {
      cubeQuery.timeDimensions.forEach((td: any) => addField(td?.dimension))
    }
  }

  try {
    const normalizedPortlet = ensureAnalysisConfig(portlet)
    const query = normalizedPortlet.analysisConfig.query as any

    if (!query) return []

    if ('funnel' in query) {
      // ServerFunnelQuery: cubes come from steps, binding key, and time dimension
      const funnel = query.funnel
      if (typeof funnel?.timeDimension === 'string') {
        addField(funnel.timeDimension)
      } else if (Array.isArray(funnel?.timeDimension)) {
        funnel.timeDimension.forEach((td: any) => td?.cube && cubes.add(td.cube))
      }
      if (typeof funnel?.bindingKey === 'string') {
        addField(funnel.bindingKey)
      } else if (Array.isArray(funnel?.bindingKey)) {
        funnel.bindingKey.forEach((bk: any) => bk?.cube && cubes.add(bk.cube))
      }
      if (Array.isArray(funnel?.steps)) {
        funnel.steps.forEach((step: any) => step?.cube && cubes.add(step.cube))
      }
    } else if ('queries' in query && Array.isArray(query.queries)) {
      // MultiQueryConfig
      query.queries.forEach(extractFromCubeQuery)
    } else {
      // Single CubeQuery
      extractFromCubeQuery(query)
    }
  } catch (e) {
    console.warn('Failed to extract cubes from portlet:', portlet.id, e)
  }

  return [...cubes]
}

export interface ReachableDimensionGroup {
  cubeName: string
  cubeTitle: string
  dimensions: CubeMetaDimension[]
}

/**
 * Get the dimensions a dashboard filter can be remapped to for a portlet:
 * dimensions of join-reachable cubes, grouped by cube. When `sameTypeAs` is a
 * known dimension, options are restricted to dimensions of the same type
 * (operator and values are shared across portlets, so the target field must
 * be type-compatible).
 */
export function getReachableDimensionOptions(
  meta: CubeMeta | null,
  portlet: PortletConfig,
  options?: { sameTypeAs?: string }
): ReachableDimensionGroup[] {
  if (!meta?.cubes) return []

  const startCubes = getPortletQueryCubes(portlet)
  if (startCubes.length === 0) return []

  const reachable = getReachableCubes(meta, startCubes)

  // Resolve the type of the reference dimension, if provided and known
  let requiredType: string | undefined
  if (options?.sameTypeAs) {
    for (const cube of meta.cubes) {
      const match = cube.dimensions?.find(d => d.name === options.sameTypeAs)
      if (match) {
        requiredType = match.type
        break
      }
    }
  }

  return meta.cubes
    .filter(cube => reachable.has(cube.name))
    .map(cube => ({
      cubeName: cube.name,
      cubeTitle: cube.title || cube.name,
      dimensions: (cube.dimensions || []).filter(
        d => !requiredType || d.type === requiredType
      )
    }))
    .filter(group => group.dimensions.length > 0)
}
