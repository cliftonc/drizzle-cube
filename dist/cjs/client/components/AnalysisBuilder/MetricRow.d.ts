import { DragEvent } from 'react';
import { MetaField } from '../../shared/types.js';
import { MetricItem } from './types.js';
interface MetricRowProps {
    metric: MetricItem;
    fieldMeta: MetaField | null;
    sortDirection: 'asc' | 'desc' | null;
    sortPriority: number | undefined;
    index: number;
    transform: string;
    showGapBefore: boolean;
    isAnyDragging: boolean;
    isDragging: boolean;
    onRemove: (id: string) => void;
    onOrderChange?: (field: string, direction: 'asc' | 'desc' | null) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onItemDragOver: (e: DragEvent, index: number) => void;
    onItemDrop: (e: DragEvent) => void;
    onDragStart: (e: DragEvent, index: number) => void;
    onDragEnd: () => void;
}
declare const MetricRow: import('react').MemoExoticComponent<({ metric, fieldMeta, sortDirection, sortPriority, index, transform, showGapBefore, isAnyDragging, isDragging, onRemove, onOrderChange, onReorder, onItemDragOver, onItemDrop, onDragStart, onDragEnd }: MetricRowProps) => import("react").JSX.Element>;
export default MetricRow;
