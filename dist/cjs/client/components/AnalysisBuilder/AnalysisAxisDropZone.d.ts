import { DragEvent } from 'react';
import { AxisDropZoneConfig } from '../../charts/chartConfigs.js';
interface FieldMeta {
    title?: string;
    shortTitle?: string;
    cubeName: string;
    type: 'measure' | 'dimension' | 'timeDimension';
    measureType?: string;
}
interface AnalysisAxisDropZoneProps {
    config: AxisDropZoneConfig;
    fields: string[];
    onDrop: (e: DragEvent<HTMLDivElement>, toKey: string) => void;
    onRemove: (field: string, fromKey: string) => void;
    onDragStart: (e: DragEvent<HTMLDivElement>, field: string, fromKey: string, fromIndex?: number) => void;
    onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onReorder?: (fromIndex: number, toIndex: number, axisKey: string) => void;
    draggedItem?: {
        field: string;
        fromAxis: string;
        fromIndex?: number;
    } | null;
    getFieldMeta?: (field: string) => FieldMeta;
    yAxisAssignment?: Record<string, 'left' | 'right'>;
    onYAxisAssignmentChange?: (field: string, axis: 'left' | 'right') => void;
}
export default function AnalysisAxisDropZone({ config, fields, onDrop, onRemove, onDragStart, onDragEnd, onDragOver, onReorder, draggedItem, getFieldMeta, yAxisAssignment, onYAxisAssignmentChange }: AnalysisAxisDropZoneProps): import("react").JSX.Element;
export {};
