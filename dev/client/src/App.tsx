import { useEffect, useState, useCallback } from 'react'
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
const SUPPORTED_LOCALES = ['en-GB', 'en-US', 'nl-NL', 'crowdin'] as const
const CROWDIN_PROJECT_ID = 'drizzle-cube'
const apiOptions = { apiUrl: '/cubejs-api/v1' }

/**
 * Load or unload the Crowdin In-Context (JIPT) script.
 * When active, Crowdin overlays editable translation UI on the page.
 * Requires the pseudo-locale package generated in Crowdin > Tools > In-Context.
 */
function loadCrowdinJipt() {
  if (document.getElementById('crowdin-jipt')) return
  const config = document.createElement('script')
  config.id = 'crowdin-jipt-config'
  config.textContent = `var _jipt = []; _jipt.push(['project', '${CROWDIN_PROJECT_ID}']);`
  document.head.appendChild(config)

  const script = document.createElement('script')
  script.id = 'crowdin-jipt'
  script.src = 'https://cdn.crowdin.com/jipt/jipt.js'
  document.head.appendChild(script)
}

function unloadCrowdinJipt() {
  document.getElementById('crowdin-jipt')?.remove()
  document.getElementById('crowdin-jipt-config')?.remove()
  // JIPT injects UI elements — reload to clean up
  if (document.querySelector('.crowdin-jipt')) {
    window.location.reload()
  }
}

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
  xlsExport: { enabled: true },
  // Choropleth map datasets — developer-registered, end users pick by id.
  // Each map ships its own GeoJSON and tells nivo which feature property to
  // match against the region dimension value. Dashboards can switch between
  // world-level (Employees.country) and US-level (Employees.region) views.
  choropleth: {
    enabled: true,
    defaultMap: 'world',
    maps: {
      world: {
        label: 'World Countries',
        url: '/world_countries.geojson',
        idProperty: 'name',
      },
      usStates: {
        label: 'US States',
        url: '/us_states.geojson',
        idProperty: 'name',
      },
    },
  },
}

function App() {
  const [locale, setLocale] = useState<string>(getInitialLocale)
  const isCrowdin = locale === 'crowdin'

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    if (isCrowdin) {
      loadCrowdinJipt()
    } else {
      unloadCrowdinJipt()
    }
  }, [locale, isCrowdin])

  // When Crowdin is active, use 'af-ZA' (Afrikaans pseudo-locale with Crowdin identifiers)
  const effectiveLocale = isCrowdin ? 'af-ZA' : locale

  const handleLocaleChange = useCallback((newLocale: string) => {
    setLocale(newLocale)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={apiOptions}
        features={features}
        customCharts={customCharts}
        locale={effectiveLocale}
        debugI18n
      >
        <Layout locale={locale} onLocaleChange={handleLocaleChange}>
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
