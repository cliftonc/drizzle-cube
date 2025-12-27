import { useState, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '@drizzle-cube/client'
import '@drizzle-cube/client/styles.css'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardListPage from './pages/DashboardListPage'
import DashboardViewPage from './pages/DashboardViewPage'
import QueryBuilderPage from './pages/QueryBuilderPage'
import AnalysisBuilderPage from './pages/AnalysisBuilderPage'

// Create a client
const queryClient = new QueryClient()

// Context for the Analysis Builder toggle
interface AnalysisBuilderToggleContextValue {
  useAnalysisBuilder: boolean
  setUseAnalysisBuilder: (value: boolean) => void
}

const AnalysisBuilderToggleContext = createContext<AnalysisBuilderToggleContextValue | null>(null)

export function useAnalysisBuilderToggle() {
  const context = useContext(AnalysisBuilderToggleContext)
  if (!context) {
    throw new Error('useAnalysisBuilderToggle must be used within AnalysisBuilderToggleProvider')
  }
  return context
}

function App() {
  const [useAnalysisBuilder, setUseAnalysisBuilder] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <AnalysisBuilderToggleContext.Provider value={{ useAnalysisBuilder, setUseAnalysisBuilder }}>
        <CubeProvider
          apiOptions={{ apiUrl: '/cubejs-api/v1' }}
          features={{ enableAI: false, useAnalysisBuilder }}
        >
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboards" element={<DashboardListPage />} />
              <Route path="/dashboards/:id" element={<DashboardViewPage />} />
              <Route path="/query-builder" element={<QueryBuilderPage />} />
              <Route path="/analysis-builder" element={<AnalysisBuilderPage />} />
            </Routes>
          </Layout>
        </CubeProvider>
      </AnalysisBuilderToggleContext.Provider>
    </QueryClientProvider>
  )
}

export default App