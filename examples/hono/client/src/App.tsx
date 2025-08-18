import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DashboardListPage from './pages/DashboardListPage'
import DashboardViewPage from './pages/DashboardViewPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboards" element={<DashboardListPage />} />
        <Route path="/dashboards/:id" element={<DashboardViewPage />} />
      </Routes>
    </Layout>
  )
}

export default App