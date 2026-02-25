import { useCallback } from 'react'
import type { LayoutItem } from 'react-grid-layout'
import type { StoreApi } from 'zustand'
import type { DashboardStore } from '../../stores/dashboardStore'

interface UseGridLayoutEngineOptions {
  storeApi: StoreApi<DashboardStore>
}

export function useGridLayoutEngine({
  storeApi
}: UseGridLayoutEngineOptions) {
  const hasLayoutActuallyChanged = useCallback(
    (newLayout: LayoutItem[]) => {
      const { isInitialized, lastKnownLayout } = storeApi.getState()
      if (!isInitialized || lastKnownLayout.length === 0) {
        return false
      }

      for (const newItem of newLayout) {
        const oldItem = lastKnownLayout.find((item) => item.i === newItem.i)
        if (!oldItem) continue

        if (
          oldItem.x !== newItem.x ||
          oldItem.y !== newItem.y ||
          oldItem.w !== newItem.w ||
          oldItem.h !== newItem.h
        ) {
          return true
        }
      }
      return false
    },
    [storeApi]
  )

  return {
    hasLayoutActuallyChanged
  }
}
