import { Routes, Route } from 'react-router-dom'
import { CubeProvider } from 'drizzle-cube/client'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardListPage from './pages/DashboardListPage'
import DashboardViewPage from './pages/DashboardViewPage'
import QueryBuilderPage from './pages/QueryBuilderPage'

function App() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/cubejs-api/v1' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboards" element={<DashboardListPage />} />
          <Route path="/dashboards/:id" element={<DashboardViewPage />} />
          <Route path="/query-builder" element={<QueryBuilderPage />} />
        </Routes>
      </Layout>
    </CubeProvider>
  )
}

export default App