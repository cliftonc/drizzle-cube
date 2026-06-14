/**
 * Create/delete actions for DashboardListPage, extracted to flatten the page
 * component. Behaviour is identical to the original inline handlers.
 */
import {
  useCreateExamplePage,
  useDeleteAnalyticsPage,
  useCreateAnalyticsPage
} from '../hooks/useAnalyticsPages'

const DASHBOARD_LIMIT = 10
const LIMIT_MESSAGE =
  'I think 10 is enough dashboards for now, just delete one if you want to test that feature!'

export function useDashboardListActions(pageCount: number) {
  const createExample = useCreateExamplePage()
  const deletePage = useDeleteAnalyticsPage()
  const createPage = useCreateAnalyticsPage()

  const atLimit = pageCount >= DASHBOARD_LIMIT

  const handleCreateExample = async () => {
    if (atLimit) {
      alert(LIMIT_MESSAGE)
      return
    }
    try {
      await createExample.mutateAsync()
    } catch (error) {
      console.error('Failed to create example dashboard:', error)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deletePage.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete dashboard:', error)
      }
    }
  }

  const handleCreateDashboard = async (data: { name: string; description?: string }) => {
    if (atLimit) {
      alert(LIMIT_MESSAGE)
      return
    }
    try {
      await createPage.mutateAsync({
        name: data.name,
        description: data.description,
        config: { portlets: [] }
      })
      // Note: We could navigate to the new page here if desired
      // navigate(`/dashboards/${newPage.id}`)
    } catch (error) {
      console.error('Failed to create dashboard:', error)
      throw error // Re-throw to keep modal open
    }
  }

  return {
    atLimit,
    createExample,
    deletePage,
    handleCreateExample,
    handleDelete,
    handleCreateDashboard,
  }
}
