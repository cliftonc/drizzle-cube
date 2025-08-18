import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="text-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Drizzle Cube Analytics
        </h1>
        <p className="text-gray-600 mb-6">
          Build powerful analytics dashboards with type-safe SQL using Drizzle ORM 
          and Cube.js-compatible APIs.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/dashboards"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Dashboards
          </Link>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Type-safe analytics with Drizzle ORM</li>
              <li>• Cube.js-compatible API</li>
              <li>• React dashboard components</li>
              <li>• Interactive chart editing</li>
              <li>• Persistent dashboard configurations</li>
            </ul>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">API Endpoints</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <code className="bg-gray-100 px-1 rounded">/cubejs-api/v1/meta</code>
                <span className="ml-2">- Schema metadata</span>
              </div>
              <div>
                <code className="bg-gray-100 px-1 rounded">/cubejs-api/v1/load</code>
                <span className="ml-2">- Execute queries</span>
              </div>
              <div>
                <code className="bg-gray-100 px-1 rounded">/api/analytics-pages</code>
                <span className="ml-2">- Dashboard CRUD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}