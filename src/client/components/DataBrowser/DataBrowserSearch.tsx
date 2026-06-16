/**
 * DataBrowserSearch Component
 *
 * A quick, clearable text-search box for the DataBrowser. The typed term is
 * matched (case-insensitive "contains") against every text column of the cube,
 * OR'd together — a row stays visible if the term appears in any text field.
 *
 * Mirrors the sidebar search input pattern. The actual filter is built in
 * useDataBrowser; this component is purely the controlled input.
 */

import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const SearchIcon = getIcon('search')
const CloseIcon = getIcon('close')

export interface DataBrowserSearchProps {
  value: string
  onChange: (value: string) => void
}

export default function DataBrowserSearch({ value, onChange }: DataBrowserSearchProps) {
  const { t } = useTranslation()

  return (
    <div className="dc:relative">
      <SearchIcon className="dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-3.5 dc:h-3.5 text-dc-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('dataBrowser.search.placeholder')}
        className="dc:w-full dc:pl-7 dc:pr-7 dc:py-1.5 dc:text-xs dc:rounded border-dc-border dc:border bg-dc-surface text-dc-text dc:outline-none dc:focus:ring-1 focus:ring-dc-accent"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('dataBrowser.search.clear')}
          className="dc:absolute dc:right-2 dc:top-1/2 dc:-translate-y-1/2 dc:p-0.5 dc:rounded text-dc-text-muted dc:hover:bg-dc-surface-hover dc:hover:text-dc-text"
        >
          <CloseIcon className="dc:w-3.5 dc:h-3.5" />
        </button>
      )}
    </div>
  )
}
