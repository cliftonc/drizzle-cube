import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '@drizzle-cube/client'
import '@drizzle-cube/client/styles.css'
import { customCharts } from './charts'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardListPage from './pages/DashboardListPage'
import DashboardViewPage from './pages/DashboardViewPage'
import AnalysisBuilderPage from './pages/AnalysisBuilderPage'
import NotebooksListPage from './pages/NotebooksListPage'
import NotebookViewPage from './pages/NotebookViewPage'
import SchemaPage from './pages/SchemaPage'
import DataBrowserPage from './pages/DataBrowserPage'

// Create a client
const queryClient = new QueryClient()
const LOCALE_STORAGE_KEY = 'drizzle-cube-dev-locale'
const DEFAULT_LOCALE = 'en-GB'
const SUPPORTED_LOCALES = ['en-GB', 'en-US', 'nl-NL'] as const
const apiOptions = { apiUrl: '/cubejs-api/v1' }

function getInitialLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale as typeof SUPPORTED_LOCALES[number])) {
    return storedLocale
  }
  return DEFAULT_LOCALE
}

// Stable references for CubeProvider props (never change)
const features = {
  enableAI: true,
  aiEndpoint: '/api/ai/generate',
  useAnalysisBuilder: true,
  showSchemaDiagram: true,
  editToolbar: 'both' as const,  // 'floating' | 'top' | 'both'
  floatingToolbarPosition: 'right' as const,
  // Manual refresh mode - shows "needs refresh" banner when query config changes
  // Disabled for dev site to allow auto-refresh on filter changes
  manualRefresh: false,
  // Dashboard thumbnail capture on save (requires modern-screenshot)
  thumbnail: {
    enabled: true,
    // Using defaults (1600x1200) for crisp thumbnails
    format: 'png' as const
  },
  // XLSX data export from portlets (requires exceljs)
  xlsExport: { enabled: true }
}

function App() {
  const [locale, setLocale] = useState<string>(getInitialLocale)

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }, [locale])

  return (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={apiOptions}
        features={features}
        customCharts={customCharts}
        locale={locale}
      >
        <Layout locale={locale} onLocaleChange={setLocale}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboards" element={<DashboardListPage />} />
            <Route path="/dashboards/:id" element={<DashboardViewPage />} />
            <Route path="/analysis-builder" element={<AnalysisBuilderPage />} />
            <Route path="/notebooks" element={<NotebooksListPage />} />
            <Route path="/notebooks/:id" element={<NotebookViewPage />} />
            <Route path="/schema" element={<SchemaPage />} />
            <Route path="/data-browser" element={<DataBrowserPage />} />
          </Routes>
        </Layout>
      </CubeProvider>
    </QueryClientProvider>
  )
}

export default App
