import { Edge, EdgeProps } from '@xyflow/react';
import { CubeMetaRelationship } from '../../types.js';
interface RelationshipEdgeData {
    relationship: CubeMetaRelationship;
    joinFields: Array<{
        sourceField: string;
        targetField: string;
    }>;
    [key: string]: unknown;
}
export type RelationshipEdgeType = Edge<RelationshipEdgeData, 'relationshipEdge'>;
export declare function RelationshipEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, data, markerEnd, }: EdgeProps<RelationshipEdgeType>): import("react").JSX.Element | null;
export {};
