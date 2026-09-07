import { Filter } from '../types.js';
import { FunnelBindingKey } from './funnel.js';
/**
 * Starting step definition for flow analysis
 * The starting step is the anchor point from which we explore paths
 * in both directions (before and after)
 */
export interface FlowStartingStep {
    /** Display name for the starting step */
    name: string;
    /** Filters that define which events qualify as the starting step */
    filters: Filter[];
}
/**
 * Server flow query format
 * This is the shape sent to the server for execution
 * Wrapped in { flow: {...} } similar to funnel queries
 */
export interface ServerFlowQuery {
    flow: FlowQueryConfig;
}
/**
 * Flow query configuration
 * Contains all parameters needed for server-side flow analysis
 */
export interface FlowQueryConfig {
    /**
     * Binding key that identifies individual entities (e.g., userId)
     * Can be a single string like 'Events.userId' or array for multi-cube
     */
    bindingKey: string | {
        cube: string;
        dimension: string;
    }[];
    /**
     * Time dimension used for ordering events
     * Can be a single string like 'Events.timestamp' or array for multi-cube
     */
    timeDimension: string | {
        cube: string;
        dimension: string;
    }[];
    /**
     * The starting step from which we explore paths
     * Defines the anchor point for bidirectional flow analysis
     */
    startingStep: {
        /** Display name for the starting step */
        name: string;
        /** Filter(s) that identify events for this starting step */
        filter?: Filter | Filter[];
    };
    /** Number of steps to explore BEFORE the starting step (0-5) */
    stepsBefore: number;
    /** Number of steps to explore AFTER the starting step (0-5) */
    stepsAfter: number;
    /**
     * Event dimension that categorizes events (e.g., 'Events.eventType')
     * This dimension's values become the node labels in the Sankey diagram
     */
    eventDimension: string;
    /**
     * Optional limit on the number of entities to process
     * Useful for performance on large datasets
     */
    entityLimit?: number;
    /**
     * Output mode for flow data aggregation
     * - 'sankey': Aggregate by (layer, event_type) - standard flow visualization where paths can converge
     * - 'sunburst': Path-qualified nodes for hierarchical tree visualization where each path is unique
     * @default 'sankey'
     */
    outputMode?: 'sankey' | 'sunburst';
    /**
     * Join strategy for fetching steps
     * - 'auto' (default): use lateral when supported, otherwise window
     * - 'lateral': force lateral joins
     * - 'window': force window function strategy
     */
    joinStrategy: 'auto' | 'lateral' | 'window';
}
/**
 * A node in the Sankey diagram
 * Represents an event type at a specific layer (distance from starting step)
 */
export interface SankeyNode {
    /**
     * Unique identifier for this node
     * Format: "before_{depth}_{eventType}" or "after_{depth}_{eventType}" or "start_{eventType}"
     * Examples: "before_2_Signup", "start_Purchase", "after_1_Checkout"
     */
    id: string;
    /** Display name (typically the event type value) */
    name: string;
    /**
     * Layer position in the Sankey diagram
     * Negative for steps before starting step, 0 for starting step, positive for after
     * Example: -2, -1, 0, 1, 2 for a flow with 2 steps before and 2 after
     */
    layer: number;
    /** Total count of entities passing through this node */
    value?: number;
}
/**
 * A link (edge) in the Sankey diagram
 * Represents a transition between two nodes
 */
export interface SankeyLink {
    /** Source node ID */
    source: string;
    /** Target node ID */
    target: string;
    /** Count of entities that follow this path */
    value: number;
}
/**
 * Complete flow result row returned from server
 * Contains the full Sankey diagram data
 */
export interface FlowResultRow {
    nodes: SankeyNode[];
    links: SankeyLink[];
}
/**
 * Chart-ready flow data format
 * Same structure as FlowResultRow, used for chart components
 */
export interface FlowChartData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}
/**
 * Flow mode state for the AnalysisBuilder store
 * Contains all UI state needed to configure a flow analysis
 */
export interface FlowSliceState {
    /** Selected cube for flow analysis (must be an eventStream cube) */
    flowCube: string | null;
    /** Binding key that identifies entities (reuses funnel binding key type) */
    flowBindingKey: FunnelBindingKey | null;
    /** Time dimension for ordering events */
    flowTimeDimension: string | null;
    /** Starting step configuration */
    startingStep: FlowStartingStep;
    /** Number of steps to explore before starting step (0-5, default 3) */
    stepsBefore: number;
    /** Number of steps to explore after starting step (0-5, default 3) */
    stepsAfter: number;
    /** Event dimension that categorizes events */
    eventDimension: string | null;
    /** Join strategy for flow execution */
    joinStrategy: 'auto' | 'lateral' | 'window';
}
/**
 * Flow slice actions for the store
 */
export interface FlowSliceActions {
    setFlowCube: (cube: string | null) => void;
    setFlowBindingKey: (key: FunnelBindingKey | null) => void;
    setFlowTimeDimension: (dim: string | null) => void;
    setEventDimension: (dim: string | null) => void;
    setStartingStepName: (name: string) => void;
    setStartingStepFilters: (filters: Filter[]) => void;
    addStartingStepFilter: (filter: Filter) => void;
    removeStartingStepFilter: (index: number) => void;
    updateStartingStepFilter: (index: number, filter: Filter) => void;
    setStepsBefore: (count: number) => void;
    setStepsAfter: (count: number) => void;
    setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void;
    isFlowMode: () => boolean;
    isFlowModeEnabled: () => boolean;
    buildFlowQuery: () => ServerFlowQuery | null;
}
/**
 * Type guard to check if data is Sankey/Flow chart data
 */
export declare function isSankeyData(data: unknown): data is FlowChartData;
/**
 * Type guard to detect server flow query format
 * Used to distinguish { flow: {...} } from CubeQuery, MultiQueryConfig, or ServerFunnelQuery
 */
export declare function isServerFlowQuery(obj: unknown): obj is ServerFlowQuery;
/**
 * Default flow slice state for store initialization
 */
export declare const defaultFlowSliceState: FlowSliceState;
/**
 * Minimum and maximum values for step depth
 */
export declare const FLOW_MIN_DEPTH = 0;
export declare const FLOW_MAX_DEPTH = 5;
