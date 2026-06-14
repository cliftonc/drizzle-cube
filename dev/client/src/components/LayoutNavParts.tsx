/**
 * Presentational nav sub-components for the example app Layout.
 *
 * Extracted from Layout.tsx to flatten the component: the repeated desktop/mobile
 * nav links and language selector live here as data-driven pieces.
 */
import { Link } from 'react-router-dom'
import { NAV_ITEMS, LOCALE_OPTIONS } from './layoutNav'

// GitHub icon component
export const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

interface DesktopNavLinksProps {
  isActive: (path: string) => boolean
}

export function DesktopNavLinks({ isActive }: DesktopNavLinksProps) {
  return (
    <div className="hidden md:ml-6 md:flex md:space-x-6">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.to}
          to={item.to}
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
            isActive(item.to)
              ? 'border-dc-primary text-dc-text whitespace-nowrap'
              : 'border-transparent text-dc-text-muted hover:text-dc-text-secondary hover:border-dc-border whitespace-nowrap'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

interface MobileNavLinksProps {
  isActive: (path: string) => boolean
  onNavigate: () => void
}

export function MobileNavLinks({ isActive, onNavigate }: MobileNavLinksProps) {
  return (
    <>
      {NAV_ITEMS.map(item => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
            isActive(item.to)
              ? 'text-dc-primary bg-dc-surface-secondary border-l-4 border-dc-primary'
              : 'text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  )
}

interface LanguageSelectProps {
  locale: string
  onLocaleChange: (locale: string) => void
  className: string
}

export function LanguageSelect({ locale, onLocaleChange, className }: LanguageSelectProps) {
  return (
    <select
      value={locale}
      onChange={(event) => onLocaleChange(event.target.value)}
      className={className}
      aria-label="Select language"
    >
      {LOCALE_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
