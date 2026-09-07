import { DragEvent } from 'react';
import { MetaField } from '../../shared/types.js';
import { BreakdownItem } from './types.js';
interface BreakdownRowProps {
    breakdown: BreakdownItem;
    fieldMeta: MetaField | null;
    sortDirection: 'asc' | 'desc' | null;
    sortPriority: number | undefined;
    index: number;
    transform: string;
    showGapBefore: boolean;
    isAnyDragging: boolean;
    isDragging: boolean;
    comparisonDisabled: boolean;
    onRemove: (id: string) => void;
    onGranularityChange: (id: string, granularity: string) => void;
    onComparisonToggle?: (id: string) => void;
    onOrderChange?: (field: string, direction: 'asc' | 'desc' | null) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onItemDragOver: (e: DragEvent, index: number) => void;
    onItemDrop: (e: DragEvent) => void;
    onDragStart: (e: DragEvent, index: number) => void;
    onDragEnd: () => void;
}
declare const BreakdownRow: import('react').MemoExoticComponent<({ breakdown, fieldMeta, sortDirection, sortPriority, index, transform, showGapBefore, isAnyDragging, isDragging, comparisonDisabled, onRemove, onGranularityChange, onComparisonToggle, onOrderChange, onReorder, onItemDragOver, onItemDrop, onDragStart, onDragEnd }: BreakdownRowProps) => import("react").JSX.Element>;
export default BreakdownRow;
