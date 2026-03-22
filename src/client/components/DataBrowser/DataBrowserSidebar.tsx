/**
 * DataBrowserSidebar
 *
 * Left panel showing a searchable list of cubes.
 * Clicking a cube loads its dimensions into the table view.
 */

import { useState, useMemo } from 'react'
import { getIcon } from '../../icons'

const SearchIcon = getIcon('search')
const CubeIcon = getIcon('cube')

interface DataBrowserSidebarProps {
  cubes: Array<{ name: string; title: string }>
  selectedCube: string | null
  onSelectCube: (cubeName: string) => void
}

export default function DataBrowserSidebar({
  cubes,
  selectedCube,
  onSelectCube,
}: DataBrowserSidebarProps) {
  const [search, setSearch] = useState('')

  const filteredCubes = useMemo(() => {
    const sorted = [...cubes].sort((a, b) =>
      (a.title || a.name).localeCompare(b.title || b.name)
    )
    if (!search) return sorted
    const lower = search.toLowerCase()
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.title.toLowerCase().includes(lower)
    )
  }, [cubes, search])

  return (
    <div className="dc:flex dc:flex-col dc:h-full dc:border-r border-dc-border bg-dc-surface dc:w-60 dc:shrink-0">
      {/* Header */}
      <div className="dc:px-3 dc:py-3 dc:border-b border-dc-border">
        <h2 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Cubes</h2>
        {/* Search */}
        <div className="dc:relative">
          <SearchIcon className="dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-3.5 dc:h-3.5 text-dc-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="dc:w-full dc:pl-7 dc:pr-2 dc:py-1.5 dc:text-xs dc:rounded border-dc-border dc:border bg-dc-surface text-dc-text dc:outline-none dc:focus:ring-1 focus:ring-dc-accent"
          />
        </div>
      </div>

      {/* Cube list */}
      <div className="dc:flex-1 dc:overflow-y-auto dc:py-1">
        {filteredCubes.map((cube) => (
          <button
            key={cube.name}
            onClick={() => onSelectCube(cube.name)}
            className={`dc:flex dc:items-center dc:gap-2 dc:w-full dc:px-3 dc:py-1.5 dc:text-left dc:text-sm dc:transition-colors ${
              selectedCube === cube.name
                ? 'bg-dc-accent-bg text-dc-accent dc:font-medium'
                : 'text-dc-text dc:hover:bg-dc-surface-hover'
            }`}
          >
            <CubeIcon className="dc:w-4 dc:h-4 dc:shrink-0 text-dc-text-muted" />
            <span className="dc:truncate">{cube.title || cube.name}</span>
          </button>
        ))}

        {filteredCubes.length === 0 && (
          <div className="dc:px-3 dc:py-4 dc:text-xs text-dc-text-muted dc:text-center">
            No cubes found
          </div>
        )}
      </div>
    </div>
  )
}
