import { Link, useLocation } from 'react-router-dom'
import { useState, useCallback, memo, type ReactNode } from 'react'
import { getIcon } from '@drizzle-cube/client'
import DrizzleCubeIcon from './DrizzleCubeIcon'
import ThemeToggle from './ThemeToggle'
import { getSourcePath } from './layoutNav'
import { GitHubIcon, DesktopNavLinks, MobileNavLinks, LanguageSelect } from './LayoutNavParts'

const DocumentTextIcon = getIcon('documentText')
const Bars3Icon = getIcon('menu')
const XMarkIcon = getIcon('close')

/**
 * LogoLink - Memoized logo link component
 *
 * Extracted and memoized to prevent re-renders when parent Layout updates.
 * Has no props, so it's perfectly stable.
 */
const LogoLink = memo(function LogoLink() {
  return (
    <Link to="/" className="flex items-center space-x-3 text-xl font-bold text-dc-text hover:text-dc-primary transition-colors">
      <DrizzleCubeIcon className="text-dc-primary" size={28} />
      <span>Drizzle Cube</span>
    </Link>
  )
})

/**
 * FloatingGitHubButton - Memoized floating button
 *
 * Only depends on location.pathname, so only re-renders on route changes.
 */
const FloatingGitHubButton = memo(function FloatingGitHubButton() {
  const location = useLocation()

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
})

interface LayoutProps {
  children: ReactNode
  locale: string
  onLocaleChange: (locale: string) => void
}

/**
 * Layout - Main application layout
 *
 * NOT memoized because it needs to respond to route changes (children prop changes).
 * However, stable child components (LogoLink, FloatingGitHubButton, ThemeToggle)
 * are memoized to prevent unnecessary re-renders.
 */
export default function Layout({ children, locale, onLocaleChange }: LayoutProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }, [location.pathname])

  return (
    <div className="h-screen flex flex-col bg-dc-surface-secondary transition-colors overflow-hidden">
      <FloatingGitHubButton />
      <nav className="bg-dc-surface shadow-2xs border-b border-dc-border relative z-10 transition-colors shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Desktop layout */}
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <LogoLink />
              </div>
              {/* Desktop navigation */}
              <DesktopNavLinks isActive={isActive} />
            </div>

            {/* Desktop external links */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              <label className="inline-flex items-center gap-2 text-sm text-dc-text-muted">
                <span className="hidden xl:inline">Language</span>
                <LanguageSelect
                  locale={locale}
                  onLocaleChange={onLocaleChange}
                  className="rounded-md border border-dc-border bg-dc-surface text-dc-text px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-dc-primary"
                />
              </label>
              <a
                href="https://www.drizzle-cube.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-dc-text-muted hover:text-dc-text text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <DocumentTextIcon className="w-4 h-4 mr-1.5" />
                Documentation
              </a>
              <a
                href="https://github.com/cliftonc/drizzle-cube"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-dc-text-muted hover:text-dc-text text-sm font-semibold transition-colors whitespace-nowrap"
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
              <MobileNavLinks isActive={isActive} onNavigate={() => setIsMobileMenuOpen(false)} />
              {/* Mobile external links */}
              <div className="border-t border-dc-border pt-4 pb-3">
                <div className="space-y-1">
                  <label className="block px-3 py-2 text-sm font-medium text-dc-text-muted">
                    Language
                    <LanguageSelect
                      locale={locale}
                      onLocaleChange={onLocaleChange}
                      className="mt-2 block w-full rounded-md border border-dc-border bg-dc-surface text-dc-text px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-dc-primary"
                    />
                  </label>
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

      <div className="flex-1 overflow-y-auto">
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
    </div>
  )
}
