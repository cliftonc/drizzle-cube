/**
 * LLM settings popover for the notebook view, plus a localStorage-backed state hook.
 *
 * Extracted from NotebookViewPage so the page component stays flat: the four
 * provider/model/key/endpoint fields share one persistence pattern, and the
 * popover markup lives here.
 */
import { useState } from 'react'

export const API_KEY_STORAGE_KEY = 'dc-notebook-api-key'
export const PROVIDER_STORAGE_KEY = 'dc-notebook-provider'
export const MODEL_STORAGE_KEY = 'dc-notebook-model'
export const ENDPOINT_STORAGE_KEY = 'dc-notebook-endpoint'

/**
 * State that mirrors a localStorage key: setting a truthy value writes it,
 * setting an empty value removes the key. Matches the original inline handlers.
 */
export function useLocalStorageState(storageKey: string): [string, (value: string) => void] {
  const [value, setValue] = useState(() => localStorage.getItem(storageKey) || '')

  const update = (next: string) => {
    setValue(next)
    if (next) {
      localStorage.setItem(storageKey, next)
    } else {
      localStorage.removeItem(storageKey)
    }
  }

  return [value, update]
}

// Gear icon for settings button
export const GearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

interface LlmSettingsPanelProps {
  provider: string
  setProvider: (value: string) => void
  model: string
  setModel: (value: string) => void
  apiKey: string
  setApiKey: (value: string) => void
  endpoint: string
  setEndpoint: (value: string) => void
  onClose: () => void
}

const FIELD_CLASS =
  'w-full px-3 py-2 border border-dc-border rounded-lg bg-dc-surface text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary text-sm'

export function LlmSettingsPanel({
  provider, setProvider,
  model, setModel,
  apiKey, setApiKey,
  endpoint, setEndpoint,
  onClose,
}: LlmSettingsPanelProps) {
  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-96 bg-dc-surface rounded-lg shadow-xl border border-dc-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-dc-text">LLM Settings</h3>
        <span className="text-[10px] text-dc-text-muted">Stored in localStorage</span>
      </div>

      {/* Provider */}
      <label className="block text-xs font-medium text-dc-text-secondary mb-1">Provider</label>
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
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
        onChange={(e) => setModel(e.target.value)}
        placeholder={provider === 'openai' ? 'gpt-4o' : provider === 'google' ? 'gemini-2.0-flash' : 'claude-sonnet-4-6'}
        className={`${FIELD_CLASS} font-mono mb-3`}
      />

      {/* API Key */}
      <label className="block text-xs font-medium text-dc-text-secondary mb-1">API Key</label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={provider === 'openai' ? 'sk-...' : provider === 'google' ? 'AIza...' : 'sk-ant-...'}
        className={`${FIELD_CLASS} font-mono mb-3`}
      />

      {/* Provider Endpoint (optional) */}
      <label className="block text-xs font-medium text-dc-text-secondary mb-1">
        Provider Endpoint <span className="text-dc-text-muted font-normal">(optional)</span>
      </label>
      <input
        type="text"
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        placeholder="https://api.groq.com/openai/v1"
        className={`${FIELD_CLASS} font-mono mb-1`}
      />
      <p className="text-[10px] text-dc-text-muted mb-3">
        For OpenAI-compatible services (Groq, Together, Ollama, etc.)
      </p>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-dc-text-secondary hover:text-dc-text transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
