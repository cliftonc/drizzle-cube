/**
 * useDragReorder Hook
 *
 * Encapsulates the drag-and-drop reordering machinery shared by the
 * MetricsSection and BreakdownSection list components. Tracks drag state,
 * builds the drag image, computes drop targets, and exposes presentational
 * helpers (item transform + gap indicators).
 */

import { useState, useCallback, useRef, DragEvent } from 'react'

const GAP_SIZE = 40

/**
 * Calculate the vertical transform for an item while a drag is in progress.
 * Pure helper extracted to keep the hook body flat.
 */
export function computeItemTransform(
  itemIndex: number,
  draggedIndex: number | null,
  dropTargetIndex: number | null
): string {
  if (draggedIndex === null || dropTargetIndex === null) return ''

  // The dragged item is already faded out — no transform needed.
  if (itemIndex === draggedIndex) return ''

  if (draggedIndex < dropTargetIndex) {
    // Dragging down.
    if (itemIndex > draggedIndex && itemIndex < dropTargetIndex) return ''
    if (itemIndex === dropTargetIndex - 1) return `translateY(-${GAP_SIZE / 2}px)`
    if (itemIndex >= dropTargetIndex) return `translateY(${GAP_SIZE / 2}px)`
    return ''
  }

  // Dragging up.
  if (itemIndex >= dropTargetIndex && itemIndex < draggedIndex) {
    return `translateY(${GAP_SIZE / 2}px)`
  }

  return ''
}

export interface DragReorderApi {
  draggedIndex: number | null
  dropTargetIndex: number | null
  handleDragStart: (e: DragEvent, index: number) => void
  handleDragEnd: () => void
  handleItemDragOver: (e: DragEvent, itemIndex: number) => void
  handleItemDrop: (e: DragEvent) => void
  handleSectionDragLeave: (e: DragEvent) => void
  handleEndZoneDragOver: (e: DragEvent) => void
  getItemTransform: (itemIndex: number) => string
  shouldShowGapIndicator: (itemIndex: number) => boolean
}

/**
 * @param dragType  Label written into the drag dataTransfer payload.
 * @param getField  Resolves the field name for a given index (for the payload).
 * @param itemCount Current number of items (used for end-of-list drop zone).
 * @param onReorder Optional reorder callback (fromIndex, toIndex).
 */
export function useDragReorder(
  dragType: string,
  getField: (index: number) => string,
  itemCount: number,
  onReorder?: (fromIndex: number, toIndex: number) => void
): DragReorderApi {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

  // Refs mirror state to avoid stale closures inside drop handlers.
  const draggedIndexRef = useRef<number | null>(null)
  const dropTargetIndexRef = useRef<number | null>(null)
  const dragCloneRef = useRef<HTMLElement | null>(null)

  const handleDragStart = useCallback((e: DragEvent, index: number) => {
    setDraggedIndex(index)
    draggedIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: dragType, index, field: getField(index) }))

    // Create a semi-transparent, slightly tilted drag image.
    const target = e.currentTarget as HTMLElement
    const clone = target.cloneNode(true) as HTMLElement
    clone.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${target.offsetWidth}px;
      opacity: 0.7;
      transform: rotate(2deg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `
    document.body.appendChild(clone)
    dragCloneRef.current = clone

    const rect = target.getBoundingClientRect()
    e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top)
  }, [dragType, getField])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
    draggedIndexRef.current = null
    dropTargetIndexRef.current = null
    if (dragCloneRef.current) {
      document.body.removeChild(dragCloneRef.current)
      dragCloneRef.current = null
    }
  }, [])

  const handleItemDragOver = useCallback((e: DragEvent, itemIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const currentDraggedIndex = draggedIndexRef.current
    if (currentDraggedIndex === null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const isTopHalf = e.clientY - rect.top < rect.height / 2
    const targetIndex = isTopHalf ? itemIndex : itemIndex + 1

    if (targetIndex === currentDraggedIndex || targetIndex === currentDraggedIndex + 1) {
      setDropTargetIndex(null)
      dropTargetIndexRef.current = null
    } else {
      setDropTargetIndex(targetIndex)
      dropTargetIndexRef.current = targetIndex
    }
  }, [])

  const handleItemDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const currentDraggedIndex = draggedIndexRef.current
    const currentDropTargetIndex = dropTargetIndexRef.current

    setDraggedIndex(null)
    setDropTargetIndex(null)
    draggedIndexRef.current = null
    dropTargetIndexRef.current = null

    if (currentDraggedIndex === null || currentDropTargetIndex === null || !onReorder) {
      return
    }

    // Adjust target index when dragging down (indices shift after splice).
    const adjustedTarget = currentDropTargetIndex > currentDraggedIndex
      ? currentDropTargetIndex - 1
      : currentDropTargetIndex

    if (adjustedTarget !== currentDraggedIndex) {
      onReorder(currentDraggedIndex, adjustedTarget)
    }
  }, [onReorder])

  const handleSectionDragLeave = useCallback((e: DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetIndex(null)
    }
  }, [])

  const handleEndZoneDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    const lastIndex = itemCount
    const currentDraggedIndex = draggedIndexRef.current
    if (dropTargetIndexRef.current !== lastIndex && currentDraggedIndex !== lastIndex - 1) {
      setDropTargetIndex(lastIndex)
      dropTargetIndexRef.current = lastIndex
    }
  }, [itemCount])

  const getItemTransform = useCallback(
    (itemIndex: number): string => computeItemTransform(itemIndex, draggedIndex, dropTargetIndex),
    [draggedIndex, dropTargetIndex]
  )

  const shouldShowGapIndicator = useCallback((itemIndex: number): boolean => {
    if (draggedIndex === null || dropTargetIndex === null) return false
    return itemIndex === dropTargetIndex
  }, [draggedIndex, dropTargetIndex])

  return {
    draggedIndex,
    dropTargetIndex,
    handleDragStart,
    handleDragEnd,
    handleItemDragOver,
    handleItemDrop,
    handleSectionDragLeave,
    handleEndZoneDragOver,
    getItemTransform,
    shouldShowGapIndicator
  }
}
