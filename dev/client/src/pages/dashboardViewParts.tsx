/**
 * Presentational pieces for DashboardViewPage: the options dropdown, demo note,
 * and reset-confirmation modal. Extracted to flatten the page component.
 */
import { Link } from 'react-router-dom'
import { getIcon } from '@drizzle-cube/client'

const ArrowPathIcon = getIcon('refresh')
const PencilIcon = getIcon('edit')
const EllipsisHorizontalIcon = getIcon('ellipsisHorizontal')

export function DashboardLoadingState() {
  return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-dc-primary"></div>
      <p className="mt-2 text-dc-text-muted">Loading dashboard...</p>
    </div>
  )
}

export function DashboardErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Dashboard not found'
  return (
    <div className="text-center py-8">
      <p className="text-dc-error">Failed to load dashboard</p>
      <p className="text-sm text-dc-text-muted mt-1">{message}</p>
      <Link
        to="/dashboards"
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover"
      >
        Back to Dashboards
      </Link>
    </div>
  )
}

interface DashboardHeaderProps {
  name: string
  description?: string
  showOptionsMenu: boolean
  onToggleOptions: () => void
  onEdit: () => void
  onReset: () => void
}

export function DashboardHeader({
  name, description,
  showOptionsMenu, onToggleOptions, onEdit, onReset,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/dashboards" className="text-dc-text-muted hover:text-dc-text-secondary text-sm">
                Dashboards
              </Link>
            </li>
            <li>
              <svg
                className="shrink-0 h-5 w-5 text-dc-border"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <span className="text-dc-text-secondary text-sm truncate">{name}</span>
            </li>
          </ol>
        </nav>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-dc-text">{name}</h1>
            {description && (
              <p className="mt-1 text-sm text-dc-text-secondary leading-relaxed">{description}</p>
            )}
          </div>

          {/* Options menu */}
          <DashboardOptionsMenu
            open={showOptionsMenu}
            onToggle={onToggleOptions}
            onEdit={onEdit}
            onReset={onReset}
          />
        </div>

        <DashboardDemoNote />
      </div>
    </div>
  )
}

interface OptionsMenuProps {
  open: boolean
  onToggle: () => void
  onEdit: () => void
  onReset: () => void
}

export function DashboardOptionsMenu({ open, onToggle, onEdit, onReset }: OptionsMenuProps) {
  return (
    <div className="relative shrink-0" data-options-menu>
      <button
        onClick={onToggle}
        className="p-2 border border-dc-border bg-dc-surface text-dc-text-muted hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-primary focus:ring-offset-2 focus:ring-offset-dc-surface rounded-md"
        title="More options"
      >
        <EllipsisHorizontalIcon className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-dc-surface border border-dc-border rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={onEdit}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-dc-text hover:bg-dc-surface-hover"
            >
              <PencilIcon className="w-4 h-4" />
              Edit Dashboard
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-dc-text hover:bg-dc-surface-hover"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Reset Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardDemoNote() {
  return (
    <div className="mt-4 px-4 py-3 bg-dc-info-bg border border-dc-info-border rounded-lg shadow-md">
      <div className="flex items-start">
        <span className="text-2xl mr-3">💡</span>
        <div>
          <p className="text-sm font-semibold text-dc-info">
            Demo Note
          </p>
          <p className="text-sm text-dc-text-secondary mt-1">
            This dashboard uses the <a href="https://github.com/cliftonc/drizzle-cube/blob/main/src/client/components/AnalyticsDashboard.tsx" target="_blank" rel="noopener noreferrer" className="underline hover:text-dc-primary"><code className="px-1 py-0.5 bg-dc-muted-bg rounded-sm text-xs font-mono">AnalyticsDashboard</code></a> component from drizzle-cube/client. It includes drag-and-drop, auto-save, and real-time updates. These dashboards are limited to 20 portlets, in your implementation this limit does not need to apply.
          </p>
        </div>
      </div>
    </div>
  )
}

interface ResetModalProps {
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ResetDashboardModal({ isPending, onCancel, onConfirm }: ResetModalProps) {
  return (
    <div className="fixed inset-0 bg-dc-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-dc-surface rounded-lg p-6 max-w-md w-full border border-dc-border">
        <h3 className="text-lg font-medium text-dc-text mb-4">
          Reset Dashboard
        </h3>
        <p className="text-sm text-dc-text-muted mb-6 leading-relaxed">
          Are you sure you want to reset this dashboard to the default configuration?
          This will remove all your customizations and cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center px-4 py-2 border border-dc-border rounded-md shadow-2xs text-sm font-medium text-dc-text bg-dc-surface hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dc-primary w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-2xs text-sm font-medium text-white bg-dc-danger hover:bg-dc-danger-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dc-danger disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
          >
            {isPending ? 'Resetting...' : 'Reset Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
