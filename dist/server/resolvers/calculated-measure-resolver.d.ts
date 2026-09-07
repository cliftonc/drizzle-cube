import { Cube, Measure } from '../types/cube.js';
/**
 * Dependency information for a calculated measure
 */
export interface MeasureDependency {
    /** Full measure name (e.g., "Cube.measure" or "measure") */
    measureName: string;
    /** Referenced cube name (null if same cube) */
    cubeName: string | null;
    /** Referenced field name */
    fieldName: string;
}
/**
 * Calculated Measure Resolver
 * Manages dependency resolution for calculated measures
 */
export declare class CalculatedMeasureResolver {
    private dependencyGraph;
    private cubes;
    constructor(cubes: Map<string, Cube> | Cube);
    /**
     * Extract {member} references from calculatedSql template
     * Supports both {measure} and {Cube.measure} syntax
     *
     * @param calculatedSql - Template string with {member} references
     * @returns Array of dependency information
     */
    extractDependencies(calculatedSql: string): MeasureDependency[];
    /**
     * Build dependency graph for all calculated measures in a cube
     *
     * @param cube - The cube containing measures
     */
    buildGraph(cube: Cube): void;
    /**
     * Build dependency graph for multiple cubes
     *
     * @param cubes - Map of cubes to analyze
     */
    buildGraphForMultipleCubes(cubes: Map<string, Cube>): void;
    /**
     * Calculate in-degree for each node (number of measures depending on it)
     */
    private calculateInDegrees;
    /**
     * Perform topological sort using Kahn's algorithm
     * Returns measures in dependency order (dependencies first)
     *
     * @param measureNames - List of measure names to sort
     * @returns Sorted array of measure names
     * @throws Error if circular dependency detected
     */
    topologicalSort(measureNames: string[]): string[];
    /**
     * Build a subgraph containing only the requested measures, with in-degrees
     * recomputed to count only dependencies that are within the subgraph.
     */
    private buildSubgraph;
    /**
     * Detect circular dependencies using DFS
     * Returns the cycle path if found, null otherwise
     *
     * @returns Array representing the cycle, or null
     */
    detectCycle(): string[] | null;
    /**
     * DFS helper for cycle detection
     */
    private dfs;
    /**
     * Get all dependencies for a specific measure (direct and transitive)
     *
     * @param measureName - Full measure name (e.g., "Cube.measure")
     * @returns Set of all dependency measure names
     */
    getAllDependencies(measureName: string): Set<string>;
    /**
     * Validate that all dependencies exist
     *
     * @param cube - The cube to validate
     * @throws Error if dependencies are missing
     */
    validateDependencies(cube: Cube): void;
    /**
     * Auto-populate dependencies array for calculated measures
     * Updates the measure objects with detected dependencies
     *
     * @param cube - The cube to update
     */
    populateDependencies(cube: Cube): void;
    /**
     * Check if a measure is a calculated measure
     *
     * @param measure - The measure to check
     * @returns True if the measure is calculated
     */
    static isCalculatedMeasure(measure: Measure): boolean;
}
