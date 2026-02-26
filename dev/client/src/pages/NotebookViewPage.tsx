import { useParams, Link } from 'react-router-dom'
import { useCallback, useState, useRef } from 'react'
import { AgenticNotebook } from '@drizzle-cube/client'
import type { NotebookConfig } from '@drizzle-cube/client'
import { getIcon } from '@drizzle-cube/client'
import { useNotebook, useUpdateNotebook } from '../hooks/useNotebooks'

const ChevronRightIcon = getIcon('chevronRight')
const CheckIcon = getIcon('check')

// Simple key icon for API key button (not in drizzle-cube icon registry)
const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
  </svg>
)

const API_KEY_STORAGE_KEY = 'dc-notebook-api-key'

export default function NotebookViewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: notebook, isLoading, error } = useNotebook(id!)
  const updateNotebook = useUpdateNotebook()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-dc-text-muted">Loading notebook...</div>
      </div>
    )
  }

  if (error || !notebook) {
    return (
      <div className="text-center py-12">
        <p className="text-dc-error text-lg">Failed to load notebook</p>
        <p className="text-dc-text-muted text-sm mt-2">{(error as Error)?.message || 'Notebook not found'}</p>
        <Link to="/notebooks" className="text-dc-primary text-sm mt-4 inline-block hover:underline">
          Back to notebooks
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-1 text-sm text-dc-text-muted">
          <Link to="/notebooks" className="hover:text-dc-text transition-colors">
            Notebooks
          </Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-dc-text font-medium truncate max-w-[200px]">
            {notebook.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-dc-text-muted">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-dc-success flex items-center gap-1">
              <CheckIcon className="w-3 h-3" />
              Saved
            </span>
          )}

          {/* API Key configuration */}
          <div className="relative">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                apiKey
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
              }`}
              title={apiKey ? 'API key configured' : 'Set your Anthropic API key'}
            >
              <KeyIcon className="w-3.5 h-3.5" />
              {apiKey ? 'API Key Set' : 'Set API Key'}
            </button>

            {showApiKeyInput && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-dc-surface rounded-lg shadow-xl border border-dc-border p-4">
                <label className="block text-sm font-medium text-dc-text mb-1.5">
                  Anthropic API Key
                </label>
                <p className="text-xs text-dc-text-muted mb-3">
                  Your key is stored in localStorage and sent via the X-Agent-Api-Key header.
                </p>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    const val = e.target.value
                    setApiKey(val)
                    if (val) {
                      localStorage.setItem(API_KEY_STORAGE_KEY, val)
                    } else {
                      localStorage.removeItem(API_KEY_STORAGE_KEY)
                    }
                  }}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary text-sm font-mono"
                  autoFocus
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => setShowApiKeyInput(false)}
                    className="px-3 py-1.5 text-xs font-medium text-dc-text-secondary hover:text-dc-text transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notebook */}
      <div className="flex-1 rounded-xl border border-dc-border overflow-hidden">
        <AgenticNotebook
          config={notebook.config as NotebookConfig | undefined}
          onSave={handleSave}
          agentApiKey={apiKey || undefined}
        />
      </div>
    </div>
  )
}
