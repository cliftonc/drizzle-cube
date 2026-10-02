/**
 * DataBrowserQuickSearch
 *
 * Free-text row search input for the Data Browser filter panel.
 */

import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const SearchIcon = getIcon('search')
const ClearIcon = getIcon('close')

interface DataBrowserQuickSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export default function DataBrowserQuickSearch({
  value,
  onChange,
  onClear,
}: DataBrowserQuickSearchProps) {
  const { t } = useTranslation()
  const clearLabel = t('dataBrowser.search.clear')

  return (
    <div className="dc:mb-2">
      <div className="dc:relative">
        <SearchIcon className="dc:absolute dc:left-2.5 dc:top-1/2 dc:-translate-y-1/2 dc:w-3.5 dc:h-3.5 text-dc-text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('dataBrowser.search.placeholder')}
          className="dc:w-full dc:pl-8 dc:pr-8 dc:py-1.5 dc:text-xs dc:rounded dc:border border-dc-border bg-dc-surface text-dc-text dc:outline-none dc:focus:ring-1 focus:ring-dc-accent"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            aria-label={clearLabel}
            title={clearLabel}
            className="dc:absolute dc:right-1.5 dc:top-1/2 dc:-translate-y-1/2 dc:p-1 dc:rounded dc:hover:bg-dc-surface-hover dc:transition-colors"
          >
            <ClearIcon className="dc:w-3.5 dc:h-3.5 text-dc-text-muted" />
          </button>
        )}
      </div>
    </div>
  )
}
