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

// Stable references for CubeProvider props (never change)
const apiOptions = { apiUrl: '/cubejs-api/v1' }
const features = {
  enableAI: true,
  aiEndpoint: '/api/ai/generate',
  useAnalysisBuilder: true,
  editToolbar: 'both' as const,  // 'floating' | 'top' | 'both'
  floatingToolbarPosition: 'right' as const,
  // Dashboard thumbnail capture on save (requires modern-screenshot)
  thumbnail: {
    enabled: true,
    // Using defaults (1600x1200) for crisp thumbnails
    format: 'png' as const
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={apiOptions}
        features={features}
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
    </QueryClientProvider>
  )
}

export default App