/**
 * FloatingEditToolbar - Vertical floating toolbar for dashboard editing
 *
 * Appears when the static edit bar scrolls out of view, providing quick access
 * to edit controls in a compact vertical format with icon-only buttons.
 *
 * Features:
 * - Icon-only buttons with tooltips
 * - Configurable left/right positioning
 * - Smooth slide-in/out animation
 * - Only visible on desktop (≥1200px)
 * - Compact palette dropdown that opens opposite to toolbar position
 */

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getIcon } from '../icons'
import { COLOR_PALETTES } from '../utils/colorPalettes'
import type { DashboardLayoutMode } from '../types'

const EditIcon = getIcon('edit')
const CheckIcon = getIcon('check')
const GridIcon = getIcon('segment')
const RowsIcon = getIcon('table')
const AddIcon = getIcon('add')
const SwatchIcon = getIcon('swatch')

interface FloatingEditToolbarProps {
  /** Whether the static edit bar is visible (toolbar hidden when true) */
  isEditBarVisible: boolean
  /** Position of the floating toolbar */
  position: 'left' | 'right'
  /** Whether currently in edit mode */
  isEditMode: boolean
  /** Toggle edit mode on/off */
  onEditModeToggle: () => void
  /** Current layout mode */
  layoutMode: DashboardLayoutMode
  /** Change layout mode */
  onLayoutModeChange: (mode: DashboardLayoutMode) => void
  /** Available layout modes */
  allowedModes: DashboardLayoutMode[]
  /** Whether layout mode can be changed */
  canChangeLayoutMode: boolean
  /** Current color palette name */
  currentPalette: string
  /** Change color palette */
  onPaletteChange: (palette: string) => void
  /** Add new portlet */
  onAddPortlet: () => void
}

export default function FloatingEditToolbar({
  isEditBarVisible,
  position,
  isEditMode,
  onEditModeToggle,
  layoutMode,
  onLayoutModeChange,
  allowedModes,
  canChangeLayoutMode,
  currentPalette,
  onPaletteChange,
  onAddPortlet
}: FloatingEditToolbarProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  // Close palette dropdown on outside click
  useEffect(() => {
    if (!isPaletteOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsPaletteOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPaletteOpen])

  // Close palette when toolbar hides
  useEffect(() => {
    if (isEditBarVisible) {
      setIsPaletteOpen(false)
    }
  }, [isEditBarVisible])

  // Position classes - fixed positioning with vertical centering
  const positionClasses = position === 'left'
    ? 'dc:left-4'
    : 'dc:right-4'

  // Animation: slide in from edge when edit bar not visible
  // When edit bar IS visible, slide out and hide
  const isHidden = isEditBarVisible
  const translateClasses = position === 'left'
    ? (isHidden ? 'dc:-translate-x-16 dc:opacity-0 dc:pointer-events-none' : 'dc:translate-x-0 dc:opacity-100')
    : (isHidden ? 'dc:translate-x-16 dc:opacity-0 dc:pointer-events-none' : 'dc:translate-x-0 dc:opacity-100')

  // Use portal to render outside the grid container to avoid react-grid-layout issues
  const toolbarContent = (
    <div
      className={`dc:fixed dc:top-1/2 dc:-translate-y-1/2 dc:z-50 dc:flex dc:flex-col dc:gap-1.5 dc:p-2
        bg-dc-surface-tertiary dc:border border-dc-border dc:rounded-lg
        dc:transition-all dc:duration-300 dc:ease-in-out
        ${positionClasses} ${translateClasses}`}
      style={{
        boxShadow: 'var(--dc-shadow-lg)'
      }}
    >
      {/* Edit Toggle */}
      <ToolbarButton
        icon={isEditMode ? CheckIcon : EditIcon}
        tooltip={isEditMode ? 'Finish Editing' : 'Edit Dashboard'}
        isActive={isEditMode}
        onClick={onEditModeToggle}
      />

      {/* Layout Mode Switcher - only in edit mode with multiple modes */}
      {isEditMode && allowedModes.length > 1 && (
        <>
          <div className="dc:w-full dc:h-px bg-dc-border dc:my-0.5" />
          <ToolbarButton
            icon={GridIcon}
            tooltip="Grid Layout"
            isActive={layoutMode === 'grid'}
            disabled={!canChangeLayoutMode}
            onClick={() => onLayoutModeChange('grid')}
          />
          <ToolbarButton
            icon={RowsIcon}
            tooltip="Rows Layout"
            isActive={layoutMode === 'rows'}
            disabled={!canChangeLayoutMode}
            onClick={() => onLayoutModeChange('rows')}
          />
        </>
      )}

      {/* Color Palette - only in edit mode */}
      {isEditMode && (
        <>
          <div className="dc:w-full dc:h-px bg-dc-border dc:my-0.5" />
          <div ref={paletteRef} className="dc:relative">
            <ToolbarButton
              icon={SwatchIcon}
              tooltip="Color Palette"
              isActive={isPaletteOpen}
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            />
            {isPaletteOpen && (
              <CompactPaletteDropdown
                position={position}
                currentPalette={currentPalette}
                onPaletteChange={(palette) => {
                  onPaletteChange(palette)
                  setIsPaletteOpen(false)
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Add Portlet - only in edit mode */}
      {isEditMode && (
        <>
          <div className="dc:w-full dc:h-px bg-dc-border dc:my-0.5" />
          <ToolbarButton
            icon={AddIcon}
            tooltip="Add Portlet"
            onClick={onAddPortlet}
          />
        </>
      )}
    </div>
  )

  // Render via portal to document.body to avoid react-grid-layout child iteration issues
  if (typeof document === 'undefined') {
    return null // SSR safety
  }

  return createPortal(toolbarContent, document.body)
}

// Internal ToolbarButton component
interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
}

function ToolbarButton({ icon: Icon, tooltip, isActive, disabled, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`dc:p-2 dc:rounded-md dc:transition-colors focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent
        ${disabled
          ? 'dc:opacity-50 dc:cursor-not-allowed bg-dc-surface-secondary text-dc-text-muted'
          : isActive
            ? 'bg-dc-accent-bg text-dc-accent'
            : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover'
        }`}
    >
      <Icon className="dc:w-5 dc:h-5" />
    </button>
  )
}

// Compact palette dropdown for floating toolbar
interface CompactPaletteDropdownProps {
  position: 'left' | 'right'
  currentPalette: string
  onPaletteChange: (palette: string) => void
}

function CompactPaletteDropdown({ position, currentPalette, onPaletteChange }: CompactPaletteDropdownProps) {
  // Position dropdown opposite to toolbar position to avoid off-screen
  const positionClasses = position === 'left' ? 'dc:left-full dc:ml-2' : 'dc:right-full dc:mr-2'

  return (
    <div
      className={`dc:absolute dc:top-0 ${positionClasses} dc:w-52 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:z-50 dc:max-h-72 dc:overflow-y-auto`}
      style={{
        boxShadow: 'var(--dc-shadow-lg)'
      }}
    >
      <div className="dc:py-1">
        {COLOR_PALETTES.slice().sort((a, b) => a.label.localeCompare(b.label)).map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => onPaletteChange(palette.name)}
            className={`dc:w-full dc:px-3 dc:py-2 text-left dc:text-sm hover:bg-dc-surface-hover dc:transition-colors ${
              palette.name === currentPalette ? 'bg-dc-surface-secondary text-dc-primary' : 'text-dc-text-secondary'
            }`}
          >
            <div className="dc:flex dc:items-center dc:gap-2">
              {/* Compact color preview - 4 series colors */}
              <div className="dc:flex dc:gap-0.5 dc:shrink-0">
                {palette.colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="dc:w-2.5 dc:h-2.5 rounded-xs dc:border border-dc-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="dc:text-xs dc:font-medium dc:truncate text-dc-text">{palette.label}</span>
              {/* Current indicator */}
              {palette.name === currentPalette && (
                <div className="dc:ml-auto dc:w-1.5 dc:h-1.5 dc:rounded-full dc:shrink-0 bg-dc-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
