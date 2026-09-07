import { AnalysisBuilderProps, AnalysisBuilderRef } from './types.js';
/**
 * AnalysisBuilder - Main exported component
 *
 * Wraps the inner component with the store provider to ensure
 * each AnalysisBuilder instance has its own isolated state.
 */
declare const AnalysisBuilder: import('react').ForwardRefExoticComponent<AnalysisBuilderProps & import('react').RefAttributes<AnalysisBuilderRef>>;
export default AnalysisBuilder;
