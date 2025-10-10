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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4 sm:mb-6">
            Drizzle Cube Dev Server
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
            Use this site to test any changes to the React components and server.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <Link
            to="/dashboards"
            className="group bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Dashboards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View analytics and insights</p>
            </div>
          </Link>

          <Link
            to="/query-builder"
            className="group bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation relative"
          >
            <div className="absolute -top-2 -right-2 bg-linear-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 shadow-md z-10">
              <SparklesIcon className="w-3 h-3" />
              <span>AI Enabled</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <MagnifyingGlassIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Query Builder</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build custom queries</p>
            </div>
          </Link>

          <a
            href="https://www.drizzle-cube.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Documentation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to use Drizzle Cube</p>
            </div>
          </a>

          <a
            href="https://github.com/cliftonc/drizzle-cube"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <CodeBracketIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">GitHub</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View source code</p>
            </div>
          </a>
        </div>        
      </div>
    </>
  )
}