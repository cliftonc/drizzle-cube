import { Link, useLocation } from 'react-router-dom'
import { DocumentTextIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import DrizzleCubeIcon from './DrizzleCubeIcon'
import ThemeToggle from './ThemeToggle'

// GitHub icon component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

// Floating GitHub source button component
const FloatingGitHubButton = () => {
  const location = useLocation()
  
  // Map routes to their source files
  const getSourcePath = (pathname: string) => {
    const basePath = 'https://github.com/cliftonc/drizzle-cube/blob/main/examples/hono/client/src'
    
    if (pathname === '/') {
      return `${basePath}/pages/HomePage.tsx`
    } else if (pathname.startsWith('/dashboards') && pathname !== '/dashboards') {
      return `${basePath}/pages/DashboardViewPage.tsx`
    } else if (pathname === '/dashboards') {
      return `${basePath}/pages/DashboardListPage.tsx`
    } else if (pathname === '/query-builder') {
      return `${basePath}/pages/QueryBuilderPage.tsx`
    }
    
    return `${basePath}/App.tsx`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href={getSourcePath(location.pathname)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-12 h-12 bg-dc-surface-tertiary hover:bg-dc-surface-hover text-dc-text rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        title="View this page in GitHub"
      >
        <GitHubIcon className="w-6 h-6" />
        <span className="absolute right-14 bg-dc-surface-tertiary text-dc-text px-2 py-1 rounded-sm text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          View source
        </span>
      </a>
    </div>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-dc-surface-secondary transition-colors">
      <FloatingGitHubButton />
      <nav className="bg-dc-surface shadow-2xs border-b border-dc-border relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Desktop layout */}
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-3 text-xl font-bold text-dc-text hover:text-dc-primary transition-colors">
                  <DrizzleCubeIcon className="text-dc-primary" size={28} />
                  <span>Drizzle Cube</span>
                </Link>
              </div>
              {/* Desktop navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive('/')
                      ? 'border-dc-primary text-dc-text'
                      : 'border-transparent text-dc-text-muted hover:text-dc-text-secondary hover:border-dc-border'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/dashboards"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive('/dashboards')
                      ? 'border-dc-primary text-dc-text'
                      : 'border-transparent text-dc-text-muted hover:text-dc-text-secondary hover:border-dc-border'
                  }`}
                >
                  Dashboards
                </Link>
                <Link
                  to="/query-builder"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive('/query-builder')
                      ? 'border-dc-primary text-dc-text'
                      : 'border-transparent text-dc-text-muted hover:text-dc-text-secondary hover:border-dc-border'
                  }`}
                >
                  Query Builder
                </Link>
              </div>
            </div>
            
            {/* Desktop external links */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <a
                href="https://www.drizzle-cube.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-dc-text-muted hover:text-dc-text text-sm font-semibold transition-colors"
              >
                <DocumentTextIcon className="w-4 h-4 mr-1.5" />
                Documentation
              </a>
              <a
                href="https://github.com/cliftonc/drizzle-cube"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-dc-text-muted hover:text-dc-text text-sm font-semibold transition-colors"
              >
                <GitHubIcon className="w-4 h-4 mr-1.5" />
                GitHub
              </a>
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-primary focus:ring-offset-2 focus:ring-offset-dc-surface transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-dc-surface border-t border-dc-border">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/')
                    ? 'text-dc-primary bg-dc-surface-secondary border-l-4 border-dc-primary'
                    : 'text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
                }`}
              >
                Home
              </Link>
              <Link
                to="/dashboards"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/dashboards')
                    ? 'text-dc-primary bg-dc-surface-secondary border-l-4 border-dc-primary'
                    : 'text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
                }`}
              >
                Dashboards
              </Link>
              <Link
                to="/query-builder"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/query-builder')
                    ? 'text-dc-primary bg-dc-surface-secondary border-l-4 border-dc-primary'
                    : 'text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
                }`}
              >
                Query Builder
              </Link>

              {/* Mobile external links */}
              <div className="border-t border-dc-border pt-4 pb-3">
                <div className="space-y-1">
                  <a
                    href="https://www.drizzle-cube.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 rounded-md text-base font-medium text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5 inline mr-2" />
                    Documentation
                  </a>
                  <a
                    href="https://github.com/cliftonc/drizzle-cube"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 rounded-md text-base font-medium text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover transition-colors"
                  >
                    <GitHubIcon className="w-5 h-5 inline mr-2" />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {isHomePage ? (
        children
      ) : (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </main>
      )}
    </div>
  )
}