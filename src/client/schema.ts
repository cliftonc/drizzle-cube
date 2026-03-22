/**
 * Separate entry point for SchemaVisualization.
 *
 * This component requires @xyflow/react and elkjs as peer dependencies.
 * It is exported separately to avoid pulling these optional dependencies
 * into the main 'drizzle-cube/client' bundle, which would break
 * webpack/Next.js builds that don't have them installed.
 *
 * Usage:
 *   import { SchemaVisualization } from 'drizzle-cube/client/schema'
 */

export { SchemaVisualizationLazy as SchemaVisualization } from './components/SchemaVisualization/SchemaVisualizationLazy'
export type { SchemaVisualizationProps } from './components/SchemaVisualization/index'
