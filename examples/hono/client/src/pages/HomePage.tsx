import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  BookOpenIcon, 
  CodeBracketIcon 
} from '@heroicons/react/24/outline'

export default function HomePage() {
  // Apply Prism.js syntax highlighting after component mounts
  useEffect(() => {
    setTimeout(() => {
      try {
        ;(window as any).Prism.highlightAll()
      } catch (error) {
        // Silently fail if Prism is not available or encounters an error
      }
    }, 0)
  }, [])
  return (
    <>
      {/* Override Prism.js background styling */}
      <style>{`
        .language-ts, .language-json, pre[class*="language-"] {
          background: transparent !important;
        }
        code[class*="language-"], pre[class*="language-"] {
          background: transparent !important;
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Drizzle Cube
          </h1>
          <p className="text-2xl text-gray-700 mb-4 font-medium">
            Drizzle ORM-first semantic layer with Cube.js compatibility
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Build type-safe analytics dashboards with SQL injection protection by leveraging Drizzle ORM as your core SQL building engine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link
            to="/dashboards"
            className="group bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboards</h3>
              <p className="text-sm text-gray-600">View analytics and insights</p>
            </div>
          </Link>
          
          <Link
            to="/query-builder"
            className="group bg-white hover:bg-green-50 border border-green-200 hover:border-green-300 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <MagnifyingGlassIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Query Builder</h3>
              <p className="text-sm text-gray-600">Build custom queries</p>
            </div>
          </Link>
          
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-300 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-sm text-gray-600">Learn how to use Drizzle Cube</p>
            </div>
          </a>
          
          <a
            href="https://github.com/cliftonc/drizzle-cube"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <CodeBracketIcon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">GitHub</h3>
              <p className="text-sm text-gray-600">View source code</p>
            </div>
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Drizzle Cube?</h2>
            <p className="text-gray-600 mb-4">
              A semantic layer that bridges your database and analytics applications, providing type-safe analytics with SQL injection protection.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span><strong>Type-safe semantic layer</strong> - Full TypeScript support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span><strong>SQL injection protection</strong> - Parameterized queries via Drizzle</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span><strong>Cube.js compatibility</strong> - Drop-in replacement</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span><strong>Multi-tenant security</strong> - Built-in isolation</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Architecture</h2>
            <p className="text-gray-600 mb-4">
              Drizzle-first architecture ensures type safety at every layer:
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">1</div>
                <span><strong>Database Schema</strong> - Drizzle ORM definitions</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">2</div>
                <span><strong>Semantic Layer</strong> - Cubes with dimensions & measures</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">3</div>
                <span><strong>Query Execution</strong> - Type-safe SQL generation</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">4</div>
                <span><strong>Framework Integration</strong> - Adapters for any framework</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">5</div>
                <span><strong>Client Components</strong> - React dashboard components</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-semibold mb-6 text-center">Quick Example</h3>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Column 1: Schema + Cube Definition */}
            <div className="space-y-6">
              {/* Drizzle Schema */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  Your EXISTING Drizzle Schema
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50">
                  <pre className="language-ts text-gray-700 overflow-x-auto p-3 bg-gray-50"><code className="language-ts">
{`// schema.ts
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
})`}
                  </code></pre>
                </div>
              </div>

              {/* Cube Definition */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-green-600 flex items-center">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                  Create a Drizzle Cube Definition
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50">
                  <pre className="language-ts text-gray-700 overflow-x-auto p-3 bg-gray-50"><code className="language-ts">
{`// cubes.ts
export const productsCube = defineCube(schema, {
  name: 'Products',
  sql: ({ db, securityContext }) => 
    db.select().from(schema.products)
      .where(eq(schema.products.organisationId, 
        securityContext.organisationId)),
  
  dimensions: {
    name: { sql: schema.products.name, type: 'string' },
    category: { sql: schema.products.category, type: 'string' },
    createdAt: { sql: schema.products.createdAt, type: 'time' }
  },
  
  measures: {
    count: { sql: schema.products.id, type: 'count' },
    avgPrice: { sql: schema.products.price, type: 'avg' },
    totalValue: { 
      sql: sql\`\${schema.products.price} * COUNT(\${schema.products.id})\`, 
      type: 'number',
      title: 'Total Inventory Value'
    }
  }
})`}
                  </code></pre>
                </div>
              </div>
            </div>

            {/* Column 2: Query Examples + Results */}
            <div className="space-y-6">
              {/* Step 3: Queries */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-purple-600 flex items-center">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                  Then use simple queries
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50">
                  <pre className="language-json text-gray-700 overflow-x-auto p-3 bg-gray-50"><code className="language-json">
{`{
  "measures": ["Products.count", "Products.avgPrice"],
  "dimensions": ["Products.category"],
  "timeDimensions": [{
    "dimension": "Products.createdAt",
    "granularity": "month"
  }],
  "filters": [{
    "member": "Products.category",
    "operator": "equals",
    "values": ["Electronics"]
  }]
}`}
                  </code></pre>
                </div>
              </div>

              {/* Step 4: Results */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-orange-600 flex items-center">
                  <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</div>
                  To get fast results
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50">
                  <pre className="language-json text-gray-700 overflow-x-auto p-3 bg-gray-50"><code className="language-json">
{`[{
  "Products.category": "Electronics",
  "Products.createdAt": "2024-01",
  "Products.count": "15",
  "Products.avgPrice": "299.99"
}]`}
                  </code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}