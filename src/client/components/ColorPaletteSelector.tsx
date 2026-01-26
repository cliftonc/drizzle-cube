/**
 * Color Palette Selector Component
 * Allows users to select from predefined color palettes for their dashboard
 */

import { useState, useRef, useEffect } from 'react'
import { COLOR_PALETTES, getColorPalette } from '../utils/colorPalettes'
import { getIcon } from '../icons'

const ChevronDownIcon = getIcon('chevronDown')

interface ColorPaletteSelectorProps {
  currentPalette?: string
  onPaletteChange: (paletteName: string) => void
  className?: string
}

export default function ColorPaletteSelector({
  currentPalette = 'default',
  onPaletteChange,
  className = ''
}: ColorPaletteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const currentPaletteObj = getColorPalette(currentPalette)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handlePaletteSelect = (paletteName: string) => {
    onPaletteChange(paletteName)
    setIsOpen(false)
  }

  return (
    <div className={`dc:relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dc:inline-flex dc:items-center dc:gap-2 dc:px-3 dc:py-1.5 bg-dc-surface dc:border border-dc-border dc:rounded-md shadow-xs dc:text-sm dc:font-medium text-dc-text-secondary hover:bg-dc-surface-hover focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 focus:ring-dc-accent"
      >
        {/* Current Palette Preview - Hidden on mobile */}
        <div className="dc:hidden dc:md:flex dc:items-center dc:gap-1.5">
          <div className="dc:flex dc:gap-0.5">
            {currentPaletteObj.colors.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="dc:w-3 dc:h-3 rounded-xs dc:border border-dc-border"
                style={{ backgroundColor: color }}
                title={`Series Color ${index + 1}`}
              />
            ))}
          </div>
          <span className="dc:text-xs text-dc-text-secondary">|</span>
          <div className="dc:flex dc:gap-0.5">
            {currentPaletteObj.gradient.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="dc:w-2 dc:h-3 dc:border-r dc:first:rounded-l-sm dc:last:rounded-r-sm dc:last:border-r-0"
                style={{
                  backgroundColor: color,
                  borderColor: 'var(--dc-border)'
                }}
                title={`Gradient Color ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <span>{currentPaletteObj.label}</span>
        <ChevronDownIcon 
          className={`dc:w-4 dc:h-4 dc:transition-transform ${isOpen ? 'dc:rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu - Responsive width */}
      {isOpen && (
        <div className="dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:w-72 dc:md:w-80 dc:lg:w-96 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:z-50 dc:max-h-80 dc:overflow-y-auto">
          <div className="dc:py-1">
            {COLOR_PALETTES.slice().sort((a, b) => a.label.localeCompare(b.label)).map((palette) => (
              <button
                key={palette.name}
                type="button"
                onClick={() => handlePaletteSelect(palette.name)}
                className={`dc:w-full dc:px-3 dc:py-2 text-left dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${
                  palette.name === currentPalette ? 'bg-dc-surface-secondary' : 'text-dc-text-secondary'
                }`}
                style={palette.name === currentPalette ? { color: 'var(--dc-primary)' } : undefined}
              >
                <div className="dc:flex dc:items-center dc:gap-3">
                  {/* Palette Preview - Hidden on mobile */}
                  <div className="dc:hidden dc:md:flex dc:items-center dc:gap-2">
                    {/* Series Colors */}
                    <div className="dc:flex dc:gap-0.5">
                      {palette.colors.slice(0, 6).map((color, index) => (
                        <div
                          key={`series-${index}`}
                          className="dc:w-3 dc:h-3 rounded-xs dc:border border-dc-border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Separator */}
                    <div className="dc:w-px dc:h-4 bg-dc-border" />
                    
                    {/* Gradient Colors */}
                    <div className="dc:flex">
                      {palette.gradient.map((color, index) => (
                        <div
                          key={`gradient-${index}`}
                          className="dc:w-2 dc:h-4 dc:first:rounded-l-sm dc:last:rounded-r-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Palette Name */}
                  <span className="dc:font-medium">{palette.label}</span>
                  
                  {/* Current Indicator */}
                  {palette.name === currentPalette && (
                    <div className="dc:ml-auto">
                      <div className="dc:w-2 dc:h-2 dc:rounded-full" style={{ backgroundColor: 'var(--dc-primary)' }}></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}