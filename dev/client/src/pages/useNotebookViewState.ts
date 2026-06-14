/**
 * State + callbacks for NotebookViewPage, extracted to flatten the page component.
 *
 * Owns LLM settings persistence, save status, and the save/score/dashboard
 * handlers. Behaviour is identical to the original inline hooks.
 */
import { useCallback, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { NotebookConfig } from '@drizzle-cube/client'
import { useUpdateNotebook } from '../hooks/useNotebooks'
import { useCreateAnalyticsPage } from '../hooks/useAnalyticsPages'
import {
  API_KEY_STORAGE_KEY,
  PROVIDER_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  ENDPOINT_STORAGE_KEY,
  useLocalStorageState,
} from './notebookLlmSettings'

export function useNotebookViewState(id: string | undefined) {
  const navigate = useNavigate()
  const location = useLocation()
  const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt
  const updateNotebook = useUpdateNotebook()
  const createDashboard = useCreateAnalyticsPage()

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const [apiKey, setApiKey] = useLocalStorageState(API_KEY_STORAGE_KEY)
  const [provider, setProvider] = useLocalStorageState(PROVIDER_STORAGE_KEY)
  const [model, setModel] = useLocalStorageState(MODEL_STORAGE_KEY)
  const [endpoint, setEndpoint] = useLocalStorageState(ENDPOINT_STORAGE_KEY)
  const [showSettings, setShowSettings] = useState(false)

  const handleSave = useCallback(async (config: NotebookConfig) => {
    if (!id) return
    setSaveStatus('saving')
    try {
      await updateNotebook.mutateAsync({
        id: parseInt(id),
        config: config as any
      })
      setSaveStatus('saved')
      // Reset status after 2 seconds
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to save notebook:', err)
      setSaveStatus('idle')
    }
  }, [id, updateNotebook])

  const handleScore = useCallback(async (data: { traceId: string; value: number; comment?: string }) => {
    try {
      await fetch('/api/agent/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (err) {
      console.error('Failed to submit score:', err)
    }
  }, [])

  const handleDashboardSaved = useCallback(async (data: { title: string; description?: string; dashboardConfig: any }) => {
    try {
      const page = await createDashboard.mutateAsync({
        name: data.title,
        description: data.description,
        config: data.dashboardConfig,
      })
      navigate(`/dashboards/${page.id}`)
    } catch (err) {
      console.error('Failed to create dashboard:', err)
    }
  }, [createDashboard, navigate])

  const agentProps = {
    agentApiKey: apiKey || undefined,
    agentProvider: provider || undefined,
    agentModel: model || undefined,
    agentProviderEndpoint: endpoint || undefined,
  }

  return {
    initialPrompt,
    saveStatus,
    apiKey, setApiKey,
    provider, setProvider,
    model, setModel,
    endpoint, setEndpoint,
    showSettings, setShowSettings,
    agentProps,
    handleSave,
    handleScore,
    handleDashboardSaved,
  }
}
