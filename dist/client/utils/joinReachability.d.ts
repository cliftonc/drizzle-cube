import { CubeMeta, CubeMetaDimension, PortletConfig } from '../types.js';
/**
 * Compute the set of cubes reachable from the given start cubes via join
 * relationships. Relationships are treated as undirected, mirroring the
 * server's bidirectional join resolution. Start cubes are included.
 */
export declare function getReachableCubes(meta: CubeMeta | null, startCubes: string[]): Set<string>;
/**
 * Get the cube names referenced by a portlet's query (measures, dimensions,
 * timeDimensions) across single-query, multi-query, and funnel shapes.
 */
export declare function getPortletQueryCubes(portlet: PortletConfig): string[];
export interface ReachableDimensionGroup {
    cubeName: string;
    cubeTitle: string;
    dimensions: CubeMetaDimension[];
}
/**
 * Get the dimensions a dashboard filter can be remapped to for a portlet:
 * dimensions of join-reachable cubes, grouped by cube. When `sameTypeAs` is a
 * known dimension, options are restricted to dimensions of the same type
 * (operator and values are shared across portlets, so the target field must
 * be type-compatible).
 */
export declare function getReachableDimensionOptions(meta: CubeMeta | null, portlet: PortletConfig, options?: {
    sameTypeAs?: string;
}): ReachableDimensionGroup[];
