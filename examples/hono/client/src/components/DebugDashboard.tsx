
interface DebugDashboardProps {
  config: any
  apiUrl?: string
}

export default function DebugDashboard({ config, apiUrl }: DebugDashboardProps) {
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug Dashboard</h3>
      
      <div className="space-y-4">
        <div>
          <strong>API URL:</strong> {apiUrl || 'Not provided'}
        </div>
        
        <div>
          <strong>Config:</strong>
          <pre className="mt-2 p-2 bg-gray-100 rounded-sm text-xs overflow-auto">
            <code className="language-json">{JSON.stringify(config, null, 2)}</code>
          </pre>
        </div>
        
        <div>
          <strong>Portlets Count:</strong> {config?.portlets?.length || 0}
        </div>
        
        {config?.portlets?.length > 0 && (
          <div>
            <strong>Portlets:</strong>
            <ul className="mt-2 space-y-2">
              {config.portlets.map((portlet: any, index: number) => (
                <li key={portlet.id || index} className="p-2 bg-gray-50 rounded-sm">
                  <div><strong>Title:</strong> {portlet.title}</div>
                  <div><strong>Type:</strong> {portlet.chartType}</div>
                  <div><strong>Query:</strong> {portlet.query}</div>
                  <div><strong>Size:</strong> {portlet.w}x{portlet.h}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}