import { default as React } from 'react';
import { QueryAnalysis, JoinPathAnalysis } from '../types.js';
/**
 * Format reason string for display
 */
export declare function formatReason(reason: string): string;
/**
 * Get badge color based on reason
 */
export declare function getReasonBadgeClasses(reason: string): string;
/**
 * Render a single join path entry (header, steps, selection, candidates).
 */
export declare const JoinPathItem: React.FC<{
    jp: JoinPathAnalysis;
    primaryCube: string;
}>;
/**
 * Render the "Join Paths" section (only when paths are present).
 */
export declare const JoinPathsSection: React.FC<{
    analysis: QueryAnalysis;
}>;
/**
 * Render the "Primary Cube" section.
 */
export declare const PrimaryCubeSection: React.FC<{
    analysis: QueryAnalysis;
}>;
/**
 * Render the "Pre-Aggregations" section (only when present).
 */
export declare const PreAggregationsSection: React.FC<{
    analysis: QueryAnalysis;
}>;
/**
 * Render the "Warnings" section (only when present).
 */
export declare const WarningsSection: React.FC<{
    analysis: QueryAnalysis;
}>;
