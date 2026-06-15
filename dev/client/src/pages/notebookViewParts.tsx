/**
 * Header + status presentational pieces for NotebookViewPage. Extracted so the
 * page component is mostly composition: the breadcrumb, save indicator, and LLM
 * settings button/panel live here.
 */
import { Link } from 'react-router-dom'
import { getIcon } from '@drizzle-cube/client'
import { GearIcon, LlmSettingsPanel } from './notebookLlmSettings'

const ChevronRightIcon = getIcon('chevronRight')
const CheckIcon = getIcon('check')

type SaveStatus = 'idle' | 'saving' | 'saved'

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return <span className="text-xs text-dc-text-muted">Saving...</span>
  }
  if (status === 'saved') {
    return (
      <span className="text-xs text-dc-success flex items-center gap-1">
        <CheckIcon className="w-3 h-3" />
        Saved
      </span>
    )
  }
  return null
}

interface NotebookHeaderProps {
  notebookName: string
  saveStatus: SaveStatus
  showSettings: boolean
  onToggleSettings: () => void
  onCloseSettings: () => void
  provider: string
  setProvider: (value: string) => void
  model: string
  setModel: (value: string) => void
  apiKey: string
  setApiKey: (value: string) => void
  endpoint: string
  setEndpoint: (value: string) => void
}

export function NotebookHeader({
  notebookName,
  saveStatus,
  showSettings,
  onToggleSettings,
  onCloseSettings,
  provider, setProvider,
  model, setModel,
  apiKey, setApiKey,
  endpoint, setEndpoint,
}: NotebookHeaderProps) {
  const settingsButtonClass = apiKey
    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
  const settingsButtonLabel = apiKey ? (provider || 'anthropic') : 'Configure LLM'

  return (
    <div className="flex items-center justify-between mb-4 shrink-0">
      <div className="flex items-center gap-1 text-sm text-dc-text-muted">
        <Link to="/notebooks" className="hover:text-dc-text transition-colors">
          Notebooks
        </Link>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-dc-text font-medium truncate max-w-[200px]">
          {notebookName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <SaveIndicator status={saveStatus} />

        {/* LLM Settings */}
        <div className="relative">
          <button
            onClick={onToggleSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${settingsButtonClass}`}
            title="LLM provider settings"
          >
            <GearIcon className="w-3.5 h-3.5" />
            {settingsButtonLabel}
          </button>

          {showSettings && (
            <LlmSettingsPanel
              provider={provider}
              setProvider={setProvider}
              model={model}
              setModel={setModel}
              apiKey={apiKey}
              setApiKey={setApiKey}
              endpoint={endpoint}
              setEndpoint={setEndpoint}
              onClose={onCloseSettings}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function NotebookLoadingState() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
      <div className="text-dc-text-muted">Loading notebook...</div>
    </div>
  )
}

export function NotebookErrorState({ error }: { error: unknown }) {
  const message = (error as Error)?.message || 'Notebook not found'
  return (
    <div className="text-center py-12">
      <p className="text-dc-error text-lg">Failed to load notebook</p>
      <p className="text-dc-text-muted text-sm mt-2">{message}</p>
      <Link to="/notebooks" className="text-dc-primary text-sm mt-4 inline-block hover:underline">
        Back to notebooks
      </Link>
    </div>
  )
}
