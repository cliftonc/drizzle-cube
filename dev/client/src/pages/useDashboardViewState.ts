/**
 * State + effects for DashboardViewPage, extracted to flatten the page component.
 *
 * Owns the config sync-on-load, the click-outside handling for the options menu,
 * and the save/reset/metadata callbacks. Behaviour is identical to the original
 * inline hooks.
 */
import { useCallback, useState, useEffect, useRef } from 'react'
import type { AnalyticsPage, DashboardConfig } from '../types'
import { useUpdateAnalyticsPage, useResetAnalyticsPage } from '../hooks/useAnalyticsPages'

interface UseDashboardViewStateArgs {
  page: AnalyticsPage | undefined
  id: string | undefined
}

/** Sync config from the server only on initial load or when the page id changes. */
function useSyncedConfig(page: AnalyticsPage | undefined, id: string | undefined) {
  const [config, setConfig] = useState<DashboardConfig>({ portlets: [] })
  const [, setLastSaved] = useState<Date | null>(null)
  const hasInitializedRef = useRef(false)
  const lastPageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!page) return

    const isInitialLoad = !hasInitializedRef.current
    const isPageChange = lastPageIdRef.current !== null && lastPageIdRef.current !== id

    if (isInitialLoad || isPageChange) {
      setConfig(page.config)
      setLastSaved(new Date(page.updatedAt))
      hasInitializedRef.current = true
      lastPageIdRef.current = id ?? null
    }
  }, [page, id])

  return { config, setConfig, setLastSaved }
}

/** Close the options menu when clicking outside of it. */
function useClickOutsideClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-options-menu]')) {
          onClose()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])
}

export function useDashboardViewState({ page, id }: UseDashboardViewStateArgs) {
  const updatePage = useUpdateAnalyticsPage()
  const resetPage = useResetAnalyticsPage()
  const { config, setConfig, setLastSaved } = useSyncedConfig(page, id)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  const closeOptionsMenu = useCallback(() => setShowOptionsMenu(false), [])
  useClickOutsideClose(showOptionsMenu, closeOptionsMenu)

  const handleConfigChange = useCallback((newConfig: DashboardConfig) => {
    setConfig(newConfig)
  }, [setConfig])

  const handleSave = useCallback(async (configToSave: DashboardConfig) => {
    if (!page || !id) return

    try {
      await updatePage.mutateAsync({
        id: parseInt(id),
        name: page.name,
        description: page.description || undefined,
        config: configToSave
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
      throw error // Re-throw to keep dirty state
    }
  }, [page, id, updatePage, setLastSaved])

  const handleDirtyStateChange = useCallback((isDirty: boolean) => {
    // For view mode, we don't need to show dirty state, just save automatically
    if (!isDirty) {
      setLastSaved(new Date())
    }
  }, [setLastSaved])

  const handleSaveThumbnail = useCallback(async (thumbnailData: string): Promise<string | void> => {
    if (!id) return

    try {
      const response = await fetch(`/api/analytics-pages/${id}/thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumbnailData })
      })

      if (response.ok) {
        const result = await response.json()
        return result.thumbnailUrl
      }

      console.error('Failed to save thumbnail:', response.statusText)
    } catch (error) {
      console.error('Error saving thumbnail:', error)
    }
  }, [id])

  const handleEditMetadata = useCallback(async (data: { name: string; description?: string }) => {
    if (!page || !id) return

    try {
      await updatePage.mutateAsync({
        id: parseInt(id),
        name: data.name,
        description: data.description,
        config: config
      })
    } catch (error) {
      console.error('Failed to save metadata:', error)
      throw error // Re-throw to keep modal open
    }
  }, [page, id, config, updatePage])

  const handleResetDashboard = useCallback(async () => {
    if (!id) return

    try {
      const resetResult = await resetPage.mutateAsync(parseInt(id))
      setConfig(resetResult.config)
      setLastSaved(new Date())
      setShowResetConfirm(false)
    } catch (error) {
      console.error('Failed to reset dashboard:', error)
    }
  }, [id, resetPage, setConfig, setLastSaved])

  return {
    config,
    resetPage,
    isEditModalOpen, setIsEditModalOpen,
    showResetConfirm, setShowResetConfirm,
    showOptionsMenu, setShowOptionsMenu,
    handleConfigChange,
    handleSave,
    handleDirtyStateChange,
    handleSaveThumbnail,
    handleEditMetadata,
    handleResetDashboard,
  }
}
