/**
 * Calculated Measure Resolver
 *
 * Handles dependency resolution for calculated measures:
 * - Extracts {member} references from calculatedSql templates
 * - Builds dependency graph
 * - Performs topological sorting to determine calculation order
 * - Detects circular dependencies
 */

import type { Cube, Measure } from './types/cube'

/**
 * Dependency information for a calculated measure
 */
export interface MeasureDependency {
  /** Full measure name (e.g., "Cube.measure" or "measure") */
  measureName: string
  /** Referenced cube name (null if same cube) */
  cubeName: string | null
  /** Referenced field name */
  fieldName: string
}

/**
 * Dependency graph node
 */
interface GraphNode {
  /** Full measure identifier */
  id: string
  /** List of dependencies (what this measure depends on) */
  dependencies: Set<string>
  /** Incoming edge count for topological sort */
  inDegree: number
}

/**
 * Calculated Measure Resolver
 * Manages dependency resolution for calculated measures
 */
export class CalculatedMeasureResolver {
  private dependencyGraph: Map<string, GraphNode>
  private cubes: Map<string, Cube>

  constructor(cubes: Map<string, Cube> | Cube) {
    this.cubes = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])
    this.dependencyGraph = new Map()
  }

  /**
   * Extract {member} references from calculatedSql template
   * Supports both {measure} and {Cube.measure} syntax
   *
   * @param calculatedSql - Template string with {member} references
   * @returns Array of dependency information
   */
  extractDependencies(calculatedSql: string): MeasureDependency[] {
    // Match {member} or {Cube.member} patterns
    const regex = /\{([^}]+)\}/g
    const matches = calculatedSql.matchAll(regex)
    const dependencies: MeasureDependency[] = []

    for (const match of matches) {
      const memberRef = match[1].trim()

      // Parse member reference
      if (memberRef.includes('.')) {
        // Cross-cube reference: {Cube.measure}
        const [cubeName, fieldName] = memberRef.split('.')
        dependencies.push({
          measureName: memberRef,
          cubeName: cubeName.trim(),
          fieldName: fieldName.trim()
        })
      } else {
        // Same-cube reference: {measure}
        dependencies.push({
          measureName: memberRef,
          cubeName: null,
          fieldName: memberRef
        })
      }
    }

    return dependencies
  }

  /**
   * Build dependency graph for all calculated measures in a cube
   *
   * @param cube - The cube containing measures
   */
  buildGraph(cube: Cube): void {
    for (const [fieldName, measure] of Object.entries(cube.measures)) {
      if (measure.type === 'calculated' && measure.calculatedSql) {
        const measureId = `${cube.name}.${fieldName}`

        // Extract dependencies
        const deps = this.extractDependencies(measure.calculatedSql)
        const depSet = new Set<string>()

        for (const dep of deps) {
          // Resolve to full measure ID
          const depCubeName = dep.cubeName || cube.name
          const depId = `${depCubeName}.${dep.fieldName}`
          depSet.add(depId)
        }

        // Add to graph
        this.dependencyGraph.set(measureId, {
          id: measureId,
          dependencies: depSet,
          inDegree: 0
        })
      }
    }

    // Calculate in-degrees
    this.calculateInDegrees()
  }

  /**
   * Build dependency graph for multiple cubes
   *
   * @param cubes - Map of cubes to analyze
   */
  buildGraphForMultipleCubes(cubes: Map<string, Cube>): void {
    for (const cube of cubes.values()) {
      this.buildGraph(cube)
    }
  }

  /**
   * Calculate in-degree for each node (number of measures depending on it)
   */
  private calculateInDegrees(): void {
    // Reset all in-degrees to 0
    for (const node of this.dependencyGraph.values()) {
      node.inDegree = 0
    }

    // Count incoming edges
    for (const node of this.dependencyGraph.values()) {
      for (const depId of node.dependencies) {
        const depNode = this.dependencyGraph.get(depId)
        if (depNode) {
          depNode.inDegree++
        }
      }
    }
  }

  /**
   * Perform topological sort using Kahn's algorithm
   * Returns measures in dependency order (dependencies first)
   *
   * @param measureNames - List of measure names to sort
   * @returns Sorted array of measure names
   * @throws Error if circular dependency detected
   */
  topologicalSort(measureNames: string[]): string[] {
    // Build subgraph for requested measures only
    const subgraph = new Map<string, GraphNode>()
    const queue: string[] = []
    const sorted: string[] = []

    // Initialize subgraph with dependencies copied from main graph
    for (const measureName of measureNames) {
      const node = this.dependencyGraph.get(measureName)
      if (node) {
        subgraph.set(measureName, {
          id: node.id,
          dependencies: new Set(node.dependencies),
          inDegree: 0  // Will recalculate below
        })
      }
    }

    // Calculate in-degrees within the subgraph
    // In-degree = number of dependencies that are IN the subgraph
    for (const node of subgraph.values()) {
      let inDegree = 0
      for (const depId of node.dependencies) {
        if (subgraph.has(depId)) {
          inDegree++
        }
      }
      node.inDegree = inDegree
    }

    // Find nodes with no dependencies within the subgraph (in-degree = 0)
    // These are ready to be processed immediately
    for (const [id, node] of subgraph) {
      if (node.inDegree === 0) {
        queue.push(id)
      }
    }

    // Process queue using Kahn's algorithm
    while (queue.length > 0) {
      const currentId = queue.shift()!
      sorted.push(currentId)

      // Find all nodes in the subgraph that depend on the current node
      // and decrease their in-degree since we've now processed their dependency
      for (const [nodeId, node] of subgraph) {
        if (node.dependencies.has(currentId)) {
          node.inDegree--
          if (node.inDegree === 0) {
            queue.push(nodeId)
          }
        }
      }
    }

    // Check if all nodes were processed
    if (sorted.length < subgraph.size) {
      const cycle = this.detectCycle()
      throw new Error(
        `Circular dependency detected in calculated measures: ${cycle ? cycle.join(' -> ') : 'unknown cycle'}`
      )
    }

    return sorted
  }

  /**
   * Detect circular dependencies using DFS
   * Returns the cycle path if found, null otherwise
   *
   * @returns Array representing the cycle, or null
   */
  detectCycle(): string[] | null {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    for (const nodeId of this.dependencyGraph.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = this.dfs(nodeId, visited, recursionStack, path)
        if (cycle) {
          return cycle
        }
      }
    }

    return null
  }

  /**
   * DFS helper for cycle detection
   */
  private dfs(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)

    const node = this.dependencyGraph.get(nodeId)
    if (!node) {
      path.pop()
      recursionStack.delete(nodeId)
      return null
    }

    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        const cycle = this.dfs(depId, visited, recursionStack, path)
        if (cycle) {
          return cycle
        }
      } else if (recursionStack.has(depId)) {
        // Found a cycle
        const cycleStart = path.indexOf(depId)
        return [...path.slice(cycleStart), depId]
      }
    }

    path.pop()
    recursionStack.delete(nodeId)
    return null
  }

  /**
   * Get all dependencies for a specific measure (direct and transitive)
   *
   * @param measureName - Full measure name (e.g., "Cube.measure")
   * @returns Set of all dependency measure names
   */
  getAllDependencies(measureName: string): Set<string> {
    const allDeps = new Set<string>()
    const visited = new Set<string>()

    const collectDeps = (id: string) => {
      if (visited.has(id)) return
      visited.add(id)

      const node = this.dependencyGraph.get(id)
      if (!node) return

      for (const depId of node.dependencies) {
        allDeps.add(depId)
        collectDeps(depId)
      }
    }

    collectDeps(measureName)
    return allDeps
  }

  /**
   * Validate that all dependencies exist
   *
   * @param cube - The cube to validate
   * @throws Error if dependencies are missing
   */
  validateDependencies(cube: Cube): void {
    for (const [fieldName, measure] of Object.entries(cube.measures)) {
      if (measure.type === 'calculated' && measure.calculatedSql) {
        const deps = this.extractDependencies(measure.calculatedSql)

        for (const dep of deps) {
          const targetCubeName = dep.cubeName || cube.name
          const targetCube = this.cubes.get(targetCubeName)

          if (!targetCube) {
            throw new Error(
              `Calculated measure '${cube.name}.${fieldName}' references unknown cube '${targetCubeName}'`
            )
          }

          const targetMeasure = targetCube.measures[dep.fieldName]
          if (!targetMeasure) {
            throw new Error(
              `Calculated measure '${cube.name}.${fieldName}' references unknown measure '${dep.measureName}'`
            )
          }

          // Prevent self-reference
          if (targetCubeName === cube.name && dep.fieldName === fieldName) {
            throw new Error(
              `Calculated measure '${cube.name}.${fieldName}' cannot reference itself`
            )
          }
        }
      }
    }
  }

  /**
   * Auto-populate dependencies array for calculated measures
   * Updates the measure objects with detected dependencies
   *
   * @param cube - The cube to update
   */
  populateDependencies(cube: Cube): void {
    for (const [, measure] of Object.entries(cube.measures)) {
      if (measure.type === 'calculated' && measure.calculatedSql && !measure.dependencies) {
        const deps = this.extractDependencies(measure.calculatedSql)
        measure.dependencies = deps.map(d => d.measureName)
      }
    }
  }

  /**
   * Check if a measure is a calculated measure
   *
   * @param measure - The measure to check
   * @returns True if the measure is calculated
   */
  static isCalculatedMeasure(measure: Measure): boolean {
    return measure.type === 'calculated' && !!measure.calculatedSql
  }
}
