import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  BookOpenIcon, 
  CodeBracketIcon,
  SparklesIcon
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6">            
            Drizzle Cube
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-3 sm:mb-4 font-medium px-2">
            Embeddable Analytics Solution for Platform Builders
          </p>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            Deliver scalable, type-safe dashboarding capabilities to your platform users. 
            Embed rich analytics directly into your existing application with zero infrastructure overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <Link
            to="/dashboards"
            className="group bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Dashboards</h3>
              <p className="text-sm text-gray-600">View analytics and insights</p>
            </div>
          </Link>
          
          <Link
            to="/query-builder"
            className="group bg-white hover:bg-green-50 border border-green-200 hover:border-green-300 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md touch-manipulation relative"
          >
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 shadow-md z-10">
              <SparklesIcon className="w-3 h-3" />
              <span>AI Enabled</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <MagnifyingGlassIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Query Builder</h3>
              <p className="text-sm text-gray-600">Build custom queries</p>
            </div>
          </Link>
          
          <a
            href="https://www.drizzle-cube.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-300 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Documentation</h3>
              <p className="text-sm text-gray-600">Learn how to use Drizzle Cube</p>
            </div>
          </a>
          
          <a
            href="https://github.com/cliftonc/drizzle-cube"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <CodeBracketIcon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">GitHub</h3>
              <p className="text-sm text-gray-600">View source code</p>
            </div>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Why Embed Analytics?</h2>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
              Turn your platform into a data-driven powerhouse. Embed sophisticated analytics directly into your application to increase user engagement, reduce churn, and drive revenue growth.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5 shrink-0">✓</span>
                <span><strong>Zero infrastructure setup</strong> - Uses your existing database</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5 shrink-0">✓</span>
                <span><strong>Seamless integration</strong> - Embed in any React application</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5 shrink-0">✓</span>
                <span><strong>Multi-tenant by design</strong> - Secure data isolation built-in</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5 shrink-0">✓</span>
                <span><strong>Developer-friendly</strong> - Type-safe with Drizzle ORM</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">How It Works</h2>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
              Simple 5-step process to add analytics to your platform:
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3 mt-0.5 shrink-0">1</div>
                <span><strong>Use your existing schema</strong> - Already have Drizzle ORM? You're 80% done</span>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3 mt-0.5 shrink-0">2</div>
                <span><strong>Define analytics cubes</strong> - Map your data to business metrics</span>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3 mt-0.5 shrink-0">3</div>
                <span><strong>Add REST endpoints</strong> - One-line integration with your framework</span>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3 mt-0.5 shrink-0">4</div>
                <span><strong>Embed React components</strong> - Drop charts and dashboards into your UI</span>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3 mt-0.5 shrink-0">5</div>
                <span><strong>Ship to users</strong> - Your customers now have powerful analytics</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">Quick Example</h3>
          
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Column 1: Schema + Cube Definition */}
            <div className="space-y-6">
              {/* Drizzle Schema */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">1</div>
                  <span className="text-sm sm:text-base">Your EXISTING Drizzle Schema</span>
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50 overflow-x-auto">
                  <pre className="language-ts text-gray-700 p-3 bg-gray-50 min-w-0"><code className="language-ts">
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
                <h4 className="text-base sm:text-lg font-semibold mb-3 text-green-600 flex items-center">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">2</div>
                  <span className="text-sm sm:text-base">Create a Drizzle Cube Definition</span>
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50 overflow-x-auto">
                  <pre className="language-ts text-gray-700 p-3 bg-gray-50 min-w-0"><code className="language-ts">
{`// cubes.ts
import { defineCube } from 'drizzle-cube/server'
import { eq, sql } from 'drizzle-orm'

export const productsCube = defineCube('Products', {
  title: 'Product Analytics',
  description: 'Product inventory and pricing metrics',
  
  sql: (ctx) => ({
    from: schema.products,
    where: eq(schema.products.organisationId, 
      ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    name: {
      name: 'name',
      title: 'Product Name',
      type: 'string',
      sql: schema.products.name
    },
    category: {
      name: 'category', 
      title: 'Category',
      type: 'string',
      sql: schema.products.category
    },
    createdAt: {
      name: 'createdAt',
      title: 'Created Date',
      type: 'time',
      sql: schema.products.createdAt
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Product Count',
      type: 'count',
      sql: schema.products.id
    },
    avgPrice: {
      name: 'avgPrice',
      title: 'Average Price',
      type: 'avg',
      sql: schema.products.price
    }
  }
})`}
                  </code></pre>
                </div>
              </div>
            </div>

            {/* Column 2: API Setup + Query Examples + Results */}
            <div className="space-y-6">
              {/* Step 3: API Setup */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 text-purple-600 flex items-center">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">3</div>
                  <span className="text-sm sm:text-base">Add to your existing application</span>
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50 overflow-x-auto">
                  <pre className="language-ts text-gray-700 p-3 bg-gray-50 min-w-0"><code className="language-ts">
{`// app.ts - Your existing Hono app
import { Hono } from 'hono'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import { productsCube } from './cubes'

const app = new Hono()

// Create cube app with your cubes
const cubeApp = createCubeApp({
  cubes: [productsCube],
  drizzle: db,
  schema,
  extractSecurityContext: async (c) => ({
    organisationId: c.get('user')?.organisationId || 1
  }),
  engineType: 'postgres'
})

// Mount cube API routes
app.route('/', cubeApp) // Done!`}
                  </code></pre>
                </div>
              </div>

              {/* Step 4: Queries */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 text-orange-600 flex items-center">
                  <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">4</div>
                  <span className="text-sm sm:text-base">Then use simple queries</span>
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50 overflow-x-auto">
                  <pre className="language-json text-gray-700 p-3 bg-gray-50 min-w-0"><code className="language-json">
{`GET https://your.application.com/cubejs-api/v1/load?query=

{
  "measures": [
    "Products.count", 
    "Products.avgPrice", 
    "Products.totalValue"
  ],
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

              {/* Step 5: Results */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 text-red-600 flex items-center">
                  <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">5</div>
                  <span className="text-sm sm:text-base">To get fast results</span>
                </h4>
                <div className="border border-gray-200 rounded-lg text-xs bg-gray-50 overflow-x-auto">
                  <pre className="language-json text-gray-700 p-3 bg-gray-50 min-w-0"><code className="language-json">
{`[{
  "Products.category": "Electronics",
  "Products.createdAt": "2024-01",
  "Products.count": "15",
  "Products.avgPrice": "299.99",
  "Products.totalValue": "4499.85"
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