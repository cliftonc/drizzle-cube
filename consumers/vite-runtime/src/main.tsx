// A lazy dashboard page, as apps load it, with one portlet per chart type.
import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const Dashboard = lazy(() => import('./Dashboard'))

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={null}>
    <Dashboard />
  </Suspense>
)
