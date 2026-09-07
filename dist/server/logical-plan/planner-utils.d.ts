import { Cube, SemanticQuery } from '../types/index.js';
import { JoinPathResolver } from '../resolvers/join-path-resolver.js';
/**
 * Caches a JoinPathResolver per cubes map to avoid repeated instantiation.
 * Shared by all sub-planners so a single query reuses one resolver per cubes map.
 */
export declare class ResolverCache {
    private cache;
    get(cubes: Map<string, Cube>): JoinPathResolver;
}
/**
 * Analyze a semantic query to determine which cubes are involved.
 * Scans measures, dimensions, time dimensions, filters and ORDER BY members.
 */
export declare function analyzeCubeUsage(query: SemanticQuery): Set<string>;
/**
 * Recursively extract cube names from a filter (handles logical AND/OR filters)
 * into the provided set.
 */
export declare function extractCubeNamesFromFilter(filter: any, cubesUsed: Set<string>): void;
