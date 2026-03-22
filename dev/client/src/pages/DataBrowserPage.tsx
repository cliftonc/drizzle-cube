import { DataBrowser } from '@drizzle-cube/client'

const DrizzleCubeLoader = () => (
  <div className="flex items-center justify-center">
    <img
      src="/drizzle-cube.png"
      alt="Loading..."
      className="h-10 w-10 animate-spin"
      style={{ animationDuration: '1.5s' }}
    />
  </div>
)

export default function DataBrowserPage() {
  return (
    <div className="-m-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-dc-border px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dc-text">Data Browser</h1>
        <p className="mt-1 text-sm text-dc-text-secondary leading-relaxed">
          Browse raw cube data with sorting, filtering, and pagination. Select a cube to explore its records.
        </p>
      </div>

      {/* Data Browser */}
      <DataBrowser maxHeight="calc(100vh - 180px)" loadingComponent={<DrizzleCubeLoader />} />
    </div>
  )
}
