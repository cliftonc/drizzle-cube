import { Node, Edge } from '@xyflow/react';
export interface LayoutOptions {
    direction: 'TB' | 'LR';
    nodeWidth: number;
    nodeSep: number;
    rankSep: number;
}
export declare const defaultLayoutOptions: LayoutOptions;
/**
 * Layout state machine phases:
 *  waiting   → ELK not loaded yet, nothing to show
 *  computing → ELK loaded, running layout algorithm
 *  ready     → layout complete, node positions available
 */
export type LayoutPhase = 'waiting' | 'computing' | 'ready';
interface ELKInstance {
    layout(graph: unknown): Promise<unknown>;
}
declare function loadElk(): Promise<ELKInstance | null>;
export { loadElk as _elkLoadPromise };
export interface ElkLayoutResult {
    nodes: Node[];
    edges: Edge[];
}
/**
 * Layout hook with explicit state machine.
 *
 * - Waits for ELK to load (phase: 'waiting')
 * - Runs layout once per unique node/edge structure (phase: 'computing')
 * - Returns stable result (phase: 'ready')
 *
 * The effect only depends on a string structure key, NOT object references.
 * This prevents re-renders from cancelling in-flight computations.
 */
export declare function useERDLayout(nodes: Node[], edges: Edge[], options?: Partial<LayoutOptions>): {
    nodes: Node[];
    edges: Edge[];
    phase: LayoutPhase;
};
