/**
 * Color Palette Selector Component
 * Allows users to select from predefined color palettes for their dashboard
 */

import { useState, useRef, useEffect } from 'react'
import { COLOR_PALETTES, getColorPalette } from '../utils/colorPalettes'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {/* Current Palette Preview - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {currentPaletteObj.colors.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm border border-gray-200"
                style={{ backgroundColor: color }}
                title={`Series Color ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">|</span>
          <div className="flex gap-0.5">
            {currentPaletteObj.gradient.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-2 h-3 border-r border-gray-200 first:rounded-l-sm last:rounded-r-sm last:border-r-0"
                style={{ backgroundColor: color }}
                title={`Gradient Color ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <span>{currentPaletteObj.label}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu - Responsive width */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 md:w-80 lg:w-96 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            {COLOR_PALETTES.slice().sort((a, b) => a.label.localeCompare(b.label)).map((palette) => (
              <button
                key={palette.name}
                type="button"
                onClick={() => handlePaletteSelect(palette.name)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                  palette.name === currentPalette ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Palette Preview - Hidden on mobile */}
                  <div className="hidden md:flex items-center gap-2">
                    {/* Series Colors */}
                    <div className="flex gap-0.5">
                      {palette.colors.slice(0, 6).map((color, index) => (
                        <div
                          key={`series-${index}`}
                          className="w-3 h-3 rounded-sm border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="w-px h-4 bg-gray-300" />
                    
                    {/* Gradient Colors */}
                    <div className="flex">
                      {palette.gradient.map((color, index) => (
                        <div
                          key={`gradient-${index}`}
                          className="w-2 h-4 first:rounded-l-sm last:rounded-r-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Palette Name */}
                  <span className="font-medium">{palette.label}</span>
                  
                  {/* Current Indicator */}
                  {palette.name === currentPalette && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
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