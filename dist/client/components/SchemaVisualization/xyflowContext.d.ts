/**
 * React context for @xyflow/react modules.
 *
 * All xyflow imports are dynamic (via SchemaVisualizationLazy) so that
 * the built schema-visualization chunk has NO static imports from
 * @xyflow/react. This prevents consuming projects from failing at
 * build time when @xyflow/react is not installed.
 */
export type XyflowModule = typeof import('@xyflow/react');
export declare const XyflowProvider: import('react').Provider<typeof import("@xyflow/react") | null>;
export declare function useXyflow(): XyflowModule;
