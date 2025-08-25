import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '@drizzle-cube/client'
import '@drizzle-cube/client/styles.css'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardListPage from './pages/DashboardListPage'
import DashboardViewPage from './pages/DashboardViewPage'
import QueryBuilderPage from './pages/QueryBuilderPage'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CubeProvider apiOptions={{ apiUrl: '/cubejs-api/v1' }} features={{enableAI: false}}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboards" element={<DashboardListPage />} />
            <Route path="/dashboards/:id" element={<DashboardViewPage />} />
            <Route path="/query-builder" element={<QueryBuilderPage />} />
          </Routes>
        </Layout>
      </CubeProvider>
    </QueryClientProvider>
  )
}

export default App