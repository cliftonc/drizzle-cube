import { useParams } from 'react-router-dom'
import { AgenticNotebook } from '@drizzle-cube/client'
import type { NotebookConfig } from '@drizzle-cube/client'
import { useNotebook } from '../hooks/useNotebooks'
import { useNotebookViewState } from './useNotebookViewState'
import { NotebookHeader, NotebookLoadingState, NotebookErrorState } from './notebookViewParts'

// Custom loading indicator matching the dashboard's branded spinner
const DrizzleCubeLoader = () => (
  <img
    src="/drizzle-cube.png"
    alt="Loading..."
    className="h-full w-full animate-spin"
    style={{ animationDuration: '1.5s' }}
  />
)

export default function NotebookViewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: notebook, isLoading, error } = useNotebook(id!)
  const {
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
  } = useNotebookViewState(id)

  if (isLoading) {
    return <NotebookLoadingState />
  }

  if (error || !notebook) {
    return <NotebookErrorState error={error} />
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Breadcrumb + Header */}
      <NotebookHeader
        notebookName={notebook.name}
        saveStatus={saveStatus}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onCloseSettings={() => setShowSettings(false)}
        provider={provider}
        setProvider={setProvider}
        model={model}
        setModel={setModel}
        apiKey={apiKey}
        setApiKey={setApiKey}
        endpoint={endpoint}
        setEndpoint={setEndpoint}
      />

      {/* Notebook */}
      <div className="flex-1 rounded-xl border border-dc-border overflow-hidden">
        <AgenticNotebook
          config={notebook.config as NotebookConfig | undefined}
          onSave={handleSave}
          {...agentProps}
          onDashboardSaved={handleDashboardSaved}
          onScore={handleScore}
          loadingComponent={<DrizzleCubeLoader />}
          initialPrompt={initialPrompt}
        />
      </div>
    </div>
  )
}
