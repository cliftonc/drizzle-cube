import { DragEvent } from 'react';
/**
 * Calculate the vertical transform for an item while a drag is in progress.
 * Pure helper extracted to keep the hook body flat.
 */
export declare function computeItemTransform(itemIndex: number, draggedIndex: number | null, dropTargetIndex: number | null): string;
export interface DragReorderApi {
    draggedIndex: number | null;
    dropTargetIndex: number | null;
    handleDragStart: (e: DragEvent, index: number) => void;
    handleDragEnd: () => void;
    handleItemDragOver: (e: DragEvent, itemIndex: number) => void;
    handleItemDrop: (e: DragEvent) => void;
    handleSectionDragLeave: (e: DragEvent) => void;
    handleEndZoneDragOver: (e: DragEvent) => void;
    getItemTransform: (itemIndex: number) => string;
    shouldShowGapIndicator: (itemIndex: number) => boolean;
}
/**
 * @param dragType  Label written into the drag dataTransfer payload.
 * @param getField  Resolves the field name for a given index (for the payload).
 * @param itemCount Current number of items (used for end-of-list drop zone).
 * @param onReorder Optional reorder callback (fromIndex, toIndex).
 */
export declare function useDragReorder(dragType: string, getField: (index: number) => string, itemCount: number, onReorder?: (fromIndex: number, toIndex: number) => void): DragReorderApi;
