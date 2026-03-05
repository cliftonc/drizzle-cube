import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useState, useRef } from 'react'
import { AgenticNotebook } from '@drizzle-cube/client'
import type { NotebookConfig } from '@drizzle-cube/client'
import { getIcon } from '@drizzle-cube/client'
import { useNotebook, useUpdateNotebook } from '../hooks/useNotebooks'
import { useCreateAnalyticsPage } from '../hooks/useAnalyticsPages'

const ChevronRightIcon = getIcon('chevronRight')
const CheckIcon = getIcon('check')

// Custom loading indicator matching the dashboard's branded spinner
const DrizzleCubeLoader = () => (
  <img
    src="/drizzle-cube.png"
    alt="Loading..."
    className="h-full w-full animate-spin"
    style={{ animationDuration: '1.5s' }}
  />
)

const API_KEY_STORAGE_KEY = 'dc-notebook-api-key'
const PROVIDER_STORAGE_KEY = 'dc-notebook-provider'
const MODEL_STORAGE_KEY = 'dc-notebook-model'
const ENDPOINT_STORAGE_KEY = 'dc-notebook-endpoint'

// Gear icon for settings button
const GearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

export default function NotebookViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt
  const { data: notebook, isLoading, error } = useNotebook(id!)
  const updateNotebook = useUpdateNotebook()
  const createDashboard = useCreateAnalyticsPage()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '')
  const [provider, setProvider] = useState(() => localStorage.getItem(PROVIDER_STORAGE_KEY) || '')
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_STORAGE_KEY) || '')
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem(ENDPOINT_STORAGE_KEY) || '')
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

          {/* LLM Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                apiKey
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
              }`}
              title="LLM provider settings"
            >
              <GearIcon className="w-3.5 h-3.5" />
              {apiKey ? (provider || 'anthropic') : 'Configure LLM'}
            </button>

            {showSettings && (
              <div className="absolute right-0 top-full mt-2 z-50 w-96 bg-dc-surface rounded-lg shadow-xl border border-dc-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-dc-text">LLM Settings</h3>
                  <span className="text-[10px] text-dc-text-muted">Stored in localStorage</span>
                </div>

                {/* Provider */}
                <label className="block text-xs font-medium text-dc-text-secondary mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const val = e.target.value
                    setProvider(val)
                    if (val) {
                      localStorage.setItem(PROVIDER_STORAGE_KEY, val)
                    } else {
                      localStorage.removeItem(PROVIDER_STORAGE_KEY)
                    }
                  }}
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-dc-primary"
                >
                  <option value="">Server default</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI</option>
                  <option value="google">Google (Gemini)</option>
                </select>

                {/* Model */}
                <label className="block text-xs font-medium text-dc-text-secondary mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => {
                    const val = e.target.value
                    setModel(val)
                    if (val) {
                      localStorage.setItem(MODEL_STORAGE_KEY, val)
                    } else {
                      localStorage.removeItem(MODEL_STORAGE_KEY)
                    }
                  }}
                  placeholder={provider === 'openai' ? 'gpt-4o' : provider === 'google' ? 'gemini-2.0-flash' : 'claude-sonnet-4-6'}
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary text-sm font-mono mb-3"
                />

                {/* API Key */}
                <label className="block text-xs font-medium text-dc-text-secondary mb-1">API Key</label>
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
                  placeholder={provider === 'openai' ? 'sk-...' : provider === 'google' ? 'AIza...' : 'sk-ant-...'}
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary text-sm font-mono mb-3"
                />

                {/* Provider Endpoint (optional) */}
                <label className="block text-xs font-medium text-dc-text-secondary mb-1">
                  Provider Endpoint <span className="text-dc-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => {
                    const val = e.target.value
                    setEndpoint(val)
                    if (val) {
                      localStorage.setItem(ENDPOINT_STORAGE_KEY, val)
                    } else {
                      localStorage.removeItem(ENDPOINT_STORAGE_KEY)
                    }
                  }}
                  placeholder="https://api.groq.com/openai/v1"
                  className="w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary text-sm font-mono mb-1"
                />
                <p className="text-[10px] text-dc-text-muted mb-3">
                  For OpenAI-compatible services (Groq, Together, Ollama, etc.)
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
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
          agentProvider={provider || undefined}
          agentModel={model || undefined}
          agentProviderEndpoint={endpoint || undefined}
          onDashboardSaved={handleDashboardSaved}
          onScore={handleScore}
          loadingComponent={<DrizzleCubeLoader />}
          initialPrompt={initialPrompt}
        />
      </div>
    </div>
  )
}
