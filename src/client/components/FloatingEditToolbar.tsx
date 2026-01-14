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
    ? 'left-4'
    : 'right-4'

  // Animation: slide in from edge when edit bar not visible
  // When edit bar IS visible, slide out and hide
  const isHidden = isEditBarVisible
  const translateClasses = position === 'left'
    ? (isHidden ? '-translate-x-16 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100')
    : (isHidden ? 'translate-x-16 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100')

  // Use portal to render outside the grid container to avoid react-grid-layout issues
  const toolbarContent = (
    <div
      className={`fixed top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5 p-2
        bg-dc-surface-tertiary border border-dc-border rounded-lg
        transition-all duration-300 ease-in-out
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
          <div className="w-full h-px bg-dc-border my-0.5" />
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
          <div className="w-full h-px bg-dc-border my-0.5" />
          <div ref={paletteRef} className="relative">
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
          <div className="w-full h-px bg-dc-border my-0.5" />
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
      className={`p-2 rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-dc-accent
        ${disabled
          ? 'opacity-50 cursor-not-allowed bg-dc-surface-secondary text-dc-text-muted'
          : isActive
            ? 'bg-dc-accent-bg text-dc-accent'
            : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover'
        }`}
    >
      <Icon className="w-5 h-5" />
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
  const positionClasses = position === 'left' ? 'left-full ml-2' : 'right-full mr-2'

  return (
    <div
      className={`absolute top-0 ${positionClasses} w-52 bg-dc-surface border border-dc-border rounded-md z-50 max-h-72 overflow-y-auto`}
      style={{
        boxShadow: 'var(--dc-shadow-lg)'
      }}
    >
      <div className="py-1">
        {COLOR_PALETTES.slice().sort((a, b) => a.label.localeCompare(b.label)).map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => onPaletteChange(palette.name)}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-dc-surface-hover transition-colors ${
              palette.name === currentPalette ? 'bg-dc-surface-secondary text-dc-primary' : 'text-dc-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Compact color preview - 4 series colors */}
              <div className="flex gap-0.5 shrink-0">
                {palette.colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="w-2.5 h-2.5 rounded-xs border border-dc-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium truncate text-dc-text">{palette.label}</span>
              {/* Current indicator */}
              {palette.name === currentPalette && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0 bg-dc-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
